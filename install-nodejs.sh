#!/bin/bash
# Quick fix for missing Node.js/npm on server

echo "Installing Node.js 18 and npm..."

# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Install build tools (needed for native modules)
sudo apt-get install -y build-essential

# Install Python 3 and pip (for ML models)
sudo apt-get install -y python3 python3-pip python3-venv

# Install other needed tools
sudo apt-get install -y git curl wget

# Verify installations
echo ""
echo "✅ Installation complete. Verifying..."
node --version
npm --version
python3 --version
git --version

echo ""
echo "✅ All tools installed successfully!"
