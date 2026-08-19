'use client';

import React, { useState, useMemo } from 'react';
import { Registration, EventItem, MainEvent } from '@/types';
import { Search, Filter, ArrowUpDown, Eye, ShieldAlert } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
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
      <div className="p-4 rounded-2xl bg-white dark:bg-kaziranga-950 border border-kaziranga-100 dark:border-kaziranga-900 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-kaziranga-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, email, phone, or event..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-kaziranga-50/70 dark:bg-kaziranga-900/50 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white placeholder-kaziranga-400 focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
            />
          </div>

          <CSVExportButton registrations={filteredData} filename="filtered_registrations.csv" />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-kaziranga-100 dark:border-kaziranga-900">
          <div>
            <select
              value={selectedMainEventId}
              onChange={(e) => {
                setSelectedMainEventId(e.target.value);
                setSelectedEventId('ALL'); // Reset sub-event when main event changes
              }}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-kaziranga-50/70 dark:bg-kaziranga-900/50 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white"
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
              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-kaziranga-50/70 dark:bg-kaziranga-900/50 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-kaziranga-50/70 dark:bg-kaziranga-900/50 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white"
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
              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-kaziranga-50/70 dark:bg-kaziranga-900/50 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white"
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
              className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-kaziranga-50/70 dark:bg-kaziranga-900/50 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white"
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
      </div>

      {/* Notice regarding deletion restriction */}
      <div className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
        <span>
          Policy Notice: Administrative accounts cannot modify or delete student registrations to preserve historical event integrity.
        </span>
      </div>

      {/* Table & Cards */}
      <div className="rounded-2xl border border-kaziranga-100 dark:border-kaziranga-900 bg-white dark:bg-kaziranga-950 overflow-hidden shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-kaziranga-50/80 dark:bg-kaziranga-900/50 text-[11px] font-bold uppercase tracking-wider text-kaziranga-600 dark:text-kaziranga-400 border-b border-kaziranga-100 dark:border-kaziranga-900">
                <th className="p-3.5">Student</th>
                <th className="p-3.5">Event</th>
                <th className="p-3.5">Phone</th>
                <th className="p-3.5">Region</th>
                <th className="p-3.5">Level & Programme</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kaziranga-100 dark:divide-kaziranga-900 text-xs">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-kaziranga-500">
                    No matching student registrations found.
                  </td>
                </tr>
              ) : (
                filteredData.map((reg) => (
                  <tr key={reg.id} className="hover:bg-kaziranga-50/50 dark:hover:bg-kaziranga-900/30 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-kaziranga-950 dark:text-white">{reg.nameSnapshot}</div>
                      <div className="text-[11px] text-kaziranga-500">{reg.emailSnapshot}</div>
                    </td>
                    <td className="p-3.5 font-semibold text-kaziranga-800 dark:text-kaziranga-200">
                      {reg.eventTitle || 'Event'}
                    </td>
                    <td className="p-3.5 text-kaziranga-600 dark:text-kaziranga-300">{reg.phoneSnapshot || 'N/A'}</td>
                    <td className="p-3.5 text-kaziranga-600 dark:text-kaziranga-300">{reg.regionSnapshot}</td>
                    <td className="p-3.5">
                      <div className="font-medium">{reg.programmeSnapshot}</div>
                      <div className="text-[11px] text-kaziranga-500">{reg.levelSnapshot}</div>
                    </td>
                    <td className="p-3.5">
                      <Badge variant={reg.status === 'CONFIRMED' ? 'emerald' : 'rose'} size="sm">
                        {reg.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedRegistration(reg)}
                        className="p-1.5 rounded-lg text-kaziranga-600 hover:bg-kaziranga-100 dark:text-kaziranga-300 dark:hover:bg-kaziranga-900"
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
        <div className="md:hidden divide-y divide-kaziranga-100 dark:divide-kaziranga-900">
          {filteredData.map((reg) => (
            <div key={reg.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-xs text-kaziranga-950 dark:text-white">{reg.nameSnapshot}</h4>
                  <p className="text-[11px] text-kaziranga-500">{reg.emailSnapshot}</p>
                </div>
                <Badge variant={reg.status === 'CONFIRMED' ? 'emerald' : 'rose'} size="sm">
                  {reg.status}
                </Badge>
              </div>
              <p className="text-xs font-semibold text-kaziranga-800 dark:text-kaziranga-200">
                {reg.eventTitle || 'Event'}
              </p>
              <div className="flex items-center justify-between text-[11px] text-kaziranga-600 dark:text-kaziranga-400 pt-1">
                <span>{reg.phoneSnapshot}</span>
                <span>{reg.regionSnapshot} • {reg.levelSnapshot}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Participant Details Modal */}
      {selectedRegistration && (
        <Modal
          isOpen={!!selectedRegistration}
          onClose={() => setSelectedRegistration(null)}
          title="Registration Details"
          subtitle={selectedRegistration.id}
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-kaziranga-50 dark:bg-kaziranga-900/40 space-y-1">
              <div className="font-bold text-sm text-kaziranga-950 dark:text-white">
                {selectedRegistration.nameSnapshot}
              </div>
              <div className="text-kaziranga-600 dark:text-kaziranga-300">{selectedRegistration.emailSnapshot}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-kaziranga-700 dark:text-kaziranga-300">
              <div>
                <span className="font-semibold text-kaziranga-900 dark:text-white">Phone: </span>
                {selectedRegistration.phoneSnapshot || 'Not provided'}
              </div>
              <div>
                <span className="font-semibold text-kaziranga-900 dark:text-white">Region: </span>
                {selectedRegistration.regionSnapshot}
              </div>
              <div>
                <span className="font-semibold text-kaziranga-900 dark:text-white">Level: </span>
                {selectedRegistration.levelSnapshot}
              </div>
              <div>
                <span className="font-semibold text-kaziranga-900 dark:text-white">Programme: </span>
                {selectedRegistration.programmeSnapshot}
              </div>
              <div>
                <span className="font-semibold text-kaziranga-900 dark:text-white">Registered At: </span>
                {new Date(selectedRegistration.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-semibold text-kaziranga-900 dark:text-white">Type: </span>
                {selectedRegistration.registrationType}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
