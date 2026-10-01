import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { excelService, ExcelUploadResponse } from '../../services/excelService';
import { InstagramAccount } from '../../types';
import { AccountGroupDTO } from '../../services/groupService';
import { useNotifications } from '../../context/NotificationContext';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Eye,
  AlertCircle,
  Users,
  User,
  Clock,
  Zap,
  Loader2,
} from 'lucide-react';

interface BulkExcelImportProps {
  accounts: InstagramAccount[];
  groups?: AccountGroupDTO[];
  onPreviewMedia: (media: { url: string; postType: string; name?: string }) => void;
}

export const BulkExcelImport: React.FC<BulkExcelImportProps> = ({ accounts, groups = [], onPreviewMedia }) => {
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelPreview, setExcelPreview] = useState<ExcelUploadResponse | null>(null);
  const [uploadMode, setUploadMode] = useState<'DIRECT' | 'PREVIEW'>('DIRECT');
  const [processing, setProcessing] = useState(false);
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
  const [infoMsg, setInfoMsg] = useState('');

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
    setInfoMsg('');
    setProcessing(true);

    const accountId = targetType === 'ACCOUNT' && selectedAccountId ? Number(selectedAccountId) : undefined;
    const groupId = targetType === 'GROUP' && selectedGroupId ? Number(selectedGroupId) : undefined;

    if (uploadMode === 'DIRECT') {
      try {
        const res = await excelService.uploadAndSchedule(file, accountId, groupId);

        if (res.isAsync) {
          // record > 199: Tell user file is under process we will let you know once completed
          const msg = res.message || 'File is under process, we will let you know once completed.';
          setInfoMsg(`${msg} (Processing ${res.totalRows} posts in background)`);
          showToast(
            'Bulk Ingestion In Progress',
            `${msg} (Processing ${res.totalRows} posts in background)`,
            'INFO',
            '/posts'
          );
        } else {
          // record < 200: Processed immediately
          const msg = res.message || `Successfully scheduled ${res.scheduledCount} posts immediately.`;
          setSuccessMsg(msg);
          showToast('Bulk Ingestion Completed', msg, 'SUCCESS', '/posts');
          setTimeout(() => {
            navigate('/posts');
          }, 2000);
        }
      } catch (err: any) {
        const errMsg = err.response?.data?.message || err.message || 'Failed to process Excel spreadsheet.';
        setError(errMsg);
        showToast('Validation Error', errMsg, 'ERROR');
      } finally {
        setProcessing(false);
      }
    } else {
      // PREVIEW MODE
      try {
        const res = await excelService.uploadExcel(file);
        setExcelPreview(res);
        const validIndices = res.rows.filter((r) => r.valid).map((r) => r.rowIndex);
        setSelectedRows(validIndices);
      } catch (err: any) {
        const errMsg = err.response?.data?.message || 'Failed to parse uploaded Excel file.';
        setError(errMsg);
        setExcelPreview(null);
        showToast('Validation Error', errMsg, 'ERROR');
      } finally {
        setProcessing(false);
      }
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
      showToast('Bulk Ingestion Completed', res.message || 'Batch scheduled successfully!', 'SUCCESS', '/posts');
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

      {/* Threshold Information Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          className="glass-card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            borderLeft: '4px solid var(--accent-green)',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-green-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={20} color="var(--accent-green)" />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Standard Batches (&lt; 200 rows)
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Validated, preserved as-it-is, and processed <strong>immediately</strong> with an instant completion alert.
            </div>
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            borderLeft: '4px solid var(--primary-blue)',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-blue-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Clock size={20} color="var(--primary-blue)" />
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Large Batches (&gt; 199 rows)
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Validated, saved as-it-is, and processed in <strong>background</strong> with real-time notification alerts.
            </div>
          </div>
        </div>
      </div>

      {/* Target Destination & Upload Mode Configuration Card */}
      <div
        className="glass-card"
        style={{
          padding: '18px 22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Target Destination:
          </span>

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
                padding: '6px 14px',
                borderRadius: 'var(--radius-xs)',
                fontWeight: 600,
                fontSize: '0.82rem',
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
                padding: '6px 14px',
                borderRadius: 'var(--radius-xs)',
                fontWeight: 600,
                fontSize: '0.82rem',
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

        {/* Upload Mode Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Mode:</span>
          <div
            style={{
              display: 'inline-flex',
              background: '#F1F5F9',
              padding: '3px',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setUploadMode('DIRECT');
                setExcelPreview(null);
              }}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-xs)',
                fontWeight: 600,
                fontSize: '0.78rem',
                background: uploadMode === 'DIRECT' ? '#FFFFFF' : 'transparent',
                color: uploadMode === 'DIRECT' ? 'var(--primary-blue)' : 'var(--text-secondary)',
                boxShadow: uploadMode === 'DIRECT' ? 'var(--shadow-xs)' : 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Upload & Schedule
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('PREVIEW')}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-xs)',
                fontWeight: 600,
                fontSize: '0.78rem',
                background: uploadMode === 'PREVIEW' ? '#FFFFFF' : 'transparent',
                color: uploadMode === 'PREVIEW' ? 'var(--primary-blue)' : 'var(--text-secondary)',
                boxShadow: uploadMode === 'PREVIEW' ? 'var(--shadow-xs)' : 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Preview First
            </button>
          </div>
        </div>
      </div>

      {/* Validation Error Banner with Clear Best Message */}
      {error && (
        <div
          style={{
            background: 'var(--accent-red-light)',
            border: '1px solid var(--accent-red-border)',
            color: 'var(--accent-red)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>Spreadsheet Validation Error:</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* In-progress Info Banner for > 199 Records */}
      {infoMsg && (
        <div
          style={{
            background: 'var(--primary-blue-light)',
            border: '1px solid #BFDBFE',
            color: 'var(--primary-blue)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Clock size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Batch Queued:</strong> {infoMsg}
          </div>
        </div>
      )}

      {/* Immediate Success Banner */}
      {successMsg && (
        <div
          style={{
            background: 'var(--accent-green-light)',
            border: '1px solid var(--accent-green-border)',
            color: 'var(--accent-green)',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Success:</strong> {successMsg}
          </div>
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
            padding: '52px 24px',
            border: '2px dashed var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            background: '#F8FAFC',
            cursor: processing ? 'wait' : 'pointer',
            textAlign: 'center',
            transition: 'border-color var(--transition-fast)',
          }}
        >
          {processing ? (
            <Loader2 size={48} color="var(--primary-blue)" className="animate-spin" style={{ marginBottom: '14px' }} />
          ) : (
            <FileSpreadsheet size={48} color="var(--primary-blue)" style={{ marginBottom: '14px' }} />
          )}

          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {processing ? 'Validating & Processing Spreadsheet...' : 'Drop Excel File here or Click to Browse'}
          </div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Supports standardized .xlsx and .xls files • Max 2,200 characters per caption
          </div>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={processing}
          />
        </label>
      )}

      {/* Preview Table Mode (If enabled) */}
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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
                            accentColor: 'var(--primary-blue)',
                            cursor: row.valid ? 'pointer' : 'not-allowed',
                          }}
                        />
                      </td>

                      <td style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>#{row.rowIndex}</td>

                      <td>
                        {row.valid ? (
                          <span className="badge badge-success" style={{ gap: '4px' }}>
                            <CheckCircle2 size={12} />
                            <span>Valid</span>
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ gap: '4px' }}>
                            <AlertCircle size={12} />
                            <span>Invalid</span>
                          </span>
                        )}
                      </td>

                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {row.scheduledTimeStr || 'Invalid / Missing'}
                        </div>
                      </td>

                      <td>
                        <span className="badge badge-info">{row.postType}</span>
                      </td>

                      <td style={{ maxWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.8rem',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {row.mediaUrl}
                          </span>
                          {row.mediaUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                onPreviewMedia({
                                  url: row.mediaUrl,
                                  postType: row.postType,
                                  name: row.name,
                                })
                              }
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary-blue)',
                                cursor: 'pointer',
                                padding: '2px',
                              }}
                              title="Preview Media"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                        </div>
                      </td>

                      <td>
                        {row.valid ? (
                          <span style={{ fontSize: '0.78rem', color: 'var(--accent-green)', fontWeight: 500 }}>
                            Ready for ingest
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {row.validationErrors.map((errText, idx) => (
                              <div
                                key={idx}
                                style={{
                                  fontSize: '0.78rem',
                                  color: 'var(--accent-red)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                                <span>{errText}</span>
                              </div>
                            ))}
                          </div>
                        )}
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
