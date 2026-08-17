'use client';

import React from 'react';
import Link from 'next/link';
import { EventGroup } from '@/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ArrowRight } from 'lucide-react';

interface EventGroupCardProps {
  group: EventGroup;
}

export const EventGroupCard: React.FC<EventGroupCardProps> = ({ group }) => {
  const defaultImage =
    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80';

  return (
    <Card hoverable className="flex flex-col h-full group">
      {/* Cover Image */}
      <div className="relative h-48 w-full bg-kaziranga-900 overflow-hidden">
        <img
          src={group.coverImageUrl || defaultImage}
          alt={group.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-kaziranga-950 via-kaziranga-950/20 to-transparent" />

        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-lg bg-kaziranga-800/80 backdrop-blur-sm text-cream-200 text-[11px] font-bold border border-kaziranga-700/40 font-display">
            {group.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <Link href={`/events/${group.id}`}>
            <h3 className="text-base sm:text-lg font-display font-bold text-kaziranga-800 dark:text-cream-100 group-hover:text-kaziranga-600 dark:group-hover:text-kaziranga-300 transition-colors line-clamp-2">
              {group.name}
            </h3>
          </Link>
          <p className="text-xs text-kaziranga-600 dark:text-cream-400/60 line-clamp-2 leading-relaxed">
            {group.description}
          </p>
        </div>

        <div className="pt-3 flex items-center justify-end gap-3 border-t border-cream-400/20 dark:border-kaziranga-800/40">
          <Link href={`/events/${group.id}`}>
            <Button size="sm" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Explore Events
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};
