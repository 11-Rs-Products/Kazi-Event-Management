'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { EventGroup } from '@/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { getOptimizedImageUrl } from '@/lib/utils/imageFormatter';

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80';

export const EventGroupCard: React.FC<{ group: EventGroup }> = ({ group }) => (
  <Card as="article" hoverable className="group relative flex flex-col h-full overflow-hidden">
    <div className="relative aspect-[16/9] w-full bg-surface-sunken overflow-hidden border-b-2 border-black dark:border-white">
      <img
        src={getOptimizedImageUrl(group.coverImageUrl) || FALLBACK_COVER}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.05]"
        onError={(e) => {
          e.currentTarget.src = FALLBACK_COVER;
        }}
      />

      <div className="absolute top-3 left-3">
        <Badge tone={group.status === 'PUBLISHED' ? 'live' : 'accent'} size="sm">
          {group.status}
        </Badge>
      </div>
    </div>

    <div className="flex-1 flex flex-col justify-between gap-4 p-5">
      <div className="space-y-2">
        <h3 className="font-display font-black text-title text-ink leading-tight clamp-2">
          <Link href={`/events/${group.id}`} className="hover:underline">
            {group.name}
          </Link>
        </h3>
        {group.description && (
          <p className="text-caption text-ink-muted leading-relaxed clamp-2 font-medium">
            {group.description}
          </p>
        )}
      </div>

      <div className="pt-3 border-t-2 border-black dark:border-white flex items-center justify-between gap-3">
        <span className="text-caption font-display font-extrabold text-ink-faint uppercase tracking-wider text-[0.6875rem]">
          House Festival
        </span>
        <Link href={`/events/${group.id}`}>
          <Button size="sm" variant="primary">
            Explore
            <ArrowUpRight className="w-3.5 h-3.5 ml-1 stroke-[2.5]" aria-hidden />
          </Button>
        </Link>
      </div>
    </div>
  </Card>
);
