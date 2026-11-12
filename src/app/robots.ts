import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/account", "/cart", "/checkout", "/invoice"],
      },
    ],
    sitemap: "https://rangoelectronics.com/sitemap.xml",
  };
}
