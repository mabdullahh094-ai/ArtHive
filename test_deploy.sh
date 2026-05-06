set -e
DEPLOY_DIR=/var/www/arthive
echo "========================================"
echo "🚀 ArtHive Deployment Starting"
echo "========================================"
echo "Server: 51.21.111.113"
echo "Directory: $DEPLOY_DIR"
echo ""
cd $DEPLOY_DIR || { echo "❌ Deploy directory not found"; exit 1; }
echo ""
echo "🔍 Verifying environment configuration..."
if [ ! -f "arthive-backend/.env" ]; then
  echo "❌ ERROR: arthive-backend/.env not found!"
  echo "Please create it manually before deploying"
  exit 1
fi
echo "✅ Backend .env found"
if [ ! -f "arthive-frontend/.env" ]; then
  echo "⚠️  Frontend .env not found - some features may not work"
else
  echo "✅ Frontend .env found"
fi
echo ""
echo "🤖 Verifying ML model..."
if [ ! -f "$DEPLOY_DIR/Scrapping/models/image_price_regressor_feedback_v2/best_model.pt" ]; then
  echo "⚠️  ML model not found at $DEPLOY_DIR/Scrapping/models/image_price_regressor_feedback_v2/best_model.pt"
  echo "Price prediction features may not work correctly."
else
  echo "✅ ML model found"
fi
echo ""
echo "📁 Setting up upload directories..."
mkdir -p arthive-backend/uploads/artist_portfolio
mkdir -p arthive-backend/uploads/profile_pics
mkdir -p arthive-backend/uploads/temp_predictions
mkdir -p models/image_price_regressor_feedback_v2
echo "✅ Directories ready"
echo ""
echo "⏹️  Stopping current services..."
sudo systemctl stop arthive-backend 2>/dev/null || true
sudo systemctl stop arthive-frontend 2>/dev/null || true
sleep 2
echo "✅ Services stopped"
