import React, { useState, useEffect } from 'react';
import { useDb } from '../context/DbContext';
import { X, Building2, Upload, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { processUploadedFile } from '../utils/fileUpload';

interface BrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_LOGOS = [
  {
    id: 'prince-gold',
    name: 'Prince Royal Crown (Gold)',
    url: '/prince-logo.svg',
    description: 'Luxury gold crown emblem with dark shield',
  },
  {
    id: 'modern-shield',
    name: 'Executive Fleet Crest',
    url: '/prince-logo.png',
    description: 'Classic limousine crest and royal insignia',
  },
];

export const BrandingModal: React.FC<BrandingModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useDb();

  const [companyName, setCompanyName] = useState(
    settings.companyName || 'Prince Limousine & Car Rental'
  );
  const [companySubtitle, setCompanySubtitle] = useState(
    settings.companySubtitle || 'Fleet & Mobility ERP'
  );
  const [companyLogoUrl, setCompanyLogoUrl] = useState(
    settings.companyLogoUrl || '/prince-logo.svg'
  );
  const [companyPhone, setCompanyPhone] = useState(settings.companyPhone || '70543888');
  const [address, setAddress] = useState(settings.address || 'Doha, State of Qatar');
  const [isUploading, setIsUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && settings) {
      setCompanyName(settings.companyName || 'Prince Limousine & Car Rental');
      setCompanySubtitle(settings.companySubtitle || 'Fleet & Mobility ERP');
      setCompanyLogoUrl(settings.companyLogoUrl || '/prince-logo.svg');
      setCompanyPhone(settings.companyPhone || '70543888');
      setAddress(settings.address || 'Doha, State of Qatar');
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const processed = await processUploadedFile(file);
      setCompanyLogoUrl(processed.fileUrl);
    } catch (err) {
      console.error('Error processing logo upload:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        companyName: companyName.trim() || 'Prince Limousine & Car Rental',
        companySubtitle: companySubtitle.trim() || 'Fleet & Mobility ERP',
        companyLogoUrl: companyLogoUrl || '/prince-logo.svg',
        companyPhone: companyPhone.trim(),
        address: address.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to update branding:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#c9a15b] flex items-center justify-center border border-[#c9a15b]/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#122038]">Company Identity & Logo</h3>
              <p className="text-[11px] text-[#718198]">
                Customize your company name, official logo, and brand header
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto py-4 space-y-4 text-xs pr-1">
          {/* Live Preview Banner */}
          <div className="p-3.5 bg-[#0c1b2d] rounded-xl border border-[#13283f] flex items-center space-x-3.5 text-white shadow-inner">
            <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-[#c9a15b]/50 bg-[#0a1726] shadow-sm">
              <img
                src={companyLogoUrl || '/prince-logo.svg'}
                alt="Logo preview"
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/prince-logo.svg';
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                {companyName || 'Prince Limousine & Car Rental'}
                <Sparkles className="w-3 h-3 text-[#c9a15b]" />
              </div>
              <div className="text-[10px] text-[#c9a15b] uppercase tracking-wider font-medium truncate">
                {companySubtitle || 'Fleet & Mobility ERP'}
              </div>
              <div className="text-[9px] text-gray-400 truncate mt-0.5">
                {address || 'Doha, State of Qatar'} • {companyPhone || '70543888'}
              </div>
            </div>
          </div>

          {/* Company Name */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Company Name *</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Prince Limousine & Car Rental"
              className="w-full p-2.5 border border-gray-200 rounded-lg font-bold text-gray-900 focus:ring-2 focus:ring-[#1f73e8] focus:outline-none"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Tagline / Subtitle (displayed under name)
            </label>
            <input
              type="text"
              value={companySubtitle}
              onChange={(e) => setCompanySubtitle(e.target.value)}
              placeholder="e.g. Luxury Fleet & Limousine Services"
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1f73e8] focus:outline-none"
            />
          </div>

          {/* Logo Options */}
          <div className="space-y-2">
            <label className="block font-semibold text-gray-700">Company Logo</label>

            {/* Presets */}
            <div className="grid grid-cols-2 gap-2">
              {PRESET_LOGOS.map((preset) => {
                const isSelected = companyLogoUrl === preset.url;
                return (
                  <button
                    type="button"
                    key={preset.id}
                    onClick={() => setCompanyLogoUrl(preset.url)}
                    className={`p-2.5 rounded-xl border flex items-center space-x-2.5 text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#c9a15b] bg-amber-50/50 ring-1 ring-[#c9a15b]'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#0c1b2d] p-1 flex items-center justify-center shrink-0">
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[11px] text-gray-800 truncate">{preset.name}</div>
                      <div className="text-[9px] text-gray-400">Preset Logo</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#c9a15b] shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Upload */}
            <div className="pt-1">
              <label className="flex items-center justify-center p-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#1f73e8] bg-gray-50/50 hover:bg-blue-50/20 cursor-pointer transition-colors text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <div className="flex items-center space-x-2 text-gray-600">
                  <Upload className="w-4 h-4 text-[#1f73e8]" />
                  <span className="font-semibold text-xs">
                    {isUploading ? 'Compressing & uploading...' : 'Upload Custom Logo from Computer (PNG, JPG, SVG)'}
                  </span>
                </div>
              </label>
              <p className="text-[10px] text-gray-400 mt-1">
                Images are automatically optimized and compressed to ensure high resolution & fast load times.
              </p>
            </div>
          </div>

          {/* Contact & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Company Phone</label>
              <input
                type="text"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                placeholder="e.g. 70543888 or +974 7054 3888"
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Address / City</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Doha, State of Qatar"
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 shrink-0">
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              {success && (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Company Branding updated successfully!</span>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || isUploading}
                className="px-5 py-2 bg-[#c9a15b] hover:bg-amber-600 text-white rounded-lg font-bold shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <span>{saving ? 'Saving...' : 'Save Company Details'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
