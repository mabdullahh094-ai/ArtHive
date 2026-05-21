/**
 * Price Recommendation Controller
 * Handles AI-based price prediction for artworks
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to Python scripts
const PREDICT_SCRIPT = path.join(__dirname, '../ml_models/predict_price.py');
const ANALYZE_IMAGE_SCRIPT = path.join(__dirname, '../ml_models/analyze_image.py');

/**
 * Analyze artwork image for quality metrics
 * POST /api/artist/analyze-image
 * Body: { imagePath: '/path/to/image.jpg' }
 */
const analyzeImage = async (req, res) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({
        success: false,
        error: 'imagePath is required'
      });
    }

    if (!fs.existsSync(imagePath)) {
      return res.status(400).json({
        success: false,
        error: 'Image file not found'
      });
    }

    // Call Python image analysis script
    const analysis = await callPythonImageAnalyzer(imagePath);

    if (!analysis.success) {
      return res.status(400).json({
        success: false,
        error: analysis.error || 'Image analysis failed'
      });
    }

    return res.json({
      success: true,
      analysis: {
        // Pixel dimensions
        width_px: analysis.width_px,
        height_px: analysis.height_px,
        
        // Physical dimensions (in cm)
        width_cm: analysis.width_cm,
        height_cm: analysis.height_cm,
        size_cm2: analysis.size_cm2,
        aspect_ratio: analysis.aspect_ratio,
        
        // Quality scores
        image_brightness_score: analysis.brightness_score,
        image_contrast_score: analysis.contrast_score,
        composition_score: analysis.composition_score,
        color_harmony_score: analysis.color_harmony_score,
        ai_quality_score: analysis.quality_score,
        ai_authenticity_score: analysis.authenticity_score,
        sharpness_score: analysis.sharpness_score
      }
    });

  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during analysis',
      details: error.message
    });
  }
};

/**
 * Call Python image analyzer and get result
 */
function callPythonImageAnalyzer(imagePath) {
  return new Promise((resolve, reject) => {
    try {
      const pythonProcess = spawn('python', [ANALYZE_IMAGE_SCRIPT, imagePath]);

      let outputData = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        try {
          // Extract JSON from output (it might have logs before/after)
          const lines = outputData.split('\n');
          let jsonLine = null;
          
          for (const line of lines) {
            if (line.trim().startsWith('{')) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.success !== undefined) {
                  jsonLine = parsed;
                  break;
                }
              } catch (e) {
                // Not JSON, continue
              }
            }
          }

          if (jsonLine) {
            resolve(jsonLine);
          } else {
            // Fallback: try to parse last line
            try {
              const lastLine = lines.filter(l => l.trim()).pop();
              if (lastLine && lastLine.includes('{')) {
                const result = JSON.parse(lastLine.substring(lastLine.indexOf('{')));
                resolve(result);
              } else {
                reject(new Error('No JSON output from Python script'));
              }
            } catch (e) {
              reject(new Error(`Failed to parse Python output: ${outputData.substring(0, 500)}`));
            }
          }
        } catch (err) {
          reject(err);
        }
      });

      pythonProcess.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Predict artwork price using ML model
 * POST /api/artist/predict-price
 * Supports both image-based prediction (new) and feature-based prediction (legacy)
 */
