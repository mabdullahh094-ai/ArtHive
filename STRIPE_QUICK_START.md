# 🎨 ArtHive Stripe Payment Integration - Quick Start

## ⚡ Quick Installation (5 minutes)

### Backend Setup
```bash
# 1. Install Stripe
cd arthive-backend
npm install stripe

# 2. Create payment tables
node scripts/setupPaymentTables.js

# 3. Start server
npm run dev
```

### Frontend Setup
```bash
# 1. Install Stripe packages
cd arthive-frontend
npm install @stripe/react-stripe-js @stripe/js

# 2. Add to .env file
echo "REACT_APP_STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY_HERE" >> .env

# 3. Start dev server
npm start
```

**✅ Done! Your payment system is ready.**

---

## 🧪 Quick Test

### Test Payment Flow:
1. Add item to cart
2. Go to `/checkout`
3. Use test card: `4242 4242 4242 4242`
4. CVC: Any 3 digits
5. Date: Any future date

Result: You should see order confirmation page.

---

## 📊 What Was Installed

### Backend (Node.js/Express):
- **Payment Controller** - Handles Stripe operations
- **Payment Routes** - API endpoints for checkout
- **Database Tables** - orders, order_items, payment_transactions
- **Webhook Handler** - Listens for Stripe events

### Frontend (React):
- **Checkout Page** - Beautiful payment form with shipping/billing
- **Order Confirmation** - Thank you page with order details
- **Payment Service** - Helper functions for API calls
- **Stripe Integration** - Complete Card Element UI

### Database:
- `orders` - Order records (Status, Total, Payment ID)
- `order_items` - Line items for each order
- `payment_transactions` - Stripe transaction logs

---

## 🔐 Your Stripe Keys

**Secret Key** (Backend only - Already configured):
```
STRIPE_SECRET_KEY: sk_test_REDACTED_SECRET_KEY
```

**Public Key** (Frontend - Get from Stripe Dashboard):
1. Go to https://dashboard.stripe.com
2. Click "Developers" → "API Keys"
3. Copy "Publishable Key" (starts with `pk_test_`)
4. Add to `.env`: `REACT_APP_STRIPE_PUBLIC_KEY=pk_test_...`

---

## 📱 API Endpoints

### Create Payment Intent
```
POST /api/payment/create-payment-intent
Body: { buyerId, amount, cartItems, email }
Returns: { clientSecret, paymentIntentId }
```

### Confirm Payment
```
POST /api/payment/confirm-payment
Body: { paymentIntentId, buyerId, cartItems, shippingAddress, billingAddress }
Returns: { orderId, totalAmount, orderDate }
```

### Get Orders
```
GET /api/payment/orders/buyer/:buyerId
Returns: { orders: [], totalCount }
```

---

## 🎯 File Structure

```
arthive-backend/
├── controllers/
│   └── payment.controller.js      ← Payment logic
├── routes/
│   └── payment.routes.js          ← API endpoints
├── scripts/
│   └── setupPaymentTables.js      ← Database setup
└── server.js                      ← Updated with payment routes

arthive-frontend/
├── src/
│   ├── pages/
│   │   ├── CheckoutPage.js        ← Payment form
│   │   └── OrderConfirmationPage.js ← Thank you page
│   └── services/
│       └── paymentService.js      ← API helpers
└── .env                           ← Add public key here
```

---

## 🚀 Integration Checklist

- [ ] Backend: `npm install stripe`
- [ ] Backend: Run `node scripts/setupPaymentTables.js`
- [ ] Frontend: `npm install @stripe/react-stripe-js @stripe/js`
- [ ] Frontend: Get Public Key from Stripe Dashboard
- [ ] Frontend: Add Public Key to `.env`
- [ ] Frontend: Update `App.js` with Stripe Elements wrapper
- [ ] Frontend: Add checkout link in cart component
- [ ] Test with card `4242 4242 4242 4242`
- [ ] Check order appears in database
- [ ] Verify Stripe Dashboard shows payment

---

## 💳 Test Cards for Development

| Status | Card Number | CVC | Date |
|--------|------------|-----|------|
| ✅ Succeeds | 4242 4242 4242 4242 | Any | Future |
| ❌ Fails | 4000 0000 0000 0002 | Any | Future |
| ⚠️ Pending | 4000 0000 0000 3220 | Any | Future |
| 🔐 3D Secure | 4000 0025 0000 3155 | Any | Future |

---

## 🔍 Verify Installation

### Backend Check:
```bash
# Should show payment routes loaded
npm run dev

# Output should include:
# ✅ Payment routes loaded
# ✅ orders table created/verified
# ✅ order_items table created/verified
```

### Frontend Check:
```bash
# Should compile without errors
npm start

# Check console (F12) for:
# - No "REACT_APP_STRIPE_PUBLIC_KEY not found" errors
# - Can see CheckoutPage component
# - Card Element renders properly
```

---

## 🐛 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| `stripe is not defined` | Run `npm install stripe` in backend |
| `REACT_APP_STRIPE_PUBLIC_KEY missing` | Add to frontend `.env` and restart |
| `payment_intent_id field does not exist` | Run `node scripts/setupPaymentTables.js` |
| `CardElement not rendering` | Check App.js has `<Elements>` wrapper |
| `CORS error on payment` | Verify CORS_ORIGINS in backend .env |

---

## 📞 API Response Examples

### Success Response:
```json
{
  "success": true,
  "orderId": 42,
  "totalAmount": 99.99,
  "orderDate": "2025-04-22T10:30:00Z"
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Payment declined. Please use a different card."
}
```

---

## 🎉 You're All Set!

Your ArtHive platform now has:
- ✅ Full payment processing with Stripe
- ✅ Beautiful checkout experience
- ✅ Order tracking and history
- ✅ Secure payment handling
- ✅ Email receipts (ready to implement)

**Start accepting payments now! 🚀**

---

## 📚 Further Customization

### Add Order History Page:
```jsx
import { paymentService } from '../services/paymentService';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  
  useEffect(() => {
    paymentService.getBuyerOrders(userId)
      .then(data => setOrders(data.orders));
  }, []);
  
  return <div>{/* render orders */}</div>;
};
```

### Add Invoice Generation:
```jsx
// In OrderConfirmationPage
const generateInvoice = () => {
  // Use pdf library or print to PDF
};
```

### Add Refund Support:
```javascript
// In payment.controller.js
refundPayment: async (req, res) => {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId
  });
}
```

---

## ❓ Need Help?

- Check [STRIPE_INTEGRATION_GUIDE.md](./STRIPE_INTEGRATION_GUIDE.md) for detailed docs
- Review [Stripe Testing Guide](https://stripe.com/docs/testing)
- Check database with: `psql -h localhost -U postgres -d arthive`

**Happy selling on ArtHive! 🎨**
