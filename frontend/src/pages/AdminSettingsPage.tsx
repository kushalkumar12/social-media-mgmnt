import React, { useEffect, useState } from 'react';
import { siteSettingService, SiteSetting } from '../services/siteSettingService';
import { Shield, ToggleLeft, ToggleRight, CheckCircle, AlertCircle, RefreshCw, Key, Settings } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [otpEnabled, setOtpEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await siteSettingService.getAllSettings();
      setSettings(data);
      const otpSetting = data.find(s => s.key === 'REGISTRATION_OTP_ENABLED');
      if (otpSetting) {
        setOtpEnabled(otpSetting.value === 'true');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load site settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggleOtp = async () => {
    setUpdating(true);
    setMessage('');
    setError('');
    const newStatus = !otpEnabled;

    try {
      await siteSettingService.toggleOtp(newStatus);
      setOtpEnabled(newStatus);
      setMessage(`Registration OTP Verification has been turned ${newStatus ? 'ON' : 'OFF'}.`);
      fetchSettings();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update OTP setting.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
              color: '#FFFFFF',
            }}
          >
            <Shield size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Site Maintainer Control Panel</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>
              Global configuration registry, feature flags, and security controls.
            </p>
          </div>
        </div>

        <button
          onClick={fetchSettings}
          className="btn-secondary"
          style={{ gap: '8px' }}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {message && (
        <div
          style={{
            background: 'var(--accent-green-light)',
            border: '1px solid var(--accent-green-border)',
            color: 'var(--accent-green)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            background: 'var(--accent-red-light)',
            border: '1px solid var(--accent-red-border)',
            color: 'var(--accent-red)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Feature Flag Card */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Key size={18} color="var(--primary-blue)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Registration OTP Verification Flag</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              Enable or disable mandatory OTP email verification during user registration.
              When turned <strong>OFF</strong>, new users register directly without needing an OTP code.
              When turned <strong>ON</strong>, users must enter a 6-digit OTP code to complete registration.
            </p>
            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Current Policy:</span>
              <span
                style={{
                  background: otpEnabled ? 'var(--accent-green-light)' : 'var(--accent-red-light)',
                  color: otpEnabled ? 'var(--accent-green)' : 'var(--accent-red)',
                  border: `1px solid ${otpEnabled ? 'var(--accent-green-border)' : 'var(--accent-red-border)'}`,
                  padding: '3px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: otpEnabled ? 'var(--accent-green)' : 'var(--accent-red)',
                  }}
                />
                {otpEnabled ? 'OTP REQUIRED (ON)' : 'OTP DISABLED (OFF)'}
              </span>
            </div>
          </div>

          <div>
            <button
              onClick={handleToggleOtp}
              disabled={updating}
              className={otpEnabled ? 'btn-primary' : 'btn-secondary'}
              style={{
                padding: '10px 20px',
                fontSize: '0.9rem',
                gap: '8px',
                background: otpEnabled ? 'var(--accent-green)' : undefined,
              }}
            >
              {otpEnabled ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
              <span>{updating ? 'Updating...' : otpEnabled ? 'Turn OFF OTP' : 'Turn ON OTP'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Settings Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Settings size={18} color="var(--primary-blue)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>System Configurations Registry</h3>
        </div>

        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading configuration registry...
          </div>
        ) : (
          <div className="table-container">
            <table className="saas-table">
              <thead>
                <tr>
                  <th>Configuration Key</th>
                  <th>Value</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {settings.map((item) => (
                  <tr key={String(item.key)}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary-blue)' }}>
                      {item.key}
                    </td>
                    <td>
                      <span
                        style={{
                          background: '#F1F5F9',
                          border: '1px solid var(--border-color)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                        }}
                      >
                        {item.value}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                      {item.description}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {item.key === 'REGISTRATION_OTP_ENABLED' && (
                        <button
                          onClick={handleToggleOtp}
                          disabled={updating}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        >
                          Toggle State
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
