import React from 'react';
import {
  LayoutDashboard,
  Car,
  KeyRound,
  ArrowLeftRight,
  Gauge,
  History,
  Users,
  UserCheck,
  Building2,
  FileText,
  Clock,
  CreditCard,
  AlertCircle,
  Banknote,
  CalendarDays,
  TrendingUp,
  Receipt,
  PieChart,
  Wrench,
  Briefcase,
  FolderLock,
  Bell,
  BarChart3,
  ShieldCheck,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { useDb } from '../context/DbContext';

export type MenuItemId =
  | 'Dashboard'
  | 'Vehicles'
  | 'Assignments'
  | 'Handover / Return'
  | 'Mileage'
  | 'Vehicle History'
  | 'All Drivers'
  | 'Company Drivers'
  | 'Outside/NOC Drivers'
  | 'Contracts'
  | 'Rent Due'
  | 'Payments'
  | 'Outstanding'
  | 'Vehicle Financing'
  | 'Installments'
  | 'Income'
  | 'Expenses'
  | 'Profit & Loss'
  | 'Maintenance'
  | 'Employees'
  | 'Documents & Expiry'
  | 'Notifications'
  | 'Reports'
  | 'Audit Logs'
  | 'Settings';

interface SidebarProps {
  currentMenu?: MenuItemId;
  activeMenu?: MenuItemId;
  onSelectMenu: (id: MenuItemId) => void;
  notificationCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

interface MenuSection {
  title: string;
  items: {
    id: MenuItemId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMenu,
  activeMenu,
  onSelectMenu,
  notificationCount = 0,
  isOpen = false,
  onClose,
}) => {
  const { settings } = useDb();
  const selected = currentMenu || activeMenu || 'Dashboard';
  const sections: MenuSection[] = [
    {
      title: 'MAIN',
      items: [{ id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'FLEET',
      items: [
        { id: 'Vehicles', label: 'Vehicles', icon: Car },
        { id: 'Assignments', label: 'Assignments', icon: KeyRound },
        { id: 'Handover / Return', label: 'Handover / Return', icon: ArrowLeftRight },
        { id: 'Mileage', label: 'Mileage', icon: Gauge },
        { id: 'Vehicle History', label: 'Vehicle History', icon: History },
      ],
    },
    {
      title: 'DRIVERS',
      items: [
        { id: 'All Drivers', label: 'All Drivers', icon: Users },
        { id: 'Company Drivers', label: 'Company Drivers', icon: UserCheck },
        { id: 'Outside/NOC Drivers', label: 'Outside/NOC Drivers', icon: Building2 },
      ],
    },
    {
      title: 'RENTALS',
      items: [
        { id: 'Contracts', label: 'Contracts', icon: FileText },
        { id: 'Rent Due', label: 'Rent Due', icon: Clock },
        { id: 'Payments', label: 'Payments', icon: CreditCard },
        { id: 'Outstanding', label: 'Outstanding', icon: AlertCircle },
      ],
    },
    {
      title: 'FINANCING',
      items: [
        { id: 'Vehicle Financing', label: 'Vehicle Financing', icon: Banknote },
        { id: 'Installments', label: 'Installments', icon: CalendarDays },
      ],
    },
    {
      title: 'FINANCE',
      items: [
        { id: 'Income', label: 'Income', icon: TrendingUp },
        { id: 'Expenses', label: 'Expenses', icon: Receipt },
        { id: 'Profit & Loss', label: 'Profit & Loss', icon: PieChart },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'Maintenance', label: 'Maintenance', icon: Wrench },
        { id: 'Employees', label: 'Employees', icon: Briefcase },
        { id: 'Documents & Expiry', label: 'Documents & Expiry', icon: FolderLock },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          id: 'Notifications',
          label: 'Notifications',
          icon: Bell,
          badge: notificationCount > 0 ? notificationCount : undefined,
        },
        { id: 'Reports', label: 'Reports', icon: BarChart3 },
        { id: 'Audit Logs', label: 'Audit Logs', icon: ShieldCheck },
        { id: 'Settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        id="erp-sidebar"
        className={`fixed lg:static top-0 bottom-0 left-0 w-[248px] min-w-[248px] bg-[#0c1b2d] text-white flex flex-col h-screen select-none z-50 shadow-xl border-r border-[#13283f] transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-3.5 border-b border-[#13283f] flex items-center space-x-3 bg-[#0a1726]">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-[#c9a15b]/40 bg-[#0c1b2d] shadow-md shadow-[#c9a15b]/10">
            <img
              src={settings?.companyLogoUrl || '/prince-logo.png'}
              alt={settings?.companyName || 'Company Logo'}
              className="w-full h-full object-contain p-0.5"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold tracking-wide text-white truncate flex items-center gap-1.5" title={settings?.companyName || 'Prince Limousine & Car Rental'}>
              {settings?.companyName || 'Prince Limousine & Car Rental'}
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a15b] inline-block animate-pulse shrink-0"></span>
            </div>
            <div className="text-[9px] uppercase tracking-wider text-[#c9a15b] font-semibold truncate">
              {settings?.companySubtitle || 'Fleet & Mobility ERP'}
            </div>
          </div>
        </div>

        {/* Menu List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin scrollbar-thumb-[#13283f]">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-[#718198] uppercase">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = selected === item.id;
                return (
                <button
                  key={item.id}
                  id={`menu-item-${item.id.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
                  onClick={() => onSelectMenu(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group ${
                    isActive
                      ? 'bg-[#1f73e8] text-white font-semibold shadow-md shadow-[#1f73e8]/30'
                      : 'text-[#a1b3c9] hover:bg-[#13283f] hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive
                          ? 'text-white'
                          : 'text-[#718198] group-hover:text-[#c9a15b]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span className="bg-[#ef5553] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {item.badge}
                    </span>
                  ) : isActive ? (
                    <ChevronRight className="w-3.5 h-3.5 text-white opacity-80" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-[#0a1726] border-t border-[#13283f] text-center text-[10px] text-[#718198]">
        <div className="truncate font-semibold text-gray-400">{settings?.companyName || 'Prince Limousine'} • Fleet ERP</div>
        <div className="text-[9px] text-[#c9a15b]/80 mt-0.5">{settings?.address || 'Doha, State of Qatar'}</div>
      </div>
    </aside>
  </>
  );
};
