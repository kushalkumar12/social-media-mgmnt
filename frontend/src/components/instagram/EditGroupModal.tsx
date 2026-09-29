import React, { useState, useEffect } from 'react';
import { groupService, AccountGroupDTO } from '../../services/groupService';
import { InstagramAccount } from '../../types';
import { X, Edit3 } from 'lucide-react';

interface EditGroupModalProps {
  group: AccountGroupDTO | null;
  accounts: InstagramAccount[];
  onClose: () => void;
  onSuccess: () => void;
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({
  group,
  accounts,
  onClose,
  onSuccess,
}) => {
  const [groupName, setGroupName] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (group) {
      setGroupName(group.groupName);
      setSelectedIds(group.accountIds || []);
      setError('');
    }
  }, [group]);

  if (!group) return null;

  const handleToggleAccount = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleUpdate = async () => {
    if (!groupName.trim()) {
      setError('Please provide a group name.');
      return;
    }

    setUpdating(true);
    setError('');
    try {
      await groupService.updateGroup(group.id, {
        groupName: groupName.trim(),
        status: group.status,
        accountIds: selectedIds,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update group members.');
    } finally {
      setUpdating(false);
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
              <Edit3 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--text-title-sm)', fontWeight: 'var(--font-weight-bold)' }}>Edit Group Members</h3>
              <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                Update accounts attached to {group.groupName}
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
            <label className="form-label" htmlFor="edit-group-name">Group Name</label>
            <input
              id="edit-group-name"
              type="text"
              className="form-input"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
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
                padding: 'var(--space-2)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-1-5)',
              }}
            >
              {accounts.map((acc) => {
                const isChecked = selectedIds.includes(acc.id);
                return (
                  <label
                    key={acc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2-5)',
                      padding: 'var(--space-2) var(--space-2-5)',
                      borderRadius: 'var(--radius-sm)',
                      background: isChecked ? 'var(--primary-blue-light)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: 'var(--text-body)',
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
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2-5)', marginTop: 'var(--space-6)' }}>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={!groupName.trim() || updating}
            className="btn-primary"
          >
            {updating ? 'Updating...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
