'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getNavSections } from './navConfig';
import { NavSectionBlock, SocialRow } from './NavList';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const sections = getNavSections(user.role);

  return (
    <aside
      className="hidden lg:flex flex-col justify-between shrink-0 ed-chrome
        w-[var(--sidebar-width)] border-r border-white/[0.07]
        sticky top-[var(--navbar-height)] h-[calc(100vh-var(--navbar-height))]
        overflow-y-auto no-scrollbar z-30 py-6"
    >
      <nav className="px-3" aria-label="Main navigation">
        {sections.map((section, i) => (
          <NavSectionBlock
            key={section.id}
            section={section}
            pathname={pathname}
            isFirst={i === 0}
          />
        ))}
      </nav>

      <div className="px-4 pt-6 mt-6 border-t border-white/[0.07] space-y-4">
        <SocialRow className="justify-center" />
        <p className="text-center text-[0.625rem] leading-relaxed text-white/25 font-display uppercase tracking-eyebrow">
          Rhinos Arena
          <span className="block mt-1 tracking-normal normal-case text-white/20">
            Kaziranga House · IIT Madras
          </span>
        </p>
      </div>
    </aside>
  );
};
