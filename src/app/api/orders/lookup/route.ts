import { NextRequest, NextResponse } from "next/server";
import { fetchAllOrdersUnified, readAdminDbCached } from "@/lib/adminDb";

export async function GET(req: NextRequest) {
  try {
    const orderId = String(req.nextUrl.searchParams.get("orderId") || "").trim();
    const phone = String(req.nextUrl.searchParams.get("phone") || "").trim();
    const db = readAdminDbCached();
    const orders = await fetchAllOrdersUnified(db);

    if (orderId) {
      const cleanId = orderId.replace(/^#/, "").toLowerCase();
      const match = orders.find((o) => o.id.toLowerCase() === cleanId);
      const override = db.orderOverrides?.[match?.id || orderId.replace(/^#/, "")];
      const invoice = (db.invoices || []).find(
        (inv) =>
          inv.id.toLowerCase() === cleanId ||
          inv.orderId?.toLowerCase() === cleanId ||
          inv.invoiceNumber.toLowerCase() === cleanId
      );
      const booking = (db.courierBookings || []).find(
        (b) => b.orderId.toLowerCase() === cleanId
      );

      if (!match && !override && !invoice) {
        return NextResponse.json({ found: false }, { status: 200 });
      }

      return NextResponse.json({
        found: true,
        order: match,
        override,
        invoice,
        booking,
      });
    }

    if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      const matched = orders.filter((o) =>
        (o.shippingAddress?.phone || o.shippingAddress?.phoneNumber || "")
          .replace(/\D/g, "")
          .includes(cleanPhone)
      );
      return NextResponse.json({ found: matched.length > 0, orders: matched });
    }

    return NextResponse.json({ found: false, orders: [] });
  } catch {
    return NextResponse.json({ found: false }, { status: 200 });
  }
}
