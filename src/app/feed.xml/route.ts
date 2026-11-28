import { NextResponse } from "next/server";
import { PRODUCTS } from "@/data/products";

export const dynamic = "force-dynamic";

function escapeXml(unsafe: string): string {
  return (unsafe || "")
    .replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "&": return "&amp;";
        case "'": return "&apos;";
        case '"': return "&quot;";
        default: return c;
      }
    });
}

function cleanText(text: string): string {
  return (text || "")
    .replace(/<[^>]*>?/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  const baseUrl = "https://rangoelectronics.com";

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Rango Electronics Product Feed</title>
    <link>${baseUrl}</link>
    <description>100% Genuine Electronics and Appliances with Official Warranty &amp; 0% EMI in Bangladesh</description>
`;

  for (const product of PRODUCTS) {
    if ((product as any).status === "draft" || (product as any).status === "archived") continue;

    const id = product.sku || product.id;
    const title = escapeXml(product.title);
    const plainDesc = escapeXml(cleanText(product.shortDescription || product.description || product.title).slice(0, 500));
    const link = `${baseUrl}/product/${product.slug}`;
    const rawImage = product.thumbnail || product.images?.[0] || "/logo.png";
    const imageLink = rawImage.startsWith("http") ? rawImage : `${baseUrl}${rawImage}`;
    const availability = product.isStockOut || (typeof product.stock === "number" && product.stock <= 0) ? "out_of_stock" : "in_stock";
    const price = `${product.price} BDT`;
    const brand = escapeXml(product.brand || "Rango Electronics");
    const mpn = escapeXml(product.model || product.sku || product.id);
    const category = escapeXml(`${product.category} > ${product.subcategory || ''}`);

    xml += `    <item>
      <g:id>${escapeXml(id)}</g:id>
      <g:title>${title}</g:title>
      <g:description>${plainDesc}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      <g:brand>${brand}</g:brand>
      <g:mpn>${mpn}</g:mpn>
      <g:product_type>${category}</g:product_type>
    </item>
`;
  }

  xml += `  </channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
