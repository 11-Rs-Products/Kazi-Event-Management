'use client';

import React, { useState, useMemo } from 'react';
import { Registration, EventItem } from '@/types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { CSVExportButton } from './CSVExportButton';
import { Search, Filter, ShieldAlert, Eye, User, Phone, MapPin, GraduationCap, BookOpen, Calendar } from 'lucide-react';

interface RegistrationTableProps {
  registrations: Registration[];
  events: EventItem[];
}

export const RegistrationTable: React.FC<RegistrationTableProps> = ({
  registrations,
  events,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedProgramme, setSelectedProgramme] = useState<string>('ALL');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);

  const filteredData = useMemo(() => {
    return registrations.filter((reg) => {
      // Event filter
      if (selectedEventId !== 'ALL' && reg.eventId !== selectedEventId) return false;

      // Region filter
      if (selectedRegion !== 'ALL' && reg.regionSnapshot !== selectedRegion) return false;

      // Level filter
      if (selectedLevel !== 'ALL' && reg.levelSnapshot !== selectedLevel) return false;

      // Programme filter
      if (selectedProgramme !== 'ALL' && reg.programmeSnapshot !== selectedProgramme) return false;

      // Search query (Student Name, Email, Phone, or Event Name)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = reg.nameSnapshot?.toLowerCase().includes(q);
        const matchesEmail = reg.emailSnapshot?.toLowerCase().includes(q);
        const matchesPhone = reg.phoneSnapshot?.toLowerCase().includes(q);
        const matchesEvent = reg.eventTitle?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesEvent) return false;
      }

      return true;
    });
  }, [registrations, selectedEventId, selectedRegion, selectedLevel, selectedProgramme, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search & Multi-Filter Control Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-kaziranga-500 dark:text-cream-400/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, email, phone, or event..."
              className="arena-input pl-10"
            />
          </div>

          <CSVExportButton
            registrations={filteredData}
            filename={`kaziranga_registrations_filtered_${Date.now()}.csv`}
          />
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="arena-select text-xs py-2"
            >
              <option value="ALL">All Events</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="arena-select text-xs py-2"
            >
              <option value="ALL">All Regions</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Chandigarh">Chandigarh</option>
              <option value="Chennai">Chennai</option>
              <option value="Delhi">Delhi</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Kolkata">Kolkata</option>
              <option value="Lucknow">Lucknow</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Patna">Patna</option>
            </select>
          </div>

          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="arena-select text-xs py-2"
            >
              <option value="ALL">All Levels</option>
              <option value="Foundation">Foundation</option>
              <option value="Diploma">Diploma</option>
              <option value="Degree">Degree</option>
            </select>
          </div>

          <div>
            <select
              value={selectedProgramme}
              onChange={(e) => setSelectedProgramme(e.target.value)}
              className="arena-select text-xs py-2"
            >
              <option value="ALL">All Programmes</option>
              <option value="BS Data Science">BS Data Science</option>
              <option value="BS Electronic Systems">BS Electronic Systems</option>
              <option value="Programming Diploma">Programming Diploma</option>
              <option value="Data Science Diploma">Data Science Diploma</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Policy Notice */}
      <div className="px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>
          Policy Notice: Administrative accounts cannot modify or delete student registrations to preserve historical event integrity.
        </span>
      </div>

      {/* Table Container */}
      <Card className="overflow-hidden shadow-arena">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="arena-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Event</th>
                <th>Phone</th>
                <th>Region</th>
                <th>Level & Programme</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-kaziranga-500 dark:text-cream-400/50">
                    No matching student registrations found.
                  </td>
                </tr>
              ) : (
                filteredData.map((reg) => (
                  <tr key={reg.id}>
                    <td>
                      <div className="font-display font-bold text-kaziranga-800 dark:text-cream-100">{reg.nameSnapshot}</div>
                      <div className="text-[11px] font-mono text-kaziranga-500 dark:text-cream-400/50">{reg.emailSnapshot}</div>
                    </td>
                    <td className="font-semibold text-kaziranga-800 dark:text-cream-200">
                      {reg.eventTitle || 'Event'}
                    </td>
                    <td className="font-mono text-kaziranga-700 dark:text-cream-300">{reg.phoneSnapshot || 'N/A'}</td>
                    <td className="text-kaziranga-700 dark:text-cream-300">{reg.regionSnapshot}</td>
                    <td>
                      <div className="font-medium text-kaziranga-800 dark:text-cream-200">{reg.programmeSnapshot}</div>
                      <div className="text-[11px] text-kaziranga-500 dark:text-cream-400/50">{reg.levelSnapshot}</div>
                    </td>
                    <td>
                      <Badge variant={reg.status === 'CONFIRMED' ? 'emerald' : 'rose'} size="sm">
                        {reg.status}
                      </Badge>
                    </td>
                    <td className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedRegistration(reg)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Snapshot
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-cream-400/20 dark:divide-kaziranga-800/60">
          {filteredData.length === 0 ? (
            <div className="p-8 text-center text-xs text-kaziranga-500 dark:text-cream-400/50">
              No matching registrations found.
            </div>
          ) : (
            filteredData.map((reg) => (
              <div key={reg.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-display font-bold text-sm text-kaziranga-800 dark:text-cream-100">
                      {reg.nameSnapshot}
                    </h4>
                    <p className="text-xs text-kaziranga-600 dark:text-cream-400/60 font-semibold">{reg.eventTitle}</p>
                    <p className="text-[11px] font-mono text-kaziranga-500 dark:text-cream-400/50">{reg.emailSnapshot}</p>
                  </div>
                  <Badge variant={reg.status === 'CONFIRMED' ? 'emerald' : 'rose'} size="sm">
                    {reg.status}
                  </Badge>
                </div>

                <div className="text-xs text-kaziranga-700 dark:text-cream-300 grid grid-cols-2 gap-1.5 p-2.5 rounded-xl bg-cream-200/40 dark:bg-kaziranga-800/40 border border-cream-400/20 dark:border-kaziranga-700/40">
                  <div>Region: <span className="font-semibold">{reg.regionSnapshot}</span></div>
                  <div>Phone: <span className="font-semibold font-mono">{reg.phoneSnapshot || 'N/A'}</span></div>
                  <div className="col-span-2">{reg.programmeSnapshot} ({reg.levelSnapshot})</div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedRegistration(reg)}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Snapshot Modal */}
      {selectedRegistration && (
        <Modal
          isOpen={!!selectedRegistration}
          onClose={() => setSelectedRegistration(null)}
          title="Registration Snapshot Record"
          subtitle={`Immutable registration record #${selectedRegistration.id.slice(0, 10)}`}
        >
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="p-4 rounded-xl bg-cream-200/50 dark:bg-kaziranga-800/50 border border-cream-400/20 dark:border-kaziranga-700/50 space-y-2">
              <div className="flex items-center gap-2 font-display font-bold text-kaziranga-800 dark:text-cream-100">
                <Calendar className="w-4 h-4 text-gold-500" />
                <span>{selectedRegistration.eventTitle}</span>
              </div>
              <div className="text-xs text-kaziranga-600 dark:text-cream-400/60">
                Registered On: {new Date(selectedRegistration.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-cream-100/60 dark:bg-kaziranga-800/30 border border-cream-400/20 dark:border-kaziranga-800 space-y-1">
                <div className="flex items-center gap-1.5 text-kaziranga-500 dark:text-cream-400/50 text-xs">
                  <User className="w-3.5 h-3.5" />
                  <span>Student Name</span>
                </div>
                <div className="font-display font-bold text-kaziranga-800 dark:text-cream-100">
                  {selectedRegistration.nameSnapshot}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cream-100/60 dark:bg-kaziranga-800/30 border border-cream-400/20 dark:border-kaziranga-800 space-y-1">
                <div className="flex items-center gap-1.5 text-kaziranga-500 dark:text-cream-400/50 text-xs">
                  <span>Student Email</span>
                </div>
                <div className="font-mono text-xs text-kaziranga-800 dark:text-cream-100 truncate">
                  {selectedRegistration.emailSnapshot}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cream-100/60 dark:bg-kaziranga-800/30 border border-cream-400/20 dark:border-kaziranga-800 space-y-1">
                <div className="flex items-center gap-1.5 text-kaziranga-500 dark:text-cream-400/50 text-xs">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Contact Phone</span>
                </div>
                <div className="font-mono text-kaziranga-800 dark:text-cream-100">
                  {selectedRegistration.phoneSnapshot || 'Not provided'}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cream-100/60 dark:bg-kaziranga-800/30 border border-cream-400/20 dark:border-kaziranga-800 space-y-1">
                <div className="flex items-center gap-1.5 text-kaziranga-500 dark:text-cream-400/50 text-xs">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Region</span>
                </div>
                <div className="font-semibold text-kaziranga-800 dark:text-cream-100">
                  {selectedRegistration.regionSnapshot}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cream-100/60 dark:bg-kaziranga-800/30 border border-cream-400/20 dark:border-kaziranga-800 space-y-1">
                <div className="flex items-center gap-1.5 text-kaziranga-500 dark:text-cream-400/50 text-xs">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Academic Level</span>
                </div>
                <div className="font-semibold text-kaziranga-800 dark:text-cream-100">
                  {selectedRegistration.levelSnapshot}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cream-100/60 dark:bg-kaziranga-800/30 border border-cream-400/20 dark:border-kaziranga-800 space-y-1">
                <div className="flex items-center gap-1.5 text-kaziranga-500 dark:text-cream-400/50 text-xs">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Programme</span>
                </div>
                <div className="font-semibold text-kaziranga-800 dark:text-cream-100">
                  {selectedRegistration.programmeSnapshot}
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <Button variant="primary" onClick={() => setSelectedRegistration(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
