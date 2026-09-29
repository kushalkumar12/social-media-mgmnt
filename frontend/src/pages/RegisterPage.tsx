import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { siteSettingService } from '../services/siteSettingService';
import { Instagram, ArrowRight, Lock, Mail, User as UserIcon, KeyRound, CheckCircle2, ShieldCheck, ShieldAlert } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [otpRequired, setOtpRequired] = useState<boolean | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [debugOtp, setDebugOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    siteSettingService.getPublicSettings()
      .then(res => {
        setOtpRequired(res.registrationOtpEnabled);
      })
      .catch(() => {
        setOtpRequired(true); // default to true if check fails
      });
  }, []);

  const handleDirectRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        confirmPassword
      });
      login(res.data);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const details = Object.values(err.response.data.errors).join('. ');
        setError(details);
      } else {
        setError(err.response?.data?.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Password and Confirm Password do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register-send-otp', {
        name,
        email,
        password,
        confirmPassword
      });
      setMessage(res.data.message);
      if (res.data.debugOtp) {
        setDebugOtp(res.data.debugOtp);
        setOtpCode(res.data.debugOtp);
      }
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/verify-otp', {
        email,
        otpCode
      });
      login(res.data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'OTP Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-card animate-fade" style={{ width: '100%', maxWidth: '460px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'var(--insta-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 8px 24px rgba(225, 48, 108, 0.4)'
          }}>
            <Instagram size={30} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {step === 1 ? 'Create Account' : 'Verify Email OTP'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
            {step === 1 ? 'Free 15-day trial (1 Instagram Account)' : `Enter the 6-digit OTP code sent to ${email}`}
          </p>
        </div>

        {/* Site Settings OTP Status Indicator */}
        {otpRequired !== null && step === 1 && (
          <div style={{
            background: otpRequired ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            border: `1px solid ${otpRequired ? 'rgba(59, 130, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: otpRequired ? '#60A5FA' : '#34D399'
          }}>
            {otpRequired ? <ShieldAlert size={15} /> : <ShieldCheck size={15} />}
            <span>
              {otpRequired
                ? 'Site Policy: OTP verification is mandatory for registration'
                : 'Site Policy: OTP verification is currently turned OFF'}
            </span>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34D399', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px' }}>
            {message}
          </div>
        )}

        {/* Render Direct Register Form if OTP is disabled */}
        {otpRequired === false ? (
          <form onSubmit={handleDirectRegister}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '42px' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '42px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '42px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '42px' }}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} disabled={loading}>
              <CheckCircle2 size={18} />
              <span>{loading ? 'Registering...' : 'Register Now (No OTP)'}</span>
            </button>
          </form>
        ) : (
          /* Render 2-Step OTP Registration Form if OTP is enabled */
          step === 1 ? (
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '42px' }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '42px' }}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '42px' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '42px' }}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} disabled={loading}>
                <span>{loading ? 'Sending OTP...' : 'Continue to Verification'}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              {debugOtp && (
                <div style={{ background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60A5FA', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', marginBottom: '20px', textAlign: 'center' }}>
                  🔑 Testing OTP Code: <strong style={{ letterSpacing: '2px', fontSize: '1rem', marginLeft: '6px' }}>{debugOtp}</strong>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Enter 6-Digit OTP Code</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%', paddingLeft: '42px', letterSpacing: '4px', fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center' }}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    placeholder="123456"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} disabled={loading}>
                <CheckCircle2 size={18} />
                <span>{loading ? 'Verifying...' : 'Verify OTP & Create Account'}</span>
              </button>

              <button type="button" onClick={() => setStep(1)} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                Back to Registration
              </button>
            </form>
          )
        )}

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--insta-pink)', fontWeight: 600 }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
};
