"use client";

import React, { useState } from "react";
import Link from "next/link";

export const Footer: React.FC = () => {
  const [showWhatsAppBubble, setShowWhatsAppBubble] = useState(true);

  return (
    <footer className="bg-primary text-white mt-20 pt-12 pb-20 xl:pb-0 print:hidden">
      <div className="container overflow-hidden">
        <div className="grid 2xl:grid-cols-[460px,1fr] gap-10 xl:gap-20">
          {/* Left Column: Brand, Address, Contacts, Socials, Store Location */}
          <div>
            <figure className="mb-6">
              <Link className="flex items-center" href="/">
                <div className="bg-white px-3 py-1.5 rounded-lg inline-block shadow-sm">
                  <img
                    alt="Rango Electronics"
                    src="/logo.png"
                    className="h-9 md:h-11 w-auto object-contain"
                  />
                </div>
              </Link>
            </figure>

            <div className="space-y-4">
              {/* Address */}
              <div className="flex items-start gap-4">
                <svg width="24" height="28" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 mt-1 text-secondary">
                  <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 12 28 12 28C12 28 24 19.5 24 12C24 5.37258 18.6274 0 12 0ZM12 16.5C9.51472 16.5 7.5 14.4853 7.5 12C7.5 9.51472 9.51472 7.5 12 7.5C14.4853 7.5 16.5 9.51472 16.5 12C16.5 14.4853 14.4853 16.5 12 16.5Z" fill="currentColor"/>
                </svg>
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/70 font-semibold mb-0.5">Location</p>
                  <p className="text-white text-base md:text-lg font-medium leading-snug">
                    H-11 R-11 DIT Project Merul Badda Dhaka
                  </p>
                </div>
              </div>

              {/* Phone numbers */}
              <div className="flex items-start gap-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-1 text-secondary">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/70 font-semibold mb-0.5">Customer Support Hotline</p>
                  <div className="space-y-0.5">
                    <a className="text-white block text-base md:text-lg font-bold hover:text-secondary transition-colors" href="tel:+8801798565001">+88 01798-565001</a>
                    <a className="text-white block text-base md:text-lg font-bold hover:text-secondary transition-colors" href="tel:+8801554565001">+88 01554-565001</a>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-1 text-secondary">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/70 font-semibold mb-0.5">Email Support</p>
                  <a className="text-white text-base md:text-lg font-medium hover:text-secondary transition-colors break-all" href="mailto:electronics.rango@gmail.com">
                    electronics.rango@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Social Media Links (6 Verified Channels) */}
            <div className="mt-6 pt-5 border-t border-white/20">
              <p className="text-sm font-semibold uppercase tracking-wider text-white/80 mb-3">Follow Rango Electronics</p>
              <div className="flex flex-wrap gap-2.5">
                {/* Facebook */}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="bg-white hover:bg-secondary text-primary hover:text-white rounded-full grid place-items-center size-10 md:size-11 transition-all shadow-sm"
                  href="https://www.facebook.com/rangoelectronics"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="bg-white hover:bg-secondary text-primary hover:text-white rounded-full grid place-items-center size-10 md:size-11 transition-all shadow-sm"
                  href="https://www.instagram.com/rangoelectronics/"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                  </svg>
                </a>

                {/* YouTube */}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="bg-white hover:bg-secondary text-primary hover:text-white rounded-full grid place-items-center size-10 md:size-11 transition-all shadow-sm"
                  href="https://www.youtube.com/@RangoElectronics"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>

                {/* X / Twitter */}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  className="bg-white hover:bg-secondary text-primary hover:text-white rounded-full grid place-items-center size-10 md:size-11 transition-all shadow-sm"
                  href="https://x.com/Rangoelectro"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>

                {/* TikTok */}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="bg-white hover:bg-secondary text-primary hover:text-white rounded-full grid place-items-center size-10 md:size-11 transition-all shadow-sm"
                  href="https://www.tiktok.com/@rango.electronics"
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298 0 .591.045.87.134V9.42a6.34 6.34 0 0 0-.87-.06A6.33 6.33 0 0 0 3.15 15.7 6.34 6.34 0 0 0 9.48 22a6.33 6.33 0 0 0 6.33-6.33V9.75c1.47 1.05 3.26 1.67 5.18 1.74V8.04c-.47-.02-.93-.11-1.4-.28-.56-.22-1.07-.57-1.5-.98-.5-.48-.87-1.06-1.1-1.69z"/>
                  </svg>
                </a>

                {/* Pinterest */}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Pinterest"
                  className="bg-white hover:bg-secondary text-primary hover:text-white rounded-full grid place-items-center size-10 md:size-11 transition-all shadow-sm"
                  href="https://www.pinterest.com/rangoelectronics/"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0a12 12 0 0 0-4.37 23.18c-.05-.98-.1-2.48.02-3.55l1.05-4.46s-.27-.54-.27-1.34c0-1.25.73-2.19 1.63-2.19.77 0 1.14.58 1.14 1.28 0 .78-.49 1.94-.75 3.02-.21.9.45 1.63 1.34 1.63 1.61 0 2.85-1.7 2.85-4.15 0-2.17-1.56-3.69-3.79-3.69-2.58 0-4.09 1.94-4.09 3.93 0 .78.3 1.62.67 2.07.07.09.08.17.06.26l-.25 1.05c-.04.17-.14.21-.32.13-1.2-.56-1.95-2.31-1.95-3.72 0-3.03 2.2-5.81 6.35-5.81 3.33 0 5.92 2.38 5.92 5.55 0 3.31-2.09 5.98-4.99 5.98-.97 0-1.89-.51-2.2-.51l-.6 2.28c-.22.84-.81 1.9-1.21 2.54A12 12 0 1 0 12 0z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: 3 Link Groups */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
            {/* 1. Policy */}
            <div className="flex flex-col">
              <p className="text-lg md:text-xl font-bold text-white mb-4 uppercase tracking-wider border-b border-white/20 pb-2">Policy</p>
              <div className="flex flex-col gap-3">
                <Link className="text-sm md:text-base font-medium text-white/90 hover:text-white hover:underline transition-colors" href="/page/privacy-policy">Privacy Policy</Link>
                <Link className="text-sm md:text-base font-medium text-white/90 hover:text-white hover:underline transition-colors" href="/page/offer-policy">Offer Policy</Link>
                <Link className="text-sm md:text-base font-medium text-white/90 hover:text-white hover:underline transition-colors" href="/page/emi-and-payment-policy">EMI and Payment Policy</Link>
                <Link className="text-sm md:text-base font-medium text-white/90 hover:text-white hover:underline transition-colors" href="/page/warranty-policy">Warranty Policy</Link>
                <Link className="text-sm md:text-base font-medium text-white/90 hover:text-white hover:underline transition-colors" href="/page/delivery-terms-and-conditions">Delivery Policy</Link>
                <Link className="text-sm md:text-base font-medium text-white/90 hover:text-white hover:underline transition-colors" href="/page/pre-book-t-c">Pre Book T&amp;C</Link>
                <Link className="text-sm md:text-base font-medium text-white/90 hover:text-white hover:underline transition-colors" href="/page/booking-t-c">Booking T&amp;C</Link>
                <Link className="text-sm md:text-base font-medium text-white/90 hover:text-white hover:underline transition-colors" href="/page/term-and-conditions">Terms &amp; Conditions</Link>
                <Link className="text-sm md:text-base font-medium text-white/90 hover:text-white hover:underline transition-colors" href="/page/refund-policy">Refund Policy</Link>
                <Link className="text-sm md:text-base font-medium text-white/90 hover:text-white hover:underline transition-colors" href="/page/return-policy">Return Policy</Link>
              </div>
            </div>

            {/* 2. Help */}
            <div className="flex flex-col">
              <p className="text-lg md:text-xl font-bold text-white mb-4 uppercase tracking-wider border-b border-white/20 pb-2">Help</p>
              <div className="flex flex-col gap-3">
                <Link className="text-sm md:text-base font-medium text-white/90 hover:text-white hover:underline transition-colors" href="/page/faq">FAQs</Link>
                <Link className="text-sm md:text-base font-medium text-white/90 hover:text-white hover:underline transition-colors" href="/page/advice-complain">Advice / Complain</Link>
                <Link className="text-sm md:text-base font-medium text-white/90 hover:text-white hover:underline transition-colors" href="/page/contact-us">Contact Us</Link>
                <Link className="text-sm md:text-base font-medium text-white/90 hover:text-white hover:underline transition-colors" href="/page/store-locator">Store Locator</Link>
                <Link className="text-sm md:text-base font-medium text-white/90 hover:text-white hover:underline transition-colors" href="/track-order">Order Tracking</Link>
              </div>
            </div>

            {/* 3. About Us */}
            <div className="flex flex-col col-span-2 md:col-span-1">
              <p className="text-lg md:text-xl font-bold text-white mb-4 uppercase tracking-wider border-b border-white/20 pb-2">About Us</p>
              <div className="flex flex-col gap-3">
                <Link className="text-sm md:text-base font-medium text-white/90 hover:text-white hover:underline transition-colors" href="/page/about-us">About Rango Electronics</Link>
                <Link className="text-sm md:text-base font-medium text-white/90 hover:text-white hover:underline transition-colors" href="/page/brand-stores">Brand Stores</Link>
                <Link className="text-sm md:text-base font-medium text-white/90 hover:text-white hover:underline transition-colors" href="/page/careers">Careers</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & SSL Badge */}
        <div className="border-t border-white/20 pt-6 pb-6 mt-12">
          <div className="flex flex-col md:flex-row gap-5 md:gap-0 items-center justify-between">
            <div className="space-y-1">
              <p className="text-center md:text-left text-sm md:text-base font-semibold text-white">
                Thanks From Rango Electronics © 2026 | All rights reserved developed by{" "}
                <a
                  href="https://www.smartedgebangladesh.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-secondary transition-colors font-bold"
                >
                  SmartEdge Bangladesh
                </a>
              </p>
              <p className="text-center md:text-left text-xs md:text-sm text-white/80">
                Official Retailer &amp; Technology Partner in Bangladesh
              </p>
            </div>
            <img className="hidden md:block h-9 md:h-11 w-auto object-contain bg-white/10 p-1 rounded" src="/ssl-1.png" alt="SSL Secure Payment Gateway" />
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Live Chat button */}
      <div className="fixed bottom-24 md:bottom-20 right-3 md:right-10 z-30">
        <div className="h-11 w-11 md:h-14 md:w-14 cursor-pointer relative print:hidden">
          <a
            className="z-20 block relative size-full hover:scale-105 transition-transform"
            target="_blank"
            rel="noopener noreferrer"
            href="https://wa.me/8801798565001?text=Hi,%20is%20there%20anyone%20to%20assist%20me?%0a%0aSent%20from:%20RangoElectronics.com"
            aria-label="Live chat on WhatsApp (+88 01798-565001)"
          >
            <svg width="39" height="39" className="h-full w-full drop-shadow-xl" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="19.4395" cy="19.4395" r="19.4395" fill="#25D366"></circle>
              <path d="M12.9821 10.1115C12.7029 10.7767 11.5862 11.442 10.7486 11.575C10.1902 11.7081 9.35269 11.8411 6.84003 10.7767C3.48981 9.44628 1.39593 6.25317 1.25634 6.12012C1.11674 5.85403 2.13001e-06 4.39053 2.13001e-06 2.92702C2.13001e-06 1.46351 0.83755 0.665231 1.11673 0.399139C1.39592 0.133046 1.8147 1.01506e-06 2.23348 1.01506e-06C2.37307 1.01506e-06 2.51267 1.01506e-06 2.65226 1.01506e-06C2.93144 1.01506e-06 3.21063 -2.02219e-06 3.35022 0.532183C3.62941 1.19741 4.32736 2.66092 4.32736 2.79397C4.46696 2.92702 4.46696 3.19311 4.32736 3.32616C4.18777 3.59225 4.18777 3.59224 3.90858 3.85834C3.76899 3.99138 3.6294 4.12443 3.48981 4.39052C3.35022 4.52357 3.21063 4.78966 3.35022 5.05576C3.48981 5.32185 4.18777 6.38622 5.16491 7.18449C6.42125 8.24886 7.39839 8.51496 7.81717 8.78105C8.09636 8.91409 8.37554 8.9141 8.65472 8.648C8.93391 8.38191 9.21309 7.98277 9.49228 7.58363C9.77146 7.31754 10.0507 7.1845 10.3298 7.31754C10.609 7.45059 12.2841 8.11582 12.5633 8.38191C12.8425 8.51496 13.1217 8.648 13.1217 8.78105C13.1217 8.78105 13.1217 9.44628 12.9821 10.1115Z" transform="translate(12.9597 12.9597)" fill="#FAFAFA"></path>
              <path d="M0.196998 23.295L0.131434 23.4862L0.323216 23.4223L5.52771 21.6875C7.4273 22.8471 9.47325 23.4274 11.6637 23.4274C18.134 23.4274 23.4274 18.134 23.4274 11.6637C23.4274 5.19344 18.134 -0.1 11.6637 -0.1C5.19344 -0.1 -0.1 5.19344 -0.1 11.6637C-0.1 13.9996 0.624492 16.3352 1.93021 18.2398L0.196998 23.295ZM5.87658 19.8847L5.84025 19.8665L5.80154 19.8788L2.78138 20.8398L3.73978 17.9646L3.75932 17.906L3.71562 17.8623L3.43104 17.5777C2.27704 15.8437 1.55796 13.8245 1.55796 11.6637C1.55796 6.03288 6.03288 1.55796 11.6637 1.55796C17.2945 1.55796 21.7695 6.03288 21.7695 11.6637C21.7695 17.2945 17.2945 21.7695 11.6637 21.7695C9.64222 21.7695 7.76778 21.1921 6.18227 20.039L6.17557 20.0342L6.16817 20.0305L5.87658 19.8847Z" transform="translate(7.7758 7.77582)" fill="white" stroke="white" strokeWidth="0.2"></path>
            </svg>
          </a>
          {showWhatsAppBubble && (
            <div className="absolute z-10 md:block hidden right-[52px] md:right-16 top-0 md:top-2 h-auto w-44 text-gray-900 text-center bg-white rounded-lg shadow-xl border border-gray-200 before:absolute before:-right-[6px] before:top-2/4 before:-translate-y-2/4 before:border-[6px] before:border-r-0 before:border-transparent before:border-l-white py-2 px-3">
              <small className="text-xs font-semibold text-gray-800 block">WhatsApp Support</small>
              <span className="text-[11px] text-primary font-bold block">+88 01798-565001</span>
              <button
                onClick={() => setShowWhatsAppBubble(false)}
                className="absolute z-10 -left-2 -top-2 size-5 grid place-items-center bg-gray-200 hover:bg-gray-300 p-0.5 rounded-full text-gray-700 transition-colors"
                type="button"
                aria-label="Close chat bubble"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};
