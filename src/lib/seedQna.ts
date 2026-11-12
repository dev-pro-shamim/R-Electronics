import { PRODUCTS, Product } from "@/data/products";
import { ProductQuestionRecord } from "@/types/admin";

const CUSTOMER_NAMES = [
  "Tanvir Ahmed",
  "Nusrat Jahan",
  "Mahmudul Hasan",
  "Farhana Akter",
  "Sajjad Hossain",
  "Tasnim Sultana",
  "Rakibul Islam",
  "Mehedi Hasan",
  "Nadia Rahman",
  "Ariful Haque",
  "Shafiqul Alam",
  "Kamrul Hasan",
];

function deterministicHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function buildCategoryQuestions(
  p: Product,
  h: number
): { q: string; a: string }[] {
  const title = p.title;
  const brand = p.brand || "Original Brand";
  const warranty = p.warranty || "Official Brand Warranty";
  const cat = (p.category || "").toLowerCase();
  const emiLine =
    p.emiAvailable && p.price >= 5000
      ? `Yes! ${title} qualifies for 0% Interest EMI for up to 36 months across 30+ commercial bank credit cards starting around ৳${Math.round(
          p.price / 36
        ).toLocaleString()}/month.`
      : `Full payment via Cash on Delivery, bKash, Nagad, or card is available across Bangladesh.`;

  if (cat.includes("air-conditioner")) {
    const isTwoTon = /2\s*ton|24000/i.test(title);
    const areaHint = isTwoTon ? "180–250 sq ft" : "120–170 sq ft";
    return [
      {
        q: `Does ${title} have a 100% copper condenser and what room size is ideal?`,
        a: `Yes, this genuine ${brand} AC features a 100% pure copper condenser with anti-corrosion fins and is ideal for cooling ${areaHint} rooms efficiently even in peak summer.`,
      },
      {
        q: `Is installation and copper pipe included with ${title}?`,
        a: `Inside Dhaka, Rango Electronics arranges fast technician installation support. You receive the standard indoor/outdoor connecting kit with ${warranty}.`,
      },
      {
        q: `Can I purchase ${title} on 0% EMI and how fast is delivery?`,
        a: `${emiLine} Same-day or next-day express delivery is available in Dhaka and 48–72 hours nationwide.`,
      },
    ];
  }

  if (cat.includes("geyser") || /geyser|water heater/i.test(title)) {
    const literMatch = title.match(/(\d+\s*(?:liter|ltr|l))/i);
    const cap = literMatch ? literMatch[1] : "high-capacity";
    return [
      {
        q: `Does this ${brand} (${cap}) geyser include auto cut-off thermostat and rust protection?`,
        a: `Yes, ${title} comes equipped with an automatic thermal cut-off, dry-heating protection, and heavy-duty anti-rust inner tank lining for safe daily hot water supply.`,
      },
      {
        q: `What wattage MCB breaker is recommended for ${title}?`,
        a: `A standard 16A–20A dedicated power socket with proper earthing is recommended for optimal safety and heating speed. Covered under ${warranty}.`,
      },
      {
        q: `Do you deliver and offer wall-hanging support across Bangladesh?`,
        a: `Yes, we ship ${title} nationwide in protective foam packaging with 24–48 hour delivery inside Dhaka. ${emiLine}`,
      },
    ];
  }

  if (cat.includes("washing-machine")) {
    const isFrontLoad = /front load/i.test(title);
    return [
      {
        q: `Does ${title} work well with regular rooftop tank water pressure?`,
        a: `Yes, ${brand} ${
          isFrontLoad ? "Front Load Inverter" : "Top Load Automatic"
        } models are built for Bangladesh household water supply and automatically adjust water intake level.`,
      },
      {
        q: `How noisy is the spin cycle and what is covered under warranty?`,
        a: `The low-vibration inverter motor keeps noise and electricity consumption minimal. It includes official ${brand} ${warranty} from Rango Electronics.`,
      },
      {
        q: `Are inlet hose and demo setup instructions included?`,
        a: `Yes, the factory inlet water pipe, drain hose, and user manual are sealed inside the box. ${emiLine}`,
      },
    ];
  }

  if (cat.includes("television") || /\btv\b/i.test(title)) {
    return [
      {
        q: `Does ${title} support Netflix, YouTube, and local Play Store apps natively?`,
        a: `Yes! ${title} comes with official Smart TV OS, dual-band Wi-Fi, built-in YouTube/Netflix support, and Bluetooth wireless audio connectivity.`,
      },
      {
        q: `Is a wall mount bracket included inside the box?`,
        a: `Standard tabletop stands are included in every box, and most ${brand} Smart TV packages also support VESA wall mounting. Let us know at checkout if you want a wall bracket arranged.`,
      },
      {
        q: `What panel warranty is provided on ${title}?`,
        a: `You receive 100% genuine ${brand} coverage (${warranty}) with official cash memo & Rango Electronics verification.`,
      },
    ];
  }

  if (cat.includes("refrigerator")) {
    return [
      {
        q: `Does ${title} require an external voltage stabilizer?`,
        a: `${title} uses wide-voltage inverter compressor technology designed for Bangladesh power conditions (typically 135V–290V). A stabilizer is optional unless your area faces severe surges.`,
      },
      {
        q: `What is the compressor warranty for this ${brand} fridge?`,
        a: `Every genuine ${brand} refrigerator from Rango Electronics includes ${warranty} plus factory-sealed compressor protection.`,
      },
      {
        q: `Is 0% EMI and home delivery inside Dhaka available?`,
        a: `${emiLine} Our dedicated Rango Express fleet delivers straight to your doorstep with careful unpacking verification.`,
      },
    ];
  }

  if (cat.includes("water-purifier")) {
    return [
      {
        q: `Does ${title} handle high TDS and iron water common in Dhaka apartments?`,
        a: `Yes! Multi-stage filtration in ${title} removes dissolved solids (TDS), odor, bacteria, and heavy metals to deliver safe drinking water directly from your tap.`,
      },
      {
        q: `Are replacement filter cartridges easily available later?`,
        a: `Yes, Rango Electronics stocks genuine replacement sediment, carbon, and membrane cartridges with doorstep reminder support.`,
      },
      {
        q: `What warranty and EMI options are offered on ${title}?`,
        a: `Covered by ${warranty}. ${emiLine}`,
      },
    ];
  }

  if (cat.includes("microwave")) {
    return [
      {
        q: `Can ${title} reheat, defrost, and cook daily family meals comfortably?`,
        a: `Yes, this ${brand} microwave oven is tuned for fast reheating, even defrosting, and Bangladeshi kitchen recipes with safety child-lock.`,
      },
      {
        q: `Is the glass turntable and starter guide inside the sealed box?`,
        a: `Yes, the factory-sealed carton includes the tempered glass turntable, roller ring, and user manual with ${warranty}.`,
      },
      {
        q: `How quickly can I get delivery and payment verification?`,
        a: `Inside Dhaka orders arrive within 24–48 hours with Cash on Delivery, bKash, Nagad, or card payment. ${emiLine}`,
      },
    ];
  }

  const pickIdx = h % 2;
  return [
    {
      q:
        pickIdx === 0
          ? `Is ${title} 100% original ${brand} with official warranty?`
          : `What warranty is provided if I buy ${title} online?`,
      a: `Yes, 100% authentic factory-sealed ${brand} unit supplied by Rango Electronics with ${warranty} and official printed invoice.`,
    },
    {
      q: `What are the delivery time and payment options for ${title}?`,
      a: `Inside Dhaka delivery takes 24–48 hours and outside Dhaka 2–4 working days via Steadfast/Pathao/RedX. You can pay via COD, bKash, Nagad, or card.`,
    },
    {
      q: `Is 0% EMI available on ${title}?`,
      a: emiLine,
    },
  ];
}

export function buildSeedProductQuestions(
  products: Product[] = PRODUCTS
): ProductQuestionRecord[] {
  const result: ProductQuestionRecord[] = [];
  const baseTime = new Date("2026-10-01T10:00:00Z").getTime();

  for (let pIdx = 0; pIdx < products.length; pIdx++) {
    const p = products[pIdx];
    const h = deterministicHash(p.id + p.title);
    const qaList = buildCategoryQuestions(p, h);

    qaList.forEach((qa, qIdx) => {
      const name = CUSTOMER_NAMES[(h + qIdx * 3) % CUSTOMER_NAMES.length];
      const dayOffset = ((h + qIdx * 7) % 35) * 86400000;
      const createdAt = new Date(baseTime + dayOffset).toISOString();
      const answeredAt = new Date(baseTime + dayOffset + 5400000).toISOString();

      result.push({
        id: `qa-seed-${p.id}-${qIdx + 1}`,
        productId: p.id,
        productSlug: p.slug,
        productTitle: p.title,
        customerName: name,
        userName: name,
        question: qa.q,
        answer: qa.a,
        answeredBy: "Rango Electronics Specialist",
        status: "Answered",
        isTestData: false,
        createdAt,
        answeredAt,
      });
    });
  }

  return result;
}
