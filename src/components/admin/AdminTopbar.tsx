"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Menu,
  Search,
  Bell,
  Plus,
  ExternalLink,
  Settings,
  LogOut,
  ShieldCheck,
  RefreshCw,
  FileText,
  TrendingUp,
  TrendingDown,
  Tag,
  PackagePlus,
  Layers,
  FolderTree,
  Award,
  MessageSquare,
  Boxes,
  ShoppingCart,
} from "lucide-react";
import { AdminTabId } from "@/types/admin";

interface NotificationItem {
  id: string;
  label: string;
  count: number;
  tab: AdminTabId;
  color: string;
}

interface AdminTopbarProps {
  onOpenMobileSidebar: () => void;
  activeTab: AdminTabId;
  onSelectTab: (tab: AdminTabId, intent?: string) => void;
  user: { email: string; role: string; name?: string };
  onLogout: () => void;
  onRefresh: () => void;
  syncing: boolean;
  notifications: NotificationItem[];
  quickSearchItems: { label: string; category: string; tab: AdminTabId }[];
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({
  onOpenMobileSidebar,
  onSelectTab,
  user,
  onLogout,
  onRefresh,
  syncing,
  notifications,
  quickSearchItems,
}) => {
  const [search, setSearch] = useState("");
  const [showNotif, setShowNotif] = useState(false);
  const [showQuick, setShowQuick] = useState(false);

  const totalAlerts = notifications.reduce((s, n) => s + n.count, 0);
  const filteredSearch =
    search.trim().length > 0
      ? quickSearchItems
          .filter(
            (i) =>
              i.label.toLowerCase().includes(search.toLowerCase()) ||
              i.category.toLowerCase().includes(search.toLowerCase())
          )
          .slice(0, 7)
      : [];

  return (
    <header className="sticky top-0 z-30 h-16 bg-gradient-to-r from-white/95 via-[#F4FAFF]/95 to-[#FFF7EF]/95 backdrop-blur border-b border-sky-100 px-4 sm:px-6 flex items-center justify-between gap-3 print:hidden">
      {/* Left: Mobile Trigger + Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
          aria-label="Open Navigation"
        >
          <Menu className="size-5" />
        </button>

        <div className="relative flex-1">
          <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Quick jump to any module, report, setting..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 outline-none focus:bg-white focus:border-[#0084C7]"
          />
          {filteredSearch.length > 0 && (
            <div className="absolute left-0 right-0 top-11 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50">
              {filteredSearch.map((item, idx) => (
                <button
                  key={`${item.tab}-${idx}`}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.tab);
                    setSearch("");
                  }}
                  className="w-full px-4 py-2 text-left text-xs hover:bg-[#E0F2FE]/60 flex items-center justify-between"
                >
                  <span className="font-semibold text-slate-800">{item.label}</span>
                  <span className="text-[10px] font-bold text-[#0084C7] uppercase">
                    {item.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Quick Actions + Notifications + Settings + Store + User */}
      <div className="flex items-center gap-2">
        {/* Quick Actions Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowQuick(!showQuick);
              setShowNotif(false);
            }}
            className="h-9 px-3 rounded-xl bg-gradient-to-r from-[#0084C7] to-[#006DA6] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:opacity-95 cursor-pointer"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">Quick Action</span>
          </button>

          {showQuick && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 z-50 max-h-[80vh] overflow-y-auto">
              {[
                { label: "Add Product", tab: "add-product" as AdminTabId, intent: "add_product", icon: PackagePlus },
                { label: "Add Category", tab: "categories" as AdminTabId, intent: "add_category", icon: Layers },
                { label: "Add Subcategory", tab: "categories" as AdminTabId, intent: "add_subcategory", icon: FolderTree },
                { label: "Add Brand", tab: "brands" as AdminTabId, intent: "add_brand", icon: Award },
                { label: "Create Coupon", tab: "coupons" as AdminTabId, icon: Tag },
                { label: "Create Popup", tab: "popups" as AdminTabId, icon: MessageSquare },
                { label: "Create Manual Invoice", tab: "invoices" as AdminTabId, intent: "create_invoice", icon: FileText },
                { label: "Add Expense", tab: "acc-expenses" as AdminTabId, icon: TrendingDown },
                { label: "Add Income", tab: "acc-income" as AdminTabId, icon: TrendingUp },
                { label: "Update Stock", tab: "inv-adjust" as AdminTabId, icon: Boxes },
                { label: "View Orders", tab: "orders" as AdminTabId, icon: ShoppingCart },
              ].map((act) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.label}
                    type="button"
                    onClick={() => {
                      onSelectTab(act.tab, act.intent);
                      setShowQuick(false);
                    }}
                    className="w-full px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-[#E0F2FE] hover:text-[#0084C7] flex items-center gap-2.5"
                  >
                    <Icon className="size-4" />
                    <span>{act.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={syncing}
          className="h-9 px-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 text-xs font-semibold"
          title="Refresh Data"
        >
          <RefreshCw className={`size-4 ${syncing ? "animate-spin text-[#0084C7]" : ""}`} />
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotif(!showNotif);
              setShowQuick(false);
            }}
            className="relative h-9 w-9 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            {totalAlerts > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF7A00] text-white text-[10px] font-black flex items-center justify-center">
                {totalAlerts}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50 space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Action Center Alerts</span>
                <span className="text-[11px] font-bold text-[#0084C7]">{totalAlerts} active</span>
              </div>
              {notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(n.tab);
                    setShowNotif(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-slate-700">{n.label}</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${n.color}`}>
                    {n.count}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/"
          target="_blank"
          className="hidden md:flex h-9 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 items-center gap-1.5 text-xs font-semibold"
        >
          <span>Live Store</span>
          <ExternalLink className="size-3.5" />
        </Link>

        <button
          type="button"
          onClick={() => onSelectTab("settings")}
          className="hidden sm:flex h-9 w-9 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 items-center justify-center"
          title="System Settings"
        >
          <Settings className="size-4" />
        </button>

        {/* Admin Profile Pill */}
        <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="size-8 rounded-xl bg-[#E0F2FE] text-[#0084C7] flex items-center justify-center font-black text-xs">
            {(user.name || user.email || "A")[0].toUpperCase()}
          </div>
          <div className="text-left leading-tight">
            <p className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
              {user.name || user.email}
            </p>
            <p className="text-[10px] font-bold text-[#0084C7] flex items-center gap-1">
              <ShieldCheck className="size-3" />
              <span>{user.role}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="h-9 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="size-4" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
