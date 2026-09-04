'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { EventGroup } from '@/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { getOptimizedImageUrl } from '@/lib/utils/imageFormatter';

const FALLBACK_COVER =
  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&auto=format&fit=crop&q=80';

export const EventGroupCard: React.FC<{ group: EventGroup }> = ({ group }) => (
  <Card as="article" hoverable className="group relative flex flex-col h-full">
    <div className="relative aspect-[16/10] w-full bg-stage overflow-hidden">
      <img
        src={getOptimizedImageUrl(group.coverImageUrl) || FALLBACK_COVER}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.06]"
        onError={(e) => {
          e.currentTarget.src = FALLBACK_COVER;
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-stage via-stage/30 to-transparent" aria-hidden />

      <div className="absolute top-3 left-3">
        <Badge tone="inverse" size="sm">
          {group.status}
        </Badge>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5">
        <h3 className="font-display font-extrabold text-title text-white leading-tight clamp-2">
          <Link href={`/events/${group.id}`} className="after:absolute after:inset-0 after:content-['']">
            {group.name}
          </Link>
        </h3>
      </div>
    </div>

    <div className="flex-1 flex flex-col justify-between gap-4 p-5">
      <p className="text-caption text-ink-muted leading-relaxed clamp-2">
        {group.description}
      </p>
      <span className="inline-flex items-center gap-1.5 text-caption font-display font-bold text-brand">
        Explore events
        <ArrowUpRight className="w-4 h-4 transition-transform duration-300 ease-editorial group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
      </span>
    </div>
  </Card>
);
