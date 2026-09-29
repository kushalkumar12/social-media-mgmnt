import React, { useMemo } from 'react';
import { InstagramAccount } from '../../types';
import { AccountCard } from './AccountCard';
import { CardSkeleton } from '../common/Skeleton';
import {
  PlusCircle,
  Search,
  CheckSquare,
  Square,
  FolderPlus,
  Trash2,
  Instagram,
  ArrowUpDown,
} from 'lucide-react';

interface AccountsGridProps {
  accounts: InstagramAccount[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: 'USERNAME_ASC' | 'USERNAME_DESC' | 'STATUS' | 'DATE_NEWEST';
  onSortChange: (sort: 'USERNAME_ASC' | 'USERNAME_DESC' | 'STATUS' | 'DATE_NEWEST') => void;
  isSelectMode: boolean;
  onToggleSelectMode: () => void;
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onSelectAll: () => void;
  onOpenAddModal: () => void;
  onCreateGroupWithSelected: () => void;
  onBatchDisconnect: () => void;
  onOpenProfile: (account: InstagramAccount) => void;
  onRefreshAccount: (id: number) => void;
  onEditKey: (account: InstagramAccount) => void;
  onDisconnectAccount: (id: number) => void;
  refreshingAccountId: number | null;
}

export const AccountsGrid: React.FC<AccountsGridProps> = ({
  accounts,
  loading,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  isSelectMode,
  onToggleSelectMode,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onOpenAddModal,
  onCreateGroupWithSelected,
  onBatchDisconnect,
  onOpenProfile,
  onRefreshAccount,
  onEditKey,
  onDisconnectAccount,
  refreshingAccountId,
}) => {
  // Memoized filtered and sorted accounts
  const filteredAccounts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = accounts.filter((a) => a.username.toLowerCase().includes(q));

    result.sort((a, b) => {
      if (sortBy === 'USERNAME_ASC') return a.username.localeCompare(b.username);
      if (sortBy === 'USERNAME_DESC') return b.username.localeCompare(a.username);
      if (sortBy === 'STATUS') return a.status.localeCompare(b.status);
      return b.id - a.id;
    });

    return result;
  }, [accounts, searchQuery, sortBy]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Toolbar: Add | Sort | Select | Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Add Account Button */}
          <button
            onClick={onOpenAddModal}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
          >
            <PlusCircle size={16} />
            <span>Add Account</span>
          </button>

          {/* Sort Dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <ArrowUpDown size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px' }} />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="form-select"
              style={{
                padding: '8px 12px 8px 30px',
                fontSize: '0.84rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                width: 'auto',
              }}
            >
              <option value="USERNAME_ASC">Username (A → Z)</option>
              <option value="USERNAME_DESC">Username (Z → A)</option>
              <option value="STATUS">Health Status</option>
              <option value="DATE_NEWEST">Recently Connected</option>
            </select>
          </div>

          {/* Select Mode Toggle */}
          <button
            onClick={onToggleSelectMode}
            className={isSelectMode ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 14px', fontSize: '0.84rem' }}
          >
            {isSelectMode ? <CheckSquare size={15} /> : <Square size={15} />}
            <span>{isSelectMode ? 'Cancel Select' : 'Select'}</span>
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="form-input"
            style={{
              padding: '8px 12px 8px 34px',
              fontSize: '0.86rem',
              width: '200px',
              borderRadius: 'var(--radius-full)',
            }}
          />
        </div>
      </div>

      {/* Batch Select Toolbar */}
      {isSelectMode && (
        <div
          style={{
            background: 'var(--primary-blue-light)',
            border: '1px solid #BFDBFE',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={onSelectAll}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            >
              {selectedIds.length === filteredAccounts.length ? 'Deselect All' : 'Select All'}
            </button>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Selected: <strong>{selectedIds.length}</strong> of {filteredAccounts.length} accounts
            </span>
          </div>

          {selectedIds.length > 0 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onCreateGroupWithSelected}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.82rem', gap: '6px' }}
              >
                <FolderPlus size={14} />
                <span>Create Group ({selectedIds.length})</span>
              </button>

              <button
                onClick={onBatchDisconnect}
                className="btn-danger"
                style={{ padding: '6px 12px', fontSize: '0.82rem', gap: '6px' }}
              >
                <Trash2 size={14} />
                <span>Disconnect Selected</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Accounts Grid or Empty State */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(225, 48, 108, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: 'var(--insta-pink)',
            }}
          >
            <Instagram size={28} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
            {searchQuery ? 'No matching accounts found' : 'No Accounts Connected'}
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '6px auto 20px auto', maxWidth: '380px' }}>
            {searchQuery
              ? `No accounts matched "${searchQuery}". Try a different keyword.`
              : 'Link an Instagram Professional or Business account using your User ID and Meta Access Token.'}
          </p>
          <button onClick={onOpenAddModal} className="btn-primary">
            <PlusCircle size={16} />
            <span>Connect Instagram Account</span>
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '16px',
            padding: '8px 0',
          }}
        >
          {filteredAccounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              isSelected={selectedIds.includes(acc.id)}
              isSelectMode={isSelectMode}
              isRefreshing={refreshingAccountId === acc.id}
              onSelect={onToggleSelect}
              onOpenProfile={onOpenProfile}
              onRefresh={onRefreshAccount}
              onEditKey={onEditKey}
              onDisconnect={onDisconnectAccount}
            />
          ))}
        </div>
      )}
    </div>
  );
};
