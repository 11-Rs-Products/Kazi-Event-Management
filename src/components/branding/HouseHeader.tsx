import React from 'react';
import { Trophy, Sparkles } from 'lucide-react';
import { KazirangaLogo } from './KazirangaLogo';

interface HouseHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
  actions?: React.ReactNode;
}

export const HouseHeader: React.FC<HouseHeaderProps> = ({
  title,
  subtitle,
  badge = 'Official Kaziranga Portal',
  actions,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-kaziranga-950 via-kaziranga-900 to-kaziranga-950 text-white p-6 sm:p-8 lg:p-10 shadow-2xl border border-kaziranga-800/80">
      {/* Background Decor Ambient Lighting */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-kaziranga-600/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gold-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-kaziranga-800/90 border border-kaziranga-600/60 text-gold-400 text-xs font-bold tracking-wider shadow-sm">
              <Trophy className="w-3.5 h-3.5 text-gold-400 shrink-0" />
              <span>{badge}</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-tight">
            {title}
          </h1>

          <p className="text-xs sm:text-sm text-kaziranga-100/90 leading-relaxed max-w-xl">
            {subtitle}
          </p>
        </div>

        {actions && (
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
