'use client';

import React, { useState, useMemo } from 'react';
import { Registration, EventItem, MainEvent } from '@/types';
import { Search, Filter, ArrowUpDown, Eye, ShieldAlert } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { CSVExportButton } from './CSVExportButton';

interface RegistrationTableProps {
  registrations: Registration[];
  events: EventItem[];
  mainEvents: MainEvent[];
}

export const RegistrationTable: React.FC<RegistrationTableProps> = ({
  registrations,
  events,
  mainEvents,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMainEventId, setSelectedMainEventId] = useState('ALL');
  const [selectedEventId, setSelectedEventId] = useState('ALL');
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedProgramme, setSelectedProgramme] = useState('ALL');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);

  // Filtered registrations
  const filteredData = useMemo(() => {
    return registrations.filter((reg) => {
      const matchSearch =
        searchQuery === '' ||
        reg.nameSnapshot.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.emailSnapshot.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (reg.phoneSnapshot && reg.phoneSnapshot.includes(searchQuery)) ||
        (reg.eventTitle && reg.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchMainEvent = selectedMainEventId === 'ALL' || reg.mainEventId === selectedMainEventId;
      const matchEvent = selectedEventId === 'ALL' || reg.eventId === selectedEventId;
      const matchRegion = selectedRegion === 'ALL' || reg.regionSnapshot === selectedRegion;
      const matchLevel = selectedLevel === 'ALL' || reg.levelSnapshot === selectedLevel;
      const matchProgramme = selectedProgramme === 'ALL' || reg.programmeSnapshot === selectedProgramme;

      return matchSearch && matchMainEvent && matchEvent && matchRegion && matchLevel && matchProgramme;
    });
  }, [registrations, searchQuery, selectedMainEventId, selectedEventId, selectedRegion, selectedLevel, selectedProgramme]);

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-kaziranga-500 dark:text-cream-400/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, email, phone, or event..."
              className="arena-input pl-10 text-xs sm:text-sm"
            />
          </div>

          <CSVExportButton registrations={filteredData} filename="filtered_registrations.csv" />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-cream-400/20 dark:border-kaziranga-800">
          <div>
            <select
              value={selectedMainEventId}
              onChange={(e) => {
                setSelectedMainEventId(e.target.value);
                setSelectedEventId('ALL'); // Reset sub-event when main event changes
              }}
              className="arena-select text-xs py-1.5"
            >
              <option value="ALL">All Mega Events</option>
              {mainEvents.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              disabled={selectedMainEventId === 'ALL'}
              className="arena-select text-xs py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="ALL">All Sub-Events</option>
              {events
                .filter((e) => selectedMainEventId === 'ALL' || e.mainEventId === selectedMainEventId)
                .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="arena-select text-xs py-1.5"
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
              className="arena-select text-xs py-1.5"
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
              className="arena-select text-xs py-1.5"
            >
              <option value="ALL">All Programmes</option>
              <option value="Data Science & Applications">Data Science & Applications</option>
              <option value="Diploma in Programming">Diploma in Programming</option>
              <option value="Diploma in Data Science">Diploma in Data Science</option>
              <option value="Electronic Systems">Electronic Systems</option>
              <option value="Management and Data Science">Management and Data Science</option>
              <option value="Aeronautics and Space Technology">Aeronautics and Space Technology</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Notice regarding deletion restriction */}
      <div className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
        <span>
          Policy Notice: Administrative accounts cannot modify or delete student registrations to preserve historical event integrity.
        </span>
      </div>

      {/* Table & Cards */}
      <Card className="overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cream-200/50 dark:bg-kaziranga-900 text-[11px] font-bold font-display uppercase tracking-wider text-kaziranga-700 dark:text-cream-300 border-b border-cream-400/30 dark:border-kaziranga-800">
                <th className="p-3.5">Student</th>
                <th className="p-3.5">Event</th>
                <th className="p-3.5">Phone</th>
                <th className="p-3.5">Region</th>
                <th className="p-3.5">Level & Programme</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-400/20 dark:divide-kaziranga-800/60 text-xs">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-kaziranga-500 dark:text-cream-400/60">
                    No matching student registrations found.
                  </td>
                </tr>
              ) : (
                filteredData.map((reg) => (
                  <tr key={reg.id} className="hover:bg-cream-200/40 dark:hover:bg-kaziranga-900/40 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-kaziranga-900 dark:text-cream-100">{reg.nameSnapshot}</div>
                      <div className="text-[11px] text-kaziranga-600 dark:text-cream-400/60 font-mono">{reg.emailSnapshot}</div>
                    </td>
                    <td className="p-3.5 font-semibold text-kaziranga-800 dark:text-cream-200">
                      {reg.eventTitle || 'Event'}
                    </td>
                    <td className="p-3.5 text-kaziranga-700 dark:text-cream-300/80">{reg.phoneSnapshot || 'N/A'}</td>
                    <td className="p-3.5 text-kaziranga-700 dark:text-cream-300/80">{reg.regionSnapshot}</td>
                    <td className="p-3.5">
                      <div className="font-medium text-kaziranga-900 dark:text-cream-100">{reg.programmeSnapshot}</div>
                      <div className="text-[11px] text-kaziranga-500 dark:text-cream-400/60">{reg.levelSnapshot}</div>
                    </td>
                    <td className="p-3.5">
                      <Badge variant={reg.status === 'CONFIRMED' ? 'emerald' : 'rose'} size="sm">
                        {reg.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedRegistration(reg)}
                        className="p-1.5 rounded-lg text-kaziranga-600 hover:bg-cream-200/60 dark:text-cream-300 dark:hover:bg-kaziranga-800"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="md:hidden divide-y divide-cream-400/20 dark:divide-kaziranga-800">
          {filteredData.map((reg) => (
            <div key={reg.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-xs text-kaziranga-900 dark:text-cream-100">{reg.nameSnapshot}</h4>
                  <p className="text-[11px] text-kaziranga-600 dark:text-cream-400/60 font-mono">{reg.emailSnapshot}</p>
                </div>
                <Badge variant={reg.status === 'CONFIRMED' ? 'emerald' : 'rose'} size="sm">
                  {reg.status}
                </Badge>
              </div>
              <p className="text-xs font-semibold text-kaziranga-800 dark:text-cream-200">
                {reg.eventTitle || 'Event'}
              </p>
              <div className="flex items-center justify-between text-[11px] text-kaziranga-600 dark:text-cream-400/70 pt-1">
                <span>{reg.phoneSnapshot}</span>
                <span>{reg.regionSnapshot} • {reg.levelSnapshot}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Participant Details Modal */}
      {selectedRegistration && (
        <Modal
          isOpen={!!selectedRegistration}
          onClose={() => setSelectedRegistration(null)}
          title="Registration Details"
          subtitle={selectedRegistration.id}
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-cream-200/60 dark:bg-kaziranga-900/60 space-y-1">
              <div className="font-bold text-sm text-kaziranga-900 dark:text-cream-100">
                {selectedRegistration.nameSnapshot}
              </div>
              <div className="text-kaziranga-600 dark:text-cream-400/70 font-mono text-[11px]">{selectedRegistration.emailSnapshot}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-kaziranga-700 dark:text-cream-300">
              <div>
                <span className="font-semibold text-kaziranga-900 dark:text-cream-100">Phone: </span>
                {selectedRegistration.phoneSnapshot || 'Not provided'}
              </div>
              <div>
                <span className="font-semibold text-kaziranga-900 dark:text-cream-100">Region: </span>
                {selectedRegistration.regionSnapshot}
              </div>
              <div>
                <span className="font-semibold text-kaziranga-900 dark:text-cream-100">Level: </span>
                {selectedRegistration.levelSnapshot}
              </div>
              <div>
                <span className="font-semibold text-kaziranga-900 dark:text-cream-100">Programme: </span>
                {selectedRegistration.programmeSnapshot}
              </div>
              <div>
                <span className="font-semibold text-kaziranga-900 dark:text-cream-100">Registered At: </span>
                {new Date(selectedRegistration.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-semibold text-kaziranga-900 dark:text-cream-100">Type: </span>
                {selectedRegistration.registrationType}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
