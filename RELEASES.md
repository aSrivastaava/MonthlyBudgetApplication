# Release Notes

## v3.0.0 — May 30, 2026

- Balance tracking (Splitwise-style) — who owes whom with debt simplification algorithm
- Settle up — record payments between members; adjusts net balances automatically
- Activity feed in house overview with payments, rent, and settlements
- New Balance page at `/house/:id/balances` with summary, all balances, and settlement history
- Member net balance shown prominently in house details header
- Member avatars with color-coded initials throughout the UI
- Full UI redesign — emerald green as primary brand color
- Split-panel login and register pages with feature highlights
- Context-aware sidebar showing house navigation links
- Skeleton loading states, password strength indicator, better modals and empty states
- Backend: Settlement model, GET /balances, POST /settle, GET /activity routes

## v2.1.0 — May 30, 2026

- Renamed project to SplitNest
- Fixed payment category bug where modal defaulted to groceries regardless of selection

## v2.0.0 — May 30, 2026

- Expense Book (`/house/:id/book`) — full financial ledger with filters, month grouping, category breakdown, and CSV export
- Payment list view with delete support in budget management
- Member contributions input in payment and rent forms
- Leave house, delete house, remove member functionality
- Complete dark UI redesign across all pages
- Shared sidebar layout component
- Budget vs spent bar chart and spending pie charts
- New backend endpoints: book ledger, delete payment, leave house, delete house, remove member
- API URLs fixed to relative paths for single-port deployment

## v1.0.0

- User registration and login with JWT
- Create and join shared houses via 6-character key
- Role-based access: Owner, Admin, Financier, Rent Payer, Member
- Monthly budget creation with categories (groceries, wifi, gas, electricity, other)
- Payment recording with receipt uploads
- Rent payment tracking with pie chart
- Budget statistics with member contribution balances
- House rename and role management
