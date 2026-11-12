import {
  AdminDatabase,
  AdminOrderRecord,
  FinancialAccount,
  FinancialTransaction,
} from "@/types/admin";

export function mapPaymentMethodToAccountId(method: string): string {
  const m = (method || "").toLowerCase();
  if (m.includes("bkash")) return "acc-bkash";
  if (m.includes("nagad")) return "acc-nagad";
  if (m.includes("ssl") || m.includes("card") || m.includes("emi") || m.includes("bank")) {
    return "acc-bank";
  }
  return "acc-cash";
}

/**
 * Recompute every account's currentBalance deterministically from openingBalance + all ledger transactions.
 */
export function recomputeAccountBalances(
  accounts: FinancialAccount[],
  transactions: FinancialTransaction[]
): FinancialAccount[] {
  const deltas = new Map<string, number>();
  for (const tx of transactions) {
    const prev = deltas.get(tx.accountId) || 0;
    const signed = tx.type === "credit" ? Number(tx.amount || 0) : -Number(tx.amount || 0);
    deltas.set(tx.accountId, prev + signed);
  }
  return accounts.map((acc) => ({
    ...acc,
    currentBalance: Number(acc.openingBalance || 0) + (deltas.get(acc.id) || 0),
  }));
}

/**
 * Record verified collected payment from an online order ONCE (idempotent anti-double-counting).
 */
export function recordOrderCollectionIdempotent(
  db: AdminDatabase,
  order: Pick<AdminOrderRecord, "id" | "total" | "paymentMethod" | "shippingAddress">,
  actor: string
): AdminDatabase {
  if ((db.recordedPaymentOrderIds || []).includes(order.id)) {
    return db;
  }

  const amount = Number(order.total || 0);
  if (amount <= 0) return db;

  const accountId = mapPaymentMethodToAccountId(order.paymentMethod);
  const nowIso = new Date().toISOString();
  const tx: FinancialTransaction = {
    id: `tx-ord-${order.id}`,
    date: nowIso.slice(0, 10),
    type: "credit",
    entryKind: "income",
    accountId,
    category: "Product Sales",
    amount,
    referenceNo: order.id,
    orderId: order.id,
    counterparty: order.shippingAddress?.fullName || "Customer",
    description: `Verified payment collected for Order #${order.id} (${order.paymentMethod})`,
    actor,
    createdAt: nowIso,
  };

  const nextTxs = [tx, ...(db.financialTransactions || [])];
  return {
    ...db,
    recordedPaymentOrderIds: [...(db.recordedPaymentOrderIds || []), order.id],
    financialTransactions: nextTxs,
    accounts: recomputeAccountBalances(db.accounts, nextTxs),
  };
}

/**
 * Reverse previously recorded order income when an order is refunded or cancelled after payment.
 */
export function recordOrderRefundReversal(
  db: AdminDatabase,
  orderId: string,
  amount: number,
  paymentMethod: string,
  actor: string
): AdminDatabase {
  const refundTxId = `tx-ref-${orderId}`;
  if ((db.financialTransactions || []).some((t) => t.id === refundTxId)) {
    return db;
  }
  const accountId = mapPaymentMethodToAccountId(paymentMethod);
  const nowIso = new Date().toISOString();
  const tx: FinancialTransaction = {
    id: refundTxId,
    date: nowIso.slice(0, 10),
    type: "debit",
    entryKind: "refund",
    accountId,
    category: "Order Refund",
    amount: Math.max(0, Number(amount || 0)),
    referenceNo: orderId,
    orderId,
    description: `Refund reversal for Order #${orderId}`,
    actor,
    createdAt: nowIso,
  };

  const nextTxs = [tx, ...(db.financialTransactions || [])];
  return {
    ...db,
    financialTransactions: nextTxs,
    accounts: recomputeAccountBalances(db.accounts, nextTxs),
  };
}

/**
 * Create a balanced transfer pair: DEBIT from source account, CREDIT to destination account.
 */
