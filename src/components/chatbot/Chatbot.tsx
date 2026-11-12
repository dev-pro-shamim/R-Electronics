"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, X, Send, Bot, Sparkles, Phone, ShieldCheck, CreditCard, ChevronRight, CheckCircle2, MapPin, ExternalLink } from "lucide-react";
import { PRODUCTS, Product } from "@/data/products";
import { useStoreRuntime } from "@/lib/useStoreRuntime";
import { useCart } from "@/context/CartContext";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
  products?: Product[];
  options?: { label: string; action: string }[];
}

export const Chatbot: React.FC = () => {
  const runtime = useStoreRuntime();
  const { user } = useCart();
  const [conversationId, setConversationId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m-1",
      sender: "bot",
      text: "আসসালামু আলাইকুম! রঙ্গ ইলেকট্রনিক্স (Rango Electronics)-এর অফিশিয়াল অ্যাসিস্ট্যান্টে স্বাগতম।\n\nআমাদের ক্যাটালগের ১৫৬+ আসল প্রোডাক্টের সঠিক দাম, স্পেসিফিকেশন, ওয়ারেন্টি, শোরুম লোকেশন বা পেমেন্ট সম্পর্কে যেকোনো প্রশ্ন করুন।",
      time: "Just now",
      options: [
        { label: "💳 ০% ইএমআই (EMI) সুবিধা", action: "emi" },
        { label: "📱 বিকাশ ও নগদ পেমেন্ট নম্বর", action: "payment" },
        { label: "❄️ ইনভার্টার এসি কালেকশন", action: "ac" },
        { label: "📺 স্মার্ট ও 4K টিভি অফার", action: "tv" },
        { label: "🧊 ফ্রিজ ও ডিপ ফ্রিজার", action: "fridge" },
        { label: "📍 শোরুম লোকেশন ও হটলাইন", action: "location" }
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  // Dynamic intelligent search against real PRODUCTS
  const searchLiveProducts = (query: string): Product[] => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const tokens = q
      .replace(/[?.,!/\\()-_]/g, " ")
      .split(/\s+/)
      .filter(t => t.length > 1 && !["the", "and", "dam", "koto", "price", "rango", "electronics", "ki", "ace", "koto", "bhalo"].includes(t));

    // Calculate score for each real product
    const scored = PRODUCTS.map(p => {
      let score = 0;
      const titleLower = p.title.toLowerCase();
      const brandLower = p.brand.toLowerCase();
      const catLower = p.category.toLowerCase();
      const subCatLower = ((p as any).subcategory || (p as any).subCategory || "").toLowerCase();
      const modelLower = (p.model || "").toLowerCase();
      const descLower = (p.description || "").toLowerCase();

      // Exact substring matches
      if (titleLower.includes(q)) score += 10;
      if (modelLower && modelLower.includes(q)) score += 8;
      if (brandLower === q) score += 6;
      if (catLower.includes(q)) score += 5;

      // Token matches
      tokens.forEach(token => {
        if (titleLower.includes(token)) score += 3;
        if (brandLower.includes(token)) score += 2;
        if (modelLower.includes(token)) score += 3;
        if (catLower.includes(token)) score += 2;
        if (subCatLower.includes(token)) score += 2;
        if (descLower.includes(token)) score += 1;
      });

      return { product: p, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.product);
  };

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: query,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let botResponse = "";
      let matchedProducts: Product[] = [];
      const q = query.toLowerCase();

      // 0. Check Admin-configured Custom FAQs first
      const liveFaqs = (runtime?.chatbotFaqs || []).filter((f) => f.active);
      const matchedFaq = liveFaqs.find((f) =>
        f.keywords
          .split(",")
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean)
          .some((kw) => q.includes(kw))
      );

      if (matchedFaq) {
        botResponse = `${matchedFaq.answer}${matchedFaq.productLink ? `\n\n🔗 দেখুন: ${matchedFaq.productLink}` : ""}`;
      }
      // 1. Payment accounts inquiry (bKash Merchant / Nagad Personal)
      else if (q.includes("bkash") || q.includes("বিকাশ") || q.includes("nagad") || q.includes("নগদ") || q.includes("payment") || q.includes("পেমেন্ট") || q === "payment") {
        botResponse = `💳 রঙ্গ ইলেকট্রনিক্স অফিশিয়াল পেমেন্ট গেটওয়ে:\n\n` +
          `• bKash Merchant (Make Payment): 01798565001\n` +
          `• Nagad Personal (Send Money): 01911116359\n` +
          `• Cash on Delivery (ক্যাশ অন ডেলিভারি): সমগ্র বাংলাদেশে প্রযোজ্য\n` +
          `• 0% EMI: ২৯টি প্রধান ব্যাংকের ক্রেডিট কার্ডে সর্বোচ্চ ৩৬ মাস পর্যন্ত\n\n` +
          `চেকআউট পেজে পেমেন্ট অপশন সিলেক্ট করে সরাসরি ট্রানজ্যাকশন আইডি সাবমিট করতে পারবেন।`;
      }
      // 2. EMI inquiries
      else if (q.includes("emi") || q.includes("ইএমআই") || q.includes("installment") || q === "emi") {
        botResponse = `💳 ০% ইন্টারেস্টে সহজ ইএমআই (EMI) সুবিধা:\n\n` +
          `• ২৯টি শীর্ষস্থানীয় ব্যাংকের ক্রেডিট কার্ডে ৩ থেকে ৩৬ মাস পর্যন্ত ইএমআই সুবিধা পাবেন।\n` +
          `• সর্বনিম্ন ক্রয়সীমা: ৫,০০০ টাকা।\n` +
          `• দ্রষ্টব্য: সিটি ব্যাংক ও ব্র্যাক ব্যাংক ছাড়া স্ট্যান্ডার্ড চার্টার্ড, ইবিএল, ডিবিবিএল, সাউথইস্ট, ব্যাংক এশিয়াসহ সকল পার্টনার ব্যাংকে এ সুবিধা চালু রয়েছে।\n` +
          `• যেকোনো প্রোডাক্ট পেজে 'EMI Available' বা 'View Plans' এ ক্লিক করে কিস্তির হিসাব দেখতে পারেন।`;
      }
      // 3. Store location & Contacts
      else if (q.includes("location") || q.includes("ঠিকানা") || q.includes("শোরুম") || q.includes("address") || q.includes("contact") || q.includes("হটলাইন") || q.includes("ফোন") || q === "location") {
        botResponse = `📍 রঙ্গ ইলেকট্রনিক্স (Rango Electronics) শোরুম ও প্রধান কার্যালয়:\n` +
          `House-11, Road-11, DIT Project, Merul Badda, Dhaka, Bangladesh.\n\n` +
          `📞 অফিশিয়াল হটলাইনসমূহ:\n` +
          `• +88 01798-565001 (কল / হোয়াটসঅ্যাপ)\n` +
          `• +88 01554-565001\n` +
          `✉️ ইমেইল: electronics.rango@gmail.com\n\n` +
          `আমাদের শোরুম সপ্তাহের ৭ দিনই সকাল ১০টা থেকে রাত ৯টা পর্যন্ত খোলা থাকে।`;
      }
      // 4. Order tracking
      else if (q.includes("track") || q.includes("ট্র্যাক") || q.includes("order status") || q.includes("অর্ডার কোথায়") || q === "track") {
        botResponse = `📦 লাইভ অর্ডার ট্র্যাকিং:\n\n` +
          `আপনার অর্ডারের বর্তমান অবস্থা জানতে ওয়েবসাইটের উপরে 'Track Order' পেজে গিয়ে আপনার অর্ডার আইডি (যেমন: RE-984210) অথবা ফোন নম্বর দিন।\n` +
          `সিস্টেম সরাসরি কুরিয়ার ও ডেলিভারি স্ট্যাটাস প্রদর্শন করবে (কোনো ভুয়া তথ্য নয়)।`;
      }
      // 5. Warranty inquiry
      else if (q.includes("warranty") || q.includes("ওয়ারেন্টি") || q.includes("গ্যারান্টি") || q === "warranty") {
        botResponse = `🛡️ ১০০% অফিশিয়াল অথেনটিক ব্র্যান্ড ওয়ারেন্টি:\n\n` +
          `• এসি: ১০ বছর পর্যন্ত ইনভার্টার কম্প্রেসর ওয়ারেন্টি ও ফ্রি ইনস্টলেশন সার্ভিস\n` +
          `• রেফ্রিজারেটর/ফ্রিজার: ১০-১২ বছরের অফিসিয়াল কম্প্রেসর ওয়ারেন্টি\n` +
          `• টিভি: ২-৪ বছরের প্যানেল ও পার্টস ওয়ারেন্টি\n` +
          `• ওভেন ও হোম অ্যাপ্লায়েন্স: ১-২ বছরের অফিশিয়াল সার্ভিস ওয়ারেন্টি\n\n` +
          `প্রতিটি পণ্যের সাথে অফিশিয়াল অথরাইজড ওয়ারেন্টি কার্ড ও ক্যাশ মেমো প্রদান করা হয়।`;
      }
      // 6. Dynamic Product Lookup from real PRODUCTS
      else {
        matchedProducts = searchLiveProducts(query);

        if (matchedProducts.length > 0) {
          botResponse = `🔍 আপনার অনুসন্ধান অনুযায়ী আমাদের স্টকের অথেনটিক প্রোডাক্টসমূহ:\n\n` +
            matchedProducts.map(p => {
              const discount = p.originalPrice && p.originalPrice > p.price
                ? ` (আগের দাম: ৳${p.originalPrice.toLocaleString()})`
                : "";
              return `📌 ${p.title}\n• ব্র্যান্ড: ${p.brand}\n• বর্তমান অফার মূল্য: ৳${p.price.toLocaleString()}${discount}\n• ওয়ারেন্টি: ${p.warranty || "অফিশিয়াল ব্র্যান্ড ওয়ারেন্টি"}\n• স্টক: ${p.inStock ? "✅ স্টকে এভেইলেবল" : "কল করে স্টক জানুন"}`;
            }).join("\n\n") +
            `\n\nনিচের কার্ড থেকে সরাসরি ক্লিক করে প্রোডাক্ট পেজ ভিজিট করতে পারেন।`;
        } else {
          // Honest fallback without fake inventions
          botResponse = `ধন্যবাদ আপনার অনুসন্ধানের জন্য! "${query}" দিয়ে নির্দিষ্ট কোনো পণ্য আমাদের বর্তমান ক্যাটালগে সরাসরি মেলেনি।\n\n` +
            `আমাদের স্টোরে ১৫৬+ টি অরিজিনাল এসি, টিভি, রেফ্রিজারেটর, ওয়াশিং মেশিন, মাইক্রোওয়েভ ও ওয়াটার পিউরিফায়ার রয়েছে।\n` +
            `সরাসরি আমাদের বিশেষজ্ঞ প্রতিনিধির সাথে কথা বলতে পারেন: 📞 01798-565001 অথবা হোয়াটসঅ্যাপে নক করুন।`;
        }
      }

      const botMsg: Message = {
        id: `b-${Date.now()}`,
        sender: "bot",
        text: botResponse,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        products: matchedProducts.length > 0 ? matchedProducts : undefined,
        options: [
          { label: "💳 ০% ইএমআই সুবিধা", action: "emi" },
          { label: "📱 বিকাশ/নগদ পেমেন্ট", action: "payment" },
          { label: "📍 শোরুম ও কন্টাক্ট", action: "location" }
        ]
      };
      setMessages(prev => [...prev, botMsg]);

      // Sync conversation non-blockingly to Enterprise Admin Inbox
      fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          customerName: user?.name || "Website Visitor",
          customerPhone: user?.phone,
          customerEmail: user?.email,
          customerMessage: query,
          botReply: botResponse,
          productLink: matchedProducts[0] ? `/product/${matchedProducts[0].slug}` : undefined,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((res) => {
          if (res?.conversationId) setConversationId(res.conversationId);
        })
        .catch(() => {});
    }, 500);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-40 print:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Rango Assistant"
          className="relative size-13 md:size-14 rounded-full bg-primary hover:bg-rose-700 text-white shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 group cursor-pointer"
        >
          {isOpen ? (
            <X className="size-6 text-white" />
          ) : (
            <>
              <MessageSquare className="size-6 text-white" />
              <span className="absolute -top-1 -right-1 size-3.5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            </>
          )}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 md:bottom-22 right-4 z-50 w-[92vw] sm:w-[400px] h-[540px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-fadeIn print:hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-rose-700 text-white p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                <Bot className="size-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  <span>Rango Assistant</span>
                  <span className="size-2 bg-green-400 rounded-full animate-ping" />
                </h3>
                <p className="text-[10px] text-rose-100">Live Catalog Knowledgebase (156+ Products)</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/60 text-xs">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-xs leading-relaxed whitespace-pre-line ${
                    msg.sender === "user"
                      ? "bg-primary text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-200/80 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>

                {/* Render Product Cards dynamically if matched */}
                {msg.products && msg.products.length > 0 && (
                  <div className="w-full mt-2 space-y-2">
                    {msg.products.map(prod => (
                      <Link
                        key={prod.id}
                        href={`/product/${prod.slug}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2.5 p-2 bg-white hover:bg-rose-50/50 border border-gray-200 hover:border-primary/40 rounded-xl transition-all shadow-xs group"
                      >
                        <img
                          src={prod.thumbnail || prod.images?.[0] || "/logo.png"}
                          alt={prod.title}
                          className="size-12 object-contain bg-gray-50 rounded border border-gray-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1 text-[11px]">
                            {prod.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-primary font-bold text-xs">
                              ৳{prod.price.toLocaleString()}
                            </span>
                            {prod.originalPrice && prod.originalPrice > prod.price && (
                              <span className="text-gray-400 line-through text-[10px]">
                                ৳{prod.originalPrice.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <ExternalLink className="size-3.5 text-gray-400 group-hover:text-primary shrink-0 mr-1" />
                      </Link>
                    ))}
                  </div>
                )}

                <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>

                {/* Quick Option Pills */}
                {msg.options && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.options.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSend(opt.action)}
                        className="px-2.5 py-1 rounded-full bg-white hover:bg-rose-50 text-gray-700 hover:text-primary border border-gray-200 hover:border-primary text-[10px] font-semibold transition-colors shadow-2xs cursor-pointer"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 p-2.5 rounded-2xl w-fit text-gray-500 text-xs">
                <span className="size-1.5 bg-primary rounded-full animate-bounce" />
                <span className="size-1.5 bg-primary rounded-full animate-bounce delay-100" />
                <span className="size-1.5 bg-primary rounded-full animate-bounce delay-200" />
                <span className="ml-1 text-[11px] text-gray-400">খোঁজা হচ্ছে...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Contacts Bar */}
          <div className="px-3 py-1.5 bg-gray-100/80 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-600">
            <span className="font-medium">হটলাইন: 01798-565001</span>
            <a
              href="https://wa.me/8801798565001"
              target="_blank"
              rel="noreferrer"
              className="text-green-700 font-bold hover:underline"
            >
              WhatsApp Support
            </a>
          </div>

          {/* Input Bar */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-gray-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="পণ্য বা মডেলের নাম লিখুন (যেমন: Gree AC, Haier...)"
              className="flex-1 h-9 px-3 rounded-lg border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="size-9 bg-primary disabled:opacity-40 hover:bg-rose-700 text-white rounded-lg flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
