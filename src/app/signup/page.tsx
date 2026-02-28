'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CUISINE_TYPES = ['Indian', 'Chinese', 'Italian', 'Mexican', 'Japanese', 'Thai', 'Mediterranean', 'American', 'Continental', 'Other'];
const EMOJI_OPTIONS = ['🍽️', '🌿', '🍜', '🍕', '🌮', '🍣', '🥘', '🍔', '🥗', '🫕', '🍛', '🔥'];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    logo_emoji: '🍽️',
    address: '',
    cuisine_type: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    confirm_password: '',
  });

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
  }

  function nextStep() {
    if (!form.name.trim()) { setError('Restaurant name is required'); return; }
    setStep(2);
  }

  async function submit() {
    if (!form.admin_name.trim() || !form.admin_email.trim() || !form.admin_password) {
      setError('All fields are required');
      return;
    }
    if (form.admin_password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    if (form.admin_password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          logo_emoji: form.logo_emoji,
          address: form.address,
          cuisine_type: form.cuisine_type,
          admin_name: form.admin_name,
          admin_email: form.admin_email,
          admin_password: form.admin_password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }
      router.push('/admin/dashboard');
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', background: '#1C1917',
    border: '1px solid #3F3B37', borderRadius: 10, color: '#FAFAF9',
    fontSize: 15, outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 500, color: '#A8A29E', marginBottom: 6,
  };
  const btnStyle: React.CSSProperties = {
    width: '100%', padding: '13px', background: '#F59E0B', border: 'none',
    borderRadius: 10, color: '#000', fontWeight: 700, fontSize: 15, cursor: 'pointer',
    opacity: loading ? 0.7 : 1,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0C0A09', color: '#FAFAF9', fontFamily: "'DM Sans', -apple-system, sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 40 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', border: '1.5px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 16 }}>🍽️</span>
        </div>
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', color: '#FAFAF9' }}>DineAI</span>
      </Link>

      <div style={{ width: '100%', maxWidth: 440, background: '#1C1917', border: '1px solid #292524', borderRadius: 16, padding: '36px 32px' }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          {[1, 2].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, background: step >= s ? '#F59E0B' : '#292524', color: step >= s ? '#000' : '#78716C' }}>
                {s}
              </div>
              {s < 2 && <div style={{ width: 40, height: 1, background: step > s ? '#F59E0B' : '#3F3B37' }} />}
            </div>
          ))}
          <span style={{ fontSize: 13, color: '#A8A29E', marginLeft: 4 }}>
            {step === 1 ? 'Restaurant info' : 'Your account'}
          </span>
        </div>

        {step === 1 && (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>Set up your restaurant</h1>
            <p style={{ fontSize: 14, color: '#A8A29E', marginBottom: 28 }}>Tell us about your restaurant — you can change everything later.</p>

            {/* Emoji picker */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Restaurant emoji</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} onClick={() => update('logo_emoji', e)} style={{ width: 40, height: 40, border: `2px solid ${form.logo_emoji === e ? '#F59E0B' : '#3F3B37'}`, borderRadius: 8, background: form.logo_emoji === e ? 'rgba(245,158,11,0.15)' : '#0C0A09', fontSize: 20, cursor: 'pointer' }}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Restaurant name *</label>
              <input style={inputStyle} placeholder="e.g. The Spice Garden" value={form.name} onChange={e => update('name', e.target.value)} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Cuisine type</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.cuisine_type} onChange={e => update('cuisine_type', e.target.value)}>
                <option value="">Select cuisine type</option>
                {CUISINE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Short description</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }} placeholder="What makes your restaurant special?" value={form.description} onChange={e => update('description', e.target.value)} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Address</label>
              <input style={inputStyle} placeholder="123 Main St, City" value={form.address} onChange={e => update('address', e.target.value)} />
            </div>

            {error && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 16 }}>{error}</p>}

            <button onClick={nextStep} style={btnStyle}>Continue →</button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>Create your account</h1>
            <p style={{ fontSize: 14, color: '#A8A29E', marginBottom: 28 }}>This will be your admin login for {form.name || 'your restaurant'}.</p>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Your name *</label>
              <input style={inputStyle} placeholder="Your full name" value={form.admin_name} onChange={e => update('admin_name', e.target.value)} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email address *</label>
              <input style={inputStyle} type="email" placeholder="you@restaurant.com" value={form.admin_email} onChange={e => update('admin_email', e.target.value)} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Password *</label>
              <input style={inputStyle} type="password" placeholder="Min. 6 characters" value={form.admin_password} onChange={e => update('admin_password', e.target.value)} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Confirm password *</label>
              <input style={inputStyle} type="password" placeholder="Repeat your password" value={form.confirm_password} onChange={e => update('confirm_password', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()} />
            </div>

            {error && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 16 }}>{error}</p>}

            <button onClick={submit} disabled={loading} style={btnStyle}>
              {loading ? 'Creating your restaurant…' : 'Launch my restaurant 🚀'}
            </button>

            <button onClick={() => setStep(1)} style={{ width: '100%', marginTop: 10, padding: '11px', background: 'transparent', border: '1px solid #3F3B37', borderRadius: 10, color: '#A8A29E', fontSize: 14, cursor: 'pointer' }}>
              ← Back
            </button>
          </>
        )}
      </div>

      <p style={{ marginTop: 24, fontSize: 13, color: '#78716C' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: '#F59E0B', textDecoration: 'none' }}>Log in</Link>
      </p>
    </div>
  );
}
