'use client';

import React, { useState } from 'react';
import { useTenure } from '@/context/TenureContext';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
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
      setErrorMsg(`Tenure "${cleanId}" already exists.`);
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
          <Calendar className="w-4 h-4 text-kaziranga-600 dark:text-gold-400" />
          <h3 className="text-sm font-display font-bold text-kaziranga-800 dark:text-cream-100">
            Tenures ({tenures.length})
          </h3>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setIsCreateOpen(true);
            }}
            className="text-xs font-bold text-kaziranga-700 dark:text-cream-300 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Tenure</span>
          </button>
        )}
      </div>

      <Card className="p-0 overflow-hidden shadow-arena divide-y divide-cream-400/15 dark:divide-kaziranga-800/40">
        {tenures.map((tenure) => {
          const isActive = tenure.active || tenure.id === activeTenureId;
          return (
            <div
              key={tenure.id}
              className="p-4 flex items-center justify-between gap-4 hover:bg-cream-100/40 dark:hover:bg-kaziranga-900/40 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-cream-400 dark:bg-kaziranga-700'}`} />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-kaziranga-900 dark:text-cream-100 truncate">
                    {tenure.displayName || tenure.id}
                  </div>
                  <div className="text-[10px] text-kaziranga-400 dark:text-cream-400/40 font-mono mt-0.5">
                    Created: {formatTenureDate(tenure.createdAt)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isActive ? (
                  <Badge variant="emerald" size="sm">
                    <Check className="w-3 h-3 mr-1" /> Active
                  </Badge>
                ) : (
                  isSuperAdmin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
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
      </Card>

      {/* Create Tenure Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => !isSubmitting && setIsCreateOpen(false)}
        title="Add Academic Tenure"
        subtitle="Define a new academic cycle partition for events and registrations."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
              Tenure ID <span className="text-rose-500">*</span>
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
              className="arena-input text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-kaziranga-800 dark:text-cream-200 mb-1">
              Display Name
            </label>
            <input
              type="text"
              placeholder="e.g. 2027-2028 Academic Tenure"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              className="arena-input text-xs"
            />
          </div>

          <div className="p-3 rounded-xl bg-cream-100 dark:bg-kaziranga-900/60 border border-cream-400/20 dark:border-kaziranga-800">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-kaziranga-800 dark:text-cream-200">
              <input
                type="checkbox"
                checked={makeActiveImmediately}
                onChange={(e) => setMakeActiveImmediately(e.target.checked)}
                className="rounded text-gold-500 focus:ring-gold-400"
              />
              <span className="font-semibold">Set as active cycle immediately</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-cream-400/20 dark:border-kaziranga-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
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
        message={`Switch active academic cycle to "${targetTenureObj?.displayName || activateTargetId}"? New events and registrations will target this cycle.`}
        confirmText="Confirm Switch"
        cancelText="Cancel"
        variant="warning"
        isLoading={isActivating}
      />
    </div>
  );
};
