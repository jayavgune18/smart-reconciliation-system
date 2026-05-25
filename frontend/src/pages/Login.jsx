import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, User, AlertCircle, ArrowRight } from 'lucide-react';

export const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (isRegister) {
      if (!formData.name || !formData.email || !formData.password) {
        setError('Please fill in all input fields.');
        setSubmitting(false);
        return;
      }
      const res = await register(formData.name, formData.email, formData.password, formData.role);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message);
      }
    } else {
      if (!formData.email || !formData.password) {
        setError('Please enter your email and password.');
        setSubmitting(false);
        return;
      }
      const res = await login(formData.email, formData.password);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message);
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900 via-slate-950 to-brand-950 text-slate-100 overflow-hidden relative">
      
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pulse-glow" style={{ animationDelay: '1.5s' }} />

      <div className="w-full max-w-md z-10">
        
        {/* Core Glassmorphic Form Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl glow-cyan-dark animate-in fade-in-50 slide-in-from-bottom-6 duration-500">
          
          {/* Header Title */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/20 glow-cyan">
              <Shield size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              {isRegister ? 'Create Audit Account' : 'Financial Reconciliation Portal'}
            </h1>
            <p className="text-xs text-slate-400 mt-2">
              {isRegister ? 'Register your credential for ledger audit operations' : 'Secured ledger analysis environment'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isRegister && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <User size={16} />
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter Email.."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                />
              </div>
            </div>

            {isRegister && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">System Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-800 rounded-lg text-xs focus:outline-none focus:border-cyan-500 transition"
                >
                  <option value="user" className="bg-slate-900 text-slate-200">Reconciliation Officer (User)</option>
                  <option value="admin" className="bg-slate-900 text-slate-200">Lead Audit Architect (Admin)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-xs rounded-lg shadow-lg flex items-center justify-center gap-2 group transition"
            >
              <span>{submitting ? 'Authenticating...' : (isRegister ? 'Register Account' : 'Verify Account')}</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          {/* Toggle Register Form */}
          <div className="text-center mt-6 pt-4 border-t border-slate-800/80">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold focus:outline-none"
            >
              {isRegister ? 'Already registered? Access Account' : 'Need authorization? Register Profile'}
            </button>
          </div>

        </div>

        {/* Demo Helper box */}
        <div className="mt-4 p-3 rounded-lg bg-slate-800/20 border border-slate-800/50 backdrop-blur-sm text-[10px] text-center text-slate-500 select-none">
          <span className="font-semibold text-slate-400">Demo Login Credits</span>: admin@recon.com / admin123 (Full Rights)
        </div>

      </div>

    </div>
  );
};
