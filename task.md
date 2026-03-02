Slooze take home challenge-front-end!!
Commodities Management Feature Flow
We are introducing a Commodities Management System to diversify product variety and meet customer expectations. This feature includes a structured role-based access system, UI enhancements, and authentication mechanisms.

Feature Breakdown & Points Allocation
1️⃣ Authentication & Access
Login (5 Points) → Users authenticate via email & password.
Role-Based Access → Only Managers can access the dashboard.
2️⃣ Core UI Features
Dashboard (30 Points) → Available only for Managers to oversee operations.
View All Products (10 Points) → Accessible to both Managers & Store Keepers.
Add/Edit Products (15 Points) [Optional] → Modify product inventory.
3️⃣ UI Enhancements
Light/Dark Mode (15 Points) → Implement theme switching.
Front-End Role-Based Menu Restrictions (Bonus: 25 Points) → Restrict UI options dynamically.
Tech Stack:
Backend: NestJS · GraphQL · Prisma
Frontend: Next.js · TypeScript · Tailwind CSS · Apollo Client
Auth: Role-based access control (RBAC) · Bonus: Re-BAC



 Implementation Steps
A) Login Flow
Create a login page with validation.
Send API request → POST /auth/login.
Store session details securely.
B) Dashboard Flow
Show statistics & insights for commodities.
Restrict access using role-based gating.
C) Product Management
Fetch product data → GET /products.
Allow adding/editing via forms (POST/PUT /products).
D) UI Enhancements
Implement Light/Dark Mode toggle with localStorage.
Role-based UI restrictions for platform features.



Role-Based Menu Restriction
✅ Show/hide menu items based on roles (Manager, Store Keeper).
✅ Implement router guards to prevent unauthorized access.
✅ Ensure restricted buttons/options remain disabled dynamically.