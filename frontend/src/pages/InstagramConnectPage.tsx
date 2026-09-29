import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { groupService, AccountGroupDTO } from '../services/groupService';
import { InstagramAccount } from '../types';
import { Instagram, Users } from 'lucide-react';

import { AccountsGrid } from '../components/instagram/AccountsGrid';
import { GroupsTable } from '../components/instagram/GroupsTable';
import { AddAccountModal } from '../components/instagram/AddAccountModal';
import { CreateGroupModal } from '../components/instagram/CreateGroupModal';
import { EditGroupModal } from '../components/instagram/EditGroupModal';
import { UpdateTokenModal } from '../components/instagram/UpdateTokenModal';
import { ProfilePreviewModal } from '../components/instagram/ProfilePreviewModal';
import { useDelayedLoading } from '../hooks/useDelayedLoading';

export const InstagramConnectPage: React.FC = () => {
  // Tab State ('ACCOUNTS' | 'GROUPS')
  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'GROUPS'>('ACCOUNTS');

  // Accounts Data & Search/Sort/Select State
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountSearchQuery, setAccountSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'USERNAME_ASC' | 'USERNAME_DESC' | 'STATUS' | 'DATE_NEWEST'>('USERNAME_ASC');
  const [isAccountSelectMode, setIsAccountSelectMode] = useState(false);
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [refreshingAccountId, setRefreshingAccountId] = useState<number | null>(null);

  // Groups Data & Search/Select State
  const [groups, setGroups] = useState<AccountGroupDTO[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [isGroupSelectMode, setIsGroupSelectMode] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);

  // Debounced skeletons: eliminates flicker on fast connections
  const showAccountsSkeleton = useDelayedLoading(loadingAccounts && accounts.length === 0);
  const showGroupsSkeleton = useDelayedLoading(loadingGroups && groups.length === 0);

  // Modals Open State
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [initialGroupAccountIds, setInitialGroupAccountIds] = useState<number[]>([]);
  const [editingGroup, setEditingGroup] = useState<AccountGroupDTO | null>(null);
  const [updatingTokenAccount, setUpdatingTokenAccount] = useState<InstagramAccount | null>(null);
  const [selectedProfileAccount, setSelectedProfileAccount] = useState<InstagramAccount | null>(null);

  // Load Accounts
  const fetchAccounts = async () => {
    try {
      const res = await api.get('/instagram/accounts');
      setAccounts(res.data);
    } catch (err) {
      console.error('Failed to load accounts', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Load Groups
  const fetchGroups = async () => {
    try {
      const data = await groupService.getGroups();
      setGroups(data);
    } catch (err) {
      console.error('Failed to load groups', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchGroups();
  }, []);

  // --- Account Actions ---
  const handleRefreshToken = async (id: number) => {
    setRefreshingAccountId(id);
    try {
      const res = await api.post(`/instagram/accounts/${id}/refresh`);
      setAccounts((prev) => prev.map((a) => (a.id === id ? res.data : a)));
      setSelectedProfileAccount((prev) => (prev && prev.id === id ? res.data : prev));
    } catch (err: any) {
      alert(`Token refresh failed: ${err.response?.data?.message || err.message}`);
      fetchAccounts();
    } finally {
      setRefreshingAccountId(null);
    }
  };

  const handleDisconnectAccount = async (id: number) => {
    if (!window.confirm('Disconnect this Instagram account? Any scheduled posts will fail unless reassigned.')) {
      return;
    }
    // Optimistic UI: remove from local state immediately
    const previousAccounts = [...accounts];
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setSelectedAccountIds((prev) => prev.filter((aId) => aId !== id));
    setSelectedProfileAccount((prev) => (prev && prev.id === id ? null : prev));
    try {
      await api.delete(`/instagram/accounts/${id}`);
    } catch (err: any) {
      // Revert if API fails
      setAccounts(previousAccounts);
      alert('Disconnect failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleBatchDisconnectAccounts = async () => {
    if (!window.confirm(`Disconnect ${selectedAccountIds.length} selected accounts?`)) return;
    const previousAccounts = [...accounts];
    const idsToRemove = [...selectedAccountIds];
    setAccounts((prev) => prev.filter((a) => !idsToRemove.includes(a.id)));
    setSelectedAccountIds([]);
    setIsAccountSelectMode(false);
    try {
      for (const id of idsToRemove) {
        await api.delete(`/instagram/accounts/${id}`);
      }
    } catch (err: any) {
      setAccounts(previousAccounts);
      alert('Batch disconnect failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleSelectAccount = (id: number) => {
    if (selectedAccountIds.includes(id)) {
      setSelectedAccountIds((prev) => prev.filter((aId) => aId !== id));
    } else {
      setSelectedAccountIds((prev) => [...prev, id]);
    }
  };

  const handleSelectAllAccounts = () => {
    if (selectedAccountIds.length === accounts.length) {
      setSelectedAccountIds([]);
    } else {
      setSelectedAccountIds(accounts.map((a) => a.id));
    }
  };

  // --- Group Actions ---
  const handleToggleGroupStatus = async (group: AccountGroupDTO) => {
    const nextStatus = group.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    // Optimistic UI: flip status immediately
    const previousGroups = [...groups];
    setGroups((prev) =>
      prev.map((g) => (g.id === group.id ? { ...g, status: nextStatus } : g))
    );
    try {
      await groupService.updateGroup(group.id, { status: nextStatus });
    } catch (err: any) {
      // Revert if API fails
      setGroups(previousGroups);
      alert('Failed to update group status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (!window.confirm('Delete this campaign group? Member accounts will remain connected.')) return;
    // Optimistic UI: remove group immediately
    const previousGroups = [...groups];
    setGroups((prev) => prev.filter((g) => g.id !== id));
    setSelectedGroupIds((prev) => prev.filter((gId) => gId !== id));
    try {
      await groupService.deleteGroup(id);
    } catch (err: any) {
      // Revert if API fails
      setGroups(previousGroups);
      alert('Failed to delete group: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleBatchDeleteGroups = async () => {
    if (!window.confirm(`Delete ${selectedGroupIds.length} selected groups?`)) return;
    try {
      for (const id of selectedGroupIds) {
        await groupService.deleteGroup(id);
      }
      fetchGroups();
      setSelectedGroupIds([]);
      setIsGroupSelectMode(false);
    } catch (err: any) {
      alert('Batch delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleSelectGroup = (id: number) => {
    if (selectedGroupIds.includes(id)) {
      setSelectedGroupIds((prev) => prev.filter((gId) => gId !== id));
    } else {
      setSelectedGroupIds((prev) => [...prev, id]);
    }
  };

  const handleSelectAllGroups = () => {
    if (selectedGroupIds.length === groups.length) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(groups.map((g) => g.id));
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Title & Overview */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Account & Group Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Manage linked Instagram Business/Creator credentials, profile DP sync, and cross-brand posting groups.
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'inline-flex',
            background: '#F1F5F9',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <button
            onClick={() => setActiveTab('ACCOUNTS')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: activeTab === 'ACCOUNTS' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'ACCOUNTS' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'ACCOUNTS' ? 'var(--shadow-xs)' : 'none',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Instagram size={16} color={activeTab === 'ACCOUNTS' ? 'var(--insta-pink)' : 'currentColor'} />
            <span>Accounts</span>
            <span
              style={{
                background: activeTab === 'ACCOUNTS' ? 'var(--bg-main)' : 'rgba(0,0,0,0.06)',
                padding: '2px 7px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {accounts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('GROUPS')}
            style={{
              padding: '8px 18px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: activeTab === 'GROUPS' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'GROUPS' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'GROUPS' ? 'var(--shadow-xs)' : 'none',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Users size={16} color={activeTab === 'GROUPS' ? 'var(--primary-blue)' : 'currentColor'} />
            <span>Groups</span>
            <span
              style={{
                background: activeTab === 'GROUPS' ? 'var(--bg-main)' : 'rgba(0,0,0,0.06)',
                padding: '2px 7px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {groups.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Tab Panels */}
      <div className="glass-card" style={{ padding: '24px' }}>
        {activeTab === 'ACCOUNTS' ? (
          <AccountsGrid
            accounts={accounts}
            loading={showAccountsSkeleton}
            searchQuery={accountSearchQuery}
            onSearchChange={setAccountSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            isSelectMode={isAccountSelectMode}
            onToggleSelectMode={() => {
              setIsAccountSelectMode(!isAccountSelectMode);
              if (isAccountSelectMode) setSelectedAccountIds([]);
            }}
            selectedIds={selectedAccountIds}
            onToggleSelect={handleToggleSelectAccount}
            onSelectAll={handleSelectAllAccounts}
            onOpenAddModal={() => setShowAddAccountModal(true)}
            onCreateGroupWithSelected={() => {
              setInitialGroupAccountIds(selectedAccountIds);
              setShowCreateGroupModal(true);
            }}
            onBatchDisconnect={handleBatchDisconnectAccounts}
            onOpenProfile={setSelectedProfileAccount}
            onRefreshAccount={handleRefreshToken}
            onEditKey={(acc) => setUpdatingTokenAccount(acc)}
            onDisconnectAccount={handleDisconnectAccount}
            refreshingAccountId={refreshingAccountId}
          />
        ) : (
          <GroupsTable
            groups={groups}
            loading={showGroupsSkeleton}
            searchQuery={groupSearchQuery}
            onSearchChange={setGroupSearchQuery}
            isSelectMode={isGroupSelectMode}
            onToggleSelectMode={() => {
              setIsGroupSelectMode(!isGroupSelectMode);
              if (isGroupSelectMode) setSelectedGroupIds([]);
            }}
            selectedIds={selectedGroupIds}
            onToggleSelect={handleToggleSelectGroup}
            onSelectAll={handleSelectAllGroups}
            onOpenCreateModal={() => {
              setInitialGroupAccountIds([]);
              setShowCreateGroupModal(true);
            }}
            onEditGroup={setEditingGroup}
            onToggleStatus={handleToggleGroupStatus}
            onDeleteGroup={handleDeleteGroup}
            onBatchDeleteGroups={handleBatchDeleteGroups}
          />
        )}
      </div>

      {/* --- Modals --- */}
      <AddAccountModal
        isOpen={showAddAccountModal}
        onClose={() => setShowAddAccountModal(false)}
        onSuccess={fetchAccounts}
      />

      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        accounts={accounts}
        initialSelectedAccountIds={initialGroupAccountIds}
        onSuccess={fetchGroups}
      />

      <EditGroupModal
        group={editingGroup}
        accounts={accounts}
        onClose={() => setEditingGroup(null)}
        onSuccess={fetchGroups}
      />

      <UpdateTokenModal
        account={updatingTokenAccount}
        onClose={() => setUpdatingTokenAccount(null)}
        onSuccess={(updated) => {
          setAccounts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          setSelectedProfileAccount((prev) => (prev && prev.id === updated.id ? updated : prev));
        }}
      />

      <ProfilePreviewModal
        account={selectedProfileAccount}
        onClose={() => setSelectedProfileAccount(null)}
        onRefresh={handleRefreshToken}
        onEditKey={(acc) => {
          setSelectedProfileAccount(null);
          setUpdatingTokenAccount(acc);
        }}
        onDisconnect={handleDisconnectAccount}
        isRefreshing={refreshingAccountId === selectedProfileAccount?.id}
      />
    </div>
  );
};
