// server.js - Error-free version
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Load config after dependencies
const config = require('./config');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files (artist portfolio, etc.)
const path = require('path');
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath, {
  etag: false,
  lastModified: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  },
}));

// Disable ETag to prevent 304 responses
app.disable('etag');

// Set no-cache headers for all API responses
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Debug middleware (optional)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// Import routes with error handling
let authRoutes, buyerRoutes, artistRoutes, cartRoutes, wishlistRoutes, adminRoutes;

try {
  authRoutes = require('./routes/auth.routes');
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.warn('⚠️ Auth routes not found, creating placeholder');
  authRoutes = require('express').Router();
  authRoutes.get('/test', (req, res) => res.json({ message: 'Auth placeholder' }));
}

try {
  buyerRoutes = require('./routes/buyer.routes');
  console.log('✅ Buyer routes loaded');
} catch (error) {
  console.warn('⚠️ Buyer routes not found, creating placeholder');
  buyerRoutes = require('express').Router();
  buyerRoutes.get('/test', (req, res) => res.json({ message: 'Buyer placeholder' }));
}

try {
  artistRoutes = require('./routes/artist.routes');
  console.log('✅ Artist routes loaded');
} catch (error) {
  console.warn('⚠️ Artist routes not found, creating placeholder');
  console.error('Error details:', error.message);
  artistRoutes = require('express').Router();
  artistRoutes.get('/test', (req, res) => res.json({ message: 'Artist placeholder' }));
}

try {
  adminRoutes = require('./routes/admin.routes');
  console.log('✅ Admin routes loaded');
} catch (error) {
  console.warn('⚠️ Admin routes not found, creating placeholder');
  adminRoutes = require('express').Router();
  adminRoutes.get('/test', (req, res) => res.json({ message: 'Admin placeholder' }));
}

try {
  cartRoutes = require('./routes/cart.routes');
  console.log('✅ Cart routes loaded');
} catch (error) {
  console.warn('⚠️ Cart routes not found, creating placeholder');
  cartRoutes = require('express').Router();
  cartRoutes.get('/test', (req, res) => res.json({ message: 'Cart placeholder' }));
}

try {
  wishlistRoutes = require('./routes/wishlist.routes');
  console.log('✅ Wishlist routes loaded');
} catch (error) {
  console.warn('⚠️ Wishlist routes not found, creating placeholder');
  wishlistRoutes = require('express').Router();
  wishlistRoutes.get('/test', (req, res) => res.json({ message: 'Wishlist placeholder' }));
}

let paymentRoutes;
try {
  paymentRoutes = require('./routes/payment.routes');
  console.log('✅ Payment routes loaded');
} catch (error) {
  console.warn('⚠️ Payment routes not found, creating placeholder');
  paymentRoutes = require('express').Router();
  paymentRoutes.get('/test', (req, res) => res.json({ message: 'Payment placeholder' }));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/artist', artistRoutes);
app.use('/api/admin', adminRoutes);
// Debug: list mounted artist routes (helpful to confirm /portfolio is registered)
try {
  if (artistRoutes && artistRoutes.stack) {
    console.log('Registered /api/artist routes:');
    artistRoutes.stack.forEach((layer) => {
      if (layer.route && layer.route.path) {
        const methods = layer.route.methods ? Object.keys(layer.route.methods).join(',') : '';
        console.log(`  - ${methods.toUpperCase()} /api/artist${layer.route.path}`);
      }
    });
  }
} catch (e) {
  console.warn('Could not list artist routes:', e.message);
}
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/payment', paymentRoutes);

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'ArtHive API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'ArtHive API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv
  });
});

