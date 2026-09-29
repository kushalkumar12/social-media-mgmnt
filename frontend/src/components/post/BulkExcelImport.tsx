import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { excelService, ExcelUploadResponse } from '../../services/excelService';
import { InstagramAccount } from '../../types';
import { AccountGroupDTO } from '../../services/groupService';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Eye,
  AlertCircle,
  Users,
  User,
} from 'lucide-react';

interface BulkExcelImportProps {
  accounts: InstagramAccount[];
  groups?: AccountGroupDTO[];
  onPreviewMedia: (media: { url: string; postType: string; name?: string }) => void;
}

export const BulkExcelImport: React.FC<BulkExcelImportProps> = ({ accounts, groups = [], onPreviewMedia }) => {
  const navigate = useNavigate();

  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelPreview, setExcelPreview] = useState<ExcelUploadResponse | null>(null);
  const [parsingExcel, setParsingExcel] = useState(false);
  const [committingExcel, setCommittingExcel] = useState(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [targetType, setTargetType] = useState<'ACCOUNT' | 'GROUP'>(
    groups && groups.length > 0 ? 'GROUP' : 'ACCOUNT'
  );
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>(
    accounts.length > 0 ? accounts[0].id : ''
  );
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>(
    groups && groups.length > 0 ? groups[0].id : ''
  );
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleDownloadTemplate = async () => {
    try {
      await excelService.downloadTemplate();
    } catch (err: any) {
      alert('Failed to download Excel template: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setExcelFile(file);
    setError('');
    setSuccessMsg('');
    setParsingExcel(true);

    try {
      const res = await excelService.uploadExcel(file);
      setExcelPreview(res);
      // Auto-select valid rows by default
      const validIndices = res.rows.filter((r) => r.valid).map((r) => r.rowIndex);
      setSelectedRows(validIndices);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to parse uploaded Excel file.');
      setExcelPreview(null);
    } finally {
      setParsingExcel(false);
    }
  };

  const toggleSelectRow = (rowIndex: number) => {
    if (selectedRows.includes(rowIndex)) {
      setSelectedRows(selectedRows.filter((i) => i !== rowIndex));
    } else {
      setSelectedRows([...selectedRows, rowIndex]);
    }
  };

  const toggleSelectAllValid = () => {
    if (!excelPreview) return;
    const validIndices = excelPreview.rows.filter((r) => r.valid).map((r) => r.rowIndex);
    if (selectedRows.length === validIndices.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(validIndices);
    }
  };

  const handleCommitBatch = async () => {
    if (!excelPreview) return;
    if (selectedRows.length === 0) {
      setError('Please select at least one valid row to commit into publishing queue.');
      return;
    }

    if (targetType === 'GROUP' && !selectedGroupId) {
      setError('Please select an Account Group to schedule posts to.');
      return;
    }
    if (targetType === 'ACCOUNT' && !selectedAccountId) {
      setError('Please select an Instagram account to schedule posts to.');
      return;
    }

    setCommittingExcel(true);
    setError('');
    try {
      const res = await excelService.commitBatch(
        excelPreview.batchId,
        targetType === 'ACCOUNT' && selectedAccountId ? Number(selectedAccountId) : undefined,
        selectedRows,
        targetType === 'GROUP' && selectedGroupId ? Number(selectedGroupId) : undefined
      );
      setSuccessMsg(res.message || 'Batch scheduled successfully!');
      setTimeout(() => {
        navigate('/posts');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to commit bulk scheduling batch.');
    } finally {
      setCommittingExcel(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Overview & Instructions Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'var(--primary-blue-light)',
          border: '1px solid #BFDBFE',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-blue)' }}>
            Bulk Schedule Ingestion Engine
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '640px' }}>
            Upload standardized Excel spreadsheets to schedule dozens or hundreds of Instagram posts at once.
            Template includes automated dropdown validation for Post Types (IMAGE, REELS, CAROUSEL).
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="btn-secondary"
          style={{ background: '#FFFFFF', gap: '8px' }}
        >
          <Download size={16} color="var(--primary-blue)" />
          <span>Download Excel Template (.xlsx)</span>
        </button>
      </div>

      {error && (
        <div
          style={{
            background: 'var(--accent-red-light)',
            border: '1px solid var(--accent-red-border)',
            color: 'var(--accent-red)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            background: 'var(--accent-green-light)',
            border: '1px solid var(--accent-green-border)',
            color: 'var(--accent-green)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          <span>{successMsg} Redirecting to Scheduled Posts...</span>
        </div>
      )}

      {/* File Drop Area */}
      {!excelPreview && (
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 24px',
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            background: '#F8FAFC',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'border-color var(--transition-fast)',
          }}
        >
          <FileSpreadsheet size={44} color="var(--primary-blue)" style={{ marginBottom: '14px' }} />
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {parsingExcel ? 'Parsing Spreadsheet...' : 'Drop Excel File here or Click to Browse'}
          </div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Supports .xlsx and .xls formatted spreadsheets
          </div>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={parsingExcel}
          />
        </label>
      )}

      {/* Excel Preview Results */}
      {excelPreview && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Rows Parsed</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '2px' }}>{excelPreview.totalRows}</div>
            </div>

            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--accent-green)', fontWeight: 600 }}>Valid & Ready</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-green)', marginTop: '2px' }}>
                {excelPreview.validRows}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--accent-red)', fontWeight: 600 }}>Invalid / Errors</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-red)', marginTop: '2px' }}>
                {excelPreview.errorRows}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--primary-blue)', fontWeight: 600 }}>Selected for Batch</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-blue)', marginTop: '2px' }}>
                {selectedRows.length}
              </div>
            </div>
          </div>

          {/* Account override selector & Commit toolbar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '14px 18px',
              background: '#F8FAFC',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Target Destination:
              </span>

              {/* Toggle Target Destination Mode */}
              <div
                style={{
                  display: 'inline-flex',
                  background: '#E2E8F0',
                  padding: '3px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setTargetType('GROUP')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-xs)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    background: targetType === 'GROUP' ? '#FFFFFF' : 'transparent',
                    color: targetType === 'GROUP' ? 'var(--primary-blue)' : 'var(--text-secondary)',
                    boxShadow: targetType === 'GROUP' ? 'var(--shadow-xs)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Users size={14} />
                  <span>Account Group</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('ACCOUNT')}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-xs)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    background: targetType === 'ACCOUNT' ? '#FFFFFF' : 'transparent',
                    color: targetType === 'ACCOUNT' ? 'var(--primary-blue)' : 'var(--text-secondary)',
                    boxShadow: targetType === 'ACCOUNT' ? 'var(--shadow-xs)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <User size={14} />
                  <span>Single Account</span>
                </button>
              </div>

              {targetType === 'GROUP' ? (
                groups && groups.length > 0 ? (
                  <select
                    className="form-select"
                    style={{ width: 'auto', padding: '6px 12px', fontSize: '0.84rem', fontWeight: 500 }}
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                  >
                    {groups.map((grp) => (
                      <option key={grp.id} value={grp.id}>
                        👥 {grp.groupName} ({grp.memberCount} account{grp.memberCount === 1 ? '' : 's'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span style={{ fontSize: '0.82rem', color: 'var(--accent-red)', fontWeight: 500 }}>
                    No groups found. Please create a group in Account Management.
                  </span>
                )
              ) : (
                <select
                  className="form-select"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '0.84rem' }}
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      @{acc.username}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={toggleSelectAllValid}
                className="btn-secondary"
                style={{ padding: '7px 12px', fontSize: '0.82rem' }}
              >
                {selectedRows.length === excelPreview.validRows ? 'Deselect All' : 'Select All Valid'}
              </button>

              <button
                type="button"
                onClick={handleCommitBatch}
                disabled={committingExcel || selectedRows.length === 0}
                className="btn-primary"
                style={{ padding: '7px 16px', fontSize: '0.84rem' }}
              >
                {committingExcel ? 'Committing Batch...' : `Schedule Selected (${selectedRows.length})`}
              </button>
            </div>
          </div>

          {/* Ingestion Rows Table */}
          <div className="table-container">
            <table className="saas-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>Select</th>
                  <th style={{ width: '50px' }}>Row</th>
                  <th>Status</th>
                  <th>Schedule Date & Time</th>
                  <th>Format</th>
                  <th>Media URL / Asset</th>
                  <th>Validation Diagnostics</th>
                </tr>
              </thead>
              <tbody>
                {excelPreview.rows.map((row) => {
                  const isChecked = selectedRows.includes(row.rowIndex);

                  return (
                    <tr
                      key={row.rowIndex}
                      style={{
                        background: !row.valid ? 'rgba(239, 68, 68, 0.04)' : undefined,
                      }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={!row.valid}
                          onChange={() => toggleSelectRow(row.rowIndex)}
                          style={{
                            width: '16px',
                            height: '16px',
                            cursor: row.valid ? 'pointer' : 'not-allowed',
                            accentColor: 'var(--primary-blue)',
                          }}
                        />
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-muted)' }}>#{row.rowIndex}</td>
                      <td>
                        {row.valid ? (
                          <span className="badge badge-published">
                            <CheckCircle2 size={11} /> Valid
                          </span>
                        ) : (
                          <span className="badge badge-failed">
                            <AlertTriangle size={11} /> Error
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {row.scheduledTimeStr || 'Invalid format'}
                      </td>
                      <td style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary-blue)' }}>
                        {row.postType || 'IMAGE'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              maxWidth: '180px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.8rem',
                              fontFamily: 'monospace',
                            }}
                          >
                            {row.mediaUrl}
                          </span>
                          {row.mediaUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                onPreviewMedia({ url: row.mediaUrl, postType: row.postType })
                              }
                              className="btn-ghost"
                              style={{ padding: '2px 4px' }}
                              title="Preview Media"
                            >
                              <Eye size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: row.valid ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {row.validationErrors && row.validationErrors.length > 0
                          ? row.validationErrors.join('; ')
                          : 'Row passed format and timestamp checks'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
