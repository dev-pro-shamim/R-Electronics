"use client";

import React, { useMemo, useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Scale,
  ArrowLeftRight,
  Printer,
  Download,
  FileSpreadsheet,
  Plus,
} from "lucide-react";
import { AdminDatabase, AdminTabId, FinancialAccount } from "@/types/admin";
import { computeFinancialMetrics } from "@/lib/accountingEngine";

interface AdminAccountsModuleProps {
  activeTab: AdminTabId;
  db: AdminDatabase;
  onAction: (action: string, payload: Record<string, unknown>, msg?: string) => Promise<boolean>;
}

const DEFAULT_EXPENSE_CATS = [
  "Product Purchase",
  "Staff Salary",
  "Office Rent",
  "Marketing & Ads",
  "Courier Charges",
  "Office Expenses",
  "Utility Bills",
  "Maintenance",
  "Miscellaneous",
];

const INCOME_CATS = ["Product Sales", "Offline Sales", "Service Income", "Other Income"];

export const AdminAccountsModule: React.FC<AdminAccountsModuleProps> = ({
  activeTab,
  db,
  onAction,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const [period, setPeriod] = useState<"all" | "daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerAccountFilter, setLedgerAccountFilter] = useState("all");
  const [reportType, setReportType] = useState<
    "pnl" | "income" | "expense" | "cashflow" | "account_ledger"
  >("pnl");

  // Shared entry form
  const [entryForm, setEntryForm] = useState({
    title: "",
    amount: "",
    category: activeTab === "acc-expenses" ? "Marketing & Ads" : "Offline Sales",
    date: today,
    accountId: db.accounts?.[0]?.id || "acc-cash",
    referenceNo: "",
    description: "",
    attachmentUrl: "",
    type: "credit" as "debit" | "credit",
    counterparty: "",
  });

  // Transfer form
  const [transferForm, setTransferForm] = useState({
    fromAccountId: "acc-cash",
    toAccountId: "acc-bank",
    amount: "",
    date: today,
    referenceNo: "",
    description: "Deposit cash into business bank account",
  });

  // New Account + AP/AR + Custom expense category
  const [newAcc, setNewAcc] = useState({
    name: "",
    accountType: "Bank" as FinancialAccount["accountType"],
    accountNumber: "",
    openingBalance: 0,
  });
  const [customExpCat, setCustomExpCat] = useState("");
  const [apDraft, setApDraft] = useState(db.accountsPayable || 0);
  const [arDraft, setArDraft] = useState(db.accountsReceivable || 0);

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    if (period === "daily") return { startDate: today, endDate: today };
    if (period === "weekly") {
      const w = new Date(now);
      w.setDate(now.getDate() - 6);
      return { startDate: w.toISOString().slice(0, 10), endDate: today };
    }
    if (period === "monthly") return { startDate: `${today.slice(0, 7)}-01`, endDate: today };
    if (period === "yearly") return { startDate: `${today.slice(0, 4)}-01-01`, endDate: today };
    return { startDate: undefined, endDate: undefined };
  }, [period, today]);

  const metrics = useMemo(
    () => computeFinancialMetrics(db.accounts || [], db.financialTransactions || [], startDate, endDate),
    [db.accounts, db.financialTransactions, startDate, endDate]
  );

  const expenseCategories = [
    ...DEFAULT_EXPENSE_CATS,
    ...(db.customExpenseCategories || []),
  ];

  const filteredTxs = useMemo(() => {
    const q = ledgerSearch.toLowerCase();
    return (db.financialTransactions || []).filter((tx) => {
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;
      if (ledgerAccountFilter !== "all" && tx.accountId !== ledgerAccountFilter) return false;
      if (activeTab === "acc-income" && tx.entryKind !== "income") return false;
      if (activeTab === "acc-expenses" && tx.entryKind !== "expense") return false;
      if (
        q &&
        !tx.description.toLowerCase().includes(q) &&
        !tx.category.toLowerCase().includes(q) &&
        !(tx.referenceNo || "").toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [db.financialTransactions, startDate, endDate, ledgerAccountFilter, activeTab, ledgerSearch]);

  const exportCsv = () => {
    const header = "ID,Date,Kind,Type,Account,Category,Amount,Reference,Description,Actor";
    const rows = filteredTxs.map((t) =>
      [
        t.id,
        t.date,
        t.entryKind,
        t.type,
        db.accounts.find((a) => a.id === t.accountId)?.name || t.accountId,
        `"${t.category}"`,
        t.amount,
        `"${t.referenceNo || ""}"`,
        `"${(t.description || "").replace(/"/g, '""')}"`,
        t.actor,
      ].join(",")
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rango-financial-${reportType}-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcelXml = () => {
    const tableHtml = `
      <table border="1">
        <tr><th>Date</th><th>Kind</th><th>Type</th><th>Account</th><th>Category</th><th>Amount (BDT)</th><th>Description</th></tr>
        ${filteredTxs
          .map(
            (t) =>
              `<tr><td>${t.date}</td><td>${t.entryKind}</td><td>${t.type}</td><td>${
                db.accounts.find((a) => a.id === t.accountId)?.name || t.accountId
              }</td><td>${t.category}</td><td>${t.amount}</td><td>${t.description}</td></tr>`
          )
          .join("")}
      </table>`;
    const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rango-accounts-report-${today}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Period Selector & Overview Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Wallet className="size-5 text-[#0084C7]" />
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Double-Entry Accounts &amp; Financial Ledger
            </h2>
            <p className="text-xs text-slate-500">
              Verified orders post automatically without duplication. Transfers create balanced Debit/Credit pairs.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "daily", label: "Daily" },
            { id: "weekly", label: "Weekly" },
            { id: "monthly", label: "Monthly" },
            { id: "yearly", label: "Yearly" },
            { id: "all", label: "All Time" },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                period === p.id ? "bg-[#0084C7] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 11 Accounts Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Income", val: `৳${metrics.totalIncome.toLocaleString()}`, color: "text-emerald-700" },
          { label: "Total Expenses", val: `৳${metrics.totalExpenses.toLocaleString()}`, color: "text-rose-600" },
          { label: "Total Credit (+)", val: `৳${metrics.totalCredit.toLocaleString()}`, color: "text-sky-700" },
          { label: "Total Debit (-)", val: `৳${metrics.totalDebit.toLocaleString()}`, color: "text-amber-700" },
          { label: "Net Profit", val: `৳${metrics.netProfit.toLocaleString()}`, color: metrics.netProfit >= 0 ? "text-emerald-700" : "text-rose-700" },
          { label: "Cash Balance", val: `৳${metrics.cashBalance.toLocaleString()}`, color: "text-slate-900" },
          { label: "Bank Balance", val: `৳${metrics.bankBalance.toLocaleString()}`, color: "text-slate-900" },
          { label: "bKash Balance", val: `৳${metrics.bkashBalance.toLocaleString()}`, color: "text-pink-700" },
          { label: "Nagad Balance", val: `৳${metrics.nagadBalance.toLocaleString()}`, color: "text-orange-600" },
          { label: "Accounts Receivable", val: `৳${(db.accountsReceivable || 0).toLocaleString()}`, color: "text-[#0084C7]" },
          { label: "Accounts Payable", val: `৳${(db.accountsPayable || 0).toLocaleString()}`, color: "text-rose-600" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <p className="text-[11px] font-bold text-slate-500 uppercase">{card.label}</p>
            <p className={`text-lg font-black mt-1 ${card.color}`}>{card.val}</p>
          </div>
        ))}
      </div>

      {/* Sub-module Workspaces */}
      {activeTab === "acc-transfers" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <ArrowLeftRight className="size-4 text-[#0084C7]" />
            <span>Balanced Inter-Account Transfer (Cash ↔ Bank ↔ bKash ↔ Nagad)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
            <select
              value={transferForm.fromAccountId}
              onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
              className="h-10 px-3 rounded-xl border border-slate-300 bg-white"
            >
              {(db.accounts || []).map((a) => (
                <option key={a.id} value={a.id}>
                  From: {a.name} (৳{a.currentBalance.toLocaleString()})
                </option>
              ))}
            </select>
            <select
              value={transferForm.toAccountId}
              onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
              className="h-10 px-3 rounded-xl border border-slate-300 bg-white"
            >
              {(db.accounts || []).map((a) => (
                <option key={a.id} value={a.id}>
                  To: {a.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Amount (৳)"
              value={transferForm.amount}
              onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
              className="h-10 px-3 rounded-xl border border-slate-300"
            />
            <input
              type="date"
              value={transferForm.date}
              onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })}
              className="h-10 px-3 rounded-xl border border-slate-300"
            />
            <input
              type="text"
              placeholder="Description / Ref#"
              value={transferForm.description}
              onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
              className="h-10 px-3 rounded-xl border border-slate-300"
            />
            <button
              type="button"
              onClick={async () => {
                if (!Number(transferForm.amount)) return;
                await onAction(
                  "record_transfer",
                  { ...transferForm, amount: Number(transferForm.amount) },
                  "Completed inter-account transfer"
                );
                setTransferForm({ ...transferForm, amount: "" });
              }}
              className="h-10 rounded-xl bg-[#0084C7] text-white font-extrabold cursor-pointer"
            >
              Execute Transfer
            </button>
          </div>
        </div>
      )}

      {(activeTab === "acc-income" ||
        activeTab === "acc-expenses" ||
        activeTab === "acc-debit-credit") && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              {activeTab === "acc-income" ? (
                <TrendingUp className="size-4 text-emerald-600" />
              ) : activeTab === "acc-expenses" ? (
                <TrendingDown className="size-4 text-rose-600" />
              ) : (
                <Scale className="size-4 text-[#0084C7]" />
              )}
              <span>
                {activeTab === "acc-income"
                  ? "Record Business Income"
                  : activeTab === "acc-expenses"
                  ? "Record Business Expense"
                  : "Record Direct Debit / Credit Entry"}
              </span>
            </h3>

            {activeTab === "acc-expenses" && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New Expense Category..."
                  value={customExpCat}
                  onChange={(e) => setCustomExpCat(e.target.value)}
                  className="h-8 px-3 rounded-lg border border-slate-300 text-xs"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!customExpCat.trim()) return;
                    await onAction("add_expense_category", { category: customExpCat });
                    setCustomExpCat("");
                  }}
                  className="px-3 rounded-lg bg-slate-800 text-white text-xs font-bold"
                >
                  + Category
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <input
              type="text"
              placeholder="Title / Counterparty *"
              value={entryForm.title}
              onChange={(e) => setEntryForm({ ...entryForm, title: e.target.value })}
              className="h-10 px-3 rounded-xl border border-slate-300"
            />
            <input
              type="number"
              placeholder="Amount (৳) *"
              value={entryForm.amount}
              onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })}
              className="h-10 px-3 rounded-xl border border-slate-300"
            />
            <select
              value={entryForm.category}
              onChange={(e) => setEntryForm({ ...entryForm, category: e.target.value })}
              className="h-10 px-3 rounded-xl border border-slate-300 bg-white"
            >
              {(activeTab === "acc-income"
                ? INCOME_CATS
                : activeTab === "acc-expenses"
                ? expenseCategories
                : [...INCOME_CATS, ...expenseCategories]
              ).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={entryForm.accountId}
              onChange={(e) => setEntryForm({ ...entryForm, accountId: e.target.value })}
              className="h-10 px-3 rounded-xl border border-slate-300 bg-white"
            >
              {(db.accounts || []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={entryForm.date}
              onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })}
              className="h-10 px-3 rounded-xl border border-slate-300"
            />
            <input
              type="text"
              placeholder="Reference / Voucher #"
              value={entryForm.referenceNo}
              onChange={(e) => setEntryForm({ ...entryForm, referenceNo: e.target.value })}
              className="h-10 px-3 rounded-xl border border-slate-300"
            />
            {activeTab === "acc-debit-credit" && (
              <select
                value={entryForm.type}
                onChange={(e) => setEntryForm({ ...entryForm, type: e.target.value as any })}
                className="h-10 px-3 rounded-xl border border-slate-300 bg-white"
              >
                <option value="credit">CREDIT (+) Inflow</option>
                <option value="debit">DEBIT (-) Outflow</option>
              </select>
            )}
            <input
              type="text"
              placeholder="Attachment Receipt URL (optional)"
              value={entryForm.attachmentUrl}
              onChange={(e) => setEntryForm({ ...entryForm, attachmentUrl: e.target.value })}
              className="h-10 px-3 rounded-xl border border-slate-300"
            />
            <input
              type="text"
              placeholder="Description / Notes"
              value={entryForm.description}
              onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })}
              className="sm:col-span-2 h-10 px-3 rounded-xl border border-slate-300"
            />
            <button
              type="button"
              onClick={async () => {
                if (!Number(entryForm.amount)) return;
                const entryKind =
                  activeTab === "acc-income"
                    ? "income"
                    : activeTab === "acc-expenses"
                    ? "expense"
                    : "adjustment";
                const type =
                  activeTab === "acc-income"
                    ? "credit"
                    : activeTab === "acc-expenses"
                    ? "debit"
                    : entryForm.type;
                await onAction(
                  "record_financial_entry",
                  {
                    entry: {
                      date: entryForm.date,
                      type,
                      entryKind,
                      accountId: entryForm.accountId,
                      category: entryForm.category,
                      amount: Number(entryForm.amount),
                      referenceNo: entryForm.referenceNo,
                      counterparty: entryForm.title,
                      description: entryForm.description || entryForm.title || entryForm.category,
                      attachmentUrl: entryForm.attachmentUrl || undefined,
                    },
                  },
                  "Recorded ledger transaction"
                );
                setEntryForm({ ...entryForm, title: "", amount: "", referenceNo: "", description: "" });
              }}
              className="h-10 rounded-xl bg-gradient-to-r from-[#0084C7] to-[#006DA6] text-white font-extrabold cursor-pointer"
            >
              + Post Transaction
            </button>
          </div>
        </div>
      )}

      {/* Overview: Add Account & Payable/Receivable */}
      {activeTab === "acc-overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">
              Configured Financial Accounts ({(db.accounts || []).length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(db.accounts || []).map((a) => (
                <div key={a.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">{a.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {a.accountType} {a.accountNumber ? `· ${a.accountNumber}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-black text-[#0084C7]">
                    ৳{a.currentBalance.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 text-xs">
              <input
                type="text"
                placeholder="New Account Name"
                value={newAcc.name}
                onChange={(e) => setNewAcc({ ...newAcc, name: e.target.value })}
                className="h-9 px-3 rounded-xl border border-slate-300"
              />
              <select
                value={newAcc.accountType}
                onChange={(e) => setNewAcc({ ...newAcc, accountType: e.target.value as any })}
                className="h-9 px-3 rounded-xl border border-slate-300 bg-white"
              >
                {["Cash", "Bank", "bKash", "Nagad", "Other"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Opening Balance"
                value={newAcc.openingBalance}
                onChange={(e) => setNewAcc({ ...newAcc, openingBalance: Number(e.target.value) })}
                className="h-9 px-3 rounded-xl border border-slate-300"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!newAcc.name.trim()) return;
                  await onAction("upsert_account", {
                    account: {
                      id: `acc-${Date.now()}`,
                      name: newAcc.name.trim(),
                      accountType: newAcc.accountType,
                      accountNumber: newAcc.accountNumber,
                      openingBalance: newAcc.openingBalance,
                      currentBalance: newAcc.openingBalance,
                      active: true,
                    },
                  });
                  setNewAcc({ name: "", accountType: "Bank", accountNumber: "", openingBalance: 0 });
                }}
                className="h-9 rounded-xl bg-slate-900 text-white font-bold inline-flex items-center justify-center gap-1"
              >
                <Plus className="size-3.5" />
                <span>Add Account</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
            <h3 className="text-sm font-extrabold text-slate-900">Payables &amp; Receivables</h3>
            <div>
              <label className="font-bold text-slate-600 block mb-1">Accounts Receivable (৳)</label>
              <input
                type="number"
                value={arDraft}
                onChange={(e) => setArDraft(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="font-bold text-slate-600 block mb-1">Accounts Payable (৳)</label>
              <input
                type="number"
                value={apDraft}
                onChange={(e) => setApDraft(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-xl border border-slate-300"
              />
            </div>
            <button
              type="button"
              onClick={() =>
                onAction("update_ap_ar", {
                  accountsPayable: apDraft,
                  accountsReceivable: arDraft,
                })
              }
              className="w-full py-2.5 rounded-xl bg-[#0084C7] text-white font-bold cursor-pointer"
            >
              Update AP / AR Balances
            </button>
          </div>
        </div>
      )}

      {/* Financial Reports Suite */}
      {activeTab === "acc-reports" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "pnl", label: "Profit & Loss Statement" },
                { id: "income", label: "Income Statement" },
                { id: "expense", label: "Expense Breakdown" },
                { id: "cashflow", label: "Cash Flow Summary" },
                { id: "account_ledger", label: "Account Ledger" },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setReportType(r.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                    reportType === r.id
                      ? "bg-[#0084C7] text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 print:hidden">
              <button
                type="button"
                onClick={exportCsv}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold inline-flex items-center gap-1"
              >
                <Download className="size-3.5" />
                <span>CSV</span>
              </button>
              <button
                type="button"
                onClick={exportExcelXml}
                className="px-3 py-1.5 rounded-xl border border-emerald-600 text-emerald-700 text-xs font-bold inline-flex items-center gap-1"
              >
                <FileSpreadsheet className="size-3.5" />
                <span>Excel</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold inline-flex items-center gap-1"
              >
                <Printer className="size-3.5" />
                <span>Print / PDF</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs border-t border-slate-200 pt-4">
            <div className="p-4 rounded-2xl bg-slate-50 space-y-2">
              <p className="font-black text-slate-900 text-sm">
                Rango Electronics — Financial Statement ({period.toUpperCase()})
              </p>
              <div className="flex justify-between"><span>Sales Revenue</span><strong>৳{metrics.salesRevenue.toLocaleString()}</strong></div>
              <div className="flex justify-between"><span>Other Income</span><strong>৳{metrics.otherIncome.toLocaleString()}</strong></div>
              <div className="flex justify-between text-rose-600"><span>Less: Refunds</span><strong>-৳{metrics.refundsTotal.toLocaleString()}</strong></div>
              <div className="flex justify-between border-t pt-1 font-bold"><span>Net Income</span><span>৳{metrics.totalIncome.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Cost of Goods Sold (COGS)</span><strong>৳{metrics.cogsTotal.toLocaleString()}</strong></div>
              <div className="flex justify-between font-bold text-[#0084C7]"><span>Gross Profit</span><span>৳{metrics.grossProfit.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Operating Expenses</span><strong>৳{metrics.operatingExpenses.toLocaleString()}</strong></div>
              <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-black text-emerald-700">
                <span>Net Profit</span>
                <span>৳{metrics.netProfit.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 space-y-2">
              <p className="font-black text-slate-900 text-sm">Cash &amp; Liquid Position by Channel</p>
              {(db.accounts || []).map((a) => (
                <div key={a.id} className="flex justify-between py-1 border-b border-slate-200/70">
                  <span>{a.name} ({a.accountType})</span>
                  <strong>৳{a.currentBalance.toLocaleString()}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Searchable Master Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-extrabold text-slate-900">
            Transaction Ledger ({filteredTxs.length} entries)
          </h3>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Search ref, category, note..."
              value={ledgerSearch}
              onChange={(e) => setLedgerSearch(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-300 text-xs"
            />
            <select
              value={ledgerAccountFilter}
              onChange={(e) => setLedgerAccountFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-300 text-xs bg-white"
            >
              <option value="all">All Accounts</option>
              {(db.accounts || []).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={exportCsv}
              className="h-9 px-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center gap-1"
            >
              <Download className="size-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px]">
                <th className="p-3">Date</th>
                <th className="p-3">Kind</th>
                <th className="p-3">Category &amp; Account</th>
                <th className="p-3">Description / Ref</th>
                <th className="p-3 text-right">Debit (-)</th>
                <th className="p-3 text-right">Credit (+)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTxs.map((tx) => {
                const accName = db.accounts.find((a) => a.id === tx.accountId)?.name || tx.accountId;
                return (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="p-3 whitespace-nowrap text-slate-500">{tx.date}</td>
                    <td className="p-3 uppercase font-bold text-[10px] text-[#0084C7]">{tx.entryKind}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{tx.category}</div>
                      <div className="text-[11px] text-slate-500">{accName}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-700">{tx.description}</div>
                      {tx.referenceNo && (
                        <div className="text-[11px] font-mono text-slate-400">Ref: {tx.referenceNo}</div>
                      )}
                    </td>
                    <td className="p-3 text-right font-extrabold text-rose-600">
                      {tx.type === "debit" ? `৳${tx.amount.toLocaleString()}` : "-"}
                    </td>
                    <td className="p-3 text-right font-extrabold text-emerald-700">
                      {tx.type === "credit" ? `৳${tx.amount.toLocaleString()}` : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
