import React, { useState, useMemo } from 'react';
import { UserProfile, UserRole } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { auth, db, isMockMode } from '@/lib/firebase/config';
import { doc, updateDoc, setDoc, collection } from 'firebase/firestore';
import { mockStore } from '@/lib/firebase/mockStore';
import { formatRoleName } from '@/lib/utils/roleFormatter';
import {
  Search,
  Shield,
  Crown,
  User,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Filter,
  ArrowUpDown,
  MapPin,
  GraduationCap,
  UsersRound,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { DataTable } from '../ui/DataTable';
import { EmptyState } from '../ui/EmptyState';

interface RoleManagerProps {
  users: UserProfile[];
  onRoleUpdated?: () => void;
}

const ROLE_PRIORITY: Record<UserRole, number> = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  USER: 3,
};

type SortOption =
  | 'default'
  | 'email-asc'
  | 'email-desc'
  | 'name-asc'
  | 'name-desc'
  | 'role-asc'
  | 'role-desc';
type RoleFilter = 'ALL' | UserRole;

export const RoleManager: React.FC<RoleManagerProps> = ({ users, onRoleUpdated }) => {
  const { user: currentUser, refreshUser } = useAuth();
  const toast = useToast();
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
        if (
          regionFilter !== 'ALL' &&
          u.region?.toLowerCase().trim() !== regionFilter.toLowerCase().trim()
        )
          return false;

        // Level filter
        if (
          levelFilter !== 'ALL' &&
          u.level?.toLowerCase().trim() !== levelFilter.toLowerCase().trim()
        )
          return false;

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
            console.warn(
              '[RoleManager] Server API role update failed, falling back to Client SDK:',
              apiErr,
            );
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

      setSuccessMsg(
        `Successfully updated role for ${targetUser.name} (${targetUser.email}) to ${selectedRole}.`,
      );
      setTargetUser(null);
      if (onRoleUpdated) onRoleUpdated();
      if (currentUser.uid === targetUser.uid) {
        await refreshUser();
      }
    } catch (err: any) {
      console.error('Role update error:', err);
      toast.error('Could not update role', err.message || 'An unexpected error occurred.');
    } finally {
      setIsUpdating(false);
    }
  };

  /** Role pill shared by the directory table and the change-role dialog. */
  const roleBadge = (role: string) => {
    if (role === 'SUPER_ADMIN') {
      return (
        <Badge tone="accent" size="sm">
          <Crown className="w-3 h-3" aria-hidden />
          Super Admin
        </Badge>
      );
    }
    if (role === 'ADMIN') {
      return (
        <Badge tone="info" size="sm">
          <Shield className="w-3 h-3" aria-hidden />
          Admin
        </Badge>
      );
    }
    return (
      <Badge tone="brand" size="sm">
        <Shield className="w-3 h-3" aria-hidden />
        Member
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Success Notification Banner */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-signal-live/10 border border-signal-live/25 text-signal-live text-caption flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-signal-live shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-signal-live font-bold text-caption"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Controls Bar: Search, Role Filter & Sort Options */}
      <Card className="p-3.5 sm:p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name, email, or department..."
              className="ed-field pl-10 h-10 text-caption sm:text-sm"
            />
          </div>

          {/* Filter & Sort Controls Grid */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Filter by Role */}
            <div className="relative">
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 h-10 rounded-xl bg-surface-sunken border border-hairline text-caption text-ink">
                <Filter className="w-3.5 h-3.5 text-ink-faint shrink-0" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                  className="bg-transparent border-none outline-none text-caption font-semibold cursor-pointer pr-1 text-ink w-full"
                  aria-label="Filter users by role"
                >
                  <option value="ALL" className="bg-surface-raised text-ink">
                    All Roles
                  </option>
                  <option value="SUPER_ADMIN" className="bg-surface-raised text-ink">
                    Super Admins
                  </option>
                  <option value="ADMIN" className="bg-surface-raised text-ink">
                    Admins
                  </option>
                  <option value="USER" className="bg-surface-raised text-ink">
                    Members
                  </option>
                </select>
              </div>
            </div>

            {/* Filter by Level */}
            <div className="relative">
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 h-10 rounded-xl bg-surface-sunken border border-hairline text-caption text-ink">
                <GraduationCap className="w-3.5 h-3.5 text-ink-faint shrink-0" />
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="bg-transparent border-none outline-none text-caption font-semibold cursor-pointer pr-1 text-ink w-full"
                  aria-label="Filter users by academic level"
                >
                  <option value="ALL" className="bg-surface-raised text-ink">
                    All Levels
                  </option>
                  {availableLevels.map((lvl) => (
                    <option key={lvl} value={lvl} className="bg-surface-raised text-ink">
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter by Region */}
            <div className="relative">
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 h-10 rounded-xl bg-surface-sunken border border-hairline text-caption text-ink">
                <MapPin className="w-3.5 h-3.5 text-ink-faint shrink-0" />
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="bg-transparent border-none outline-none text-caption font-semibold cursor-pointer pr-1 text-ink w-full"
                  aria-label="Filter users by region"
                >
                  <option value="ALL" className="bg-surface-raised text-ink">
                    All Regions
                  </option>
                  {availableRegions.map((reg) => (
                    <option key={reg} value={reg} className="bg-surface-raised text-ink">
                      {reg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sort Options */}
            <div className="relative">
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 h-10 rounded-xl bg-surface-sunken border border-hairline text-caption text-ink">
                <ArrowUpDown className="w-3.5 h-3.5 text-ink-faint shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent border-none outline-none text-caption font-semibold cursor-pointer pr-1 text-ink w-full"
                  aria-label="Sort users list"
                >
                  <option value="default" className="bg-surface-raised text-ink">
                    Default (Role & Email A-Z)
                  </option>
                  <option value="email-asc" className="bg-surface-raised text-ink">
                    Email (A → Z)
                  </option>
                  <option value="email-desc" className="bg-surface-raised text-ink">
                    Email (Z → A)
                  </option>
                  <option value="name-asc" className="bg-surface-raised text-ink">
                    Name (A → Z)
                  </option>
                  <option value="name-desc" className="bg-surface-raised text-ink">
                    Name (Z → A)
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filter Indicators */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-hairline text-caption text-ink-muted">
          <span>
            Showing <strong className="font-semibold text-ink">{processedUsers.length}</strong> of{' '}
            {users.length} active users
          </span>
          {(roleFilter !== 'ALL' ||
            regionFilter !== 'ALL' ||
            levelFilter !== 'ALL' ||
            searchQuery.trim()) && (
            <button
              onClick={() => {
                setRoleFilter('ALL');
                setRegionFilter('ALL');
                setLevelFilter('ALL');
                setSearchQuery('');
              }}
              className="text-accent hover:underline font-bold text-caption"
            >
              Reset Filters
            </button>
          )}
        </div>
      </Card>

      <DataTable
        columns={[
          {
            id: 'user',
            header: 'User',
            primary: true,
            sortValue: (u) => u.name,
            cell: (u) => (
              <div className="min-w-0">
                <div className="font-display font-bold text-ink truncate">{u.name}</div>
                <div className="font-mono text-micro text-ink-faint truncate">{u.email}</div>
              </div>
            ),
          },
          {
            id: 'academics',
            header: 'Academics',
            sortValue: (u) => u.programme || '',
            cell: (u) => (
              <div className="min-w-0">
                <div className="text-ink truncate">{u.programme || 'Not provided'}</div>
                <div className="text-micro text-ink-faint truncate">
                  {[u.level, u.region, u.phone].filter(Boolean).join(' · ') || '—'}
                </div>
              </div>
            ),
          },
          {
            id: 'role',
            header: 'Role',
            sortValue: (u) => u.role,
            cell: (u) => roleBadge(u.role),
          },
        ]}
        rows={processedUsers}
        rowKey={(u) => u.uid}
        caption="Member directory"
        actions={(u) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenModal(u)}
            rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
          >
            Change role
          </Button>
        )}
        empty={
          <EmptyState
            icon={<UsersRound />}
            title="No members found"
            description="No accounts match the current search or role filter."
          />
        }
      />

      {/* Role Manager Modal */}
      {targetUser && (
        <Modal
          isOpen={!!targetUser}
          onClose={() => setTargetUser(null)}
          title="Update User Role"
          subtitle={`Assign an access level for ${targetUser.name} (${targetUser.email})`}
        >
          <div className="space-y-4 text-caption sm:text-sm">
            {/* Warning if demoting oneself */}
            {currentUser?.uid === targetUser.uid && (
              <div className="p-3 rounded-xl bg-signal-warn/10 border border-signal-warn/25 text-signal-warn text-caption flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-signal-warn" />
                <span>
                  Caution: You are editing your own role. Demoting from Super Admin will immediately
                  revoke access to the Super Admin Suite.
                </span>
              </div>
            )}

            <div className="space-y-2.5">
              <label className="block text-caption font-bold uppercase tracking-wider text-ink-muted font-display">
                Select Role:
              </label>

              {/* USER Role Option */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedRole === 'USER'
                    ? 'border-hairline bg-surface-sunken ring-2 ring-accent/20'
                    : 'border-hairline hover:bg-surface-raised'
                }`}
              >
                <input
                  type="radio"
                  name="roleOption"
                  value="USER"
                  checked={selectedRole === 'USER'}
                  onChange={() => setSelectedRole('USER')}
                  className="mt-0.5 text-ink-muted focus:ring-accent/30"
                />
                <div className="space-y-0.5">
                  <div className="font-display font-bold text-ink flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-accent" />
                    <span>Member</span>
                  </div>
                  <div className="text-caption text-ink-muted leading-relaxed">
                    Standard account. Can browse competitions, submit registrations, and receive
                    event updates.
                  </div>
                </div>
              </label>

              {/* ADMIN Role Option */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedRole === 'ADMIN'
                    ? 'border-signal-info bg-signal-info/10 ring-2 ring-signal-info/20'
                    : 'border-hairline hover:bg-surface-raised'
                }`}
              >
                <input
                  type="radio"
                  name="roleOption"
                  value="ADMIN"
                  checked={selectedRole === 'ADMIN'}
                  onChange={() => setSelectedRole('ADMIN')}
                  className="mt-0.5 text-signal-info focus:ring-signal-info"
                />
                <div className="space-y-0.5">
                  <div className="font-display font-bold text-ink flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-signal-info" />
                    <span>Admin</span>
                  </div>
                  <div className="text-caption text-ink-muted leading-relaxed">
                    Event coordinator. Can create and edit competitions, manage registrations, and
                    export participant data.
                  </div>
                </div>
              </label>

              {/* SUPER_ADMIN Role Option */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedRole === 'SUPER_ADMIN'
                    ? 'border-accent/40 bg-signal-warn/10 ring-2 ring-accent/40'
                    : 'border-hairline hover:bg-surface-raised'
                }`}
              >
                <input
                  type="radio"
                  name="roleOption"
                  value="SUPER_ADMIN"
                  checked={selectedRole === 'SUPER_ADMIN'}
                  onChange={() => setSelectedRole('SUPER_ADMIN')}
                  className="mt-0.5 text-accent focus:ring-accent/40"
                />
                <div className="space-y-0.5">
                  <div className="font-display font-bold text-ink flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-accent" />
                    <span>Super Admin</span>
                  </div>
                  <div className="text-caption text-ink-muted leading-relaxed">
                    Full system access. Can manage allowed-user whitelists, assign roles, configure
                    tenures, and inspect security audit logs.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-hairline">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTargetUser(null)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                variant={
                  selectedRole === 'SUPER_ADMIN'
                    ? 'accent'
                    : selectedRole === 'ADMIN'
                      ? 'primary'
                      : 'outline'
                }
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
