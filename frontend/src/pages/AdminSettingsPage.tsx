import React, { useEffect, useState } from 'react';
import { siteSettingService, SiteSetting } from '../services/siteSettingService';
import { Shield, ToggleLeft, ToggleRight, CheckCircle, AlertCircle, RefreshCw, Key, Settings, Server, Lock } from 'lucide-react';

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
    <div className="animate-fade" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #833AB4, #FD1D1D)',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(131, 58, 180, 0.4)'
            }}>
              <Shield color="#fff" size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Site Maintainer Control Panel</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>
                Global configuration, feature flags, and security settings
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchSettings}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {message && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          color: '#047857',
          padding: '14px 18px',
          borderRadius: '12px',
          fontSize: '0.9rem',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle size={20} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#B91C1C',
          padding: '14px 18px',
          borderRadius: '12px',
          fontSize: '0.9rem',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Feature Flag Card */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '28px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Key size={20} color="var(--insta-purple)" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Registration OTP Verification Flag</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 }}>
              Enable or disable mandatory OTP email verification during user registration.
              When turned <strong>OFF</strong>, new users register directly without needing an OTP code.
              When turned <strong>ON</strong>, users must enter a 6-digit OTP code to complete registration.
            </p>
            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Current Status:</span>
              <span style={{
                background: otpEnabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                color: otpEnabled ? '#047857' : '#B91C1C',
                border: `1px solid ${otpEnabled ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: otpEnabled ? '#10B981' : '#EF4444'
                }} />
                {otpEnabled ? 'OTP REQUIRED (ON)' : 'OTP DISABLED (OFF)'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
            <button
              onClick={handleToggleOtp}
              disabled={updating}
              style={{
                background: otpEnabled ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #6B7280, #4B5563)',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: otpEnabled ? '0 4px 16px rgba(16, 185, 129, 0.35)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {otpEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              <span>{updating ? 'Updating...' : otpEnabled ? 'Turn OFF OTP' : 'Turn ON OTP'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Settings Table */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Settings size={20} color="var(--insta-pink)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>System Configurations Registry</h3>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading configuration...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '12px' }}>KEY</th>
                  <th style={{ padding: '12px' }}>VALUE</th>
                  <th style={{ padding: '12px' }}>DESCRIPTION</th>
                  <th style={{ padding: '12px' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {settings.map((item) => (
                  <tr key={String(item.key)} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '14px 12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--insta-purple)' }}>
                      {item.key}
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <span style={{
                        background: 'var(--bg-card-hover)',
                        border: '1px solid var(--border-color)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        fontWeight: 700
                      }}>
                        {item.value}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {item.description}
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      {item.key === 'REGISTRATION_OTP_ENABLED' && (
                        <button
                          onClick={handleToggleOtp}
                          disabled={updating}
                          style={{
                            background: 'transparent',
                            color: 'var(--insta-pink)',
                            border: '1px solid var(--insta-pink)',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
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
