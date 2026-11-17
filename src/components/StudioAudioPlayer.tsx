import { useState, useRef, useEffect } from 'react';
import { Music, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useStudio } from '../context/StudioContext';

export function StudioAudioPlayer() {
  const { lang } = useStudio();
  const isFa = lang === 'fa';
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.5;
    const attemptPlay = () => {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Autoplay policy prevented direct autoplay; wait for user interaction
        const handleInteraction = () => {
          audio.play().then(() => {
            setIsPlaying(true);
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
          }).catch(() => {});
        };
        window.addEventListener('click', handleInteraction, { once: true });
        window.addEventListener('keydown', handleInteraction, { once: true });
      });
    };

    attemptPlay();
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/15 bg-[#0d0e12]/90 shadow-sm">
      <audio
        ref={audioRef}
        src="/assets/aistudio/de757e87-0b45-40b5-8930-2f27d178afcc_5e48704e.mp3"
        loop
        preload="auto"
      />
      <button
        type="button"
        onClick={togglePlay}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-[#F2CF66] cursor-pointer transition"
        title={isPlaying ? (isFa ? 'توقف موسیقی' : 'Pause Music') : (isFa ? 'پخش موسیقی استودیو' : 'Play Studio Music')}
      >
        <span className="relative flex h-3 w-3 items-center justify-center">
          {isPlaying && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4AF37] opacity-75" />
          )}
          <Music className={`h-3.5 w-3.5 ${isPlaying ? 'text-[#D4AF37]' : 'text-slate-400'}`} />
        </span>
        <span className="hidden sm:inline text-[11px] font-mono-tabular">
          {isPlaying ? (isFa ? 'موسیقی استودیو' : 'TAK1 Theme') : (isFa ? 'پخش موسیقی' : 'Studio OST')}
        </span>
        {isPlaying ? <Pause className="h-3.5 w-3.5 ml-0.5 text-[#D4AF37]" /> : <Play className="h-3.5 w-3.5 ml-0.5 text-slate-300" />}
      </button>

      {isPlaying && (
        <button
          type="button"
          onClick={toggleMute}
          className="text-slate-400 hover:text-white transition cursor-pointer p-0.5"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="h-3.5 w-3.5 text-red-400" /> : <Volume2 className="h-3.5 w-3.5 text-[#D4AF37]" />}
        </button>
      )}
    </div>
  );
}
