"use client";

import React, { useState } from "react";
import { X, Calculator, Check, PhoneCall, Building2 } from "lucide-react";
import { Product } from "@/data/products";
import { EMI_BANKS, EMI_RATES, EMI_MIN_AMOUNT, SSL_OPERATION_HOTLINE } from "@/data/emiData";
import { useStoreRuntime } from "@/lib/useStoreRuntime";

interface EmiModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export const EmiModal: React.FC<EmiModalProps> = ({ product, isOpen, onClose }) => {
  const runtime = useStoreRuntime();
  const [selectedBankId, setSelectedBankId] = useState("scb");
  const [selectedMonths, setSelectedMonths] = useState(12);
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const banksList = runtime?.emiBanks?.length ? runtime.emiBanks : EMI_BANKS;
  const ratesList = runtime?.emiRates?.length ? runtime.emiRates : EMI_RATES;

  const selectedBank = banksList.find(b => b.id === selectedBankId) || banksList[0];
  const availableTenures = selectedBank.tenures;

  // If currently selected tenure is not supported by the newly selected bank, reset to first available
  const activeMonths = availableTenures.includes(selectedMonths) ? selectedMonths : availableTenures[availableTenures.length - 1];

  const rateConfig = ratesList.find(r => r.months === activeMonths);
  const applicableRate = selectedBank.id === "scb" ? (rateConfig?.scbRate || 0) : (rateConfig?.generalRate || 0);

  // 0% Monthly instalment
  const monthlyZeroEmi = Math.round(product.price / activeMonths);

  // Filter banks by search
  const filteredBanks = banksList.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 animate-fadeIn max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-primary text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Calculator className="size-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">
                0% EMI Calculator &amp; Bank Plans
              </h3>
              <p className="text-xs text-rose-100 truncate max-w-[280px] sm:max-w-md">
                {product.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Price Overview Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-emerald-50/70 border border-emerald-100 rounded-xl">
            <div>
              <span className="text-xs text-gray-500 font-medium">Product Price:</span>
              <p className="text-2xl font-black text-primary">৳{product.price.toLocaleString()}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Eligibility: Min order ৳{EMI_MIN_AMOUNT.toLocaleString()}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-gray-500 font-medium">0% EMI Monthly Instalment:</span>
              <p className="text-2xl font-black text-gray-900">
                ৳{monthlyZeroEmi.toLocaleString()}
                <span className="text-xs font-normal text-gray-500"> / month</span>
              </p>
              <div className="flex items-center gap-1.5 sm:justify-end mt-0.5">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  0% Zero Interest Facility
                </span>
                {applicableRate > 0 && (
                  <span className="text-[10px] text-gray-500">
                    (Standard Charge: {applicableRate}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 1. Select Bank */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="size-3.5 text-primary" />
                Step 1: Choose Your Credit Card Bank
              </label>
              <span className="text-[11px] text-gray-500">{EMI_BANKS.length} Partner Banks</span>
            </div>
            <select
              value={selectedBankId}
              onChange={(e) => {
                setSelectedBankId(e.target.value);
                const bank = EMI_BANKS.find(b => b.id === e.target.value);
                if (bank && !bank.tenures.includes(selectedMonths)) {
                  setSelectedMonths(bank.tenures[0]);
                }
              }}
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {EMI_BANKS.map((b, idx) => (
                <option key={b.id} value={b.id}>
                  {idx + 1}. {b.name} (Max {b.tenures[b.tenures.length - 1]} Months)
                </option>
              ))}
            </select>
          </div>

          {/* 2. Select Supported Tenure for Chosen Bank */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Step 2: Select Tenure for {selectedBank.shortName}
              </label>
              <span className="text-[11px] font-semibold text-primary">
                Supported: {availableTenures.join(", ")} Months
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {availableTenures.map((m) => {
                const isSelected = activeMonths === m;
                const mRate = selectedBank.id === "scb"
                  ? EMI_RATES.find(r => r.months === m)?.scbRate
                  : EMI_RATES.find(r => r.months === m)?.generalRate;
                const inst = Math.round(product.price / m);

                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMonths(m)}
                    className={`py-2 px-1.5 rounded-lg border text-center transition-all ${
                      isSelected
                        ? "bg-primary border-primary text-white shadow-md font-bold scale-[1.02]"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-400 font-medium"
                    }`}
                  >
                    <p className="text-xs font-bold">{m} Mo</p>
                    <p className="text-[10px] mt-0.5 opacity-90">৳{inst.toLocaleString()}/m</p>
                    {mRate ? (
                      <p className={`text-[9px] mt-0.5 ${isSelected ? "text-yellow-200" : "text-gray-400"}`}>
                        {mRate}%
                      </p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Partner Banks Directory (30 Commercial Banks) */}
          <div className="space-y-2 pt-3 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                All 30 Partner Commercial Banks (SSLCOMMERZ Network)
              </h4>
              <input
                type="text"
                placeholder="Search bank name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs px-2.5 py-1 border border-gray-200 rounded-md outline-none focus:border-primary w-full sm:w-48"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-1 bg-gray-50/60 rounded-xl border border-gray-100">
              {filteredBanks.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setSelectedBankId(b.id);
                    if (!b.tenures.includes(selectedMonths)) {
                      setSelectedMonths(b.tenures[0]);
                    }
                  }}
                  className={`p-2 rounded-lg border text-left flex items-start gap-1.5 transition-colors ${
                    selectedBankId === b.id
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                      : "border-gray-200 bg-white hover:border-gray-300 text-gray-800"
                  }`}
                >
                  <Check className={`size-3.5 shrink-0 mt-0.5 ${selectedBankId === b.id ? "text-primary" : "text-emerald-600"}`} />
                  <div className="min-w-0">
                    <p className="text-xs truncate">{b.name}</p>
                    <p className="text-[10px] text-gray-500 font-normal">
                      Tenures: {b.tenures.join(", ")}M
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* SSLCommerz Operation Helpline & Terms */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-1.5 border-b border-gray-200">
              <span className="font-bold text-gray-800">Card Charges + EMI Charges are Included</span>
              <span className="flex items-center gap-1 text-primary font-bold">
                <PhoneCall className="size-3" /> SSL Operation: {SSL_OPERATION_HOTLINE} (9am-11pm, 365 Days)
              </span>
            </div>
            <p className="text-[11px] leading-relaxed">
              • 0% EMI is applicable for credit cardholders of the listed 30 commercial banks.
            </p>
            <p className="text-[11px] leading-relaxed">
              • Minimum purchase amount for EMI is ৳{EMI_MIN_AMOUNT.toLocaleString()}.
            </p>
            <p className="text-[11px] leading-relaxed">
              • City Bank and BRAC Bank are currently excluded from our automated checkout EMI channel.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Selected: <strong className="text-gray-800">{selectedBank.shortName}</strong> ({activeMonths} Months)
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-black transition-colors"
          >
            Apply / Close
          </button>
        </div>
      </div>
    </div>
  );
};
