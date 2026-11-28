import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/feed.xml", "/api/feed/google-shopping"],
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/account",
          "/account/",
          "/cart",
          "/checkout",
          "/invoice",
          "/*?*q=",
          "/*?*search=",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin", "/admin/", "/account", "/cart", "/checkout", "/invoice"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/products/", "/banners/", "/logo.png"],
      },
    ],
    sitemap: "https://rangoelectronics.com/sitemap.xml",
    host: "https://rangoelectronics.com",
  };
}
