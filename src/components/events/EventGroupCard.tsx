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
      {/* Cover Image Header */}
      <div className="relative h-44 w-full bg-kaziranga-900 overflow-hidden">
        <img
          src={group.coverImageUrl || defaultImage}
          alt={group.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-kaziranga-950 via-kaziranga-950/30 to-transparent" />
        
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="px-2.5 py-1 rounded-full bg-kaziranga-950/80 backdrop-blur-md text-white text-[11px] font-bold border border-kaziranga-700/50">
            {group.status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <Link href={`/events/${group.id}`}>
            <h3 className="text-base sm:text-lg font-bold text-kaziranga-950 dark:text-white group-hover:text-kaziranga-600 dark:group-hover:text-kaziranga-300 transition-colors line-clamp-2">
              {group.name}
            </h3>
          </Link>
          <p className="text-xs text-kaziranga-600 dark:text-kaziranga-300 line-clamp-2 leading-relaxed">
            {group.description}
          </p>
        </div>

        {/* Actions Footer */}
        <div className="pt-3 flex items-center justify-end gap-3 border-t border-kaziranga-100 dark:border-kaziranga-900/60">
          <Link href={`/events/${group.id}`}>
            <Button size="sm" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View Events
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};
