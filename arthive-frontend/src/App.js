import React from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { NotificationProvider } from "./context/NotificationContext";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Layout from "./components/Layout/Layout";
import ScrollToTop from "./components/Common/ScrollToTop";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import RegisterArtist from "./pages/artist/RegisterArtist";
import ArtistProfileSetup from "./pages/artist/ArtistProfileSetup";
import ArtistDashboard from "./pages/artist/ArtistDashboard";
import UploadArtworks from "./pages/artist/UploadArtworks";
import SoldPaintings from "./pages/artist/SoldPaintings";
import ArtworkGallery from "./components/Artwork/ArtworkGallery";
import ArtworkDetail from "./pages/artwork/ArtworkDetail";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import Cart from "./pages/user/Cart";
import Wishlist from "./pages/user/Wishlist";
import Profile from "./pages/user/Profile";
import MyOrders from "./pages/user/MyOrders";
import ArtistsList from "./components/Artists/ArtistsList";
import ArtistDetail from "./pages/artists/ArtistDetail";
import AdminPanel from "./pages/admin/AdminPanel";
import Privacy from "./pages/Privacy";
import TermsAndConditions from "./pages/TermsAndConditions";

const stripeKey = process.env.REACT_APP_STRIPE_PUBLIC_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const NotFound = () => (
  <div style={{ padding: "40px", textAlign: "center" }}>
    <h1>404 - Page Not Found</h1>
  </div>
);

const CheckoutRoute = () => {
  if (!stripePromise) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        Stripe is not configured. Please set REACT_APP_STRIPE_PUBLIC_KEY.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutPage />
    </Elements>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <ScrollToTop />
          <Layout>
            <Routes>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="reset-password/:token" element={<ResetPassword />} />
              <Route path="artist/register" element={<RegisterArtist />} />
              <Route path="artist/profile" element={<ArtistProfileSetup />} />
              <Route path="artist/dashboard" element={<ArtistDashboard />} />
              <Route path="artist/sold-paintings" element={<SoldPaintings />} />
              <Route path="artist/upload" element={<UploadArtworks />} />
              <Route path="artworks" element={<ArtworkGallery />} />
              <Route path="artwork/:id" element={<ArtworkDetail />} />
              <Route path="checkout" element={<CheckoutRoute />} />
              <Route path="order-confirmation/:orderId" element={<OrderConfirmationPage />} />
              <Route path="cart" element={<Cart />} />
              <Route path="wishlist" element={<Wishlist />} />
              <Route path="orders" element={<MyOrders />} />
              <Route path="my-orders" element={<MyOrders />} />
              <Route path="profile" element={<Profile />} />
              <Route path="artists" element={<ArtistsList />} />
              <Route path="artists/:id" element={<ArtistDetail />} />
              <Route path="admin" element={<AdminPanel />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<TermsAndConditions />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;