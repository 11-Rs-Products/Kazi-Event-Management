'use client';

import React, { useState } from 'react';
import { UserProfile, UserRole } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { auth, db, isMockMode } from '@/lib/firebase/config';
import { doc, updateDoc, setDoc, collection } from 'firebase/firestore';
import { mockStore } from '@/lib/firebase/mockStore';
import { formatRoleName } from '@/lib/utils/roleFormatter';
import { Search, Shield, Crown, User, ArrowUpRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface RoleManagerProps {
  users: UserProfile[];
  onRoleUpdated?: () => void;
}

export const RoleManager: React.FC<RoleManagerProps> = ({ users, onRoleUpdated }) => {
  const { user: currentUser, refreshUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('USER');
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    return (
      searchQuery === '' ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleOpenModal = (user: UserProfile) => {
    setTargetUser(user);
    setSelectedRole(user.role);
    setSuccessMsg(null);
  };

  const handleConfirmRoleChange = async () => {
    console.log('[RoleManager] handleConfirmRoleChange called');
    console.log('[RoleManager] targetUser:', targetUser);
    console.log('[RoleManager] currentUser:', currentUser);
    console.log('[RoleManager] selectedRole:', selectedRole);
    console.log('[RoleManager] isMockMode:', isMockMode);

    if (!targetUser || !currentUser) {
      console.error('[RoleManager] ABORTED: targetUser or currentUser is null', { targetUser, currentUser });
      return;
    }

    if (selectedRole === targetUser.role) {
      console.warn('[RoleManager] selectedRole is same as current role, no change needed');
      setTargetUser(null);
      return;
    }

    setIsUpdating(true);

    try {
      const oldRole = targetUser.role;
      console.log('[RoleManager] Updating role from', oldRole, 'to', selectedRole, 'for', targetUser.email);

      if (isMockMode) {
        mockStore.updateUserRole(targetUser.uid, selectedRole, currentUser);
        console.log('[RoleManager] Mock role update completed');
      } else {
        const token = await auth.currentUser?.getIdToken();
        let serverSuccess = false;

        if (token) {
          try {
            const response = await fetch('/api/super-admin/users/role', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                targetUserId: targetUser.uid,
                newRole: selectedRole,
              }),
            });

            const result = await response.json().catch(() => null);
            if (response.ok && result?.success) {
              serverSuccess = true;
              console.log('[RoleManager] Server role update transaction completed successfully');
            }
          } catch (apiErr) {
            console.warn('[RoleManager] Server API role update failed, falling back to Client SDK:', apiErr);
          }
        }

        // Client SDK Fallback if Server API was not reachable or failed
        if (!serverSuccess) {
          const timestamp = new Date().toISOString();

          // 1. Update User Role
          const userRef = doc(db, 'users', targetUser.uid);
          await updateDoc(userRef, { role: selectedRole, updatedAt: timestamp });

          // 2. Create Notification Document for target user
          const notifRef = doc(collection(db, 'notifications'));
          await setDoc(notifRef, {
            id: notifRef.id,
            userId: targetUser.uid,
            title: 'Role Updated',
            message: `Your account access role has been updated from ${formatRoleName(oldRole)} to ${formatRoleName(selectedRole)}.`,
            type: 'ROLE_CHANGE',
            read: false,
            createdAt: timestamp,
          });

          // 3. Create Audit Log Document
          const auditRef = doc(collection(db, 'auditLogs'));
          await setDoc(auditRef, {
            id: auditRef.id,
            actorUserId: currentUser.uid,
            actorEmail: currentUser.email,
            action: 'ROLE_CHANGED',
            target: `${targetUser.name} (${targetUser.email})`,
            timestamp,
            metadata: { oldRole, newRole: selectedRole },
          });

          console.log('[RoleManager] Client SDK role update and notification creation completed');
        }
      }

      console.log('[RoleManager] SUCCESS! Setting success message and closing modal');
      setSuccessMsg(`Successfully updated role for ${targetUser.name} (${targetUser.email}) from ${oldRole} to ${selectedRole}`);
      setIsUpdating(false);
      setTargetUser(null);
      await refreshUser();
      if (onRoleUpdated) {
        console.log('[RoleManager] Calling onRoleUpdated callback to refresh user list');
        onRoleUpdated();
      }
    } catch (err: any) {
      console.error('[RoleManager] ROLE UPDATE ERROR:', err);
      console.error('[RoleManager] Error code:', err?.code);
      console.error('[RoleManager] Error message:', err?.message);
      alert('Failed to update role: ' + (err.message || 'Unauthorized'));
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Search Header */}
      <div className="p-4 rounded-2xl bg-white dark:bg-kaziranga-950 border border-kaziranga-100 dark:border-kaziranga-900 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-kaziranga-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name, email, or role..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-kaziranga-50/70 dark:bg-kaziranga-900/50 border border-kaziranga-200 dark:border-kaziranga-800 text-kaziranga-950 dark:text-white placeholder-kaziranga-400 focus:outline-none focus:ring-2 focus:ring-kaziranga-600"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-kaziranga-100 dark:border-kaziranga-900 bg-white dark:bg-kaziranga-950 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-kaziranga-50/80 dark:bg-kaziranga-900/50 text-[11px] font-bold uppercase tracking-wider text-kaziranga-600 dark:text-kaziranga-400 border-b border-kaziranga-100 dark:border-kaziranga-900">
                <th className="p-3.5">User</th>
                <th className="p-3.5">Contact & Department</th>
                <th className="p-3.5">Current Role</th>
                <th className="p-3.5 text-right">Manage Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kaziranga-100 dark:divide-kaziranga-900 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-kaziranga-500">
                    No users matching search found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-kaziranga-50/50 dark:hover:bg-kaziranga-900/30 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-kaziranga-950 dark:text-white">{u.name}</div>
                      <div className="text-[11px] text-kaziranga-500">{u.email}</div>
                    </td>
                    <td className="p-3.5 text-kaziranga-600 dark:text-kaziranga-300">
                      <div>{u.programme || 'Not filled'}</div>
                      <div className="text-[11px] text-kaziranga-500">{u.region || 'No region'} • {u.level || 'No level'}</div>
                    </td>
                    <td className="p-3.5">
                      {u.role === 'SUPER_ADMIN' ? (
                        <Badge variant="gold" size="sm">
                          <Crown className="w-3 h-3 text-gold-500" />
                          <span>Super Admin</span>
                        </Badge>
                      ) : u.role === 'ADMIN' ? (
                        <Badge variant="blue" size="sm">
                          <Shield className="w-3 h-3 text-sky-500" />
                          <span>Admin</span>
                        </Badge>
                      ) : (
                        <Badge variant="emerald" size="sm">
                          <User className="w-3 h-3 text-emerald-500" />
                          <span>User</span>
                        </Badge>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenModal(u)}
                        rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                      >
                        Change Role
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Manager Modal */}
      {targetUser && (
        <Modal
          isOpen={!!targetUser}
          onClose={() => setTargetUser(null)}
          title="Modify Account Role"
          subtitle={`${targetUser.name} (${targetUser.email})`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Privileged Action Confirmation: </span>
                Changing account permissions alters access to administrative dashboards, event editing capabilities, and spreadsheet tools.
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-kaziranga-950 dark:text-white">
                Select New Access Role:
              </label>

              <div className="space-y-2">
                <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedRole === 'USER' ? 'border-kaziranga-600 bg-kaziranga-50/70 dark:bg-kaziranga-900/40' : 'border-kaziranga-200 dark:border-kaziranga-800'}`}>
                  <input
                    type="radio"
                    name="roleChoice"
                    value="USER"
                    checked={selectedRole === 'USER'}
                    onChange={() => setSelectedRole('USER')}
                    className="mt-0.5 text-kaziranga-600"
                  />
                  <div>
                    <div className="font-bold text-kaziranga-950 dark:text-white">USER (Student)</div>
                    <p className="text-[11px] text-kaziranga-500">Can view events, register, view own registrations, and manage own profile.</p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedRole === 'ADMIN' ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/40' : 'border-kaziranga-200 dark:border-kaziranga-800'}`}>
                  <input
                    type="radio"
                    name="roleChoice"
                    value="ADMIN"
                    checked={selectedRole === 'ADMIN'}
                    onChange={() => setSelectedRole('ADMIN')}
                    className="mt-0.5 text-sky-600"
                  />
                  <div>
                    <div className="font-bold text-kaziranga-950 dark:text-white">ADMIN (Event Manager)</div>
                    <p className="text-[11px] text-kaziranga-500">All USER permissions plus event creation, editing, closing, registration viewing, and CSV exports.</p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedRole === 'SUPER_ADMIN' ? 'border-gold-500 bg-amber-50/70 dark:bg-amber-950/40' : 'border-kaziranga-200 dark:border-kaziranga-800'}`}>
                  <input
                    type="radio"
                    name="roleChoice"
                    value="SUPER_ADMIN"
                    checked={selectedRole === 'SUPER_ADMIN'}
                    onChange={() => setSelectedRole('SUPER_ADMIN')}
                    className="mt-0.5 text-gold-500"
                  />
                  <div>
                    <div className="font-bold text-gold-600 dark:text-gold-400">SUPER ADMIN (System Administrator)</div>
                    <p className="text-[11px] text-kaziranga-500">Full platform privileges including allowed-user spreadsheet synchronization, role management, and audit logs.</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-kaziranga-100 dark:border-kaziranga-900">
              <Button type="button" variant="ghost" onClick={() => setTargetUser(null)}>
                Cancel
              </Button>
              <Button type="button" variant="gold" isLoading={isUpdating} onClick={handleConfirmRoleChange}>
                Confirm Role Update
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
