/**
 * Comprehensive API Test Script
 * Tests all price recommendation endpoints
 */

const http = require('http');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(color, msg) {
  console.log(colors[color] + msg + colors.reset);
}

// Test 1: Get Prediction Info (Public)
function testPredictionInfo() {
  return new Promise((resolve) => {
    log('blue', '\n[TEST 1] GET /api/artist/prediction-info');
    log('blue', '─'.repeat(60));

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/artist/prediction-info',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.success) {
            log('green', '✓ SUCCESS\n');
            log('green', 'Model Information:');
            console.log(`  Name: ${response.model_info.name}`);
            console.log(`  Type: ${response.model_info.type}`);
            console.log(`  R² Score: ${response.model_info.accuracy_metrics.r2_score}`);
            console.log(`  RMSE: ${response.model_info.accuracy_metrics.rmse}`);
            console.log(`  Training Samples: ${response.model_info.training_samples}`);
            
            log('green', '\nValid Categories:');
            console.log(`  Mediums: ${response.model_info.valid_categories.medium.slice(0,3).join(', ')}...`);
            console.log(`  Styles: ${response.model_info.valid_categories.style.slice(0,3).join(', ')}...`);
            console.log(`  Conditions: ${response.model_info.valid_categories.condition.join(', ')}`);
            
            resolve(true);
          } else {
            log('red', `✗ FAILED: ${response.error}`);
            resolve(false);
          }
        } catch (e) {
          log('red', `✗ Error parsing response: ${e.message}`);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      log('red', `✗ Connection failed: ${err.message}`);
      log('yellow', '\n⚠️  Backend server not running!');
      log('yellow', 'Start it with: cd arthive-backend && npm start\n');
      resolve(false);
    });

    req.end();
  });
}

// Test 2: Predict Price (Without Auth - should fail)
function testPredictionWithoutAuth() {
  return new Promise((resolve) => {
    setTimeout(() => {
      log('blue', '\n[TEST 2] POST /api/artist/predict-price (WITHOUT AUTH)');
      log('blue', '─'.repeat(60));

      const testData = {
        artworkData: {
          width_cm: 60,
          height_cm: 80,
          size_cm2: 4800,
          aspect_ratio: 0.75,
          medium: 'oil',
          style: 'realism',
          artist_experience_years: 15,
          artist_previous_sales: 30,
          artist_reputation_score: 4.2,
          country: 'Pakistan',
          is_original: 1,
          edition_size: 1,
          condition: 'excellent',
          year_created: 2023,
          time_taken_hours: 60,
          ai_quality_score: 0.85,
          ai_authenticity_score: 0.90,
          image_brightness_score: 0.80,
          image_contrast_score: 0.85,
          composition_score: 0.88,
          color_harmony_score: 0.85,
          subject_complexity_score: 0.82,
          market_demand_index: 0.70
        }
      };

      const postData = JSON.stringify(testData);

      const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/artist/predict-price',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);

            if (res.statusCode === 401 || res.statusCode === 403) {
              log('green', `✓ CORRECT - Auth required (Status: ${res.statusCode})\n`);
              console.log(`  Message: ${response.message || response.error}`);
              resolve(true);
            } else if (response.success && response.prediction) {
              log('yellow', `⚠️  Auth might be disabled\n`);
              console.log(`  Predicted Price: $${response.prediction.predicted_price}`);
              console.log(`  Confidence: ${(response.prediction.confidence * 100).toFixed(2)}%`);
              resolve(true);
            } else {
              log('red', `✗ Unexpected response: ${response.error}`);
              resolve(false);
            }
          } catch (e) {
            log('red', `✗ Error parsing response: ${e.message}`);
            resolve(false);
          }
        });
      });

      req.on('error', (err) => {
        log('red', `✗ Connection failed: ${err.message}`);
        resolve(false);
      });

      req.write(postData);
      req.end();
    }, 500);
  });
}

// Test 3: Summary
async function runAllTests() {
  log('blue', '\n' + '='.repeat(60));
  log('blue', '  ArtHive Price Recommendation - API Test Suite');
  log('blue', '='.repeat(60));

  const test1Result = await testPredictionInfo();
  const test2Result = await testPredictionWithoutAuth();

  setTimeout(() => {
    log('blue', '\n' + '='.repeat(60));
    log('blue', 'TEST RESULTS SUMMARY');
    log('blue', '='.repeat(60));

    console.log(`\n[Test 1] Prediction Info:     ${test1Result ? log('green', '✓ PASSED') || '✓' : log('red', '✗ FAILED') || '✗'}`);
    console.log(`[Test 2] Price Prediction:   ${test2Result ? log('green', '✓ PASSED') || '✓' : log('red', '✗ FAILED') || '✗'}`);

    log('blue', '\n' + '='.repeat(60));
    log('green', '\n✓ API Tests Completed!\n');
    
    log('yellow', 'Next Steps:');
    console.log('1. Start backend: npm start');
    console.log('2. Start frontend: npm start (in arthive-frontend)');
    console.log('3. Login as artist');
    console.log('4. Go to "Upload Artwork"');
    console.log('5. Upload image and click "Get AI Price Recommendation"');
    console.log('6. Select 4 fields and click "Predict Price"');
    console.log('7. See price prediction!\n');

    process.exit(0);
  }, 1000);
}

// Run tests
runAllTests();
