import React, { useState, useMemo } from 'react';
import { UserProfile, UserRole } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { auth, db, isMockMode } from '@/lib/firebase/config';
import { doc, updateDoc, setDoc, collection } from 'firebase/firestore';
import { mockStore } from '@/lib/firebase/mockStore';
import { formatRoleName } from '@/lib/utils/roleFormatter';
import { Search, Shield, Crown, User, ArrowUpRight, CheckCircle2, AlertTriangle, Filter, ArrowUpDown, MapPin, GraduationCap } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface RoleManagerProps {
  users: UserProfile[];
  onRoleUpdated?: () => void;
}

const ROLE_PRIORITY: Record<UserRole, number> = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  USER: 3,
};

type SortOption = 'default' | 'email-asc' | 'email-desc' | 'name-asc' | 'name-desc' | 'role-asc' | 'role-desc';
type RoleFilter = 'ALL' | UserRole;

export const RoleManager: React.FC<RoleManagerProps> = ({ users, onRoleUpdated }) => {
  const { user: currentUser, refreshUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('USER');
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dynamically compute unique regions from users list
  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.region && u.region.trim()) set.add(u.region.trim());
    });
    return Array.from(set).sort();
  }, [users]);

  // Dynamically compute unique academic levels from users list
  const availableLevels = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.level && u.level.trim()) set.add(u.level.trim());
    });
    return Array.from(set).sort();
  }, [users]);

  const processedUsers = useMemo(() => {
    return users
      .filter((u) => {
        // Role filter
        if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;

        // Region filter
        if (regionFilter !== 'ALL' && u.region?.toLowerCase().trim() !== regionFilter.toLowerCase().trim()) return false;

        // Level filter
        if (levelFilter !== 'ALL' && u.level?.toLowerCase().trim() !== levelFilter.toLowerCase().trim()) return false;

        // Search filter
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q) ||
          (u.programme && u.programme.toLowerCase().includes(q)) ||
          (u.region && u.region.toLowerCase().includes(q)) ||
          (u.level && u.level.toLowerCase().includes(q)) ||
          (u.phone && u.phone.includes(q))
        );
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'default': {
            // Primary: Super Admin (1) -> Admin (2) -> Member (3)
            const roleDiff = (ROLE_PRIORITY[a.role] || 99) - (ROLE_PRIORITY[b.role] || 99);
            if (roleDiff !== 0) return roleDiff;
            // Secondary: Ascending order of email
            return a.email.toLowerCase().localeCompare(b.email.toLowerCase());
          }
          case 'email-asc':
            return a.email.toLowerCase().localeCompare(b.email.toLowerCase());
          case 'email-desc':
            return b.email.toLowerCase().localeCompare(a.email.toLowerCase());
          case 'name-asc':
            return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
          case 'name-desc':
            return b.name.toLowerCase().localeCompare(a.name.toLowerCase());
          case 'role-asc': {
            const diff = (ROLE_PRIORITY[a.role] || 99) - (ROLE_PRIORITY[b.role] || 99);
            if (diff !== 0) return diff;
            return a.email.toLowerCase().localeCompare(b.email.toLowerCase());
          }
          case 'role-desc': {
            const diff = (ROLE_PRIORITY[b.role] || 99) - (ROLE_PRIORITY[a.role] || 99);
            if (diff !== 0) return diff;
            return a.email.toLowerCase().localeCompare(b.email.toLowerCase());
          }
          default:
            return 0;
        }
      });
  }, [users, searchQuery, roleFilter, regionFilter, levelFilter, sortBy]);

  const handleOpenModal = (user: UserProfile) => {
    setTargetUser(user);
    setSelectedRole(user.role);
    setSuccessMsg(null);
  };

  const handleConfirmRoleChange = async () => {
    if (!targetUser || !currentUser) return;

    if (selectedRole === targetUser.role) {
      setTargetUser(null);
      return;
    }

    setIsUpdating(true);

    try {
      const oldRole = targetUser.role;

      if (isMockMode) {
        mockStore.updateUserRole(targetUser.uid, selectedRole, currentUser);
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
                actorUserId: currentUser.uid,
                actorEmail: currentUser.email,
              }),
            });

            const result = await response.json().catch(() => null);
            if (response.ok && result?.success) {
              serverSuccess = true;
            }
          } catch (apiErr) {
            console.warn('[RoleManager] Server API role update failed, falling back to Client SDK:', apiErr);
          }
        }

        // Client SDK Fallback
        if (!serverSuccess) {
          const timestamp = new Date().toISOString();
          const userDocRef = doc(db, 'users', targetUser.uid);
          await updateDoc(userDocRef, {
            role: selectedRole,
            updatedAt: timestamp,
          });

          // Create notification doc directly
          const notifId = 'notif_' + Date.now();
          const notifDocRef = doc(db, 'notifications', notifId);
          await setDoc(notifDocRef, {
            id: notifId,
            userId: targetUser.uid,
            title: 'Role Updated',
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

      {/* Controls Bar: Search, Role Filter & Sort Options */}
      <Card className="p-3.5 sm:p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-kaziranga-500 dark:text-cream-400/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name, email, or department..."
              className="arena-input pl-10 h-10 text-xs sm:text-sm"
            />
          </div>

          {/* Filter & Sort Controls Grid */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Filter by Role */}
            <div className="relative">
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 h-10 rounded-xl bg-cream-200/50 dark:bg-kaziranga-800/60 border border-cream-400/40 dark:border-kaziranga-700/60 text-xs text-kaziranga-800 dark:text-cream-100">
                <Filter className="w-3.5 h-3.5 text-kaziranga-500 dark:text-cream-400/60 shrink-0" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                  className="bg-transparent border-none outline-none text-xs font-semibold cursor-pointer pr-1 text-kaziranga-800 dark:text-cream-100 w-full"
                  aria-label="Filter users by role"
                >
                  <option value="ALL" className="bg-cream-100 dark:bg-kaziranga-900 text-kaziranga-800 dark:text-cream-100">All Roles</option>
                  <option value="SUPER_ADMIN" className="bg-cream-100 dark:bg-kaziranga-900 text-kaziranga-800 dark:text-cream-100">Super Admins</option>
                  <option value="ADMIN" className="bg-cream-100 dark:bg-kaziranga-900 text-kaziranga-800 dark:text-cream-100">Admins</option>
                  <option value="USER" className="bg-cream-100 dark:bg-kaziranga-900 text-kaziranga-800 dark:text-cream-100">Members</option>
                </select>
              </div>
            </div>

            {/* Filter by Level */}
            <div className="relative">
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 h-10 rounded-xl bg-cream-200/50 dark:bg-kaziranga-800/60 border border-cream-400/40 dark:border-kaziranga-700/60 text-xs text-kaziranga-800 dark:text-cream-100">
                <GraduationCap className="w-3.5 h-3.5 text-kaziranga-500 dark:text-cream-400/60 shrink-0" />
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-semibold cursor-pointer pr-1 text-kaziranga-800 dark:text-cream-100 w-full"
                  aria-label="Filter users by academic level"
                >
                  <option value="ALL" className="bg-cream-100 dark:bg-kaziranga-900 text-kaziranga-800 dark:text-cream-100">All Levels</option>
                  {availableLevels.map((lvl) => (
                    <option key={lvl} value={lvl} className="bg-cream-100 dark:bg-kaziranga-900 text-kaziranga-800 dark:text-cream-100">
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter by Region */}
            <div className="relative">
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 h-10 rounded-xl bg-cream-200/50 dark:bg-kaziranga-800/60 border border-cream-400/40 dark:border-kaziranga-700/60 text-xs text-kaziranga-800 dark:text-cream-100">
                <MapPin className="w-3.5 h-3.5 text-kaziranga-500 dark:text-cream-400/60 shrink-0" />
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-semibold cursor-pointer pr-1 text-kaziranga-800 dark:text-cream-100 w-full"
                  aria-label="Filter users by region"
                >
                  <option value="ALL" className="bg-cream-100 dark:bg-kaziranga-900 text-kaziranga-800 dark:text-cream-100">All Regions</option>
                  {availableRegions.map((reg) => (
                    <option key={reg} value={reg} className="bg-cream-100 dark:bg-kaziranga-900 text-kaziranga-800 dark:text-cream-100">
                      {reg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sort Options */}
            <div className="relative">
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 h-10 rounded-xl bg-cream-200/50 dark:bg-kaziranga-800/60 border border-cream-400/40 dark:border-kaziranga-700/60 text-xs text-kaziranga-800 dark:text-cream-100">
                <ArrowUpDown className="w-3.5 h-3.5 text-kaziranga-500 dark:text-cream-400/60 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent border-none outline-none text-xs font-semibold cursor-pointer pr-1 text-kaziranga-800 dark:text-cream-100 w-full"
                  aria-label="Sort users list"
                >
                  <option value="default" className="bg-cream-100 dark:bg-kaziranga-900 text-kaziranga-800 dark:text-cream-100">Default (Role & Email A-Z)</option>
                  <option value="email-asc" className="bg-cream-100 dark:bg-kaziranga-900 text-kaziranga-800 dark:text-cream-100">Email (A → Z)</option>
                  <option value="email-desc" className="bg-cream-100 dark:bg-kaziranga-900 text-kaziranga-800 dark:text-cream-100">Email (Z → A)</option>
                  <option value="name-asc" className="bg-cream-100 dark:bg-kaziranga-900 text-kaziranga-800 dark:text-cream-100">Name (A → Z)</option>
                  <option value="name-desc" className="bg-cream-100 dark:bg-kaziranga-900 text-kaziranga-800 dark:text-cream-100">Name (Z → A)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filter Indicators */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-cream-300/30 dark:border-kaziranga-800/60 text-[11px] text-kaziranga-600 dark:text-cream-400/60">
          <span>
            Showing <strong className="font-semibold text-kaziranga-800 dark:text-cream-100">{processedUsers.length}</strong> of {users.length} active users
          </span>
          {(roleFilter !== 'ALL' || regionFilter !== 'ALL' || levelFilter !== 'ALL' || searchQuery.trim()) && (
            <button
              onClick={() => {
                setRoleFilter('ALL');
                setRegionFilter('ALL');
                setLevelFilter('ALL');
                setSearchQuery('');
              }}
              className="text-gold-600 dark:text-gold-400 hover:underline font-bold text-[11px]"
            >
              Reset Filters
            </button>
          )}
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
                <th>Academics & Contact</th>
                <th className="text-center">Current Role</th>
                <th className="text-right">Manage Role</th>
              </tr>
            </thead>
            <tbody>
              {processedUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-kaziranga-500 dark:text-cream-400/50">
                    No users matching search or filter criteria found.
                  </td>
                </tr>
              ) : (
                processedUsers.map((u) => (
                  <tr key={u.uid}>
                    <td>
                      <div className="font-display font-bold text-kaziranga-800 dark:text-cream-100">{u.name}</div>
                      <div className="text-[11px] font-mono text-kaziranga-500 dark:text-cream-400/50">{u.email}</div>
                    </td>
                    <td className="text-kaziranga-700 dark:text-cream-300">
                      <div className="font-medium text-kaziranga-800 dark:text-cream-200">{u.programme || 'Not filled'}</div>
                      <div className="text-[11px] text-kaziranga-500 dark:text-cream-400/50">
                        {u.level || 'No level'} • {u.region || 'No region'}{u.phone ? ` • ${u.phone}` : ''}
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="inline-flex justify-center">
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
                            <Shield className="w-3 h-3 text-gold-400" />
                            <span>Member</span>
                          </Badge>
                        )}
                      </div>
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
          {processedUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-kaziranga-500 dark:text-cream-400/50">
              No users matching search or filter criteria found.
            </div>
          ) : (
            processedUsers.map((u) => (
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
                        <Shield className="w-3 h-3 text-gold-400" />
                        <span>Member</span>
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-xs text-kaziranga-700 dark:text-cream-300 p-2.5 rounded-xl bg-cream-200/40 dark:bg-kaziranga-800/40 border border-cream-400/20 dark:border-kaziranga-700/40 space-y-0.5">
                  <div className="font-medium text-kaziranga-800 dark:text-cream-200">{u.programme || 'Programme: Not filled'}</div>
                  <div className="text-[11px] text-kaziranga-500 dark:text-cream-400/50">
                    {u.level || 'No level'} • {u.region || 'No region'}{u.phone ? ` • ${u.phone}` : ''}
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenModal(u)}
                    rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                  >
                    Change Role
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
          title="Update User Role"
          subtitle={`Assign an access level for ${targetUser.name} (${targetUser.email})`}
        >
          <div className="space-y-4 text-xs sm:text-sm">
            {/* Warning if demoting oneself */}
            {currentUser?.uid === targetUser.uid && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  Caution: You are editing your own role. Demoting from Super Admin will immediately revoke access to the Super Admin Suite.
                </span>
              </div>
            )}

            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-kaziranga-600 dark:text-cream-400/60 font-display">
                Select Role:
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
                  className="mt-0.5 text-kaziranga-600 focus:ring-kaziranga-600"
                />
                <div className="space-y-0.5">
                  <div className="font-display font-bold text-kaziranga-800 dark:text-cream-100 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-gold-500" />
                    <span>Member</span>
                  </div>
                  <div className="text-xs text-kaziranga-600 dark:text-cream-400/60 leading-relaxed">
                    Standard account. Can browse competitions, submit registrations, and receive event updates.
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
                  className="mt-0.5 text-sky-600 focus:ring-sky-600"
                />
                <div className="space-y-0.5">
                  <div className="font-display font-bold text-kaziranga-800 dark:text-cream-100 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-sky-500" />
                    <span>Admin</span>
                  </div>
                  <div className="text-xs text-kaziranga-600 dark:text-cream-400/60 leading-relaxed">
                    Event coordinator. Can create and edit competitions, manage registrations, and export participant data.
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
                  className="mt-0.5 text-gold-500 focus:ring-gold-500"
                />
                <div className="space-y-0.5">
                  <div className="font-display font-bold text-kaziranga-800 dark:text-cream-100 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-gold-500" />
                    <span>Super Admin</span>
                  </div>
                  <div className="text-xs text-kaziranga-600 dark:text-cream-400/60 leading-relaxed">
                    Full system access. Can manage allowed-user whitelists, assign roles, configure tenures, and inspect security audit logs.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-cream-400/20 dark:border-kaziranga-800">
              <Button variant="ghost" size="sm" onClick={() => setTargetUser(null)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button
                variant={selectedRole === 'SUPER_ADMIN' ? 'gold' : selectedRole === 'ADMIN' ? 'primary' : 'outline'}
                size="sm"
                onClick={handleConfirmRoleChange}
                isLoading={isUpdating}
              >
                Update Role
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
