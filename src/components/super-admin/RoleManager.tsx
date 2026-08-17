'use client';

import React, { useState } from 'react';
import { UserProfile, UserRole } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { auth, db, isMockMode } from '@/lib/firebase/config';
import { doc, updateDoc, setDoc, collection } from 'firebase/firestore';
import { mockStore } from '@/lib/firebase/mockStore';
import { formatRoleName } from '@/lib/utils/roleFormatter';
import { Search, Shield, Crown, User, ArrowUpRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
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
          const userDocRef = doc(db, 'users', targetUser.uid);
          await updateDoc(userDocRef, {
            role: selectedRole,
            updatedAt: timestamp,
          });

          // Create notification doc directly in notifications collection
          const notifId = 'notif_' + Date.now();
          const notifDocRef = doc(db, 'notifications', notifId);
          await setDoc(notifDocRef, {
            id: notifId,
            userId: targetUser.uid,
            title: 'Role Updated! 🛡️',
            message: `Your account role has been updated from ${formatRoleName(oldRole)} to ${formatRoleName(selectedRole)} by Kaziranga House Management.`,
            type: 'ROLE_CHANGE',
            read: false,
            createdAt: timestamp,
          });

          // Record audit log
          const auditId = 'log_' + Date.now();
          const auditRef = doc(db, 'auditLogs', auditId);
          await setDoc(auditRef, {
            id: auditId,
            actorUserId: currentUser.uid,
            actorEmail: currentUser.email,
            action: 'USER_ROLE_CHANGED',
            target: `${targetUser.email} (${oldRole} -> ${selectedRole})`,
            timestamp,
            metadata: {
              targetUid: targetUser.uid,
              targetEmail: targetUser.email,
              oldRole,
              newRole: selectedRole,
            },
          });
        }
      }

      setSuccessMsg(`Successfully updated role for ${targetUser.name} (${targetUser.email}) to ${selectedRole}.`);
      setTargetUser(null);
      if (onRoleUpdated) onRoleUpdated();
      if (currentUser.uid === targetUser.uid) {
        await refreshUser();
      }
    } catch (err: any) {
      console.error('Role update error:', err);
      alert('Failed to update user role: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Success Notification Banner */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Search Header */}
      <Card className="p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-kaziranga-500 dark:text-cream-400/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name, email, or role..."
            className="arena-input pl-10"
          />
        </div>
      </Card>

      {/* Users Table / Mobile Cards */}
      <Card className="overflow-hidden shadow-arena">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="arena-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact & Department</th>
                <th>Current Role</th>
                <th className="text-right">Manage Role</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-kaziranga-500 dark:text-cream-400/50">
                    No users matching search found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.uid}>
                    <td>
                      <div className="font-display font-bold text-kaziranga-800 dark:text-cream-100">{u.name}</div>
                      <div className="text-[11px] font-mono text-kaziranga-500 dark:text-cream-400/50">{u.email}</div>
                    </td>
                    <td className="text-kaziranga-700 dark:text-cream-300">
                      <div className="font-medium text-kaziranga-800 dark:text-cream-200">{u.programme || 'Not filled'}</div>
                      <div className="text-[11px] text-kaziranga-500 dark:text-cream-400/50">{u.region || 'No region'} • {u.level || 'No level'}</div>
                    </td>
                    <td>
                      {u.role === 'SUPER_ADMIN' ? (
                        <Badge variant="gold" size="sm">
                          <Crown className="w-3 h-3" />
                          <span>Super Admin</span>
                        </Badge>
                      ) : u.role === 'ADMIN' ? (
                        <Badge variant="blue" size="sm">
                          <Shield className="w-3 h-3" />
                          <span>Admin</span>
                        </Badge>
                      ) : (
                        <Badge variant="kaziranga" size="sm">
                          <User className="w-3 h-3" />
                          <span>Student</span>
                        </Badge>
                      )}
                    </td>
                    <td className="text-right">
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

        {/* Mobile Responsive Cards */}
        <div className="md:hidden divide-y divide-cream-400/20 dark:divide-kaziranga-800/60">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-kaziranga-500 dark:text-cream-400/50">
              No users matching search found.
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div key={u.uid} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-display font-bold text-sm text-kaziranga-800 dark:text-cream-100">
                      {u.name}
                    </h4>
                    <p className="text-[11px] font-mono text-kaziranga-500 dark:text-cream-400/50">
                      {u.email}
                    </p>
                  </div>
                  <div>
                    {u.role === 'SUPER_ADMIN' ? (
                      <Badge variant="gold" size="sm">
                        <Crown className="w-3 h-3" />
                        <span>Super Admin</span>
                      </Badge>
                    ) : u.role === 'ADMIN' ? (
                      <Badge variant="blue" size="sm">
                        <Shield className="w-3 h-3" />
                        <span>Admin</span>
                      </Badge>
                    ) : (
                      <Badge variant="kaziranga" size="sm">
                        <User className="w-3 h-3" />
                        <span>Student</span>
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-xs text-kaziranga-700 dark:text-cream-300 p-2.5 rounded-xl bg-cream-200/40 dark:bg-kaziranga-800/40 border border-cream-400/20 dark:border-kaziranga-700/40 space-y-0.5">
                  <div className="font-medium text-kaziranga-800 dark:text-cream-200">{u.programme || 'Programme: Not filled'}</div>
                  <div className="text-[11px] text-kaziranga-500 dark:text-cream-400/50">{u.region || 'No region'} • {u.level || 'No level'}</div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenModal(u)}
                    rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                  >
                    Change Authorization
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Role Manager Modal */}
      {targetUser && (
        <Modal
          isOpen={!!targetUser}
          onClose={() => setTargetUser(null)}
          title="Change User Authorization Level"
          subtitle={`Modifying access rights for ${targetUser.name} (${targetUser.email})`}
        >
          <div className="space-y-5 text-xs sm:text-sm">
            {/* Warning if demoting oneself */}
            {currentUser?.uid === targetUser.uid && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  Caution: You are editing your own authorization level. Demoting yourself from Super Admin will immediately revoke your access to this management dashboard.
                </span>
              </div>
            )}

            <div className="space-y-3">
              <label className="block font-display font-bold text-kaziranga-800 dark:text-cream-100">
                Select New Role Privilege:
              </label>

              {/* USER Role Option */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedRole === 'USER'
                    ? 'border-kaziranga-600 bg-cream-200/60 dark:bg-kaziranga-800/60 ring-2 ring-kaziranga-600/20'
                    : 'border-cream-400/30 dark:border-kaziranga-800 hover:bg-cream-100 dark:hover:bg-kaziranga-800/30'
                }`}
              >
                <input
                  type="radio"
                  name="roleOption"
                  value="USER"
                  checked={selectedRole === 'USER'}
                  onChange={() => setSelectedRole('USER')}
                  className="mt-1 text-kaziranga-600 focus:ring-kaziranga-600"
                />
                <div>
                  <div className="font-display font-bold text-kaziranga-800 dark:text-cream-100">USER (Student)</div>
                  <div className="text-xs text-kaziranga-600 dark:text-cream-400/60 mt-0.5 leading-relaxed">
                    Standard House member account. Can view all competitions, register for events, update profile, and receive notifications.
                  </div>
                </div>
              </label>

              {/* ADMIN Role Option */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedRole === 'ADMIN'
                    ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 ring-2 ring-sky-500/20'
                    : 'border-cream-400/30 dark:border-kaziranga-800 hover:bg-cream-100 dark:hover:bg-kaziranga-800/30'
                }`}
              >
                <input
                  type="radio"
                  name="roleOption"
                  value="ADMIN"
                  checked={selectedRole === 'ADMIN'}
                  onChange={() => setSelectedRole('ADMIN')}
                  className="mt-1 text-sky-600 focus:ring-sky-600"
                />
                <div>
                  <div className="font-display font-bold text-kaziranga-800 dark:text-cream-100">ADMIN (Event Manager)</div>
                  <div className="text-xs text-kaziranga-600 dark:text-cream-400/60 mt-0.5 leading-relaxed">
                    Event coordinator account. Can create and edit events, publish/close registration lifecycles, view participant data, and export CSV reports. Cannot modify allowed-user spreadsheets or assign user roles.
                  </div>
                </div>
              </label>

              {/* SUPER_ADMIN Role Option */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedRole === 'SUPER_ADMIN'
                    ? 'border-gold-500 bg-amber-50/60 dark:bg-amber-950/40 ring-2 ring-gold-500/20'
                    : 'border-cream-400/30 dark:border-kaziranga-800 hover:bg-cream-100 dark:hover:bg-kaziranga-800/30'
                }`}
              >
                <input
                  type="radio"
                  name="roleOption"
                  value="SUPER_ADMIN"
                  checked={selectedRole === 'SUPER_ADMIN'}
                  onChange={() => setSelectedRole('SUPER_ADMIN')}
                  className="mt-1 text-gold-500 focus:ring-gold-500"
                />
                <div>
                  <div className="font-display font-bold text-kaziranga-800 dark:text-cream-100 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-gold-500" />
                    <span>SUPER_ADMIN (House Lead / Core)</span>
                  </div>
                  <div className="text-xs text-kaziranga-600 dark:text-cream-400/60 mt-0.5 leading-relaxed">
                    Full unrestricted administrative access. Can synchronize allowed-user spreadsheets, promote or demote user roles, and inspect security audit logs.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-cream-400/20 dark:border-kaziranga-800">
              <Button variant="ghost" onClick={() => setTargetUser(null)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button
                variant={selectedRole === 'SUPER_ADMIN' ? 'gold' : selectedRole === 'ADMIN' ? 'primary' : 'outline'}
                onClick={handleConfirmRoleChange}
                isLoading={isUpdating}
              >
                Confirm Privilege Change
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
