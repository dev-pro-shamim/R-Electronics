import { NextRequest, NextResponse } from "next/server";
import { readAdminDb, writeAdminDb } from "@/lib/adminDb";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawCode = String(body.code || "").trim().toUpperCase();
    const subtotal = Number(body.subtotal || 0);
    const customerKey = String(body.customerKey || body.phone || body.email || "")
      .trim()
      .toLowerCase();
    const items = Array.isArray(body.items) ? body.items : [];
    const recordUsage = Boolean(body.recordUsage);

    if (!rawCode) {
      return NextResponse.json(
        { valid: false, message: "Please enter a promo or coupon code." },
        { status: 400 }
      );
    }

    const db = readAdminDb();
    const coupon = (db.coupons || []).find(
      (c) => c.code.trim().toUpperCase() === rawCode && c.active
    );

    if (!coupon) {
      return NextResponse.json(
        { valid: false, message: `Invalid or inactive coupon code "${rawCode}".` },
        { status: 200 }
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    if (coupon.startDate && today < coupon.startDate) {
      return NextResponse.json({
        valid: false,
        message: `Coupon "${rawCode}" starts on ${coupon.startDate}.`,
      });
    }
    if (coupon.expiryDate && today > coupon.expiryDate) {
      return NextResponse.json({
        valid: false,
        message: `Coupon "${rawCode}" expired on ${coupon.expiryDate}.`,
      });
    }

    if (subtotal < Number(coupon.minOrder || 0)) {
      return NextResponse.json({
        valid: false,
        message: `Minimum order of ৳${Number(coupon.minOrder).toLocaleString()} required for "${rawCode}".`,
      });
    }

    if (
      typeof coupon.usageLimit === "number" &&
      coupon.usageLimit > 0 &&
      coupon.usageCount >= coupon.usageLimit
    ) {
      return NextResponse.json({
        valid: false,
        message: `Coupon "${rawCode}" has reached its maximum usage limit.`,
      });
    }

    if (
      customerKey &&
      typeof coupon.perCustomerLimit === "number" &&
      coupon.perCustomerLimit > 0
    ) {
      const usedByCust = coupon.usageByCustomer?.[customerKey] || 0;
      if (usedByCust >= coupon.perCustomerLimit) {
        return NextResponse.json({
          valid: false,
          message: `You have already used "${rawCode}" the maximum allowed times.`,
        });
      }
    }

    // Category / Product targeting check (if cart items supplied)
    let eligibleSubtotal = subtotal;
    if (
      items.length > 0 &&
      ((coupon.applicableCategories || []).length > 0 ||
        (coupon.applicableProducts || []).length > 0)
    ) {
      const matchingItems = items.filter((it: any) => {
        const cat = String(it.category || it.product?.category || "");
        const pid = String(it.id || it.product?.id || "");
        const catMatch =
          coupon.applicableCategories.length === 0 ||
          coupon.applicableCategories.includes(cat);
        const prodMatch =
          coupon.applicableProducts.length === 0 ||
          coupon.applicableProducts.includes(pid);
        return catMatch && prodMatch;
      });
      if (matchingItems.length === 0) {
        return NextResponse.json({
          valid: false,
          message: `Coupon "${rawCode}" does not apply to the items in your cart.`,
        });
      }
      eligibleSubtotal = matchingItems.reduce(
        (sum: number, it: any) =>
          sum + Number(it.price || it.product?.price || 0) * Number(it.quantity || 1),
        0
      );
    }

    let discountAmount = 0;
    if (coupon.type === "percent") {
      discountAmount = Math.round((eligibleSubtotal * Number(coupon.value || 0)) / 100);
      if (coupon.maxDiscount && coupon.maxDiscount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscount);
      }
    } else {
      discountAmount = Math.min(eligibleSubtotal, Number(coupon.value || 0));
    }

    if (recordUsage && discountAmount >= 0) {
      const updatedCoupons = db.coupons.map((c) => {
        if (c.id !== coupon.id) return c;
        const nextByCustomer = { ...(c.usageByCustomer || {}) };
        if (customerKey) {
          nextByCustomer[customerKey] = (nextByCustomer[customerKey] || 0) + 1;
        }
        return {
          ...c,
          usageCount: (c.usageCount || 0) + 1,
          usageByCustomer: nextByCustomer,
        };
      });
      writeAdminDb({ ...db, coupons: updatedCoupons });
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      name: coupon.name,
      type: coupon.type,
      value: coupon.value,
      discountAmount,
      message: `${coupon.name || coupon.code} applied! Saved ৳${discountAmount.toLocaleString()}.`,
    });
  } catch {
    return NextResponse.json(
      { valid: false, message: "Could not validate coupon code." },
      { status: 400 }
    );
  }
}
