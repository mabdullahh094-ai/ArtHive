# 🚀 Stripe Payment Integration Guide for ArtHive

## Phase 1: Backend Setup ✅

### Step 1: Install Dependencies
```bash
cd arthive-backend
npm install stripe
```

### Step 2: Set Up Database
The Stripe integration requires three new database tables: `orders`, `order_items`, and `payment_transactions`.

Run the setup script to create these tables:
```bash
node scripts/setupPaymentTables.js
```

This will create:
- **orders**: Stores order information with payment status
- **order_items**: Tracks individual artworks in each order
- **payment_transactions**: Records all Stripe transactions

### Step 3: Verify .env Configuration
Your `.env` file already has:
```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
```

> **Note:** Your actual Stripe secret key is stored in `.env` (never commit real keys to git)

✅ **No additional backend setup needed!**

---

## Phase 2: Frontend Setup 🎨

### Step 1: Install Stripe React Packages
```bash
cd arthive-frontend
npm install @stripe/react-stripe-js @stripe/js
```

### Step 2: Add Stripe Public Key to .env
Get your **Stripe Publishable Key** from your Stripe Dashboard:

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Click **Developers** → **API Keys**
3. Copy your **Publishable Key** (starts with `pk_test_`)

Add to your frontend `.env` file:
```env
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY_HERE
```

### Step 3: Update App.js
Wrap your application with Stripe provider. Update your `src/App.js`:

```jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { loadStripe } from '@stripe/js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import Home from './pages/Home';
// ... other imports

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

function App() {
  return (
    <Router>
      <Elements stripe={stripePromise}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
          {/* ... other routes */}
        </Routes>
      </Elements>
    </Router>
  );
}

export default App;
```

### Step 4: Update Cart Component
Add a "Proceed to Checkout" button that links to the checkout page. Example:

```jsx
// In your Cart component
<button 
  onClick={() => navigate('/checkout')}
  disabled={cartItems.length === 0}
>
  Proceed to Checkout
</button>
```

---

## Phase 3: API Endpoints Reference 📝

### Create Payment Intent
**POST** `/api/payment/create-payment-intent`

Request body:
```json
{
  "buyerId": 1,
  "amount": 99.99,
  "cartItems": [
    { "artwork_id": 1, "quantity": 1, "price": 99.99 }
  ],
  "email": "buyer@example.com"
}
```

Response:
```json
{
  "success": true,
  "clientSecret": "pi_1234567890_secret_abcd",
  "paymentIntentId": "pi_1234567890"
}
```

### Confirm Payment
**POST** `/api/payment/confirm-payment`

Request body:
```json
{
  "paymentIntentId": "pi_1234567890",
  "buyerId": 1,
  "cartItems": [...],
  "shippingAddress": { "fullName": "John Doe", ... },
  "billingAddress": { "fullName": "John Doe", ... }
}
```

Response:
```json
{
  "success": true,
  "orderId": 5,
  "totalAmount": 99.99,
  "itemCount": 1,
  "orderDate": "2025-04-22T10:30:00Z"
}
```

### Get Order
**GET** `/api/payment/order/:orderId?buyerId=1`

Response:
```json
{
  "success": true,
  "order": {
    "id": 5,
    "buyer_id": 1,
    "total_amount": 99.99,
    "status": "completed",
    "items": [...]
  }
}
```

### Get Buyer Orders
**GET** `/api/payment/orders/buyer/:buyerId?limit=10&offset=0`

Response:
```json
{
  "success": true,
  "orders": [...],
  "totalCount": 5
}
```

---

## Testing Instructions 🧪

### 1. **Test with Stripe Test Cards**

Use these test card numbers in the payment form:

| Card Type | Number | CVC | Date |
|-----------|--------|-----|------|
| Visa | 4242 4242 4242 4242 | Any 3 digits | Any future date |
| Mastercard | 5555 5555 5555 4444 | Any 3 digits | Any future date |
| Amex | 3782 822463 10005 | Any 4 digits | Any future date |
| Failed | 4000 0000 0000 0002 | Any 3 digits | Any future date |

### 2. **Test Payment Flow**

1. Add items to cart
2. Click "Proceed to Checkout"
3. Fill in shipping/billing information
4. Enter test card details
5. Click "Pay"
6. You should see order confirmation

### 3. **Monitor in Stripe Dashboard**

- Go to [Payments](https://dashboard.stripe.com/payments) to see all transactions
- Click on a payment to see full details
- Check Events for webhooks

---

## Current Components 📦

### Backend Files:
- `controllers/payment.controller.js` - Payment logic
- `routes/payment.routes.js` - Payment endpoints
- `scripts/setupPaymentTables.js` - Database setup

### Frontend Files:
- `src/pages/CheckoutPage.js` - Payment form
- `src/pages/OrderConfirmationPage.js` - Order confirmation

### Database Tables:
- `orders` - Order records
- `order_items` - Items in orders
- `payment_transactions` - Stripe transactions

---

## Important Security Notes 🔒

1. **Never expose your Secret Key** - Keep `STRIPE_SECRET_KEY` secret
2. **Frontend uses only Public Key** - `REACT_APP_STRIPE_PUBLIC_KEY` is safe to expose
3. **Webhook Verification** - Implement signature verification for production
4. **HTTPS Required** - Always use HTTPS in production
5. **PCI Compliance** - Never handle raw card data on server

---

## Troubleshooting 🔧

### Issue: "Stripe is not defined"
- Ensure `stripe` package is installed: `npm install stripe`
- Check that Stripe is imported: `const stripe = require('stripe')`

### Issue: "Missing REACT_APP_STRIPE_PUBLIC_KEY"
- Add public key to `.env`: `REACT_APP_STRIPE_PUBLIC_KEY=pk_test_...`
- Restart frontend dev server

### Issue: "Payment intent creation fails"
- Check STRIPE_SECRET_KEY is correct
- Verify amount is in cents (99.99 → 9999)
- Check buyer email is provided

### Issue: Database tables not created
- Run: `node scripts/setupPaymentTables.js`
- Check database connection

---

## Next Steps 🎯

1. ✅ Run `npm install stripe` in backend
2. ✅ Run `npm install @stripe/react-stripe-js @stripe/js` in frontend
3. ✅ Run `node scripts/setupPaymentTables.js` to create tables
4. ✅ Add REACT_APP_STRIPE_PUBLIC_KEY to frontend .env
5. ✅ Update App.js with Stripe provider
6. ✅ Test with test cards
7. 🚀 Deploy to production with real Stripe keys

---

## Support & Documentation

- [Stripe Documentation](https://stripe.com/docs)
- [React Stripe.js](https://stripe.com/docs/stripe-js/react)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Payment Intents API](https://stripe.com/docs/payments/payment-intents)

---

**✨ Your Stripe integration is now complete and ready to process payments!**
