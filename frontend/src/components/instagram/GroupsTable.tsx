import React, { useMemo } from 'react';
import { AccountGroupDTO } from '../../services/groupService';
import { TableSkeleton } from '../common/Skeleton';
import {
  PlusCircle,
  Search,
  CheckSquare,
  Square,
  Trash2,
  Edit3,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface GroupsTableProps {
  groups: AccountGroupDTO[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isSelectMode: boolean;
  onToggleSelectMode: () => void;
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onSelectAll: () => void;
  onOpenCreateModal: () => void;
  onEditGroup: (group: AccountGroupDTO) => void;
  onToggleStatus: (group: AccountGroupDTO) => void;
  onDeleteGroup: (id: number) => void;
  onBatchDeleteGroups: () => void;
}

export const GroupsTable: React.FC<GroupsTableProps> = ({
  groups,
  loading,
  searchQuery,
  onSearchChange,
  isSelectMode,
  onToggleSelectMode,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onOpenCreateModal,
  onEditGroup,
  onToggleStatus,
  onDeleteGroup,
  onBatchDeleteGroups,
}) => {
  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return groups.filter((g) => g.groupName.toLowerCase().includes(q));
  }, [groups, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Toolbar: Add | Select | Search */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onOpenCreateModal}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.88rem' }}
          >
            <PlusCircle size={16} />
            <span>Create Group</span>
          </button>

          <button
            onClick={onToggleSelectMode}
            className={isSelectMode ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 14px', fontSize: '0.84rem' }}
          >
            {isSelectMode ? <CheckSquare size={15} /> : <Square size={15} />}
            <span>{isSelectMode ? 'Cancel Select' : 'Select'}</span>
          </button>
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
          <input
            type="text"
            placeholder="Search groups..."
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
              {selectedIds.length === filteredGroups.length ? 'Deselect All' : 'Select All'}
            </button>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Selected: <strong>{selectedIds.length}</strong> of {filteredGroups.length} groups
            </span>
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={onBatchDeleteGroups}
              className="btn-danger"
              style={{ padding: '6px 12px', fontSize: '0.82rem', gap: '6px' }}
            >
              <Trash2 size={14} />
              <span>Delete Selected Groups</span>
            </button>
          )}
        </div>
      )}

      {/* Groups Table or Empty State */}
      {loading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : filteredGroups.length === 0 ? (
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(193, 53, 132, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: 'var(--insta-purple)',
            }}
          >
            <Users size={28} />
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
            {searchQuery ? 'No matching groups found' : 'No Campaign Groups Yet'}
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '6px auto 20px auto', maxWidth: '380px' }}>
            Group multiple Instagram accounts together to schedule and post across entire brand networks in one click.
          </p>
          <button onClick={onOpenCreateModal} className="btn-primary">
            <PlusCircle size={16} />
            <span>Create New Group</span>
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="saas-table">
            <thead>
              <tr>
                {isSelectMode && <th style={{ width: '40px', textAlign: 'center' }}>Select</th>}
                <th style={{ width: '60px' }}>#</th>
                <th>Group Name</th>
                <th>Total Members</th>
                <th>Status</th>
                <th>Inactive Accounts</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group, index) => {
                const isChecked = selectedIds.includes(group.id);
                const isActive = group.status === 'ACTIVE';

                return (
                  <tr key={group.id}>
                    {isSelectMode && (
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleSelect(group.id)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--primary-blue)' }}
                        />
                      </td>
                    )}
                    <td className="text-numeric" style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{index + 1}</td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{group.groupName}</td>
                    <td><span className="text-numeric" style={{ fontWeight: 600 }}>{group.memberCount}</span> accounts</td>
                    <td>
                      <button
                        onClick={() => onToggleStatus(group)}
                        title="Click to toggle group active/inactive status"
                        style={{
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--text-micro)',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                          minHeight: '28px',
                          background: isActive ? 'var(--accent-green-light)' : '#F1F5F9',
                          color: isActive ? 'var(--accent-green)' : '#64748B',
                          border: isActive ? '1px solid var(--accent-green-border)' : '1px solid #CBD5E1',
                        }}
                      >
                        {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        <span>{isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td>
                      {group.inactiveCount > 0 ? (
                        <span
                          className="text-numeric"
                          style={{
                            fontWeight: 700,
                            color: 'var(--accent-red)',
                            background: 'var(--accent-red-light)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: 'var(--text-micro)',
                          }}
                        >
                          {group.inactiveCount} expired
                        </span>
                      ) : (
                        <span className="text-numeric" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-secondary)' }}>0</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 'var(--space-1-5)' }}>
                        <button
                          onClick={() => onEditGroup(group)}
                          className="btn-secondary btn-icon-target"
                          style={{ padding: '0 var(--space-2-5)', fontSize: 'var(--text-secondary)', gap: 'var(--space-1)' }}
                          title="Edit member accounts"
                        >
                          <Edit3 size={14} />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => onDeleteGroup(group.id)}
                          className="btn-danger btn-icon-target"
                          title="Delete group"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
