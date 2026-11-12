# Rango Electronics

Enterprise E-Commerce Platform built with **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**.

## Features

- **Storefront**: High-performance catalog browsing, category filtering, instant search, responsive banners, 0% EMI calculation, and fast checkout.
- **Strict Validation**: 11-digit Bangladeshi mobile number validation and anti-bot order protection.
- **Landing Page Engine**: Built-in drag-and-drop landing page system (`/lp/[slug]`) with product showcases, specs slider, and customer reviews.
- **Admin Dashboard (`/admin`)**:
  - Unified live order management with inline payment approval and TrxID verification.
  - 1-Click Courier booking & bulk dispatch (Steadfast, Pathao, RedX).
  - 12-step Product Wizard with automatic SEO slug generation and plain-text specification parsing.
  - Multi-invoice batch printing.
  - Role-based access control (RBAC).
  - Reviews and Q&A moderation.
- **Accounting & Finance**: Real-time multi-account ledger, P&L reporting, and transaction history.

## Getting Started

First, install dependencies:

```bash
npm install
```

Set up your environment variables in `.env.local` (see `.env.example`).

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Production Build

```bash
npm run build
npm start
```
