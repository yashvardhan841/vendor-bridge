import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole, type Role } from '../context/RoleContext';
import { addActivityLog } from '../db/db';
import { 
  Shield, 
  Mail, 
  Lock, 
  User, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register, theme } = useRole();
  const navigate = useNavigate();

  // Navigation tab state
  const [isRegistering, setIsRegistering] = useState(false);

  // Sign In form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  // Registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<Role>('Procurement Officer');
  const [regPhoto, setRegPhoto] = useState<string | null>(null);

  // Notifications
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const success = login(email, password, rememberMe);
    if (success) {
      addActivityLog({
        user: email,
        role: email.includes('admin') ? 'Admin' : email.includes('officer') ? 'Procurement Officer' : email.includes('vendor') ? 'Vendor' : 'Manager',
        action: 'User Authenticated',
        details: `Session initialized for user account ${email}. IP: 127.0.0.1 (Local host).`,
        category: 'security'
      });
      navigate('/');
    } else {
      setError('Invalid email or password. Please verify credentials.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regName.trim()) {
      setError('Name is required.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (regPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    const created = register(regName, regEmail, regRole, regPassword, regPhoto);
    if (created) {
      addActivityLog({
        user: regEmail,
        role: regRole,
        action: 'New User Registered',
        details: `New account registered for ${regName} (${regRole}) with corporate email ${regEmail}.`,
        category: 'security'
      });

      setSuccessMsg('Account created successfully! You can now sign in.');
      setIsRegistering(false);
      
      // Auto fill sign in form with new details
      setEmail(regEmail);
      setPassword(regPassword);
      
      // Clear registration inputs
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegRole('Procurement Officer');
      setRegPhoto(null);
    } else {
      setError('Email address is already registered.');
    }
  };



  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background neon glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/10 filter blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/10 filter blur-3xl" />

      {/* Login Card */}
      <div className="w-full max-w-md p-8 rounded-3xl glass-panel border border-white/10 bg-slate-900/90 shadow-2xl space-y-6 relative z-10 text-left">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div 
            className="flex items-center justify-center p-3.5 rounded-2xl bg-white/5 border border-white/10 shadow-lg"
            style={{ boxShadow: `0 0 20px -3px ${theme?.primary || '#6366f1'}40` }}
          >
            <Shield className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold tracking-wider text-white mt-3">
            Vendor<span className="text-indigo-400">Bridge</span> ERP
          </h2>
          <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">
            Enterprise Supply Chain Ledger
          </p>
        </div>

        {/* Tab Toggle Buttons */}
        <div className="flex rounded-xl bg-white/5 p-1 border border-white/5">
          <button
            onClick={() => {
              setIsRegistering(false);
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              !isRegistering 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsRegistering(true);
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              isRegistering 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-xs text-emerald-400 animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Validation Errors */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 text-xs text-red-400 animate-in fade-in slide-in-from-top-2 duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Forms Switcher */}
        {!isRegistering ? (
          /* Sign In Form */
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl glass-input border border-white/10 bg-slate-955 text-white outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl glass-input border border-white/10 bg-slate-955 text-white outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-xs mt-2 select-none">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-slate-955 accent-indigo-500 cursor-pointer"
                />
                Remember Me
              </label>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all active:scale-98 cursor-pointer mt-6"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Registration Form */
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Tony Stark"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl glass-input border border-white/10 bg-slate-955 text-white outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Role Select
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as Role)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-lg bg-slate-800 text-white border border-slate-600 focus:border-indigo-500/50 transition-all cursor-pointer outline-none"
                >
                  <option className="bg-slate-800 text-white" value="Admin">Admin</option>
                  <option className="bg-slate-800 text-white" value="Procurement Officer">Procurement Officer</option>
                  <option className="bg-slate-800 text-white" value="Vendor">Vendor</option>
                  <option className="bg-slate-800 text-white" value="Manager">Manager</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="tony@stark.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl glass-input border border-white/10 bg-slate-955 text-white outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl glass-input border border-white/10 bg-slate-955 text-white outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all active:scale-98 cursor-pointer mt-6"
            >
              Create ERP Account
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}



      </div>
    </div>
  );
};