const predictPrice = async (req, res) => {
  try {
    const { artworkData, imagePath } = req.body;
    const uploadedImagePath = req.file?.path;
    const resolvedImagePath = imagePath || artworkData?.imagePath || uploadedImagePath;

    // Validate input
    if (!artworkData && !resolvedImagePath) {
      return res.status(400).json({
        success: false,
        error: 'Either artworkData or imagePath is required'
      });
    }

    // NEW: Image-based prediction using PyTorch model
    if (resolvedImagePath) {
      const imagePathToUse = resolvedImagePath;
      
      if (!fs.existsSync(imagePathToUse)) {
        return res.status(400).json({
          success: false,
          error: 'Image file not found at: ' + imagePathToUse
        });
      }

      try {
        const prediction = await callPythonPredictorImage(imagePathToUse);
        
        if (!prediction.success) {
          return res.status(400).json({
            success: false,
            error: prediction.error || 'Image-based prediction failed'
          });
        }

        return res.json({
          success: true,
          prediction: {
            predicted_price_pkr: prediction.predicted_price_pkr,
            price_range: prediction.price_range,
            confidence: prediction.confidence,
            currency: prediction.currency,
            model_type: 'image_based_pytorch',
            model_location: 'C:\\Users\\11 TRDs\\Desktop\\Abdullah\\Scrapping\\models\\image_price_regressor_feedback_v2',
            image_path: imagePathToUse
          }
        });
      } catch (error) {
        console.error('Image-based prediction error:', error);
        return res.status(500).json({
          success: false,
          error: 'Image-based prediction failed: ' + error.message
        });
      }
    }

    // LEGACY: Feature-based prediction
    // Validate input
    const toValidCategory = (value, allowed, fallback) => {
      const normalized = String(value ?? '').trim().toLowerCase();
      return allowed.includes(normalized) ? normalized : fallback;
    };

    const validMediums = ['acrylic', 'charcoal', 'digital', 'gouache', 'ink', 'mixed_media', 'oil', 'pastel', 'watercolor'];
    const validStyles = ['abstract', 'conceptual', 'expressionism', 'impressionism', 'landscape', 'minimalism', 'pop_art', 'portrait', 'realism', 'surrealism'];
    const validConditions = ['excellent', 'fair', 'good', 'new'];
    const validCountries = ['bangladesh', 'canada', 'france', 'germany', 'india', 'italy', 'japan', 'pakistan', 'turkey', 'uae', 'uk', 'usa'];
    const countryCaseMap = {
      bangladesh: 'Bangladesh',
      canada: 'Canada',
      france: 'France',
      germany: 'Germany',
      india: 'India',
      italy: 'Italy',
      japan: 'Japan',
      pakistan: 'Pakistan',
      turkey: 'Turkey',
      uae: 'UAE',
      uk: 'UK',
      usa: 'USA'
    };

    let normalizedCondition = String(artworkData.condition ?? '').trim().toLowerCase();
    if (normalizedCondition === 'poor') {
      normalizedCondition = 'fair';
    }

    // Prepare features for Python model
    const features = {
      width_cm: parseFloat(artworkData.width_cm) || 50,
      height_cm: parseFloat(artworkData.height_cm) || 60,
      size_cm2: parseFloat(artworkData.size_cm2) || 3000,
      aspect_ratio: parseFloat(artworkData.aspect_ratio) || 0.83,
      medium: toValidCategory(artworkData.medium, validMediums, 'oil'),
      style: toValidCategory(artworkData.style, validStyles, 'impressionism'),
      artist_experience_years: parseInt(artworkData.artist_experience_years) || 5,
      artist_previous_sales: parseInt(artworkData.artist_previous_sales) || 0,
      artist_reputation_score: parseFloat(artworkData.artist_reputation_score) || 3.0,
      country: countryCaseMap[toValidCategory(artworkData.country, validCountries, 'pakistan')],
      is_original: parseInt(artworkData.is_original) || 1,
      edition_size: parseInt(artworkData.edition_size) || 1,
      condition: toValidCategory(normalizedCondition, validConditions, 'good'),
      year_created: parseInt(artworkData.year_created) || new Date().getFullYear(),
      time_taken_hours: parseFloat(artworkData.time_taken_hours) || 10,
      ai_quality_score: parseFloat(artworkData.ai_quality_score) || 0.75,
      ai_authenticity_score: parseFloat(artworkData.ai_authenticity_score) || 0.80,
      image_brightness_score: parseFloat(artworkData.image_brightness_score) || 0.70,
      image_contrast_score: parseFloat(artworkData.image_contrast_score) || 0.75,
      composition_score: parseFloat(artworkData.composition_score) || 0.80,
      color_harmony_score: parseFloat(artworkData.color_harmony_score) || 0.80,
      subject_complexity_score: parseFloat(artworkData.subject_complexity_score) || 0.75,
      market_demand_index: parseFloat(artworkData.market_demand_index) || 0.50
    };

    // Call Python prediction script
    const prediction = await callPythonPredictor(features);

    if (!prediction.success) {
      return res.status(400).json({
        success: false,
        error: prediction.error || 'Prediction failed'
      });
    }

    // Return prediction with additional metadata
    return res.json({
      success: true,
      prediction: {
        predicted_price: prediction.predicted_price,
        price_range: prediction.price_range,
        confidence: prediction.confidence,
        currency: 'USD',
        model_info: {
          accuracy: 'R² = 0.7746 (77.46%)',
          training_samples: 4000,
          test_rmse: '$714.08'
        }
      },
      artworkSummary: {
        medium: features.medium,
        style: features.style,
        size_cm2: features.size_cm2,
        condition: features.condition,
        is_original: features.is_original === 1 ? 'Original' : 'Copy',
        artist_experience: `${features.artist_experience_years} years`,
        artist_sales: features.artist_previous_sales
      }
    });

  } catch (error) {
    console.error('Price prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during prediction',
      details: error.message
    });
  }
};

