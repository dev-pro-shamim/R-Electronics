"use client";

import React, { useEffect, useState } from "react";
import Script from "next/script";
import { useStoreRuntime } from "@/lib/useStoreRuntime";

export const TrackingScripts: React.FC = () => {
  const runtime = useStoreRuntime();
  const tracking = runtime?.tracking;
  const [consentGiven, setConsentGiven] = useState(true);
  const [showConsentBar, setShowConsentBar] = useState(false);

  useEffect(() => {
    if (!tracking) return;
    if (tracking.consentRequired) {
      const saved = localStorage.getItem("rango_tracking_consent");
      if (saved === "granted") {
        setConsentGiven(true);
        setShowConsentBar(false);
      } else if (saved === "denied") {
        setConsentGiven(false);
        setShowConsentBar(false);
      } else {
        setConsentGiven(false);
        setShowConsentBar(true);
      }
    } else {
      setConsentGiven(true);
      setShowConsentBar(false);
    }
  }, [tracking]);

  if (!tracking) return null;

  return (
    <>
      {consentGiven && tracking.gtmEnabled && tracking.gtmContainerId && (
        <Script id="rango-gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${tracking.gtmContainerId}');`}
        </Script>
      )}

      {consentGiven && tracking.ga4MeasurementId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${tracking.ga4MeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="rango-ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${tracking.ga4MeasurementId}');`}
          </Script>
        </>
      )}

      {consentGiven && tracking.metaPixelEnabled && tracking.metaPixelId && (
        <Script id="rango-meta-pixel-init" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
          document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${tracking.metaPixelId}'); fbq('track', 'PageView');`}
        </Script>
      )}

      {showConsentBar && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:max-w-md z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex flex-col gap-3">
          <p className="text-xs leading-relaxed text-slate-200">
            Rango Electronics uses cookies &amp; analytics tags to improve product recommendations and offers.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("rango_tracking_consent", "denied");
                setConsentGiven(false);
                setShowConsentBar(false);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("rango_tracking_consent", "granted");
                setConsentGiven(true);
                setShowConsentBar(false);
              }}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#0084C7] hover:bg-[#006DA6] text-white"
            >
              Accept Cookies
            </button>
          </div>
        </div>
      )}
    </>
  );
};
