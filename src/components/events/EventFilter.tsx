import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Card } from '../ui/Card';

interface EventFilterProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  categories: string[];
}

export const EventFilter: React.FC<EventFilterProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  categories,
}) => {
  return (
    <Card className="p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-kaziranga-500 dark:text-cream-400/50" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search events by title, description, or venue..."
          className="arena-input pl-10"
        />
      </div>

      {/* Category Dropdown */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-kaziranga-500 dark:text-cream-400/50 hidden sm:inline" />
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="arena-select text-xs py-2.5"
        >
          <option value="ALL">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Status Dropdown */}
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="arena-select text-xs py-2.5"
        >
          <option value="ALL">All Statuses</option>
          <option value="PUBLISHED">Open for Registration</option>
          <option value="CLOSED">Closed</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>
    </Card>
  );
};
