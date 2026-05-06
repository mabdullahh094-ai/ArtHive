/**
 * Quick Test Script for Price Recommendation API
 * Tests the backend endpoint
 */

const http = require('http');

// Test data
const testArtwork = {
  artworkData: {
    width_cm: 60,
    height_cm: 80,
    size_cm2: 4800,
    aspect_ratio: 0.75,
    medium: 'oil',
    style: 'realism',
    artist_experience_years: 15,
    artist_previous_sales: 30,
    artist_reputation_score: 4.5,
    country: 'Pakistan',
    is_original: 1,
    edition_size: 1,
    condition: 'excellent',
    year_created: 2023,
    time_taken_hours: 60,
    ai_quality_score: 0.88,
    ai_authenticity_score: 0.92,
    image_brightness_score: 0.80,
    image_contrast_score: 0.85,
    composition_score: 0.90,
    color_harmony_score: 0.88,
    subject_complexity_score: 0.82,
    market_demand_index: 0.70
  }
};

console.log('='.repeat(60));
console.log('Price Recommendation API - Backend Test');
console.log('='.repeat(60));

// Test 1: Get Prediction Info (Public endpoint)
console.log('\n[Test 1] GET /api/artist/prediction-info (PUBLIC)');
console.log('Fetching model information and valid categories...\n');

const options1 = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/artist/prediction-info',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req1 = http.request(options1, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.success) {
        console.log('✓ SUCCESS');
        console.log(`  - Model: ${response.model_info.name}`);
        console.log(`  - Type: ${response.model_info.type}`);
        console.log(`  - R² Score: ${response.model_info.accuracy_metrics.r2_score}`);
        console.log(`  - Training Samples: ${response.model_info.training_samples}`);
        console.log(`  - Valid Mediums: ${response.model_info.valid_categories.medium.slice(0, 3).join(', ')}...`);
        console.log(`  - Valid Styles: ${response.model_info.valid_categories.style.slice(0, 3).join(', ')}...`);
      } else {
        console.log('✗ FAILED:', response.error);
      }
    } catch (e) {
      console.log('✗ Error parsing response:', e.message);
    }
  });
});

req1.on('error', (error) => {
  console.log('✗ Connection error for Test 1:', error.message);
  console.log('\nPlease make sure the backend server is running:');
  console.log('  npm start  (in arthive-backend directory)');
});

req1.end();

// Test 2: Price Prediction (Protected - without auth, should fail)
setTimeout(() => {
  console.log('\n' + '='.repeat(60));
  console.log('[Test 2] POST /api/artist/predict-price (PROTECTED - no auth)');
  console.log('This should fail without authentication...\n');

  const postData = JSON.stringify(testArtwork);

  const options2 = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/artist/predict-price',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req2 = http.request(options2, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`Status: ${res.statusCode}`);
        
        if (res.statusCode === 401 || res.statusCode === 403) {
          console.log('✓ CORRECT - Request blocked (auth required)');
          console.log(`  Error: ${response.message || response.error}`);
        } else if (response.success) {
          console.log('✓ SUCCESS (Auth might be bypassed or server started fresh)');
          console.log(`  Predicted Price: $${response.prediction.predicted_price}`);
          console.log(`  Price Range: $${response.prediction.price_range.min} - $${response.prediction.price_range.max}`);
          console.log(`  Confidence: ${(response.prediction.confidence * 100).toFixed(2)}%`);
        } else {
          console.log('? Response:', response.error || 'Unknown response');
        }
      } catch (e) {
        console.log('Response received (non-JSON):', data.substring(0, 100));
      }
    });
  });

  req2.on('error', (error) => {
    // Error already logged in Test 1
    console.log('(Server still not running)');
  });

  req2.write(postData);
  req2.end();

}, 500);

// Test 3: Summary
setTimeout(() => {
  console.log('\n' + '='.repeat(60));
  console.log('Test Summary:');
  console.log('='.repeat(60));
  console.log('\n✓ API Endpoint Tests Completed!');
  console.log('\nTo test with authentication:');
  console.log('1. Login as an artist');
  console.log('2. Get JWT token from response');
  console.log('3. Include token in Authorization header:');
  console.log('   Authorization: Bearer <your_token>');
  console.log('\nExample cURL command:');
  console.log('curl -X POST http://localhost:5000/api/artist/predict-price \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -H "Authorization: Bearer <token>" \\');
  console.log('  -d \'{"artworkData": {...}}\'');
  console.log('\n' + '='.repeat(60));

}, 1000);
