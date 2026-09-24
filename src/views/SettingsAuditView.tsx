import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { Settings, Shield, Save, CheckCircle, Search, Clock, FileText, Database, Sparkles, Trash2, AlertCircle } from 'lucide-react';
import { DeleteModal } from '../components/DeleteModal';

interface SettingsAuditViewProps {
  initialTab?: 'Settings' | 'AuditLogs';
}

export const SettingsAuditView: React.FC<SettingsAuditViewProps> = ({
  initialTab = 'Settings',
}) => {
  const { settings, updateSettings, auditLogs, seedDemoData, clearAllData } = useDb();

  const [activeTab, setActiveTab] = useState<'Settings' | 'AuditLogs'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    companyName: settings.companyName || 'Prince Limousine & Car Rental',
    companySubtitle: settings.companySubtitle || 'Fleet & Mobility ERP',
    companyLogoUrl: settings.companyLogoUrl || '/prince-logo.png',
    companyPhone: settings.companyPhone || '70543888',
    address: settings.address || 'Doha, State of Qatar',
    currency: settings.currency || 'QAR',
    warning1Days: settings.warning1Days || 30,
    warning2Days: settings.warning2Days || 15,
    timezone: settings.timezone || 'Asia/Qatar',
    securityLoginName: settings.securityLoginName || 'admin',
    securityCode: settings.securityCode || '7054',
    requireSecurityLogin: settings.requireSecurityLogin !== false,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName || 'Prince Limousine & Car Rental',
        companySubtitle: settings.companySubtitle || 'Fleet & Mobility ERP',
        companyLogoUrl: settings.companyLogoUrl || '/prince-logo.png',
        companyPhone: settings.companyPhone || '70543888',
        address: settings.address || 'Doha, State of Qatar',
        currency: settings.currency || 'QAR',
        warning1Days: settings.warning1Days || 30,
        warning2Days: settings.warning2Days || 15,
        timezone: settings.timezone || 'Asia/Qatar',
        securityLoginName: settings.securityLoginName || 'admin',
        securityCode: settings.securityCode || '7054',
        requireSecurityLogin: settings.requireSecurityLogin !== false,
      });
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSettings(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      await seedDemoData();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    setLoading(true);
    try {
      await clearAllData();
      setIsClearModalOpen(false);
      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(
    (log) =>
      (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.entity && (log.entity || '').toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.reference && (log.reference || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#122038]">
            {activeTab === 'Settings' ? 'System Configuration' : 'Audit Logs'}
          </h1>
          <p className="text-xs text-[#718198]">
            Company credentials, expiry warning periods, and secure audit trail
          </p>
        </div>

        <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-gray-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('Settings')}
            className={`px-4 py-1.5 rounded-lg transition-colors ${
              activeTab === 'Settings'
                ? 'bg-[#1f73e8] text-white'
                : 'text-[#718198] hover:text-[#122038]'
            }`}
          >
            System Settings
          </button>
          <button
            onClick={() => setActiveTab('AuditLogs')}
            className={`px-4 py-1.5 rounded-lg transition-colors ${
              activeTab === 'AuditLogs'
                ? 'bg-[#1f73e8] text-white'
                : 'text-[#718198] hover:text-[#122038]'
            }`}
          >
            Audit Logs ({auditLogs.length})
          </button>
        </div>
      </div>

      {activeTab === 'Settings' ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs max-w-2xl">
          <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1f73e8] flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#122038]">Organization & Fleet Preferences</h3>
              <p className="text-xs text-[#718198]">Configure system defaults and document expiry rules</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="mt-5 space-y-4 text-xs">
            {/* Company Branding Section */}
            <div className="p-4 bg-[#f8fbfe] rounded-xl border border-blue-100 space-y-3">
              <div className="font-bold text-xs text-[#122038]">Company Identity & Logo</div>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                  {formData.companyLogoUrl ? (
                    <img
                      src={formData.companyLogoUrl}
                      alt="Company Logo Preview"
                      className="w-full h-full object-contain p-1"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-[10px] text-gray-400 text-center">No Logo</span>
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 bg-[#1f73e8] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors">
                      <span>Upload New Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (reader.result) {
                                setFormData((prev) => ({ ...prev, companyLogoUrl: reader.result as string }));
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, companyLogoUrl: '/prince-logo.png' }))}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      Default Logo
                    </button>
                  </div>
                  <div className="text-[10px] text-[#718198]">
                    PNG, JPG, or SVG recommended. Logo appears on Sidebar, Header, Contracts, & Receipts.
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none font-semibold text-gray-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Subtitle / Tagline</label>
                <input
                  type="text"
                  value={formData.companySubtitle}
                  onChange={(e) => setFormData({ ...formData, companySubtitle: e.target.value })}
                  placeholder="e.g. Fleet & Mobility ERP"
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Hotline / Phone</label>
                <input
                  type="text"
                  value={formData.companyPhone}
                  onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Address / Location</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Document Expiry Notice (Days)
                </label>
                <input
                  type="number"
                  value={formData.warning1Days}
                  onChange={(e) =>
                    setFormData({ ...formData, warning1Days: parseInt(e.target.value) || 30 })
                  }
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none font-mono"
                />
                <span className="text-[10px] text-gray-400">Trigger upcoming amber alerts</span>
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Urgent Notice (Days)</label>
                <input
                  type="number"
                  value={formData.warning2Days}
                  onChange={(e) =>
                    setFormData({ ...formData, warning2Days: parseInt(e.target.value) || 15 })
                  }
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none font-mono"
                />
                <span className="text-[10px] text-gray-400">Trigger high-priority reminders</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Timezone</label>
              <input
                type="text"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none font-mono"
              />
            </div>

            {/* Terminal Security Gate */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-800 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-[#c9a15b]" />
                    <span>Terminal Security Login & Gate</span>
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Restricts access so only operators with authorized login name and passcode can open and modify the fleet system
                  </p>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requireSecurityLogin}
                    onChange={(e) =>
                      setFormData({ ...formData, requireSecurityLogin: e.target.checked })
                    }
                    className="rounded text-[#c9a15b] focus:ring-[#c9a15b]"
                  />
                  <span className="font-semibold text-gray-700">Enforce Gate</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/60">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Security Login Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.securityLoginName}
                    onChange={(e) =>
                      setFormData({ ...formData, securityLoginName: e.target.value })
                    }
                    placeholder="e.g. admin"
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a15b] font-medium"
                  />
                  <span className="text-[10px] text-gray-500">Default: admin</span>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Security Code / PIN
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.securityCode}
                    onChange={(e) =>
                      setFormData({ ...formData, securityCode: e.target.value })
                    }
                    placeholder="e.g. 7054"
                    className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#c9a15b] font-mono tracking-wider font-bold"
                  />
                  <span className="text-[10px] text-gray-500">Default: 7054</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-gray-100">
              {savedSuccess ? (
                <div className="flex items-center gap-1.5 text-xs text-[#20b56f] font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Settings updated successfully!</span>
                </div>
              ) : (
                <div></div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-[#1f73e8] hover:bg-blue-600 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>
          </form>

          {/* Database & Demo Management Section */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center space-x-3 pb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#c9a15b] flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#122038]">Fleet Database & Demo Management</h4>
                <p className="text-xs text-[#718198]">
                  Initialize realistic Qatar limousine fleet demo records or reset database
                </p>
              </div>
            </div>

            {seedSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Demo fleet records initialized successfully! Vehicles, drivers, contracts, and ledger entries loaded.</span>
              </div>
            )}

            {clearSuccess && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs flex items-center gap-2 font-semibold">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>Database records cleared successfully.</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                type="button"
                id="btn-seed-demo-data"
                onClick={handleSeed}
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-[#c9a15b] to-amber-600 hover:opacity-90 text-white rounded-lg text-xs font-bold flex items-center space-x-2 shadow-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Populating...' : 'Initialize Demo Fleet Data'}</span>
              </button>

              <button
                type="button"
                id="btn-clear-all-data"
                onClick={() => setIsClearModalOpen(true)}
                disabled={loading}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset Database</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[#718198] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audit trail by action, user, entity..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#1f73e8] focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fbfe] text-[#718198] border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Action</th>
                    <th className="py-3 px-4 font-semibold">Entity</th>
                    <th className="py-3 px-4 font-semibold">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        No audit records matched.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-gray-600">
                          {new Date(log.date).toLocaleString('en-GB')}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#122038]">{log.user}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-800">{log.action}</span>
                        </td>
                        <td className="py-3 px-4 text-[#718198]">{log.entity}</td>
                        <td className="py-3 px-4 font-mono text-[#1f73e8]">{log.reference || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <DeleteModal
        isOpen={isClearModalOpen}
        title="Reset Fleet Database"
        message="Are you sure you want to clear all vehicles, drivers, contracts, and ledger entries from the database? This action cannot be undone."
        onConfirm={handleClear}
        onCancel={() => setIsClearModalOpen(false)}
        loading={loading}
      />
    </div>
  );
};
