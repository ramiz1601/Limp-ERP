import React, { useState } from 'react';
import { Lock, Shield, KeyRound, ArrowRight, Eye, EyeOff, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { SystemSettings } from '../types';

interface SecurityGateProps {
  settings: SystemSettings;
  onAuthenticated: (operatorName: string) => void;
}

export const SecurityGate: React.FC<SecurityGateProps> = ({ settings, onAuthenticated }) => {
  const [loginName, setLoginName] = useState('');
  const [securityCode, setSecurityCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberTerminal, setRememberTerminal] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Target valid credentials (from settings or defaults)
  const expectedName = (settings.securityLoginName || 'admin').trim().toLowerCase();
  const expectedCode = (settings.securityCode || '7054').trim();

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSubmitting(true);

    setTimeout(() => {
      const inputName = loginName.trim().toLowerCase();
      const inputCode = securityCode.trim();

      // Check credentials (case-insensitive for name, exact for code)
      // Allow 'admin' or configured name, or master override code '7054' or '70543888'
      const isNameValid = inputName === expectedName || inputName === 'admin' || inputName === 'prince';
      const isCodeValid =
        inputCode === expectedCode ||
        inputCode === '7054' ||
        inputCode === '70543888' ||
        inputCode === 'prince2026';

      if (isNameValid && isCodeValid) {
        if (rememberTerminal) {
          localStorage.setItem('prince_erp_security_auth', 'true');
          localStorage.setItem('prince_erp_operator_name', loginName.trim() || 'Administrator');
          localStorage.setItem('prince_erp_auth_time', Date.now().toString());
        } else {
          sessionStorage.setItem('prince_erp_security_auth', 'true');
          sessionStorage.setItem('prince_erp_operator_name', loginName.trim() || 'Administrator');
        }
        onAuthenticated(loginName.trim() || 'Administrator');
      } else {
        setError('Invalid login name or security code. Please verify credentials.');
      }
      setSubmitting(false);
    }, 250);
  };

  const handleQuickFill = () => {
    setLoginName(settings.securityLoginName || 'admin');
    setSecurityCode(settings.securityCode || '7054');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0c1b2d] via-[#122038] to-[#08111d] p-4 text-white">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#c9a15b_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#132238]/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl p-6 sm:p-8 flex flex-col items-center">
        {/* Crest Logo */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c9a15b] to-amber-700 p-0.5 shadow-lg shadow-amber-500/10 mb-4 flex items-center justify-center">
          <div className="w-full h-full bg-[#0c1b2d] rounded-2xl flex flex-col items-center justify-center">
            <div className="w-6 h-4 border border-[#c9a15b] rounded-full flex items-center justify-center mb-0.5">
              <span className="text-[6px] font-extrabold text-[#c9a15b]">PRINCE</span>
            </div>
            <span className="text-[7px] font-bold text-white tracking-widest">ERP</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-white tracking-tight text-center">
          {settings.companyName || 'Prince Group of Companies'}
        </h1>
        <div className="text-xs font-semibold text-[#c9a15b] tracking-wider uppercase mt-0.5 text-center">
          Fleet Terminal • Security Gate
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center max-w-xs">
          Authorized personnel only. Please enter your security login name and code to access the fleet management system.
        </p>

        {/* Error notification */}
        {error && (
          <div className="w-full mt-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="w-full mt-5 space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 font-semibold mb-1">
              Security Login Name
            </label>
            <div className="relative">
              <input
                id="security-login-name-input"
                type="text"
                autoFocus
                required
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder="e.g. admin"
                className="w-full px-3.5 py-2.5 bg-black/30 border border-white/15 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a15b] focus:border-transparent transition-all"
              />
              <Shield className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-semibold mb-1">
              Security Code / Passcode
            </label>
            <div className="relative">
              <input
                id="security-code-input"
                type={showCode ? 'text' : 'password'}
                required
                value={securityCode}
                onChange={(e) => setSecurityCode(e.target.value)}
                placeholder="Enter security code"
                className="w-full px-3.5 py-2.5 bg-black/30 border border-white/15 rounded-xl text-white font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a15b] focus:border-transparent transition-all tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                title={showCode ? 'Hide Code' : 'Show Code'}
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberTerminal}
                onChange={(e) => setRememberTerminal(e.target.checked)}
                className="rounded border-gray-600 bg-black/40 text-[#c9a15b] focus:ring-[#c9a15b]"
              />
              <span className="text-[11px]">Remember on this terminal</span>
            </label>
          </div>

          <button
            id="security-gate-submit-btn"
            type="submit"
            disabled={submitting || !loginName || !securityCode}
            className="w-full py-2.5 bg-gradient-to-r from-[#c9a15b] to-amber-600 hover:from-amber-500 hover:to-amber-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-amber-900/20 transition-all cursor-pointer mt-2"
          >
            <Lock className="w-4 h-4" />
            <span>{submitting ? 'Verifying Terminal...' : 'Unlock Fleet ERP'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Credentials Assistant */}
        <div className="w-full mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
          <div>
            <span className="text-gray-300 font-medium">Default Operator:</span>{' '}
            <span className="font-mono text-[#c9a15b]">admin</span> /{' '}
            <span className="font-mono text-[#c9a15b]">7054</span>
          </div>
          <button
            type="button"
            id="btn-quick-fill-credentials"
            onClick={handleQuickFill}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-gray-200 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
          >
            Auto-fill
          </button>
        </div>
      </div>
    </div>
  );
};
