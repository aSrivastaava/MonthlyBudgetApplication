# Release Notes

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
