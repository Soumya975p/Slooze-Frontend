# Slooze Commodities Management — Full Implementation Guide

> **Stack:** Frontend: Next.js 16 · TypeScript · Tailwind CSS v4 · Apollo Client | Backend: NestJS · GraphQL · Prisma · JWT RBAC
> **Proceed step-by-step.** Complete each step before moving to the next. Copy the provided prompt into GitHub Copilot Chat / Cursor AI for each step.

---

## TABLE OF CONTENTS

- [BACKEND STEPS (1–10)](#backend)
- [FRONTEND STEPS (11–20)](#frontend)
- [Final Wiring & Testing (21–22)](#final)

---

## BACKEND

### STEP 1 — Scaffold NestJS Backend Project

**Action:** Open a NEW terminal outside the `my-app` folder (e.g. inside `slooze/`) and run:

```bash
npm i -g @nestjs/cli
nest new backend
cd backend
```

Choose `npm` as the package manager.

**Then install all required dependencies:**

```bash
npm install @nestjs/graphql @nestjs/apollo apollo-server-express graphql
npm install @prisma/client @nestjs/config
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcryptjs
npm install class-validator class-transformer
npx prisma init
npm install --save-dev prisma @types/bcryptjs @types/passport-jwt
```

---

### STEP 2 — Define Prisma Schema

**File:** `backend/prisma/schema.prisma`

**Copilot Prompt:**
```
Create a Prisma schema for a Commodities Management System with the following models:
1. User — fields: id (cuid), email (unique), password, role (enum: MANAGER | STORE_KEEPER), createdAt, updatedAt
2. Product — fields: id (cuid), name, sku (unique), stock (Int), price (Float), discount (Float, optional), purchase (Float, optional), createdAt, updatedAt, createdBy relation to User
Use PostgreSQL as the datasource. Add all necessary relations.
```

**After writing schema, run:**

```bash
# Set DATABASE_URL in backend/.env first:
# DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/slooze_db"

npx prisma migrate dev --name init
npx prisma generate
```

---

### STEP 3 — Seed the Database

**File:** `backend/prisma/seed.ts`

**Copilot Prompt:**
```
Create a Prisma seed script in TypeScript that:
1. Creates a Manager user: email "manager@slooze.com", password "Password@123" (bcrypt hashed, 10 rounds), role MANAGER
2. Creates a StoreKeeper user: email "keeper@slooze.com", password "Password@123" (bcrypt hashed, 10 rounds), role STORE_KEEPER
3. Seeds 10 sample products with realistic commodity names, SKUs, stock, price, discount, and purchase values
Use @prisma/client. Add "prisma": { "seed": "ts-node prisma/seed.ts" } to package.json.
```

**Run the seed:**

```bash
npm install --save-dev ts-node
npx prisma db seed
```

---

### STEP 4 — Configure App Module

**File:** `backend/src/app.module.ts`

**Copilot Prompt:**
```
Configure the NestJS AppModule to:
1. Import ConfigModule globally with .env support
2. Import GraphQLModule with Apollo driver, autoSchemaFile: true, playground: true, context: ({ req }) => ({ req })
3. Import PrismaModule (a global module that provides PrismaService extending PrismaClient)
4. Import AuthModule and ProductsModule (to be created)
Create PrismaService in src/prisma/prisma.service.ts that extends PrismaClient and implements OnModuleInit with await this.$connect().
```

---

### STEP 5 — Auth Module (Register / Login)

**Directory:** `backend/src/auth/`

**Copilot Prompt:**
```
Create a complete NestJS Auth module with GraphQL resolvers using JWT and bcrypt:

1. auth.module.ts — imports JwtModule (secret from env JWT_SECRET, expiresIn: '7d'), PassportModule, UsersModule
2. auth.service.ts — methods:
   - validateUser(email, password): checks DB, compares bcrypt hash, returns user or null
   - login(email, password): returns { access_token, user: { id, email, role } }
   - me(userId): returns user from DB
3. auth.resolver.ts — GraphQL mutations:
   - login(email: String!, password: String!): AuthPayload
   - Query: me: User (guarded by GqlAuthGuard)
4. jwt.strategy.ts — validates JWT payload, returns { userId, email, role }
5. gql-auth.guard.ts — extends AuthGuard('jwt'), overrides getRequest for GraphQL context
6. roles.guard.ts — checks user.role against @Roles() decorator
7. roles.decorator.ts — creates @Roles(...roles) metadata decorator
8. DTOs: LoginInput { email, password }, AuthPayload { access_token, user }

Return the JWT token on successful login. Throw UnauthorizedException on failure.
```

---

### STEP 6 — Products Module (CRUD)

**Directory:** `backend/src/products/`

**Copilot Prompt:**
```
Create a complete NestJS Products module with GraphQL resolvers:

1. product.model.ts — GraphQL ObjectType with fields: id, name, sku, stock, price, discount, purchase, createdAt, trend (optional computed field)
2. products.service.ts — methods:
   - findAll(filters?: { search?: string }): Product[]
   - findOne(id: string): Product
   - create(input: CreateProductInput, userId: string): Product
   - update(id: string, input: UpdateProductInput): Product
   - delete(id: string): boolean
   All using PrismaService.
3. products.resolver.ts — GraphQL:
   - Query: products(search: String): [Product!]! — accessible by MANAGER and STORE_KEEPER
   - Query: product(id: String!): Product — accessible by MANAGER and STORE_KEEPER
   - Mutation: createProduct(input: CreateProductInput!): Product — MANAGER only
   - Mutation: updateProduct(id: String!, input: UpdateProductInput!): Product — MANAGER only
   - Mutation: deleteProduct(id: String!): Boolean — MANAGER only
4. CreateProductInput and UpdateProductInput DTOs with class-validator decorators
5. Use @UseGuards(GqlAuthGuard, RolesGuard) and @Roles() appropriately
```

---

### STEP 7 — Dashboard Stats Query

**Copilot Prompt:**
```
Add a GraphQL Query to the products resolver (or a new stats resolver) called:
  dashboardStats: DashboardStats — accessible by MANAGER only

DashboardStats ObjectType should return:
- totalEarnings: Float
- totalSales: Int
- totalRevenue: Float
- subscriptions: Int
- recentSales: [RecentSale]   (RecentSale: { name, email, amount })
- monthlySalesData: [MonthlyStat]  (MonthlyStat: { month, value })
- weeklyOverviewData: [WeeklyStat] (WeeklyStat: { day, revenue, expenses })

Compute these from the Products table (use price * stock for earnings, count for sales, etc.) or return realistic mock/computed values from the seed data.
```

---

### STEP 8 — CORS & Environment Config

**File:** `backend/src/main.ts`

**Copilot Prompt:**
```
Update NestJS main.ts to:
1. Enable CORS for http://localhost:3000 (Next.js frontend)
2. Set global validation pipe with transform: true, whitelist: true
3. Use ConfigService to read PORT from .env (default 4000)
4. Log the running URL on startup

Also create a .env file template:
DATABASE_URL=postgresql://postgres:password@localhost:5432/slooze_db
JWT_SECRET=super_secret_jwt_key_change_in_production
PORT=4000
```

---

### STEP 9 — Test the Backend

**Run the backend:**

```bash
npm run start:dev
```

**Open GraphQL Playground at:** `http://localhost:4000/graphql`

**Test login mutation:**
```graphql
mutation {
  login(email: "manager@slooze.com", password: "Password@123") {
    access_token
    user {
      id
      email
      role
    }
  }
}
```

**Test products query (add Bearer token in HTTP Headers):**
```graphql
query {
  products {
    id
    name
    sku
    stock
    price
  }
}
```

---

### STEP 10 — Backend Checklist

- [ ] Prisma schema migrated and seeded
- [ ] Login mutation returns JWT + user role
- [ ] `me` query returns authenticated user
- [ ] Products CRUD protected by role guards
- [ ] Dashboard stats query returns data for MANAGER
- [ ] CORS enabled for `localhost:3000`

---

---

## FRONTEND

### STEP 11 — Install Frontend Dependencies

In the `my-app/` directory:

```bash
npm install @apollo/client graphql
npm install js-cookie @types/js-cookie
npm install lucide-react
npm install recharts @types/recharts
npm install next-themes
npm install clsx tailwind-merge
```

---

### STEP 12 — Apollo Client Setup

**File:** `my-app/lib/apollo-client.ts`

**Copilot Prompt:**
```
Create an Apollo Client configuration for a Next.js 16 app (App Router) using TypeScript:

1. lib/apollo-client.ts — creates an ApolloClient with:
   - HttpLink to http://localhost:4000/graphql
   - AuthLink that reads the JWT token from localStorage (key: 'slooze_token') and adds it as Authorization: Bearer <token> header
   - InMemoryCache
   - Export a singleton makeClient() function for server components and a useApollo hook for client components

2. lib/providers.tsx — a 'use client' ApolloProvider wrapper component that wraps children with ApolloProvider using the client

3. Update app/layout.tsx to wrap the app in the Providers component
```

---

### STEP 13 — GraphQL Operations (Queries & Mutations)

**File:** `my-app/lib/graphql/`

**Copilot Prompt:**
```
Create GraphQL operation files in my-app/lib/graphql/ using TypeScript:

1. auth.ts — export:
   - LOGIN_MUTATION: gql mutation for login(email, password) returning access_token and user { id email role }
   - ME_QUERY: gql query for me() returning { id email role }

2. products.ts — export:
   - GET_PRODUCTS: gql query for products(search) returning [{ id name sku stock price discount purchase createdAt }]
   - GET_PRODUCT: gql query for product(id)
   - CREATE_PRODUCT_MUTATION: gql mutation for createProduct(input)
   - UPDATE_PRODUCT_MUTATION: gql mutation for updateProduct(id, input)
   - DELETE_PRODUCT_MUTATION: gql mutation for deleteProduct(id)

3. dashboard.ts — export:
   - GET_DASHBOARD_STATS: gql query for dashboardStats returning all fields (totalEarnings, totalSales, totalRevenue, subscriptions, recentSales, monthlySalesData, weeklyOverviewData)
```

---

### STEP 14 — Auth Context & Hooks

**Copilot Prompt:**
```
Create an authentication context for a Next.js 16 App Router TypeScript app:

1. lib/auth-context.tsx ('use client') — AuthContext with:
   - State: user ({ id, email, role } | null), loading (boolean)
   - login(email, password): calls LOGIN_MUTATION via Apollo, stores token in localStorage as 'slooze_token', sets user state
   - logout(): clears localStorage, resets user state, redirects to /login
   - Auto-restore session on mount using stored token + ME_QUERY
   - Export useAuth() hook

2. Types in lib/types.ts:
   - User: { id: string; email: string; role: 'MANAGER' | 'STORE_KEEPER' }
   - AuthPayload: { access_token: string; user: User }
   - Product: { id, name, sku, stock, price, discount?, purchase?, createdAt }
   - DashboardStats (all fields)

3. Add AuthProvider to app/layout.tsx (inside ApolloProvider)
```

---

### STEP 15 — Login Page

**File:** `my-app/app/(auth)/login/page.tsx`

**Copilot Prompt:**
```
Create a Login page for a Next.js 16 TypeScript app using Tailwind CSS that exactly matches this design:
- Split layout: left side (white background) with login form, right side with a vibrant blue/pink abstract tech image (use a placeholder gradient if no image)
- Left side contains:
  - "Welcome Back" heading (bold, large)
  - "Sign Up For Free" subtitle in gray
  - Email input field with label
  - Password input field with label and show/hide toggle
  - Checkbox: "I agree to all Term, Privacy Policy and fees"
  - Purple gradient "Get Started" button (full width)
  - "OR" divider
  - "Sign in with Google" button (with Google icon, outlined)
  - "Sign in with Facebook" button (with Facebook icon, outlined)  
  - "Already have an account? Login" link at bottom
- Use useAuth() hook for the login action
- Show loading spinner on button while submitting
- Show error toast/message on failed login
- On success: redirect MANAGER to /dashboard, STORE_KEEPER to /products
- Add form validation: email format, password min 6 chars
- The page URL should be /login. Add a small "Login" label in top-left corner.
```

---

### STEP 16 — Layout with Sidebar

**Copilot Prompt:**
```
Create a Dashboard Layout for Next.js 16 App Router at app/(dashboard)/layout.tsx that includes:

1. Sidebar (left, fixed, dark navy/indigo background) with:
   - Logo "Slooze" at top with an icon
   - Navigation items with icons (using lucide-react):
     * Home
     * Dashboard (visible to MANAGER only)
     * Products
     * Histories
     * Settings
     * Reports
     * Add Products (visible to MANAGER only)
   - Profile/avatar section at bottom
   - Collapse toggle button
   - Highlight active route

2. Top Header (right side, fixed) with:
   - Search bar in center
   - "Add Product" button (purple, right side, MANAGER only)
   - Notification bell icon
   - Settings icon
   - User avatar with role label
   - Theme toggle (Light/Dark)

3. Main content area that renders {children}

4. Route guard: if user is not authenticated, redirect to /login
   If user is STORE_KEEPER and tries to access /dashboard, redirect to /products

Use useAuth() hook. Use usePathname() for active route detection.
Apply role-based conditional rendering for menu items and buttons.
```

---

### STEP 17 — Dashboard Page

**File:** `my-app/app/(dashboard)/dashboard/page.tsx`

**Copilot Prompt:**
```
Create a Dashboard page for a Next.js 16 TypeScript app using Tailwind CSS and Recharts that matches this design:

TOP STATS ROW (4 cards, horizontal):
- Total Earnings: $112,893.00 (with up arrow trend)
- Sales: +12,893 (with up arrow trend)
- Total Sales: +112,893 (with trend)
- Subscriptions: +112,893 (with trend)

MAIN GRID ROW:
- Left (2/3 width): "Overview" bar chart (Weekly revenue vs expenses, using Recharts BarChart)
- Right (1/3 width): "Recent Sales" list with avatar, name, email, and green amount

STATS SECTION (4 area/line charts in a 2x2 grid):
- Total Earning ($112,893.00) — green area chart
- Total Earning ($112,893.00) — green bar chart
- Total Earning ($112,893.00) — purple/indigo area chart
- Subscriptions (+112,893) — orange/yellow line chart

SMALLER STATS ROW (3 cards):
- Total Earning line chart (small)
- Total Sales line chart (small)
- Total Views line chart (small)

BOTTOM SECTION:
- Subscriptions Performers card: large "+500" text with orange bar chart
- Top Sales Product table: image, name, price, sold, revenue columns
- Payment History table: email, date, amount, status (badge: success/pending)

Fetch data using GET_DASHBOARD_STATS Apollo query.
Show skeleton loaders while data is loading.
This page is MANAGER only — redirect STORE_KEEPER to /products.
```

---

### STEP 18 — Products Page

**File:** `my-app/app/(dashboard)/products/page.tsx`

**Copilot Prompt:**
```
Create a Products page for Next.js 16 TypeScript using Tailwind CSS that matches this design:

HEADER:
- Title "Product" with breadcrumb
- "Add New Product" purple button (top right, MANAGER only)

TABS:
- "Featured" and "Item1" tab buttons

PRODUCTS TABLE with columns:
- Checkbox column
- Thumbnail (small square image placeholder)
- Product Name
- Stock
- Price
- Discount
- Purchase
- Title/Note
- Action buttons (view/edit/delete, MANAGER only for edit & delete)
- Small sparkline trend chart per row (using Recharts)

FEATURES:
- Search bar that filters by product name
- Pagination (rows per page: 10, 25, 50)
- Sort by clicking column headers
- Checkboxes for bulk selection
- Loading skeleton while fetching

TOP RIGHT STATS CARD:
- Total Views: +110,893 with a small line chart (green)

Fetch data with GET_PRODUCTS Apollo query. Pass search term as variable.
Both MANAGER and STORE_KEEPER can view. Only MANAGER sees edit/delete/add buttons.
```

---

### STEP 19 — Add / Edit Product Page

**File:** `my-app/app/(dashboard)/products/add/page.tsx`

**Copilot Prompt:**
```
Create an "Add Product" page for Next.js 16 TypeScript using Tailwind CSS that matches this design:

LAYOUT: Two-column layout
LEFT COLUMN — "General Information" card:
- Product Name input
- Description textarea (tall)
- Category select dropdown
- Sub-category select dropdown
- Keywords/tags input with tag pills

PRICING card (below general info):
- Price input
- Discount input
- Discount coupon input

RIGHT COLUMN:
- "Featured Product" upload card (dashed border, upload icon, "Drop your image here" text)
- "Thumbnail Product" upload card (same style, smaller)

HEADER:
- "Add Product" title
- "Save Draft" outlined button and "Publish" purple button (top right)
- Breadcrumb navigation

FORM BEHAVIOR:
- All inputs use react-hook-form or controlled state
- On submit: call CREATE_PRODUCT_MUTATION
- Show success toast on creation, redirect to /products
- Show validation errors inline

Also create an edit variant at /products/[id]/edit that pre-fills fields using GET_PRODUCT query and calls UPDATE_PRODUCT_MUTATION on submit.

This page is MANAGER only — redirect STORE_KEEPER away.
```

---

### STEP 20 — Dark Mode & Theme System

**Copilot Prompt:**
```
Implement a complete Light/Dark mode system for a Next.js 16 TypeScript app using next-themes and Tailwind CSS v4:

1. Update app/layout.tsx to wrap the app in ThemeProvider from next-themes with attribute="class", defaultTheme="system", enableSystem

2. Create a ThemeToggle component in components/ui/ThemeToggle.tsx:
   - Shows a Sun icon in dark mode, Moon icon in light mode (using lucide-react)
   - Calls setTheme() from useTheme() on click
   - Smooth transition animation
   - Show in the dashboard header

3. Update tailwind.config — ensure darkMode: 'class' is set

4. Update all page components to use dark: variants for:
   - Sidebar: dark:bg-gray-900 dark:text-white
   - Cards: dark:bg-gray-800 dark:border-gray-700
   - Tables: dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700
   - Inputs: dark:bg-gray-700 dark:text-white dark:border-gray-600
   - Header: dark:bg-gray-900 dark:border-gray-700

5. Persist theme choice — next-themes handles this via localStorage automatically.

Show a brief "No flash" solution using suppressHydrationWarning on <html> tag.
```

---

## FINAL

### STEP 21 — Route Structure & Middleware

**File:** `my-app/middleware.ts`

**Copilot Prompt:**
```
Create a Next.js middleware (middleware.ts at project root) that:
1. Reads the 'slooze_token' from cookies (not localStorage, for SSR compatibility)
2. If the token is missing and the route is NOT /login, redirect to /login
3. If the token exists and the route IS /login, redirect to /dashboard
4. For role-based protection: if the cookie 'slooze_role' is 'STORE_KEEPER' and the path is /dashboard or /products/add, redirect to /products
5. Apply to all routes except /api, /_next, /public assets

Also update the login function in auth-context.tsx to store the role as a cookie ('slooze_role') alongside the token cookie ('slooze_token') using js-cookie. Keep localStorage as secondary storage.
```

---

### STEP 22 — Final Integration Checklist & Folder Structure

**Expected folder structure after all steps:**

```
my-app/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx              ← Step 15
│   ├── (dashboard)/
│   │   ├── layout.tsx                ← Step 16
│   │   ├── dashboard/
│   │   │   └── page.tsx              ← Step 17
│   │   └── products/
│   │       ├── page.tsx              ← Step 18
│   │       ├── add/
│   │       │   └── page.tsx          ← Step 19
│   │       └── [id]/
│   │           └── edit/
│   │               └── page.tsx      ← Step 19
│   ├── globals.css
│   └── layout.tsx                    ← Updated in Step 12, 14, 20
├── components/
│   └── ui/
│       ├── ThemeToggle.tsx           ← Step 20
│       ├── Sidebar.tsx               ← Step 16
│       ├── Header.tsx                ← Step 16
│       └── SkeletonLoader.tsx
├── lib/
│   ├── apollo-client.ts              ← Step 12
│   ├── providers.tsx                 ← Step 12
│   ├── auth-context.tsx              ← Step 14
│   ├── types.ts                      ← Step 14
│   └── graphql/
│       ├── auth.ts                   ← Step 13
│       ├── products.ts               ← Step 13
│       └── dashboard.ts              ← Step 13
├── middleware.ts                     ← Step 21
└── public/

backend/
├── prisma/
│   ├── schema.prisma                 ← Step 2
│   └── seed.ts                       ← Step 3
└── src/
    ├── app.module.ts                 ← Step 4
    ├── main.ts                       ← Step 8
    ├── prisma/
    │   └── prisma.service.ts
    ├── auth/
    │   ├── auth.module.ts            ← Step 5
    │   ├── auth.service.ts
    │   ├── auth.resolver.ts
    │   ├── jwt.strategy.ts
    │   ├── gql-auth.guard.ts
    │   ├── roles.guard.ts
    │   └── roles.decorator.ts
    └── products/
        ├── products.module.ts        ← Steps 6 & 7
        ├── products.service.ts
        ├── products.resolver.ts
        └── dto/
```

---

### FINAL CHECKLIST

#### Backend
- [ ] NestJS app runs on `http://localhost:4000`
- [ ] GraphQL Playground accessible at `/graphql`
- [ ] `login` mutation returns JWT and user role
- [ ] `me` query returns current user (auth-guarded)
- [ ] `products` query works for MANAGER and STORE_KEEPER
- [ ] `createProduct`, `updateProduct`, `deleteProduct` work for MANAGER only
- [ ] `dashboardStats` returns data for MANAGER only
- [ ] CORS allows `http://localhost:3000`

#### Frontend
- [ ] `/login` page renders correctly and authenticates
- [ ] MANAGER redirects to `/dashboard` after login
- [ ] STORE_KEEPER redirects to `/products` after login
- [ ] Dashboard page fetches and renders real stats + charts
- [ ] Products page shows table with search and pagination
- [ ] Add Product form submits and creates a product
- [ ] Edit Product pre-fills and updates a product
- [ ] STORE_KEEPER cannot see Dashboard, Add Product, or Edit/Delete buttons
- [ ] Light/Dark mode toggle works and persists across refreshes
- [ ] Middleware guards routes from unauthorized access

---

### RUNNING THE FULL STACK

**Terminal 1 — Backend:**
```bash
cd backend
npm run start:dev
# Running on http://localhost:4000/graphql
```

**Terminal 2 — Frontend:**
```bash
cd my-app
npm run dev
# Running on http://localhost:3000
```

**Test Credentials:**
| Role         | Email                   | Password      |
|--------------|-------------------------|---------------|
| Manager      | manager@slooze.com      | Password@123  |
| Store Keeper | keeper@slooze.com       | Password@123  |

---

### POINTS SUMMARY

| Feature                          | Points | Status |
|----------------------------------|--------|--------|
| Login with validation            | 5      | ☐      |
| Dashboard (Manager only)         | 30     | ☐      |
| View All Products                | 10     | ☐      |
| Add/Edit Products                | 15     | ☐      |
| Light/Dark Mode                  | 15     | ☐      |
| Front-End RBAC Menu Restrictions | 25     | ☐      |
| **Total**                        | **100**|        |