export function recordBalancedTransfer(
  db: AdminDatabase,
  params: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    date: string;
    referenceNo?: string;
    description: string;
    actor: string;
  }
): AdminDatabase {
  const amt = Number(params.amount || 0);
  if (amt <= 0 || params.fromAccountId === params.toAccountId) {
    return db;
  }

  const stamp = Date.now();
  const debitId = `tx-trf-d-${stamp}`;
  const creditId = `tx-trf-c-${stamp}`;
  const nowIso = new Date().toISOString();

  const fromName = db.accounts.find((a) => a.id === params.fromAccountId)?.name || params.fromAccountId;
  const toName = db.accounts.find((a) => a.id === params.toAccountId)?.name || params.toAccountId;

  const debitTx: FinancialTransaction = {
    id: debitId,
    date: params.date,
    type: "debit",
    entryKind: "transfer",
    accountId: params.fromAccountId,
    category: "Account Transfer Out",
    amount: amt,
    referenceNo: params.referenceNo || `TRF-${stamp.toString().slice(-6)}`,
    counterparty: toName,
    description: params.description || `Transfer from ${fromName} to ${toName}`,
    pairTxId: creditId,
    actor: params.actor,
    createdAt: nowIso,
  };

  const creditTx: FinancialTransaction = {
    id: creditId,
    date: params.date,
    type: "credit",
    entryKind: "transfer",
    accountId: params.toAccountId,
    category: "Account Transfer In",
    amount: amt,
    referenceNo: params.referenceNo || `TRF-${stamp.toString().slice(-6)}`,
    counterparty: fromName,
    description: params.description || `Transfer received from ${fromName} to ${toName}`,
    pairTxId: debitId,
    actor: params.actor,
    createdAt: nowIso,
  };

  const nextTxs = [creditTx, debitTx, ...(db.financialTransactions || [])];
  return {
    ...db,
    financialTransactions: nextTxs,
    accounts: recomputeAccountBalances(db.accounts, nextTxs),
  };
}

export interface FinancialSummaryMetrics {
  totalIncome: number;
  salesRevenue: number;
  otherIncome: number;
  refundsTotal: number;
  cogsTotal: number;
  operatingExpenses: number;
  totalExpenses: number;
  totalCredit: number;
  totalDebit: number;
  grossProfit: number;
  netProfit: number;
  cashBalance: number;
  bankBalance: number;
  bkashBalance: number;
  nagadBalance: number;
}

export function computeFinancialMetrics(
  accounts: FinancialAccount[],
  transactions: FinancialTransaction[],
  startDate?: string,
  endDate?: string
): FinancialSummaryMetrics {
  const inRange = transactions.filter((tx) => {
    if (startDate && tx.date < startDate) return false;
    if (endDate && tx.date > endDate) return false;
    return true;
  });

  let salesRevenue = 0;
  let otherIncome = 0;
  let refundsTotal = 0;
  let cogsTotal = 0;
  let operatingExpenses = 0;
  let totalCredit = 0;
  let totalDebit = 0;

  for (const tx of inRange) {
    const amt = Number(tx.amount || 0);
    if (tx.type === "credit") totalCredit += amt;
    else totalDebit += amt;

    if (tx.entryKind === "income") {
      if (tx.category === "Product Sales" || tx.category === "Offline Sales") {
        salesRevenue += amt;
      } else {
        otherIncome += amt;
      }
    } else if (tx.entryKind === "refund") {
      refundsTotal += amt;
    } else if (tx.entryKind === "expense") {
      if (tx.category === "Product Purchase" || tx.category === "Cost of Goods Sold") {
        cogsTotal += amt;
      } else {
        operatingExpenses += amt;
      }
    }
  }

  const totalIncome = Math.max(0, salesRevenue + otherIncome - refundsTotal);
  const totalExpenses = cogsTotal + operatingExpenses;
  const grossProfit = salesRevenue - refundsTotal - cogsTotal;
  const netProfit = totalIncome - totalExpenses;

  const findBal = (type: FinancialAccount["accountType"]) =>
    accounts
      .filter((a) => a.accountType === type)
      .reduce((s, a) => s + Number(a.currentBalance || 0), 0);

  return {
    totalIncome,
    salesRevenue,
    otherIncome,
    refundsTotal,
    cogsTotal,
    operatingExpenses,
    totalExpenses,
    totalCredit,
    totalDebit,
    grossProfit,
    netProfit,
    cashBalance: findBal("Cash"),
    bankBalance: findBal("Bank"),
    bkashBalance: findBal("bKash"),
    nagadBalance: findBal("Nagad"),
  };
}
