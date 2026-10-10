# HEAVEN — Luxury Perfume E-Commerce Platform

HEAVEN is an enterprise-grade luxury perfume e-commerce platform built with Next.js (App Router), TypeScript, Tailwind CSS, and Prisma ORM with SQLite (and direct PostgreSQL compatibility).

The platform features three distinct, role-separated portals:
1. **Customer Storefront & Private Lounge** (`/`, `/intro`, `/login`, `/register`, `/home`, `/products`, `/cart`, `/checkout`, `/orders`, `/account`)
2. **Admin Management Console** (`/admin/login`, `/admin/dashboard`, `/admin/products`, `/admin/categories`, `/admin/orders`, `/admin/inventory`, `/admin/delivery-partners`, `/admin/reports`, `/admin/settings`, `/admin/audit-logs`)
3. **White-Glove Courier Dispatch Portal** (`/delivery/login`, `/delivery/dashboard`, `/delivery/orders`, `/delivery/history`, `/delivery/earnings`, `/delivery/profile`)

---

## Architecture & Technology Stack

- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling & Design System**: Tailwind CSS with custom monochromatic luxury tokens (`#0A0A0A`, `#FFFFFF`, `#C5A059` gold accents, `Cinzel` serif and `Montserrat` sans-serif typography)
- **Database & ORM**: Prisma ORM with SQLite (`dev.db`) for local zero-configuration development, fully relational with foreign keys, cascading rules, unique indexes, and ACID transactions. Compatible with PostgreSQL via `DATABASE_URL`.
- **Authentication & Security**:
  - Secure bcrypt password hashing with salt rounds
  - Cryptographically signed JWT tokens with 7-day expiration (`jose` HS256)
  - `httpOnly`, `sameSite: 'lax'`, `secure` session cookies
  - Next.js Edge Middleware route guards enforcing role segregation (`ADMIN`, `DELIVERY_PARTNER`, `CUSTOMER`)
  - Prevention of privilege escalation during public registration (public registration is locked to `CUSTOMER`)
  - Generic authentication error messages to mitigate account enumeration
- **Multimedia & 4K Sensory Intro**:
  - 4K video intro asset located at `/public/assets/heaven_intro_4k.webm`
  - High-resolution sliced fragrance imagery extracted from master perfume photographs in `/public/images/products/`
  - Dedicated `/intro` page and modal with graceful fallback, skip controls, and sound toggling.

---

## Getting Started

### 1. Prerequisites
- Node.js v18+ (tested on Node v26)
- npm v9+

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default variables in `.env`:
```ini
DATABASE_URL="file:./dev.db"
JWT_SECRET="heaven-luxury-perfume-super-secure-jwt-secret-key-2026-99"
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Migration & Seed
Run Prisma to create SQLite tables and seed initial catalogue, categories, and privileged accounts:
```bash
npm run db:push
npm run db:seed
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Seeded Development Accounts

| Portal | Email | Role | Notes |
| :--- | :--- | :--- | :--- |
| **Admin Management Console** | `24eg105t14@anurag.edu.in` | `ADMIN` | Storefront management, orders, catalog, dispatches |
| **Customer Private Lounge** | `pitallachandu99@gmail.com` | `CUSTOMER` | Storefront browsing, cart, checkout, order history |
| **Delivery Courier Portal** | `delivery@heaven.com` | `DELIVERY_PARTNER` | White-glove courier dispatches and deliveries |

> **Security Note:** Passwords and password hashes are strictly redacted and never exposed in the dashboard UI, API responses, customer dossiers, or export files. All authentication is verified using bcrypt hashing.

---

## Route Separation Matrix