/**
 * Call Python prdiction script with image path (NEW - PyTorch model)
 * Returns promise with prediction result
 */
function callPythonPredictorImage(imagePath) {
  return new Promise((resolve, reject) => {
    try {
      // Spawn Python process with image path as argument
      const pythonProcess = spawn('python', [PREDICT_SCRIPT, imagePath]);

      let outputData = '';
      let errorData = '';

      // Handle stdout
      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      // Handle stderr
      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      // Handle process exit
      pythonProcess.on('close', (code) => {
        try {
          // Parse JSON from output
          const lines = outputData.split('\n');
          let result = null;

          // Find JSON in output
          for (const line of lines) {
            if (line.trim().startsWith('{')) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.success !== undefined) {
                  result = parsed;
                  break;
                }
              } catch (e) {
                // Not JSON, continue
              }
            }
          }

          if (result) {
            resolve(result);
          } else {
            // Try last non-empty line
            const lastLine = lines.filter(l => l.trim()).pop();
            if (lastLine && lastLine.includes('{')) {
              try {
                const parsed = JSON.parse(lastLine);
                resolve(parsed);
              } catch (e) {
                reject(new Error(`Invalid JSON output: ${outputData}`));
              }
            } else {
              reject(new Error(`No valid output from predictor. stderr: ${errorData}`));
            }
          }
        } catch (err) {
          reject(err);
        }
      });

      pythonProcess.on('error', (err) => {
        reject(new Error(`Failed to spawn Python process: ${err.message}`));
      });

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Call Python prediction script and get result
 * Returns promise with prediction result
 */
function callPythonPredictor(features) {
  return new Promise((resolve, reject) => {
    try {
      // Spawn Python process
      const pythonProcess = spawn('python', [PREDICT_SCRIPT]);

      let outputData = '';
      let errorData = '';

      // Handle stdout
      pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
      });

      // Handle stderr
      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
      });

      // Handle process exit
      pythonProcess.on('close', (code) => {
        try {
          // Try to parse JSON from output
          const lines = outputData.split('\n');
          
          // Find JSON in output (it might be mixed with logs)
          let jsonLine = null;
          for (const line of lines) {
            if (line.includes('PREDICTION SUCCESSFUL') || line.includes('Predicted Price')) {
              continue;
            }
            try {
              const parsed = JSON.parse(line);
              if (parsed.success !== undefined) {
                jsonLine = parsed;
                break;
              }
            } catch (e) {
              // Not JSON, continue
            }
          }

          // If no JSON found, create result from features
          if (!jsonLine) {
            // Use direct Python import instead
            callPythonImport(features, resolve, reject);
            return;
          }

          resolve(jsonLine);
        } catch (err) {
          reject(err);
        }
      });

      // Send features as JSON to stdin
      pythonProcess.stdin.write(JSON.stringify(features));
      pythonProcess.stdin.end();

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Alternative: Direct Python import using child_process
 * More reliable than spawning Python script
 */
function callPythonImport(features, resolve, reject) {
  try {
  // Create a simple Python script that returns JSON only
  const modelPath = JSON.stringify(path.join(__dirname, '../ml_models'));
    const pythonCode = `
import sys
import json
import io
import contextlib
sys.path.insert(0, ${modelPath})
from predict_price import predict_price

features = json.loads(sys.argv[1])
with contextlib.redirect_stdout(io.StringIO()):
  result = predict_price(features)
print(json.dumps(result))
`;

  const pythonProcess = spawn('python', ['-c', pythonCode, JSON.stringify(features)]);
    let outputData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.on('close', (code) => {
      try {
        const lines = outputData.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

        for (let index = lines.length - 1; index >= 0; index -= 1) {
          try {
            const parsed = JSON.parse(lines[index]);
            if (parsed && parsed.success !== undefined) {
              resolve(parsed);
              return;
            }
          } catch (parseError) {
            // Keep scanning upward until we find the JSON payload.
          }
        }

        reject(new Error(`Failed to parse Python output: ${outputData || 'no output'}`));
      } catch (err) {
        reject(new Error(`Failed to parse Python output: ${outputData || err.message}`));
      }
    });

    pythonProcess.on('error', (err) => {
      reject(err);
    });

  } catch (error) {
    reject(error);
  }
}

/**
 * Get prediction model info and metrics
 * GET /api/artist/prediction-info
 */
const getPredictionInfo = (req, res) => {
  try {
    res.json({
      success: true,
      model_info: {
        name: 'ArtHive Price Recommendation Model',
        type: 'Random Forest Regression',
        training_date: '2025-04-01',
        training_samples: 5000,
        test_samples: 1000,
        accuracy_metrics: {
          r2_score: 0.7746,
          rmse: '$714.08',
          mae: '$507.81'
        },
        top_features: [
          { feature: 'Size (cm²)', importance: 0.5345 },
          { feature: 'Artist Previous Sales', importance: 0.0689 },
          { feature: 'Edition Size', importance: 0.0611 },
          { feature: 'Artist Reputation Score', importance: 0.0545 },
          { feature: 'Market Demand Index', importance: 0.0447 }
        ]
      },
      required_fields: {
        numerical: [
          'width_cm', 'height_cm', 'size_cm2', 'aspect_ratio',
          'artist_experience_years', 'artist_previous_sales', 'artist_reputation_score',
          'edition_size', 'year_created', 'time_taken_hours',
          'ai_quality_score', 'ai_authenticity_score', 'image_brightness_score',
          'image_contrast_score', 'composition_score', 'color_harmony_score',
          'subject_complexity_score', 'market_demand_index'
        ],
        categorical: ['medium', 'style', 'country', 'is_original', 'condition']
      },
      valid_categories: {
        medium: ['oil', 'acrylic', 'watercolor', 'ink', 'pastel', 'gouache', 'mixed_media', 'crayon', 'pencil'],
        style: ['impressionism', 'realism', 'landscape', 'minimalism', 'conceptual', 'pop_art', 'expressionism', 'surrealism', 'abstract', 'digital'],
        condition: ['poor', 'fair', 'good', 'excellent'],
        is_original: [0, 1],
        country: ['Pakistan', 'India', 'UK', 'USA', 'Canada', 'Australia', 'Japan', 'Turkey', 'Italy', 'Ireland', 'Netherlands', 'Singapore']
      }
    });
  } catch (error) {
    console.error('Error getting prediction info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get prediction info'
    });
  }
};

module.exports = {
  analyzeImage,
  predictPrice,
  getPredictionInfo
};
