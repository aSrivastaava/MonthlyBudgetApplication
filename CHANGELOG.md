# Changelog

All notable changes to the Monthly Budget Application will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### User Authentication Enhancement
- **Username/Email Login**: Users can now sign in using either their username or email address, providing more flexibility in authentication.

#### House Management
- **Restricted House Renaming**: House renaming is now restricted to users with Owner or Admin roles only. Regular members can no longer modify the house name.

#### Financier Role - Budget & Payment Management
- **Monthly Budget Creation**: Financiers (along with Admins and Owners) can now create and manage monthly budgets for their household.
- **Budget Categories**: Support for multiple budget categories including:
  - Groceries
  - Wi-Fi
  - Gas
  - Electricity
  - Other
- **Payment Records**: Financiers can add payment records for each budget category with the following features:
  - Upload receipt attachments (JPEG, PNG, PDF)
  - Track individual member contributions for each payment
  - Add descriptions and payment dates
  - Link payments to specific budget categories

#### Rent Payer Role - Rent Payment Management
- **Rent Payment Records**: Rent Payers (along with Admins and Owners) can upload rent payment receipts and track rent contributions.
- **Member Rent Contributions**: Track individual member contributions towards rent payments.
- **Monthly Rent Tracking**: Record and view rent payments by month and year.

#### Budget Statistics & Reporting
- **Spending Analytics**: View comprehensive budget statistics including:
  - Total budgeted vs. total spent amounts
  - Category-wise budget breakdown
  - Remaining budget for each category
  - Individual payment history per category
- **Member Contribution Tracking**: Display each member's financial contributions:
  - Total amount contributed by each member
  - Expected vs. actual contributions
  - Balance calculation (over-paid or under-paid)

#### API Endpoints

**Budget Management**
- `POST /api/houses/:houseId/budget` - Create or update monthly budget
- `GET /api/houses/:houseId/budget/:year/:month` - Get budget for specific month
- `GET /api/houses/:houseId/budgets` - Get all budgets for a house

**Payment Management**
- `POST /api/houses/:houseId/payment` - Create payment record with receipt upload
- `GET /api/houses/:houseId/payments/:budgetId` - Get payments for a specific budget
- `GET /api/houses/:houseId/payments` - Get all payments for a house

**Rent Management**
- `POST /api/houses/:houseId/rent` - Create or update rent payment
- `GET /api/houses/:houseId/rent/:year/:month` - Get rent payment for specific month
- `GET /api/houses/:houseId/rent` - Get all rent payments for a house

**Statistics**
- `GET /api/houses/:houseId/statistics/:year/:month` - Get comprehensive budget statistics

### Changed
- **Login API**: Updated to accept `emailOrUsername` field instead of just `email`
- **House Rename Permission**: Modified to check for Owner or Admin role before allowing rename

### Security
- **File Upload Validation**: Implemented file type and size validation for receipt uploads
  - Maximum file size: 5MB
  - Allowed file types: JPEG, PNG, PDF
- **Role-Based Access Control**: Enhanced permission checks for budget and rent management features

## Technical Details

### New Models
- **Budget**: Stores monthly budget information with categories
- **Payment**: Records payment transactions with receipts and member contributions
- **RentPayment**: Tracks rent payments with receipts and individual contributions

### Dependencies Added
- `multer`: For handling file uploads (receipts)

### File Structure
- Added `/uploads/receipts/` directory for payment receipts
- Added `/uploads/rent-receipts/` directory for rent receipts
- Both directories are excluded from version control via `.gitignore`

---

## Future Enhancements

Potential features for future releases:
- Pie chart visualization for rent contributions
- Frontend components for all new features
- Payment notifications and reminders
- Export budget reports to PDF/Excel
- Recurring payment tracking
- Mobile app support
