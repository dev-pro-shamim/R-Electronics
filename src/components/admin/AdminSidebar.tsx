"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  FileText,
  Truck,
  MapPin,
  Package,
  PlusCircle,
  Layers,
  LayoutTemplate,
  Award,
  Star,
  HelpCircle,
  Boxes,
  ArrowUpDown,
  History,
  AlertTriangle,
  Tag,
  Sparkles,
  Image as ImageIcon,
  MessageSquare,
  Activity,
  BarChart2,
  Users,
  Mail,
  Bot,
  BookOpen,
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
  ArrowLeftRight,
  PieChart,
  FileCode2,
  Layout,
  Percent,
  Settings,
  UserCog,
  Shield,
  ClipboardList,
  Database,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { AdminRoleName, AdminTabId, RoleDefinition } from "@/types/admin";
import { hasRolePermission } from "@/lib/adminAuth";

interface NavItem {
  id: AdminTabId;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  key: string;
  label: string;
  items: NavItem[];
}

interface AdminSidebarProps {
  activeTab: AdminTabId;
  onSelectTab: (tab: AdminTabId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  userRole: AdminRoleName | string;
  roles: RoleDefinition[];
  badges?: Partial<Record<AdminTabId, number>>;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  userRole,
  roles,
  badges = {},
}) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    overview: true,
    sales: true,
    catalog: true,
    inventory: false,
    marketing: false,
    support: true,
    finance: true,
    website: false,
    system: false,
  });

  const groups: NavGroup[] = [
    {
      key: "overview",
      label: "OVERVIEW",
      items: [{ id: "overview", label: "Dashboard Overview", icon: LayoutDashboard }],
    },
    {
      key: "sales",
      label: "SALES & FULFILLMENT",
      items: [
        { id: "orders", label: "Orders", icon: ShoppingCart, badge: badges.orders },
        { id: "payments", label: "Payments", icon: CreditCard, badge: badges.payments },
        { id: "invoices", label: "Invoices", icon: FileText },
        { id: "courier", label: "Courier Management", icon: Truck },
        { id: "tracking", label: "Order Tracking", icon: MapPin },
      ],
    },
    {
      key: "catalog",
      label: "CATALOG",
      items: [
        { id: "products", label: "All Products", icon: Package },
        { id: "add-product", label: "Add New Product", icon: PlusCircle },
        { id: "categories", label: "Categories", icon: Layers },
        { id: "brands", label: "Brands", icon: Award },
        { id: "reviews", label: "Reviews", icon: Star },
        { id: "qna", label: "Q&A", icon: HelpCircle },
      ],
    },
    {
      key: "inventory",
      label: "INVENTORY",
      items: [
        { id: "inv-overview", label: "Stock Overview", icon: Boxes },
        { id: "inv-adjust", label: "Stock Adjustment", icon: ArrowUpDown },
        { id: "inv-history", label: "Stock History", icon: History },
        { id: "inv-alerts", label: "Low Stock Alerts", icon: AlertTriangle, badge: badges["inv-alerts"] },
      ],
    },
    {
      key: "marketing",
      label: "MARKETING & TRACKING",
      items: [
        { id: "coupons", label: "Coupons", icon: Tag },
        { id: "offers", label: "Offers & Campaigns", icon: Sparkles },
        { id: "banners", label: "Banners & Sliders", icon: ImageIcon },
        { id: "popups", label: "Popups", icon: MessageSquare },
        { id: "meta-pixel", label: "Meta Pixel & CAPI", icon: Activity },
        { id: "gtm", label: "Google Tag Manager", icon: BarChart2 },
      ],
    },
    {
      key: "support",
      label: "CUSTOMERS & SUPPORT",
      items: [
        { id: "customers", label: "Customers", icon: Users },
        { id: "inquiries", label: "Contact Inquiries", icon: Mail, badge: badges.inquiries },
        { id: "chatbot", label: "Chatbot Inbox", icon: Bot, badge: badges.chatbot },
        { id: "faqs", label: "FAQs & Knowledge", icon: BookOpen },
      ],
    },
    {
      key: "finance",
      label: "FINANCE & ACCOUNTS",
      items: [
        { id: "acc-overview", label: "Accounts Overview", icon: Wallet },
        { id: "acc-income", label: "Income Management", icon: TrendingUp },
        { id: "acc-expenses", label: "Expense Management", icon: TrendingDown },
        { id: "acc-debit-credit", label: "Debit & Credit", icon: Scale },
        { id: "acc-ledger", label: "Account Ledger", icon: BookOpen },
        { id: "acc-transfers", label: "Account Transfers", icon: ArrowLeftRight },
        { id: "acc-reports", label: "Financial Reports", icon: PieChart },
      ],
    },
    {
      key: "website",
      label: "WEBSITE MANAGEMENT",
      items: [
        { id: "landing-pages", label: "Landing Pages Builder", icon: LayoutTemplate },
        { id: "cms", label: "Pages (CMS)", icon: FileCode2 },
        { id: "homepage", label: "Homepage Sections", icon: Layout },
        { id: "emi", label: "EMI Settings", icon: Percent },
        { id: "delivery", label: "Delivery & Courier Fee", icon: Truck },
        { id: "pay-settings", label: "Payment Gateways", icon: CreditCard },
      ],
    },
    {
      key: "system",
      label: "SYSTEM & SECURITY",
      items: [
        { id: "settings", label: "Global Settings", icon: Settings },
        { id: "users", label: "Admin Users", icon: UserCog },
        { id: "roles", label: "Roles & Permissions", icon: Shield },
        { id: "logs", label: "Activity Logs", icon: ClipboardList },
        { id: "db-sync", label: "Database & SQL Sync", icon: Database },
      ],
    },
  ];

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderContent = (isMobileDrawer: boolean) => (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#071A2C] via-[#0B253E] to-[#082F49] text-slate-100 select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-gradient-to-r from-[#0084C7] via-[#006DA6] to-[#FF7A00]">
        <Link href="/admin" className="flex items-center gap-2.5 min-w-0">
          <div className="size-9 rounded-xl bg-gradient-to-br from-[#0084C7] to-[#FF7A00] flex items-center justify-center font-black text-white text-base shadow shrink-0">
            R
          </div>
          {(!collapsed || isMobileDrawer) && (
            <div className="min-w-0">
              <p className="text-sm font-black text-white truncate tracking-tight">
                RANGO ADMIN
              </p>
              <p className="text-[10px] text-[#38BDF8] font-semibold truncate">
                Enterprise Suite
              </p>
            </div>
          )}
        </Link>

        {isMobileDrawer ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X className="size-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="size-4" />
            ) : (
              <ChevronLeft className="size-4" />
            )}
          </button>
        )}
      </div>

      {/* Scrollable Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-2 custom-scrollbar">
        {groups.map((group) => {
          const visibleItems = group.items.filter((it) =>
            hasRolePermission(userRole, it.id, roles)
          );
          if (visibleItems.length === 0) return null;
          const isOpen = openGroups[group.key] !== false;

          return (
            <div key={group.key} className="space-y-0.5">
              {(!collapsed || isMobileDrawer) && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className="w-full px-2.5 py-1.5 flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-400 hover:text-white uppercase"
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={`size-3.5 transition-transform ${
                      isOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>
              )}

              {(isOpen || (collapsed && !isMobileDrawer)) &&
                visibleItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(item.id);
                        if (isMobileDrawer) onCloseMobile();
                      }}
                      title={collapsed && !isMobileDrawer ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer ${
                        active
                          ? "bg-gradient-to-r from-[#0084C7] via-[#0074B2] to-[#FF7A00] text-white shadow-md shadow-[#0084C7]/25"
                          : "text-slate-200 hover:bg-white/10 hover:text-white"
                      } ${collapsed && !isMobileDrawer ? "justify-center px-2" : ""}`}
                    >
                      <Icon
                        className={`size-4 shrink-0 ${
                          active ? "text-white" : "text-[#38BDF8]"
                        }`}
                      />
                      {(!collapsed || isMobileDrawer) && (
                        <>
                          <span className="flex-1 text-left truncate">{item.label}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                                active
                                  ? "bg-white text-[#0084C7]"
                                  : "bg-[#FF7A00] text-white"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      {(!collapsed || isMobileDrawer) && (
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 bg-slate-900/60">
          <p className="font-bold text-slate-200 truncate">Rango Electronics</p>
          <p className="truncate text-[10px]">rangoelectronics.com · v2.0</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 border-r border-slate-800 transition-all duration-200 print:hidden ${
          collapsed ? "w-[74px]" : "w-[272px]"
        }`}
      >
        <div className="sticky top-0 h-screen">{renderContent(false)}</div>
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl">
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
