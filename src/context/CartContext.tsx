"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/data/products";
import { supabase } from "@/lib/supabase";
import { fireTrackingEvent } from "@/lib/useStoreRuntime";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Address {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  addresses: Address[];
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  paymentMethod: string;
  shippingAddress: Address;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  discountCode: string;
  discountAmount: number;
  applyDiscountCode: (code: string) => Promise<{ valid: boolean; message: string; discountAmount?: number }>;
  removeDiscountCode: () => void;
  shippingCost: number;
  setShippingCost: (cost: number) => void;
  grandTotal: number;

  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Compare
  compareList: Product[];
  addToCompare: (product: Product) => boolean;
  removeFromCompare: (productId: string) => void;
  isInCompare: (productId: string) => boolean;

  // Auth & User
  user: User | null;
  authLoading: boolean;
  setAuthenticatedUser: (rawUser: any) => void;
  loginWithPhone: (phone: string, otp: string) => boolean;
  loginWithGoogle: (email: string, name: string) => void;
  logout: () => Promise<void>;
  addAddress: (address: Omit<Address, "id">) => Promise<void>;

  // Orders
  orders: Order[];
  createOrder: (data: { paymentMethod: string; shippingAddress: Address; notes?: string }) => Order;
  updateOrderStatus: (orderId: string, status: Order["status"]) => void;

  // Modals
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [discountCode, setDiscountCode] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(60); // ৳60 Inside Dhaka by default
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [orders, setOrders] = useState<Order[]>([]);

  const mapServerCustomerToUser = (raw: any): User => ({
    id: raw.id,
    name: raw.fullName || raw.name || "Rango Customer",
    phone: raw.phone || "",
    email: raw.email || "",
    addresses: Array.isArray(raw.addresses)
      ? raw.addresses.map((a: any) => ({
          id: a.id,
          title: a.area || a.title || "Delivery Address",
          fullName: a.fullName || raw.fullName || "Customer",
          phone: a.phoneNumber || a.phone || raw.phone || "",
          email: raw.email || "",
          city: a.city || "Dhaka",
          address: a.addressLine || a.address || "",
          isDefault: Boolean(a.isDefault),
        }))
      : [],
  });

  const setAuthenticatedUser = (rawUser: any) => {
    if (!rawUser) {
      setUser(null);
      try {
        localStorage.removeItem("rango_user");
      } catch {}
      return;
    }
    const mapped = mapServerCustomerToUser(rawUser);
    setUser(mapped);
    try {
      localStorage.setItem("rango_user", JSON.stringify(mapped));
    } catch {}
  };

  // Load from localStorage & verify server session cookie on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("rango_cart");
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart)) {
          setCart(parsedCart.filter((item) => item && item.product && item.product.id));
        }
      }

      const savedWishlist = localStorage.getItem("rango_wishlist");
      if (savedWishlist) {
        const parsedWishlist = JSON.parse(savedWishlist);
        if (Array.isArray(parsedWishlist)) {
          setWishlist(parsedWishlist.filter((id) => typeof id === "string"));
        }
      }

      const savedUser = localStorage.getItem("rango_user");
      if (savedUser) {
        const rawUser = JSON.parse(savedUser);
        if (rawUser && typeof rawUser === "object") {
          const safeName =
            typeof rawUser.name === "string" && rawUser.name.trim()
              ? rawUser.name.trim()
              : typeof rawUser.fullName === "string" && rawUser.fullName.trim()
              ? rawUser.fullName.trim()
              : typeof rawUser.phone === "string" && rawUser.phone.trim()
              ? rawUser.phone.trim()
              : typeof rawUser.email === "string" && rawUser.email.includes("@")
              ? rawUser.email.split("@")[0]
              : "Customer";
          setUser({
            id: typeof rawUser.id === "string" && rawUser.id ? rawUser.id : `cust-${Date.now()}`,
            name: safeName,
            email: typeof rawUser.email === "string" ? rawUser.email : "",
            phone: typeof rawUser.phone === "string" ? rawUser.phone : "",
            addresses: Array.isArray(rawUser.addresses) ? rawUser.addresses : [],
          });
        }
      }

      const savedOrders = localStorage.getItem("rango_orders");
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);
        if (Array.isArray(parsedOrders)) {
          setOrders(
            parsedOrders
              .filter((o) => o && typeof o === "object")
              .map((o) => ({
                ...o,
                id: typeof o.id === "string" ? o.id : `ORD-${Date.now()}`,
                date: typeof o.date === "string" ? o.date : new Date().toISOString().split("T")[0],
                status: typeof o.status === "string" ? o.status : "Pending",
                total: typeof o.total === "number" && Number.isFinite(o.total) ? o.total : 0,
                items: Array.isArray(o.items)
                  ? o.items.filter(
                      (it: { product?: { id?: string }; title?: string; id?: string }) =>
                        Boolean(it && (it.product || it.title || it.id))
                    )
                  : [],
              }))
          );
        }
      }
    } catch (e) {
      console.error("Failed to load state from localStorage:", e);
    }

    // Local state hydrated synchronously; stop blocking UI while background session check runs
    setAuthLoading(false);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    fetch("/api/auth/customer", { cache: "no-store", signal: controller.signal })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => {
        if (data?.user) {
          setAuthenticatedUser(data.user);
        } else if (data && "user" in data) {
          setUser(null);
          try {
            localStorage.removeItem("rango_user");
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(timer);
      });

    // Listen to Supabase Auth State changes (e.g. legacy OAuth redirect fallback)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.access_token) {
        try {
          const res = await fetch("/api/auth/customer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "sync_oauth", accessToken: session.access_token }),
          });
          const data = await res.json();
          if (res.ok && data?.user) {
            setAuthenticatedUser(data.user);
          }
        } catch {}
      }
    });

    return () => {
      clearTimeout(timer);
      controller.abort();
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("rango_cart", JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem("rango_wishlist", JSON.stringify(wishlist));
    } catch (e) {}
  }, [wishlist]);

  useEffect(() => {
    try {
      if (user) localStorage.setItem("rango_user", JSON.stringify(user));
      else localStorage.removeItem("rango_user");
    } catch (e) {}
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem("rango_orders", JSON.stringify(orders));
    } catch (e) {}
  }, [orders]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    fireTrackingEvent("AddToCart", {
      value: product.price * quantity,
      contentIds: [product.id],
    });
    showToast(`Added "${product.title}" to Cart`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    showToast("Item removed from cart");
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setDiscountCode("");
    setDiscountAmount(0);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const applyDiscountCode = async (
    code: string
  ): Promise<{ valid: boolean; message: string; discountAmount?: number }> => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      return { valid: false, message: "Please enter a coupon code." };
    }
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: trimmed,
          subtotal,
          customerKey: user?.phone || user?.email || "",
          items: cart.map((c) => ({
            id: c.product.id,
            category: c.product.category,
            price: c.product.price,
            quantity: c.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setDiscountCode(data.code || trimmed);
        setDiscountAmount(Number(data.discountAmount || 0));
        showToast(data.message || `Coupon "${trimmed}" applied!`);
        return {
          valid: true,
          message: data.message,
          discountAmount: Number(data.discountAmount || 0),
        };
      }
      showToast(data.message || "Invalid discount voucher code.");
      return {
        valid: false,
        message: data.message || "Invalid discount voucher code.",
      };
    } catch {
      showToast("Unable to validate coupon right now.");
      return { valid: false, message: "Unable to validate coupon right now." };
    }
  };

  const removeDiscountCode = () => {
    setDiscountCode("");
    setDiscountAmount(0);
    showToast("Discount voucher removed");
  };

  const grandTotal = Math.max(0, subtotal - discountAmount + (subtotal > 0 ? shippingCost : 0));

  // Wishlist
  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const exists = prev.includes(productId);
      if (exists) {
        showToast("Removed from Wishlist");
        return prev.filter(id => id !== productId);
      } else {
        showToast("Saved to Wishlist");
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  // Compare
  const addToCompare = (product: Product): boolean => {
    if (compareList.length >= 4) {
      showToast("You can compare up to 4 products at a time.");
      return false;
    }
    if (compareList.some(p => p.id === product.id)) {
      showToast("Product is already in comparison list.");
      return false;
    }
    setCompareList(prev => [...prev, product]);
    showToast(`Added "${product.title}" to Compare`);
    return true;
  };

  const removeFromCompare = (productId: string) => {
    setCompareList(prev => prev.filter(p => p.id !== productId));
    showToast("Product removed from comparison");
  };

  const isInCompare = (productId: string) => compareList.some(p => p.id === productId);

  // Auth simulation
  const loginWithPhone = (phone: string, otp: string): boolean => {
    if (phone.length >= 10) {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: "Rango Customer",
        phone,
        email: `${phone}@rangomember.com`,
        addresses: [
          {
            id: "addr-1",
            title: "Home",
            fullName: "Verified Customer",
            phone,
            email: `${phone}@rangomember.com`,
            city: "Dhaka",
            address: "House 24, Road 5, Dhanmondi, Dhaka",
            isDefault: true
          }
        ]
      };
      setUser(newUser);
      setIsAuthModalOpen(false);
      showToast(`Welcome! Signed in as ${phone}`);
      return true;
    }
    return false;
  };

  const loginWithGoogle = (email: string, name: string) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      phone: "+8801798565001",
      email,
      addresses: [
        {
          id: "addr-1",
          title: "Home",
          fullName: name,
          phone: "+8801798565001",
          email,
          city: "Dhaka",
          address: "H-11 R-11 DIT Project Merul Badda Dhaka",
          isDefault: true
        }
      ]
    };
    setUser(newUser);
    setIsAuthModalOpen(false);
    showToast(`Signed in as ${name}`);
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      await supabase.auth.signOut().catch(() => {});
      localStorage.removeItem("rango_user");
    } catch {}
    setUser(null);
    showToast("Signed out successfully.");
  };

  const addAddress = async (addressData: Omit<Address, "id">) => {
    if (!user) return;
    try {
      const res = await fetch("/api/auth/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_address",
          address: {
            fullName: addressData.fullName,
            phoneNumber: addressData.phone,
            city: addressData.city,
            area: addressData.title,
            addressLine: addressData.address,
            isDefault: addressData.isDefault,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data?.user) {
        setAuthenticatedUser(data.user);
        showToast("New address added successfully.");
        return;
      }
    } catch {}

    const newAddr: Address = {
      ...addressData,
      id: `addr-${Date.now()}`,
    };
    const updated = {
      ...user,
      addresses: [...user.addresses, newAddr],
    };
    setUser(updated);
    showToast("New address added successfully.");
  };

  const createOrder = (data: { paymentMethod: string; shippingAddress: Address; notes?: string }): Order => {
    const orderId = `RE-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: Order = {
      id: orderId,
      date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      items: [...cart],
      subtotal,
      discount: discountAmount,
      shipping: shippingCost,
      total: grandTotal,
      status: "Processing",
      paymentMethod: data.paymentMethod,
      shippingAddress: data.shippingAddress
    };
    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    showToast(`Order #${orderId} placed successfully!`);
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order["status"]) => {
    setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status } : o)));
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("rango_orders") || "[]");
        const nextStored = stored.map((o: any) =>
          o.id === orderId ? { ...o, status } : o
        );
        localStorage.setItem("rango_orders", JSON.stringify(nextStored));
      } catch {}
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        discountCode,
        discountAmount,
        applyDiscountCode,
        removeDiscountCode,
        shippingCost,
        setShippingCost,
        grandTotal,
        wishlist,
        toggleWishlist,
        isInWishlist,
        compareList,
        addToCompare,
        removeFromCompare,
        isInCompare,
        user,
        authLoading,
        setAuthenticatedUser,
        loginWithPhone,
        loginWithGoogle,
        logout,
        addAddress,
        orders,
        createOrder,
        updateOrderStatus,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        toastMessage,
        showToast
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-gray-900 text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 border border-gray-700 animate-bounce duration-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