| Route | Role Permitted | Behavior if Unauthorized |
| :--- | :--- | :--- |
| `/` | Public | Accessible to all |
| `/intro` | Public | Accessible to all (4K intro with skip & fallback) |
| `/login` | Public / Guest | Redirects authenticated users to their portal |
| `/register` | Public / Guest | Redirects authenticated users to their portal |
| `/admin/login` | Public / Guest | Authenticates admin credentials only |
| `/admin/dashboard` | `ADMIN` | Middleware redirects unauthenticated/non-admin to `/admin/login` |
| `/delivery/login` | Public / Guest | Authenticates courier partner credentials only |
| `/delivery/dashboard` | `DELIVERY_PARTNER` | Middleware redirects unauthenticated/non-courier to `/delivery/login` |
| `/account`, `/orders`, `/checkout` | `CUSTOMER` | Middleware redirects to `/login` |

---

## Verification & Testing Instructions

Run the production build:
```bash
npm run build
```

Run automated Module 1 regression tests:
```bash
node scripts/test_module1.js
```

Run automated Module 2 acceptance and regression tests:
```bash
node scripts/test_module2.js
```

Run automated Module 3 direct data integrity and transaction tests:
```bash
node scripts/verify_module3_direct.js
```

Run automated Module 3 end-to-end API and checkout tests:
```bash
node scripts/test_module3.js
```

Run automated Module 4 admin dashboard and operational management suite:
```bash
node scripts/test_module4.js
```

Run automated Module 5 delivery partner dashboard and logistics QA suite:
```bash
node scripts/test_module5.js
```

Run credential privacy and clean operational state verification:
```bash
node scripts/verify_credentials_and_clean_admin.js
```

---

## Completed Modules

- [x] **MODULE 1**: Foundation, SQLite/PostgreSQL Database Architecture, Monochromatic Luxury Design System, 4K Sensory Intro Experience, Role-Segregated Authentication & Edge Route Guards.
- [x] **MODULE 2**: Customer Shopping Experience, Database Catalogue, Dynamic Filtering & Olfactive Search, Fragrance Notes Breakdown, Persistent Cart, Live Steppers, Stock Enforcement, Wishlist, and Client Account Lounge.
- [x] **MODULE 3**: Checkout, Address Management, Simulated Payment Flow, Atomic Inventory Deductions, Idempotency, Order History, Status Timelines & Leaflet OpenStreetMap Tracking.
- [x] **MODULE 4**: Executive Admin Management Console, Products & Categories CRUD, Order Status Transitions & Stock Restoration, Courier Fleet Allocation, Customer Privacy Dossiers, Cellar Inventory Ledger, Financial Analytics, Formula-Safe CSV Export, Store Configuration & Audit Trail.
- [x] **MODULE 5**: White-Glove Delivery Partner Dashboard, Live GPS Corridor Telemetry, Step-by-Step Custody Handover Workflow, Delivery Exception Handling, Historical Run Archive & Demonstration Compensation Analytics.

---

## Known Limitations & Development Fallbacks
1. **Database**: Local SQLite (`dev.db`) is used as a zero-configuration relational fallback since a local PostgreSQL daemon was not active on the system. The Prisma schema is fully ANSI-SQL compliant and can switch to PostgreSQL by changing `provider = "postgresql"` in `prisma/schema.prisma`.
2. **Intro Video**: The 4K WebM intro video is pre-rendered and stored at `public/assets/heaven_intro_4k.webm`. If video playback is blocked or unavailable on client devices, an elegant luxury fallback screen with audio controls and an instant "Enter The Boutique" button is displayed.
3. **Simulated Payments**: As mandated for the demonstration project, real banking transactions are simulated. Demonstration UPI, simulated cards, and Cash on Delivery are clearly labeled with demo notices.
4. **Demonstration Courier Earnings**: Partner earnings are simulated at ₹180 per completed delivery as configured in store settings. No actual banking transfers or payment gateways are attached to courier payouts.
5. **Geolocation Telemetry**: Live GPS tracking utilizes browser HTML5 `navigator.geolocation` with graceful fallback when hardware GPS or user permission is not granted. Simulated corridor coordinates between the Flagship Atelier and destination city are rendered on OpenStreetMap / Leaflet.
