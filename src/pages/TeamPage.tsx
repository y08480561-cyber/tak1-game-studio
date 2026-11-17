import { Users } from 'lucide-react';
import { useStudio } from '../context/StudioContext';
import { SafeMedia } from '../components/SafeMedia';

export function TeamPage() {
  const { lang, t, team, loadingData } = useStudio();
  const isRtl = lang === 'fa';

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 space-y-16">
      {/* Studio Overview Split */}
      <section className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
          <p className="text-xs font-medium text-[#D4AF37]">
            {isRtl
              ? 'توسعه‌دهندگان بازی تک۱ · TAK1 Game Studio · kalametgame.ir'
              : 'TAK1 Game Studio · kalametgame.ir'}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
            {t.team.title}
          </h1>
          <p className="text-base leading-relaxed text-slate-300">{t.team.subtitle}</p>
        </div>

        <div className="lg:col-span-5">
          <div className="h-full min-h-[260px] rounded-2xl overflow-hidden border border-white/10 bg-[#0d0e12]">
            <SafeMedia
              src="/src/assets/images/studio_craft_atmosphere_1794901595072.jpg"
              alt={isRtl ? 'توسعه‌دهندگان بازی تک۱ — TAK1 Game Studio' : 'TAK1 Game Studio Hardware and Craft'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Core Disciplines */}
      <section className="space-y-6">
        <h2 className="font-display text-2xl font-bold text-white">{t.team.disciplinesTitle}</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {t.team.disciplines.map((item, idx) => (
            <div key={idx} className="surface-card rounded-xl p-6 space-y-2.5">
              <span className="font-mono-tabular text-xs font-semibold text-[#D4AF37]">
                0{idx + 1}.
              </span>
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Database-Driven Team Roster */}
      <section className="space-y-6 pt-6 border-t border-white/10">
        <h2 className="font-display text-2xl font-bold text-white">{t.team.rosterTitle}</h2>

        {loadingData ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-56 rounded-xl border border-white/10 bg-[#0d0e12] animate-pulse" />
            ))}
          </div>
        ) : team.length === 0 ? (
          <div className="surface-card rounded-xl p-8 flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-[#D4AF37] shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">{t.team.emptyTitle}</h3>
              <p className="text-sm text-slate-400">{t.team.emptyDesc}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((member) => {
              const name = isRtl ? member.nameFa : member.nameEn;
              const role = isRtl ? member.roleFa : member.roleEn;
              const bio = isRtl ? member.bioFa : member.bioEn;
              return (
                <article key={member.id} className="surface-card rounded-xl p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <SafeMedia
                      src={member.avatarUrl}
                      alt={name}
                      className="h-16 w-16 rounded-full object-cover border border-[#D4AF37]/30 shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">{name}</h3>
                      <p className="text-xs font-medium text-[#D4AF37] truncate">{role}</p>
                    </div>
                  </div>
                  {bio && <p className="text-sm leading-relaxed text-slate-400">{bio}</p>}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
