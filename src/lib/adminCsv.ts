import { Product } from "@/data/products";
import { AdminOrderRecord } from "@/types/admin";

export function getEffectiveStock(p: Product): number {
  return p.stock ?? p.stockCount ?? 0;
}

export function isProductOutOfStock(p: Product): boolean {
  if (typeof p.isStockOut === "boolean") return p.isStockOut;
  if (typeof p.inStock === "boolean") return !p.inStock;
  return getEffectiveStock(p) <= 0;
}

export function getOrderCustomerName(order: AdminOrderRecord): string {
  return order.shippingAddress?.fullName || "Guest Customer";
}

export function getOrderCustomerPhone(order: AdminOrderRecord): string {
  return order.shippingAddress?.phone || order.shippingAddress?.phoneNumber || "N/A";
}

export function getOrderItemsSummary(order: AdminOrderRecord): string {
  return (order.items || [])
    .map((it) => `${it.title || it.product?.title || "Item"} x${it.quantity}`)
    .join(" | ");
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? "");
    return `"${str.replace(/"/g, '""')}"`;
  };
  const csvContent = [
    headers.map(escapeCell).join(","),
    ...rows.map((r) => r.map(escapeCell).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
