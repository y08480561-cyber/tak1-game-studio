import { useEffect, useState, useCallback } from 'react';
import { Headphones } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import type { TicketStatus } from '../types/studio';

interface LocalTicketRecord {
  trackingCode: string;
  subject: string;
  status: TicketStatus;
  adminReply: string;
  read?: boolean;
}

const STORAGE_KEY = 'tak1_my_tickets';

// Play a subtle notification chime using Web Audio API
function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // AudioContext blocked or not supported
  }
}

export function SupportBubble() {
  const { path, navigate, lang } = useStudio();
  const isRtl = lang === 'fa';
  const [hasNewReply, setHasNewReply] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const checkUnreadReplies = useCallback(async () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const tickets = JSON.parse(raw) as LocalTicketRecord[];
      if (!Array.isArray(tickets) || tickets.length === 0) return;

      let unread = 0;
      let newlyAnswered = false;

      for (const t of tickets) {
        if (!t.trackingCode) continue;
        const res = await fetch(`/api/support/track/${encodeURIComponent(t.trackingCode)}`);
        if (res.ok) {
          const json = await res.json();
          const serverTicket = json.ticket;
          if (serverTicket && serverTicket.adminReply && !t.read) {
            unread += 1;
            if (t.adminReply !== serverTicket.adminReply) {
              newlyAnswered = true;
            }
          }
        }
      }

      setUnreadCount(unread);
      if (unread > 0) {
        setHasNewReply(true);
        if (newlyAnswered) {
          playNotificationChime();
        }
      } else {
        setHasNewReply(false);
      }
    } catch {
      // Ignore network errors in background check
    }
  }, []);

  useEffect(() => {
    void checkUnreadReplies();
    const interval = setInterval(() => {
      void checkUnreadReplies();
    }, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [checkUnreadReplies]);

  // Hide bubble if already on support page
  if (path === '/support') {
    return null;
  }

  return (
    <div className={`fixed bottom-6 z-50 ${isRtl ? 'left-6' : 'right-6'}`}>
      <button
        type="button"
        onClick={() => navigate('/support')}
        className="relative group flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-r from-[#E8C563] to-[#C89B2B] text-[#070709] shadow-lg shadow-black/60 hover:scale-105 transition duration-200 cursor-pointer focus:outline-none"
        aria-label="TAK1 Support & Chat"
      >
        <Headphones className="h-7 w-7 text-[#070709]" />

        {hasNewReply && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-md animate-bounce">
            {unreadCount > 0 ? unreadCount : '!'}
          </span>
        )}

        {/* Tooltip */}
        <div className={`absolute bottom-full mb-2 hidden group-hover:block whitespace-nowrap rounded-xl bg-[#0d0e12] border border-[#D4AF37]/40 px-3 py-1.5 text-xs font-semibold text-white shadow-xl ${isRtl ? 'left-0' : 'right-0'}`}>
          {isRtl ? 'پشتیبانی آنلاین تک۱' : 'TAK1 Live Support'}
        </div>
      </button>
    </div>
  );
}
