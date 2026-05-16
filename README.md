# ScriptBlox - Roblox Script Store

A comprehensive platform for uploading, verifying, and purchasing Roblox scripts with a built-in verification system, trusted user management, and Stripe payment integration.

## Features

### Core Features
- **User Authentication**: Secure registration and login with JWT tokens
- **Script Upload System**: Logged-in users can upload Roblox scripts
- **Verification Workflow**: Scripts require moderator verification unless uploaded by trusted users
- **Script Marketplace**: Browse and search approved scripts
- **In-App Currency**: ScriptCoins (SC) with 100 SC = 1€ exchange rate
- **Stripe Integration**: Purchase ScriptCoins via Stripe
- **Review System**: Users can rate and review scripts (1-5 stars)

### User Roles
- **User**: Basic account, scripts require verification, can purchase scripts
- **Trusted**: Scripts auto-approved, scripts don't require verification
- **Moderator**: Can verify/reject scripts, assign by admins
- **Admin**: Full platform control, can make users trusted, manage moderators

### Admin Features
- **Moderation Panel**: Verify or reject pending scripts
- **User Management**: View all users, assign roles, grant trusted status
- **Platform Analytics**: View statistics about users, scripts, and revenue
- **Trusted Status**: Grant/revoke trusted status to users

## Project Structure

```
ScriptBlox/
├── models/
│   ├── User.js           # User schema with roles and coins
│   ├── Script.js         # Script schema with verification status
│   └── Payment.js        # Payment records for audit trail
├── routes/
│   ├── auth.js           # Authentication endpoints
│   ├── scripts.js        # Script upload, browse, review
│   ├── payments.js       # Stripe integration and coins
│   └── admin.js          # Moderation and admin features
├── middleware/
│   └── auth.js           # JWT authentication and authorization
├── server.js             # Main Express server
├── package.json          # Dependencies
└── .env.example          # Environment variables template
```

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/n0tpurplx/ScriptBlox.git
   cd ScriptBlox
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your MongoDB URI, JWT secret, and Stripe keys.

4. **Start the server**
   ```bash
   npm start
   ```
   For development with auto-reload:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Scripts
- `POST /api/scripts/upload` - Upload new script
- `GET /api/scripts` - Get all approved scripts (with filters)
- `GET /api/scripts/:id` - Get single script details
- `GET /api/scripts/user/:userId` - Get user's uploaded scripts
- `POST /api/scripts/:id/review` - Add review to script
- `PUT /api/scripts/:id` - Update script (author only)
- `DELETE /api/scripts/:id` - Delete script (author only)

### Payments
- `GET /api/payments/coins/packages` - Get available coin packages
- `POST /api/payments/coins/create-intent` - Create payment intent for coins
- `POST /api/payments/script/create-intent` - Purchase script with coins
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Get user's payment history
- `POST /api/payments/webhook` - Stripe webhook

### Admin
- `GET /api/admin/scripts/pending` - Get pending scripts for review
- `POST /api/admin/scripts/:id/approve` - Approve script
- `POST /api/admin/scripts/:id/reject` - Reject script with reason
- `POST /api/admin/users/:userId/trust` - Make user trusted
- `POST /api/admin/users/:userId/revoke-trust` - Revoke trusted status
- `POST /api/admin/users/:userId/moderator` - Assign moderator role
- `GET /api/admin/users` - Get all users (paginated)
- `GET /api/admin/statistics` - Get platform statistics

## Verification Workflow

1. **Regular Users**:
   - Upload script → Script status: `pending`
   - Moderator reviews → Approved or Rejected
   - If approved → Script becomes public

2. **Trusted Users**:
   - Upload script → Script status: `approved` (auto-approved)
   - Script immediately available for purchase

3. **Updated Scripts**:
   - If code changes, script reverts to `pending` for non-trusted users
   - Trusted users can update without re-verification

## ScriptCoins System

### Exchange Rate
- 100 ScriptCoins = 1€

### Coin Packages
- Small: 500 SC for €5.00
- Medium: 1200 SC for €10.00 (20% bonus)
- Large: 3000 SC for €20.00 (50% bonus)
- XLarge: 6500 SC for €40.00 (62.5% bonus)

### Welcome Bonus
- New users receive 100 free ScriptCoins upon registration

## Stripe Integration

### Setup
1. Create a Stripe account at https://stripe.com
2. Get your API keys from the dashboard
3. Add to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Payment Flow
1. User selects coin package
2. System creates Stripe PaymentIntent
3. Payment is processed
4. Webhook confirms payment
5. ScriptCoins added to account

### Script Purchase Flow
1. User clicks purchase on script
2. System checks balance
3. Coins deducted immediately (internal transaction)
4. Script added to user's library
5. Payment record created for audit trail

## Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT token-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Stripe webhook signature verification
- ✅ CORS protection
- ✅ Input validation
- ✅ Authorization checks on protected routes

## Environment Variables

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/scriptblox
JWT_SECRET=your_super_secret_jwt_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000
```

## Database Schema

### User
- username, email, password (hashed)
- scriptCoins balance
- role (user, trusted, moderator, admin)
- isTrusted flag
- avatar, bio
- purchasedScripts, uploadedScripts
- timestamps

### Script
- title, description, code content
- category, price (in SC)
- author (User ref)
- status, verificationStatus
- reviews with ratings
- downloads counter
- tags, compatibility info
- timestamps

### Payment
- user, script (optional)
- amount, currency, coinsAmount
- paymentType, stripePaymentId
- status, metadata
- timestamps

## License

MIT License - See LICENSE file for details

## Support

For issues and feature requests, please open an issue on GitHub.