// External script for reset password page. Required because CSP blocks inline scripts.
app.get('/reset-password.js', (req, res) => {
  res.type('application/javascript');
  return res.send(`
(() => {
  const form = document.getElementById('resetForm');
  const messageEl = document.getElementById('message');
  const submitBtn = document.getElementById('submitBtn');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPasswordBtn');
  const matchHintEl = document.getElementById('matchHint');
  const tokenEncoded = form?.dataset?.token || '';
  const token = tokenEncoded ? decodeURIComponent(tokenEncoded) : '';
  const apiUrl = new URL('/api/auth/reset-password', window.location.origin).toString();

  const showMessage = (type, text) => {
    if (!messageEl) return;
    messageEl.className = type === 'ok' ? 'msg ok' : 'msg err';
    messageEl.textContent = text || '';
  };

  const setSubmitting = (isSubmitting) => {
    if (!submitBtn) return;
    submitBtn.disabled = isSubmitting;
    submitBtn.style.opacity = isSubmitting ? '0.75' : '1';
    submitBtn.style.cursor = isSubmitting ? 'not-allowed' : 'pointer';
    submitBtn.textContent = isSubmitting ? 'Updating...' : 'Update Password';
  };

  const updateMatchHint = () => {
    if (!passwordInput || !confirmPasswordInput || !matchHintEl) return;

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!password && !confirmPassword) {
      matchHintEl.className = 'hint';
      matchHintEl.textContent = '';
      return;
    }

    if (password.length > 0 && password.length < 6) {
      matchHintEl.className = 'hint err';
      matchHintEl.textContent = 'Password must be at least 6 characters.';
      return;
    }

    if (!confirmPassword) {
      matchHintEl.className = 'hint';
      matchHintEl.textContent = 'Please confirm your password.';
      return;
    }

    if (password === confirmPassword) {
      matchHintEl.className = 'hint ok';
      matchHintEl.textContent = 'Passwords match.';
    } else {
      matchHintEl.className = 'hint err';
      matchHintEl.textContent = 'Passwords do not match.';
    }
  };

  const toggleInputType = (inputEl, btnEl) => {
    if (!inputEl || !btnEl) return;
    const nextType = inputEl.type === 'password' ? 'text' : 'password';
    inputEl.type = nextType;
    btnEl.textContent = nextType === 'password' ? 'Show' : 'Hide';
  };

  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => toggleInputType(passwordInput, togglePasswordBtn));
  }
  if (toggleConfirmPasswordBtn) {
    toggleConfirmPasswordBtn.addEventListener('click', () => toggleInputType(confirmPasswordInput, toggleConfirmPasswordBtn));
  }
  if (passwordInput) {
    passwordInput.addEventListener('input', updateMatchHint);
  }
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', updateMatchHint);
  }

  if (!token) {
    showMessage('err', 'Invalid reset token. Please request a new reset link.');
    if (form) {
      form.style.display = 'none';
    }
    return;
  }

  if (!form) {
    showMessage('err', 'Reset form could not be loaded. Please refresh.');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showMessage('ok', '');

    const password = passwordInput ? passwordInput.value : '';
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

    if (password.length < 6) {
      showMessage('err', 'Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      showMessage('err', 'Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      let data;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const rawText = await res.text();
        data = { success: false, message: rawText || 'Unexpected server response' };
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to reset password');
      }

      showMessage('ok', 'Password updated successfully. You can now login.');
      form.reset();
      updateMatchHint();
    } catch (err) {
      showMessage('err', err.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  });
})();
  `);
});

// Serve reset password page directly from backend to avoid host/port mismatch loops.
app.get('/reset-password', (req, res) => {
  const token = req.query?.token ? String(req.query.token) : '';
  const encodedToken = encodeURIComponent(token);

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Reset Password - ArtHive</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f5f7fb; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .card { width: min(420px, calc(100vw - 32px)); margin: 0 auto; background: white; border-radius: 12px; padding: 24px; box-shadow: 0 10px 24px rgba(15,23,42,0.12); }
        h2 { margin-top: 0; color: #0f172a; }
        label { display: block; margin: 10px 0 6px; color: #334155; font-weight: 600; }
        input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; }
        .input-wrap { position: relative; }
        .input-wrap input { padding-right: 86px; }
        .toggle-btn { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); border: 0; background: transparent; color: #2563eb; cursor: pointer; font-weight: 700; font-size: 12px; padding: 4px 8px; }
        .submit-btn { width: 100%; margin-top: 14px; padding: 10px 12px; border: 0; border-radius: 8px; background: #2563eb; color: white; font-weight: 700; cursor: pointer; }
        .msg { margin-top: 12px; font-size: 14px; }
        .hint { margin-top: 6px; font-size: 12px; color: #64748b; min-height: 16px; }
        .hint.ok { color: #166534; }
        .hint.err { color: #b91c1c; }
        .ok { color: #166534; }
        .err { color: #b91c1c; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Reset Password</h2>
        <p>Enter your new password below.</p>
        <form id="resetForm" data-token="${encodedToken}">
          <label for="password">New Password</label>
          <div class="input-wrap">
            <input id="password" type="password" minlength="6" required />
            <button type="button" id="togglePasswordBtn" class="toggle-btn">Show</button>
          </div>
          <label for="confirmPassword">Confirm Password</label>
          <div class="input-wrap">
            <input id="confirmPassword" type="password" minlength="6" required />
            <button type="button" id="toggleConfirmPasswordBtn" class="toggle-btn">Show</button>
          </div>
          <div id="matchHint" class="hint"></div>
          <button id="submitBtn" class="submit-btn" type="submit">Update Password</button>
        </form>
        <div id="message" class="msg"></div>
      </div>
      <script src="/reset-password.js"></script>
    </body>
  </html>`;

  return res.status(200).send(html);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🔥 Error:', {
    message: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method
  });
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error);
  console.log('🔄 Server continuing...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`\n✨ ==================================== ✨`);
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Environment: ${config.nodeEnv}`);
  console.log(`✅ Test URL: http://localhost:${PORT}/api/test`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  console.log(`✅ Frontend URL: ${config.cors.origin}`);
  console.log(`\n📋 Available API Routes:`);
  console.log(`   - http://localhost:${PORT}/api/auth/*`);
  console.log(`   - http://localhost:${PORT}/api/buyer/*`);
  console.log(`   - http://localhost:${PORT}/api/artist/*`);
  console.log(`   - http://localhost:${PORT}/api/cart/*`);
  console.log(`   - http://localhost:${PORT}/api/wishlist/*`);
  console.log(`✨ ==================================== ✨\n`);
});