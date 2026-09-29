import React, { useState, useEffect } from 'react';
import { groupService } from '../../services/groupService';
import { InstagramAccount } from '../../types';
import { X, Users } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: InstagramAccount[];
  initialSelectedAccountIds?: number[];
  onSuccess: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  accounts,
  initialSelectedAccountIds = [],
  onSuccess,
}) => {
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>(initialSelectedAccountIds);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedIds(initialSelectedAccountIds);
      setGroupName('');
      setError('');
    }
  }, [isOpen, initialSelectedAccountIds]);

  if (!isOpen) return null;

  const handleToggleAccount = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Please provide a campaign group name.');
      return;
    }

    setCreating(true);
    setError('');
    try {
      await groupService.createGroup(groupName.trim(), selectedIds, 'ACTIVE');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create group.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '520px', padding: 'var(--space-6)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2-5)' }}>
            <div
              style={{
                width: 'var(--target-compact-min)',
                height: 'var(--target-compact-min)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-blue-light)',
                color: 'var(--primary-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--text-title-sm)', fontWeight: 'var(--font-weight-bold)' }}>Create Campaign Group</h3>
              <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                Organize accounts into target campaign lists
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="btn-icon-target"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'var(--accent-red-light)',
              border: '1px solid var(--accent-red-border)',
              color: 'var(--accent-red)',
              padding: 'var(--space-2-5) var(--space-3-5)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-secondary)',
              marginBottom: 'var(--space-4)',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="new-group-name">Group Name</label>
            <input
              id="new-group-name"
              type="text"
              className="form-input"
              placeholder="e.g. Festive Campaign Brands"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <label className="form-label">
                Member Accounts (<span className="text-numeric">{selectedIds.length}</span> selected)
              </label>
              {accounts.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedIds.length === accounts.length) setSelectedIds([]);
                    else setSelectedIds(accounts.map((a) => a.id));
                  }}
                  style={{ fontSize: 'var(--text-caption)', color: 'var(--primary-blue)', fontWeight: 600 }}
                >
                  {selectedIds.length === accounts.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            <div
              style={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              {accounts.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  No connected accounts available.
                </div>
              ) : (
                accounts.map((acc) => {
                  const isChecked = selectedIds.includes(acc.id);
                  return (
                    <label
                      key={acc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: isChecked ? 'var(--primary-blue-light)' : 'transparent',
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleAccount(acc.id)}
                        style={{ accentColor: 'var(--primary-blue)', width: '16px', height: '16px' }}
                      />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>@{acc.username}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2-5)', marginTop: 'var(--space-6)' }}>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!groupName.trim() || creating}
            className="btn-primary"
          >
            {creating ? 'Creating...' : 'Save Group'}
          </button>
        </div>
      </div>
    </div>
  );
};
