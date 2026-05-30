# Release Notes

## v2.0.0 — May 30, 2026

Complete application overhaul — new Expense Book feature, full dark UI redesign, and major backend additions.

### 🆕 New Features

- **Expense Book** (`/house/:id/book`) — Full financial ledger across all months
  - Filter by category, year, month, and free-text search
  - Sort by date or amount
  - Grouped by month with running subtotals
  - Per-category spending breakdown with progress bars
  - Member contribution pills on every row
  - One-click CSV export
- **Payment list view** — See all recorded payments for the current budget month
- **Delete payments** — Remove incorrect entries; receipt files cleaned up automatically
- **Member contributions in forms** — Assign per-member amounts on payments and rent
- **Leave house** — Non-owner members can leave a house
- **Delete house** — Owner can permanently delete a house and all its data
- **Remove members** — Admins/owners can kick members from the house

### 🎨 UI Redesign

- Complete dark theme across all pages
- Shared `AppLayout` sidebar component for consistent navigation
- Modern Login and Register pages
- Dashboard with house cards and role badges
- House Details with quick-action cards (Budget, Expense Book, Copy Key)
- Budget Management with progress bars, bar chart, and pie charts
- Mobile responsive

### 🔧 Backend

- `GET /api/houses/:houseId/book` — financial ledger endpoint
- `DELETE /api/houses/:houseId/payments/:paymentId` — delete payment
- `POST /api/houses/:houseId/leave` — leave house
- `DELETE /api/houses/:houseId` — delete house
- `DELETE /api/houses/:houseId/members/:memberId` — remove member
- API URLs fixed to relative paths for single-port deployment

### 🚀 Deployment

- Hosted at https://budget.adityasrivastavaa.me via Cloudflare Tunnel
- Single-port Express server (4040) serving API + React build
- MongoDB in Docker with persistent volume

---

## v1.0.0 — Initial Release

Original SplitNest.

### Features

- User registration and login with JWT
- Create and join shared houses via 6-character key
- Role-based access: Owner, Admin, Financier, Rent Payer, Member
- Monthly budget creation with categories (groceries, wifi, gas, electricity, other)
- Payment recording with receipt uploads
- Rent payment tracking with pie chart
- Budget statistics with member contribution balances
- House rename and role management
