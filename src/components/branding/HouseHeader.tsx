import React from 'react';
import { ShieldCheck, Trophy, Sparkles } from 'lucide-react';

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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-kaziranga-950 via-kaziranga-800 to-kaziranga-900 text-white p-6 sm:p-8 shadow-kaziranga border border-kaziranga-700/50">
      {/* Background Decor */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-kaziranga-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gold-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-kaziranga-700/60 border border-kaziranga-500/30 text-gold-400 text-xs font-semibold tracking-wide">
            <Trophy className="w-3.5 h-3.5 text-gold-400" />
            <span>{badge}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {title}
          </h1>

          <p className="text-sm sm:text-base text-kaziranga-100/80 leading-relaxed">
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
