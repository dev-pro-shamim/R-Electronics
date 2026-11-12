export interface PolicyPage {
  slug: string;
  title: string;
  lastUpdated: string;
  content: string;
}

export const POLICIES: Record<string, PolicyPage> = {
  "about-us": {
    slug: "about-us",
    title: "About Rango Electronics",
    lastUpdated: "January 2026",
    content: `
      <h2>Welcome to Rango Electronics</h2>
      <p>Rango Electronics (RangoElectronics.com) is one of the most trusted and customer-focused consumer electronics and home appliance retailers in Bangladesh. Founded with a vision to deliver 100% genuine products, unmatched customer service, and flexible purchasing solutions, Rango Electronics brings the latest global technology right to your doorstep.</p>

      <h3>Our Mission</h3>
      <p>To empower households and professionals across Bangladesh with authentic, reliable, and energy-efficient consumer electronics, televisions, smart cooling systems, refrigerators, washing machines, and personal gadgets at honest, competitive prices backed by genuine manufacturer warranties.</p>

      <h3>Why Choose Rango Electronics?</h3>
      <ul>
        <li><strong>100% Authentic Brand Sourcing:</strong> Every television, air conditioner, and home appliance is sourced through authorized distributor channels.</li>
        <li><strong>Official Manufacturer Warranty:</strong> Enjoy official brand warranties with service and parts covered nationwide.</li>
        <li><strong>0% EMI Payment Solutions:</strong> Up to 36 months zero-interest EMI facility with 29 leading commercial banks.</li>
        <li><strong>Express Nationwide Delivery:</strong> Safe and insured delivery inside Dhaka within 24-48 hours and across all 64 districts.</li>
        <li><strong>Expert After-Sales Support:</strong> Dedicated customer support and professional technician assistance for installation and maintenance.</li>
      </ul>

      <h3>Physical Showroom & Office</h3>
      <p>Visit our flagship store and experience center at:<br/>
      <strong>Rango Electronics (রঙ্গ ইলেকট্রনিক্স)</strong><br/>
      H-11 R-11 DIT Project Merul Badda Dhaka, Bangladesh.<br/>
      Hotline: <a href="tel:+8801798565001" style="color: #006A4E; font-weight: bold;">+88 01798-565001</a> | <a href="tel:+8801554565001" style="color: #006A4E; font-weight: bold;">+88 01554-565001</a><br/>
      Email: <a href="mailto:electronics.rango@gmail.com" style="color: #006A4E; font-weight: bold;">electronics.rango@gmail.com</a>
      </p>

      <h3>Store Location on Google Maps</h3>
      <iframe src="https://maps.google.com/maps?q=rango%20electronics&t=m&z=17&output=embed&iwloc=near" style="width: 100%; height: 380px; border: 0; border-radius: 12px; margin-top: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" allowfullscreen="" loading="lazy"></iframe>
    `
  },
  "contact-us": {
    slug: "contact-us",
    title: "Contact Us - Rango Electronics",
    lastUpdated: "January 2026",
    content: `
      <h2>We Are Here to Assist You</h2>
      <p>Have questions regarding an order, product specifications, warranty support, or EMI options? Our customer care specialists are available 7 days a week from 9:00 AM to 10:00 PM.</p>

      <h3>Hotline & Phone Support</h3>
      <p>
      Primary Hotline: <a href="tel:+8801798565001" style="color: #006A4E; font-weight: bold;">+88 01798-565001</a><br/>
      Secondary Hotline: <a href="tel:+8801554565001" style="color: #006A4E; font-weight: bold;">+88 01554-565001</a><br/>
      WhatsApp Support: <a href="https://wa.me/8801798565001" target="_blank" style="color: #25D366; font-weight: bold;">+88 01798-565001 (Chat on WhatsApp)</a>
      </p>

      <h3>Official Email</h3>
      <p>Customer Support: <a href="mailto:electronics.rango@gmail.com" style="color: #006A4E; font-weight: bold;">electronics.rango@gmail.com</a></p>

      <h3>Showroom & Office Location</h3>
      <p>
      <strong>Rango Electronics (রঙ্গ ইলেকট্রনিক্স)</strong><br/>
      Location: H-11 R-11 DIT Project Merul Badda Dhaka, Bangladesh.
      </p>

      <h3>Connect With Us on Social Media</h3>
      <ul>
        <li><a href="https://www.facebook.com/rangoelectronics" target="_blank" style="color: #006A4E;">Facebook: @rangoelectronics</a></li>
        <li><a href="https://www.instagram.com/rangoelectronics/" target="_blank" style="color: #006A4E;">Instagram: @rangoelectronics</a></li>
        <li><a href="https://www.youtube.com/@RangoElectronics" target="_blank" style="color: #006A4E;">YouTube: @RangoElectronics</a></li>
        <li><a href="https://x.com/Rangoelectro" target="_blank" style="color: #006A4E;">Twitter / X: @Rangoelectro</a></li>
        <li><a href="https://www.tiktok.com/@rango.electronics" target="_blank" style="color: #006A4E;">TikTok: @rango.electronics</a></li>
        <li><a href="https://www.pinterest.com/rangoelectronics/" target="_blank" style="color: #006A4E;">Pinterest: @rangoelectronics</a></li>
      </ul>

      <h3>Store Location on Google Maps</h3>
      <iframe src="https://maps.google.com/maps?q=rango%20electronics&t=m&z=17&output=embed&iwloc=near" style="width: 100%; height: 420px; border: 0; border-radius: 12px; margin-top: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" allowfullscreen="" loading="lazy"></iframe>
    `
  },
  "store-locator": {
    slug: "store-locator",
    title: "Store Locator - Rango Electronics",
    lastUpdated: "January 2026",
    content: `
      <h2>Find Our Store</h2>
      <p>Visit our flagship electronics experience store in Dhaka. You can experience the latest Smart OLED/QLED TVs, Inverter Air Conditioners, French Door Refrigerators, and Home Appliances in person.</p>

      <h3>Rango Electronics Flagship Store</h3>
      <p>
      <strong>Address:</strong> H-11 R-11 DIT Project Merul Badda Dhaka, Bangladesh.<br/>
      <strong>Hotline:</strong> <a href="tel:+8801798565001" style="color: #006A4E; font-weight: bold;">+88 01798-565001</a> | <a href="tel:+8801554565001" style="color: #006A4E; font-weight: bold;">+88 01554-565001</a><br/>
      <strong>Email:</strong> <a href="mailto:electronics.rango@gmail.com" style="color: #006A4E; font-weight: bold;">electronics.rango@gmail.com</a><br/>
      <strong>Store Hours:</strong> Open 7 Days a Week, 9:30 AM - 10:00 PM
      </p>

      <h3>Interactive Google Maps</h3>
      <iframe src="https://maps.google.com/maps?q=rango%20electronics&t=m&z=17&output=embed&iwloc=near" style="width: 100%; height: 450px; border: 0; border-radius: 12px; margin-top: 15px; box-shadow: 0 4px 14px rgba(0,0,0,0.12);" allowfullscreen="" loading="lazy"></iframe>
    `
  },
  "privacy-policy": {
    slug: "privacy-policy",
    title: "Privacy Policy",
    lastUpdated: "January 2026",
    content: `
      <h2>Rango Electronics Privacy Policy</h2>
      <p>At Rango Electronics (accessible from RangoElectronics.com), customer privacy is one of our top priorities. This Privacy Policy outlines the types of information collected and recorded by Rango Electronics and how we use it.</p>
      <h3>Information We Collect</h3>
      <p>When you register for an account, make an order, or contact us, we may collect your name, email address, phone number, delivery address, and payment transaction references. We do not store sensitive payment card credentials directly; all payments are processed through PCI-DSS certified payment gateways.</p>
      <h3>How We Use Your Information</h3>
      <ul>
        <li>Process, dispatch, and track your orders.</li>
        <li>Send order status notifications via SMS and email.</li>
        <li>Provide after-sales service and warranty verification.</li>
        <li>Prevent fraud and enhance platform security.</li>
      </ul>
    `
  },
  "emi-and-payment-policy": {
    slug: "emi-and-payment-policy",
    title: "EMI and Payment Policy",
    lastUpdated: "January 2026",
    content: `
      <h2>0% Interest EMI Facility (Up to 36 Months)</h2>
      <p>Rango Electronics offers 0% EMI (Equated Monthly Instalment) facilities with 30 leading partner commercial banks in Bangladesh via SSLCOMMERZ for credit card holders (minimum purchase amount ৳5,000).</p>
      <h3>Partner Commercial Banks (30 Banks)</h3>
      <ul>
        <li>Standard Chartered Bank (SCB)</li>
        <li>Eastern Bank Limited (EBL)</li>
        <li>Dutch-Bangla Bank Limited (DBBL)</li>
        <li>Mutual Trust Bank Limited (MTB)</li>
        <li>Southeast Bank Limited (SEBL - Up to 36 Months)</li>
        <li>Dhaka Bank Limited (DBL)</li>
        <li>Prime Bank Limited</li>
        <li>Bank Asia Limited (BAL)</li>
        <li>United Commercial Bank (UCBL)</li>
        <li>One Bank LTD., Exim Bank, SIBL, Premier Bank, Standard Bank, LankaBangla Finance, NRBC, SBAC, Midland, Pubali, Modhumoti, AB Bank, Meghna, Al-Arafah, Islami Bank, NRB Bank, NCC Bank, Jamuna Bank, Community Bank, Trust Bank, Mercantile Bank.</li>
      </ul>
      <p><em>Note: City Bank and BRAC Bank are excluded from the current automated online EMI channel.</em></p>
      <p>For EMI support and card operations assistance, call SSLCOMMERZ Operations Hotline: <strong>09677725222</strong> (9:00 AM to 11:00 PM, 365 Days).</p>
      <h3>Payment Methods Accepted</h3>
      <ul>
        <li>Cash on Delivery (COD) for eligible locations.</li>
        <li>Mobile Financial Services (MFS): bKash, Nagad, Rocket, Upay.</li>
        <li>Credit / Debit Cards (Visa, MasterCard, Amex, UnionPay) via secure payment gateway.</li>
        <li>Direct Bank Transfer for corporate purchases.</li>
      </ul>
    `
  },
  "warranty-policy": {
    slug: "warranty-policy",
    title: "Warranty Policy",
    lastUpdated: "January 2026",
    content: `
      <h2>Official Manufacturer Warranty</h2>
      <p>Every product sold on RangoElectronics.com is 100% brand original and accompanied by the official manufacturer's warranty card.</p>
      <h3>Warranty Coverage Breakdown</h3>
      <ul>
        <li><strong>Televisions:</strong> Up to 5 Years Panel Warranty, 2 Years Spare Parts, and 5 Years Free Service Warranty.</li>
        <li><strong>Air Conditioners:</strong> Up to 10 Years Compressor Warranty, 1 Year Spare Parts, and 1 Year Free Service.</li>
        <li><strong>Refrigerators & Freezers:</strong> Up to 10-12 Years Compressor Warranty, 2 Years Spare Parts.</li>
        <li><strong>Washing Machines:</strong> Up to 10 Years Motor Warranty, 1 Year Spare Parts.</li>
        <li><strong>Smartphones & Tablets:</strong> 1 Year Official Brand Warranty with BTRC Approval.</li>
      </ul>
    `
  },
  "delivery-terms-and-conditions": {
    slug: "delivery-terms-and-conditions",
    title: "Delivery Policy & Terms",
    lastUpdated: "January 2026",
    content: `
      <h2>Fast and Reliable Nationwide Delivery</h2>
      <p>Rango Electronics provides express shipping across all 64 districts in Bangladesh with safe protective packaging.</p>
      <h3>Delivery Timeline</h3>
      <ul>
        <li><strong>Inside Dhaka City:</strong> 24 to 48 Hours. Regular shipping charge: ৳60 (Free on promotional items).</li>
        <li><strong>Outside Dhaka / All Bangladesh:</strong> 48 to 72 Hours via reputed courier partners. Regular shipping charge: ৳120.</li>
      </ul>
      <h3>Inspection at Delivery</h3>
      <p>Customers are advised to check the physical condition of the package and unit in the presence of the delivery agent before confirming receipt.</p>
    `
  },
  "refund-policy": {
    slug: "refund-policy",
    title: "Refund Policy",
    lastUpdated: "January 2026",
    content: `
      <h2>Hassle-Free Refund Process</h2>
      <p>If an item delivered is found physically damaged, malfunctioning on arrival, or differing from description, Rango Electronics provides prompt refunds or replacements within 7 business days.</p>
      <p>Refunds are credited back to the original payment channel (bKash/Nagad/Card) within 5-10 working days as per standard banking procedures.</p>
    `
  },
  "return-policy": {
    slug: "return-policy",
    title: "Return Policy",
    lastUpdated: "January 2026",
    content: `
      <h2>7-Day Easy Return Policy</h2>
      <p>To initiate a return, notify our customer care team within 7 days of delivery with the order number and proof of condition. Returned products must have intact original packaging, warranty documentation, and accessories.</p>
    `
  },
  "term-and-conditions": {
    slug: "term-and-conditions",
    title: "Terms and Conditions",
    lastUpdated: "January 2026",
    content: `
      <h2>Terms & Conditions of Service</h2>
      <p>Welcome to RangoElectronics.com. By browsing, purchasing, or using services on this website, you agree to comply with and be bound by the following terms and conditions.</p>
      <h3>Pricing and Availability</h3>
      <p>All prices are listed in Bangladeshi Taka (BDT) and are inclusive of applicable VAT unless stated otherwise. Stock availability is updated continuously, but in rare cases of stock depletion, our team will contact you promptly with alternate options or immediate refund.</p>
    `
  },
  "faq": {
    slug: "faq",
    title: "Frequently Asked Questions (FAQs)",
    lastUpdated: "January 2026",
    content: `
      <h2>Frequently Asked Questions</h2>
      <div class="space-y-4">
        <div>
          <h4>Are the products sold on Rango Electronics 100% genuine?</h4>
          <p>Yes. All products are 100% authentic, brand-new, and sourced through official manufacturer and authorized distributor channels.</p>
        </div>
        <div>
          <h4>How do I avail 0% EMI?</h4>
          <p>Select the EMI option at checkout or contact our support team. We partner with over 28 commercial banks to provide zero-interest EMI from 3 up to 36 months.</p>
        </div>
        <div>
          <h4>Do you deliver outside Dhaka?</h4>
          <p>Yes, we deliver to all 64 districts across Bangladesh through secure insured courier networks.</p>
        </div>
        <div>
          <h4>How can I track my order?</h4>
          <p>Visit our Track Order page and enter your Order ID and contact phone number for real-time delivery status.</p>
        </div>
      </div>
    `
  }
};
