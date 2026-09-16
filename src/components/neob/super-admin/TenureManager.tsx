'use client';

import React, { useState } from 'react';
import { useTenure } from '@/context/TenureContext';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/neob/ui/Card';
import { Button } from '@/components/neob/ui/Button';
import { Badge } from '@/components/neob/ui/Badge';
import { Modal } from '@/components/neob/ui/Modal';
import { ConfirmModal } from '@/components/neob/ui/ConfirmModal';
import { Calendar, Plus, Check, AlertTriangle } from 'lucide-react';

export const TenureManager: React.FC = () => {
  const { user } = useAuth();
  const { tenures, activeTenureId, createTenure, activateTenure } = useTenure();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTenureId, setNewTenureId] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [makeActiveImmediately, setMakeActiveImmediately] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activateTargetId, setActivateTargetId] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = newTenureId.trim();
    if (!cleanId) {
      setErrorMsg('Please enter a valid Tenure ID (e.g. 2027-2028).');
      return;
    }

    if (tenures.some((t) => t.id.toLowerCase() === cleanId.toLowerCase())) {
      setErrorMsg(`Tenure"${cleanId}" already exists.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await createTenure({
        id: cleanId,
        displayName: newDisplayName.trim() || `${cleanId} Academic Tenure`,
        active: makeActiveImmediately,
      });
      setNewTenureId('');
      setNewDisplayName('');
      setMakeActiveImmediately(false);
      setIsCreateOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create tenure.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeActivate = async () => {
    if (!activateTargetId) return;
    setIsActivating(true);
    try {
      await activateTenure(activateTargetId);
      setActivateTargetId(null);
    } catch (err) {
      console.error('Failed to activate tenure:', err);
    } finally {
      setIsActivating(false);
    }
  };

  const formatTenureDate = (dateVal: any) => {
    if (!dateVal) return 'Current';
    if (typeof dateVal === 'object' && dateVal.seconds) {
      return new Date(dateVal.seconds * 1000).toLocaleDateString();
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? 'Current' : d.toLocaleDateString();
  };

  const targetTenureObj = tenures.find((t) => t.id === activateTargetId);

  return (
    <div className="space-y-3">
      <div className="h-7 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-display font-bold text-ink">Tenures ({tenures.length})</h3>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FFE873] text-black border-2 border-black shadow-[2px_2px_0px_#121212] font-display font-black text-caption transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none hover:bg-black hover:text-white cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Tenure</span>
          </button>
        )}
      </div>

      <div className="rounded-2xl border-2 border-black dark:border-white bg-surface-raised overflow-hidden shadow-[4px_4px_0px_#121212] dark:shadow-[4px_4px_0px_#FFFFFF] divide-y-2 divide-black/10 dark:divide-white/20">
        {tenures.map((tenure) => {
          const isActive = tenure.active || tenure.id === activeTenureId;
          return (
            <div
              key={tenure.id}
              className="p-4 flex items-center justify-between gap-4 hover:bg-[#FFE873]/10 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-signal-live' : 'bg-surface-sunken'}`}
                />
                <div className="min-w-0">
                  <div className="text-caption font-bold text-ink truncate">
                    {tenure.displayName || tenure.id}
                  </div>
                  <div className="text-micro text-ink-faint font-mono mt-0.5">
                    Created: {formatTenureDate(tenure.createdAt)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isActive ? (
                  <Badge tone="live" size="sm">
                    <Check className="w-3 h-3 mr-1" /> Active
                  </Badge>
                ) : (
                  isSuperAdmin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-caption"
                      onClick={() => setActivateTargetId(tenure.id)}
                    >
                      Make Active
                    </Button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Tenure Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => !isSubmitting && setIsCreateOpen(false)}
        title="Add Academic Tenure"
        subtitle="Define a new academic cycle partition for events and registrations."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-[#FFA0A0] text-black border-2 border-black shadow-[2px_2px_0px_#121212] text-caption font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-black stroke-[2.5]" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-caption font-black text-ink mb-1 font-display">
              Tenure ID <span className="text-signal-danger">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 2027-2028"
              value={newTenureId}
              onChange={(e) => {
                setNewTenureId(e.target.value);
                if (!newDisplayName || newDisplayName.includes('Academic Tenure')) {
                  setNewDisplayName(`${e.target.value} Academic Tenure`);
                }
              }}
              className="ed-field text-caption font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-caption font-black text-ink mb-1 font-display">Display Name</label>
            <input
              type="text"
              placeholder="e.g. 2027-2028 Academic Tenure"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              className="ed-field text-caption font-medium"
            />
          </div>

          <div className="p-3 rounded-2xl bg-surface-sunken border-2 border-black dark:border-white shadow-[2px_2px_0px_#121212]">
            <label className="flex items-center gap-2.5 cursor-pointer text-caption text-ink">
              <input
                type="checkbox"
                checked={makeActiveImmediately}
                onChange={(e) => setMakeActiveImmediately(e.target.checked)}
                className="rounded text-black focus:ring-black"
              />
              <span className="font-bold">Set as active cycle immediately</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-black dark:border-white">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!activateTargetId}
        onClose={() => setActivateTargetId(null)}
        onConfirm={executeActivate}
        title="Change Active Tenure"
        message={`Switch active academic cycle to"${targetTenureObj?.displayName || activateTargetId}"? New events and registrations will target this cycle.`}
        confirmText="Confirm Switch"
        cancelText="Cancel"
        variant="warning"
        isLoading={isActivating}
      />
    </div>
  );
};
