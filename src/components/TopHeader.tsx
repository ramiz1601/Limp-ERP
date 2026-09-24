import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Menu,
  Search,
  Bell,
  User,
  LogOut,
  ChevronDown,
  CheckCircle,
  Car,
  Users,
  FileText,
  CreditCard,
  Lock,
  AlertTriangle,
  Clock,
  ExternalLink,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDb } from '../context/DbContext';
import { MenuItemId } from './Sidebar';
import { WhatsAppButton } from './WhatsAppButton';
import { WhatsAppTemplates } from '../utils/whatsapp';

interface TopHeaderProps {
  onNavigate: (menu: MenuItemId) => void;
  notificationCount?: number;
  activeMenuTitle?: string;
  onOpenSidebar?: () => void;
  onLockTerminal?: () => void;
}

export interface ExpiryAlertItem {
  id: string;
  entityName: string;
  entityType: 'Driver' | 'Vehicle';
  mobile?: string;
  docType: string;
  docNumber?: string;
  expiryDate: string;
  daysRemaining: number;
  isExpired: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onNavigate,
  activeMenuTitle,
  onOpenSidebar,
  onLockTerminal,
}) => {
  const { currentUser, logout, signInWithGoogle } = useAuth();
  const { vehicles, drivers, contracts, payments, documents, settings } = useDb();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState<'all' | 'expired' | 'expiring'>('all');

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute Expiry Alerts across all drivers, vehicles, and documents
  const warningDays = settings?.documentExpiryWarningDays || 30;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiryAlerts: ExpiryAlertItem[] = useMemo(() => {
    const alerts: ExpiryAlertItem[] = [];
    const seenKeys = new Set<string>();

    const checkAndAdd = (
      entityName: string,
      entityType: 'Driver' | 'Vehicle',
      docType: string,
      expiryDate: string,
      docNumber?: string,
      mobile?: string
    ) => {
      if (!expiryDate) return;
      const expDate = new Date(expiryDate);
      if (isNaN(expDate.getTime())) return;
      expDate.setHours(0, 0, 0, 0);

      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Alert if already expired or within warning threshold
      if (diffDays <= warningDays) {
        const uniqueKey = `${entityType}-${entityName}-${docType}-${docNumber || ''}`;
        if (!seenKeys.has(uniqueKey)) {
          seenKeys.add(uniqueKey);
          alerts.push({
            id: uniqueKey,
            entityName,
            entityType,
            mobile,
            docType,
            docNumber,
            expiryDate,
            daysRemaining: diffDays,
            isExpired: diffDays < 0,
          });
        }
      }
    };

    // 1. Scan Drivers
    drivers.forEach((drv) => {
      if (drv.qidExpiry) {
        checkAndAdd(drv.name, 'Driver', 'QID', drv.qidExpiry, drv.qid, drv.mobile);
      }
      if (drv.drivingLicenseExpiry) {
        checkAndAdd(drv.name, 'Driver', 'Driving License', drv.drivingLicenseExpiry, drv.drivingLicense, drv.mobile);
      }
      if (drv.nocExpiry) {
        checkAndAdd(drv.name, 'Driver', 'NOC', drv.nocExpiry, drv.noc, drv.mobile);
      }
      if (drv.passportExpiry) {
        checkAndAdd(drv.name, 'Driver', 'Passport', drv.passportExpiry, drv.passport, drv.mobile);
      }
      // Check driver document attachments list
      if (drv.documentsList && Array.isArray(drv.documentsList)) {
        drv.documentsList.forEach((att) => {
          if (att.expiry) {
            checkAndAdd(drv.name, 'Driver', att.type || att.name, att.expiry, att.number, drv.mobile);
          }
        });
      }
    });

    // 2. Scan Vehicles
    vehicles.forEach((veh) => {
      const assignedDrv = veh.currentDriverId
        ? drivers.find((d) => d.id === veh.currentDriverId)
        : veh.currentDriverName
        ? drivers.find((d) => d.name === veh.currentDriverName)
        : null;

      const entityLabel = assignedDrv
        ? `Plate ${veh.plate} (${assignedDrv.name})`
        : `Vehicle ${veh.plate}`;

      if (veh.istimaraExpiry) {
        checkAndAdd(
          entityLabel,
          'Vehicle',
          'Istimara (Road Permit)',
          veh.istimaraExpiry,
          veh.plate,
          assignedDrv?.mobile
        );
      }
      if (veh.insuranceExpiry) {
        checkAndAdd(
          entityLabel,
          'Vehicle',
          'Vehicle Insurance',
          veh.insuranceExpiry,
          veh.insurancePolicyNumber || veh.plate,
          assignedDrv?.mobile
        );
      }
    });

    // 3. Scan Documents collection
    documents.forEach((docItem) => {
      if (docItem.expiry) {
        const drvMatch = docItem.entity === 'Driver' ? drivers.find((d) => d.id === docItem.entityId || d.name === docItem.entityId) : null;
        checkAndAdd(
          drvMatch?.name || docItem.entityId || 'Fleet Entity',
          docItem.entity === 'Driver' ? 'Driver' : 'Vehicle',
          docItem.type,
          docItem.expiry,
          docItem.number,
          drvMatch?.mobile
        );
      }
    });

    // Sort: Expired first, then closest to expire
    return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [drivers, vehicles, documents, warningDays, today]);

  const activeAlertCount = expiryAlerts.length;
  const expiredCount = expiryAlerts.filter((a) => a.isExpired).length;
  const expiringCount = expiryAlerts.filter((a) => !a.isExpired).length;

  const filteredAlerts = expiryAlerts.filter((a) => {
    if (notificationTab === 'expired') return a.isExpired;
    if (notificationTab === 'expiring') return !a.isExpired;
    return true;
  });

  // Filtered search results
  const q = searchQuery.trim().toLowerCase();
  const matchedVehicles = q
    ? vehicles.filter(
        (v) =>
          v.plate.toLowerCase().includes(q) ||
          v.make.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const matchedDrivers = q
    ? drivers.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.mobile.includes(q) ||
          d.qid.includes(q)
      ).slice(0, 3)
    : [];

  const matchedContracts = q
    ? contracts.filter(
        (c) =>
          c.contractNo.toLowerCase().includes(q) ||
          c.driverName.toLowerCase().includes(q) ||
          c.vehiclePlate.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const matchedPayments = q
    ? payments.filter(
        (p) =>
          (p.reference && p.reference.toLowerCase().includes(q)) ||
          p.driverName.toLowerCase().includes(q) ||
          p.vehiclePlate.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const totalMatches =
    matchedVehicles.length + matchedDrivers.length + matchedContracts.length + matchedPayments.length;

  return (
    <header
      id="top-header"
      className="h-16 bg-white border-b border-[#e2e8f0] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs gap-3"
    >
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {onOpenSidebar && (
          <button
            id="mobile-sidebar-toggle"
            onClick={onOpenSidebar}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Global Search */}
        <div ref={searchRef} className="relative w-full">
          <div className="relative">
            <Search className="w-4 h-4 text-[#718198] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="global-search-input"
              type="text"
              placeholder="Search vehicles, drivers, contracts, payments..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-full pl-10 pr-4 py-2 bg-[#f8fbfe] border border-[#e2e8f0] rounded-xl text-xs text-[#122038] placeholder-[#718198] focus:outline-none focus:ring-2 focus:ring-[#1f73e8] focus:bg-white transition-all"
            />
          </div>

          {/* Quick Search Dropdown */}
          {isSearchOpen && searchQuery.trim() && (
            <div
              id="global-search-dropdown"
              className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 max-h-96 overflow-y-auto"
            >
              {totalMatches === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  No matching records found for "{searchQuery}"
                </div>
              ) : (
                <div className="space-y-3">
                  {matchedVehicles.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-[#718198] px-2 py-1 uppercase tracking-wider flex items-center gap-1.5">
                        <Car className="w-3 h-3 text-[#1f73e8]" /> Vehicles
                      </div>
                      {matchedVehicles.map((v) => (
                        <div
                          key={v.id}
                          onClick={() => {
                            onNavigate('Vehicles');
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="p-2 hover:bg-[#f5f8fb] rounded-lg cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <span className="font-mono font-bold text-xs text-[#1f73e8] mr-2">
                              {v.plate}
                            </span>
                            <span className="text-xs text-[#122038]">
                              {v.make} {v.model} ({v.year})
                            </span>
                          </div>
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                            {v.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedDrivers.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-[#718198] px-2 py-1 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-[#20b56f]" /> Drivers
                      </div>
                      {matchedDrivers.map((d) => (
                        <div
                          key={d.id}
                          onClick={() => {
                            onNavigate('All Drivers');
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="p-2 hover:bg-[#f5f8fb] rounded-lg cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <span className="font-bold text-xs text-[#122038] mr-2">{d.name}</span>
                            <span className="text-[11px] text-[#718198]">QID: {d.qid}</span>
                          </div>
                          <span className="text-[11px] font-mono text-gray-500">{d.mobile}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedContracts.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-[#718198] px-2 py-1 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-[#7b5ce6]" /> Contracts
                      </div>
                      {matchedContracts.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            onNavigate('Contracts');
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="p-2 hover:bg-[#f5f8fb] rounded-lg cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <span className="font-mono font-bold text-xs text-[#7b5ce6] mr-2">
                              {c.contractNo}
                            </span>
                            <span className="text-xs text-[#122038]">{c.driverName}</span>
                          </div>
                          <span className="text-[10px] bg-emerald-50 text-[#20b56f] font-bold px-2 py-0.5 rounded-full">
                            QAR {c.monthlyAmount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchedPayments.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-[#718198] px-2 py-1 uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard className="w-3 h-3 text-[#20b56f]" /> Payments
                      </div>
                      {matchedPayments.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            onNavigate('Payments');
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="p-2 hover:bg-[#f5f8fb] rounded-lg cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <span className="font-mono font-bold text-xs text-gray-800 mr-2">
                              {p.reference || p.id.slice(0, 6).toUpperCase()}
                            </span>
                            <span className="text-xs text-[#718198]">{p.driverName}</span>
                          </div>
                          <span className="text-[10px] font-bold text-[#20b56f]">
                            QAR {p.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Header Controls */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Lock Terminal Button */}
        {onLockTerminal && (
          <button
            id="header-lock-terminal-btn"
            onClick={onLockTerminal}
            className="p-2 rounded-lg text-[#718198] hover:text-[#c9a15b] hover:bg-[#f5f8fb] transition-colors cursor-pointer"
            title="Lock Terminal (Security Gate)"
          >
            <Lock className="w-4 h-4" />
          </button>
        )}

        {/* Notifications & Expiry Alerts Dropdown */}
        <div ref={notificationsRef} className="relative">
          <button
            id="header-notification-btn"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 rounded-lg text-[#718198] hover:text-[#122038] hover:bg-[#f5f8fb] transition-colors cursor-pointer"
            title="Document Expiry & Compliance Alerts"
          >
            <Bell className="w-5 h-5" />
            {activeAlertCount > 0 && (
              <span
                id="header-notification-badge"
                className="absolute top-1 right-1 w-4 h-4 bg-[#ef5553] text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse"
              >
                {activeAlertCount}
              </span>
            )}
          </button>

          {/* Interactive Expiry Alert Notification Menu */}
          {isNotificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-red-50 text-[#ef5553] flex items-center justify-center font-bold">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-[#122038]">
                      Expiry Alerts & Reminders
                    </h3>
                    <p className="text-[10px] text-[#718198]">
                      {activeAlertCount} documents need attention (within {warningDays} days)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Alert Filter Tabs */}
              <div className="flex border-b border-gray-100 pt-2 pb-1 text-[11px] font-bold gap-2 shrink-0">
                <button
                  onClick={() => setNotificationTab('all')}
                  className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    notificationTab === 'all'
                      ? 'bg-gray-100 text-[#122038]'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  All ({activeAlertCount})
                </button>
                <button
                  onClick={() => setNotificationTab('expired')}
                  className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    notificationTab === 'expired'
                      ? 'bg-red-50 text-[#ef5553]'
                      : 'text-gray-500 hover:text-red-600'
                  }`}
                >
                  Expired ({expiredCount})
                </button>
                <button
                  onClick={() => setNotificationTab('expiring')}
                  className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    notificationTab === 'expiring'
                      ? 'bg-amber-50 text-[#f1a32a]'
                      : 'text-gray-500 hover:text-amber-600'
                  }`}
                >
                  Expiring Soon ({expiringCount})
                </button>
              </div>

              {/* List of Alerts */}
              <div className="flex-1 overflow-y-auto mt-2 space-y-2.5 pr-1">
                {filteredAlerts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">
                    <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                    No documents matching this filter. Fleet compliance is healthy!
                  </div>
                ) : (
                  filteredAlerts.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs flex flex-col justify-between transition-colors ${
                        item.isExpired
                          ? 'bg-red-50/40 border-red-200'
                          : 'bg-amber-50/40 border-amber-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-[#122038] flex items-center gap-1.5">
                            <span>{item.entityName}</span>
                            <span className="text-[10px] text-gray-500 font-normal">
                              ({item.entityType})
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-gray-700 mt-0.5">
                            {item.docType} {item.docNumber && `• No: ${item.docNumber}`}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                            Expiry: {item.expiryDate}
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            item.isExpired
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.isExpired
                            ? `Expired ${Math.abs(item.daysRemaining)}d ago`
                            : `Expires in ${item.daysRemaining}d`}
                        </span>
                      </div>

                      {/* WhatsApp 1-Click Contact Button */}
                      {item.mobile ? (
                        <div className="mt-2.5 pt-2 border-t border-gray-200/60 flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-mono">{item.mobile}</span>
                          <WhatsAppButton
                            phone={item.mobile}
                            driverName={item.entityName}
                            message={WhatsAppTemplates.documentExpiryWarning(
                              item.entityName,
                              item.docType,
                              item.docNumber || '',
                              item.expiryDate,
                              item.daysRemaining
                            )}
                            variant="badge"
                            label="WhatsApp Driver"
                            title={`Send expiry alert to ${item.entityName} on WhatsApp`}
                          />
                        </div>
                      ) : (
                        <div className="mt-2 text-[10px] text-gray-400 italic">
                          Vehicle permit alert
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-gray-100 mt-2 shrink-0">
                <button
                  onClick={() => {
                    setIsNotificationsOpen(false);
                    onNavigate('Documents & Expiry');
                  }}
                  className="w-full py-2 bg-[#1f73e8] hover:bg-blue-600 text-white rounded-lg text-xs font-bold text-center transition-colors cursor-pointer"
                >
                  View All Documents & Expiry
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-[1px] bg-[#e2e8f0]" />

        {/* User Profile Menu */}
        <div ref={userMenuRef} className="relative">
          <button
            id="user-profile-menu-button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-3 p-1.5 pr-2.5 rounded-lg hover:bg-[#f5f8fb] transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0c1b2d] to-[#1f73e8] flex items-center justify-center text-white text-xs font-bold shadow-xs">
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0)?.toUpperCase() || 'A'
              )}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-[#122038]">
                {currentUser?.displayName || 'Admin Operator'}
              </div>
              <div className="text-[10px] text-[#718198] font-medium">
                System Administrator
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#718198]" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50">
              <div className="p-2 border-b border-gray-100 flex items-center space-x-2">
                <img
                  src={settings?.companyLogoUrl || '/prince-logo.png'}
                  alt="Logo"
                  className="w-7 h-7 rounded object-contain border border-gray-200"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-[#122038] truncate">{settings?.companyName || 'Prince Limousine & Car Rental'}</div>
                  <div className="text-[10px] text-[#718198] truncate">{settings?.address || 'Doha, Qatar'} • ERP Terminal</div>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    onNavigate('Settings');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[#122038] hover:bg-[#f5f8fb] rounded-lg transition-colors cursor-pointer flex items-center space-x-2"
                >
                  <User className="w-3.5 h-3.5 text-[#718198]" />
                  <span>Company Settings</span>
                </button>
              </div>

              <div className="pt-1 border-t border-gray-100">
                <button
                  onClick={() => {
                    logout();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-[#ef5553] hover:bg-red-50 rounded-lg transition-colors cursor-pointer flex items-center space-x-2 font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
