import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

interface HouseHeaderProps {
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export const HouseHeader: React.FC<HouseHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl rhinos-hero-gradient text-cream-100 p-6 sm:p-8 lg:p-10 shadow-kaziranga-lg border border-kaziranga-700/30"
    >
      {/* Soft Ambient Depth Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-kaziranga-600/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-gold-500/10 blur-3xl" />

        {/* Geometric diagonal texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 20px,
              rgba(245, 244, 220, 0.5) 20px,
              rgba(245, 244, 220, 0.5) 21px
            )`,
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          {badge && (
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cream-300/10 backdrop-blur-sm border border-cream-300/15 text-gold-400 text-xs font-bold tracking-wider font-display">
                {badge}
              </div>
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-black tracking-tight text-cream-50 leading-[1.1]">
            {title}
          </h1>

          <p className="text-sm text-cream-300/80 leading-relaxed max-w-xl">
            {subtitle}
          </p>
        </div>

        {actions && (
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
    </motion.div>
  );
};
