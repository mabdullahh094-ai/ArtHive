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
 * Uses image-based PyTorch model for prediction
 * Expects: multipart/form-data with 'image' file
 */
const predictPrice = async (req, res) => {
  try {
    // Check if image file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image file is required for price prediction'
      });
    }

    const imagePath = req.file.path;
    console.log(`[Price Prediction] Processing image: ${imagePath}`);

    // Use PyTorch image-based prediction
    try {
      const prediction = await callPythonPredictorImage(imagePath);
      
      if (!prediction.success) {
        // Clean up temp file
        fs.unlink(imagePath, (err) => {
          if (err) console.warn('Failed to delete temp image:', err);
        });
        
        return res.status(400).json({
          success: false,
          error: prediction.error || 'Image-based prediction failed'
        });
      }

      // Clean up temp file after successful prediction
      fs.unlink(imagePath, (err) => {
        if (err) console.warn('Failed to delete temp image:', err);
      });

      return res.json({
        success: true,
        prediction: {
          predicted_price_pkr: prediction.predicted_price_pkr,
          price_range: prediction.price_range,
          confidence: prediction.confidence,
          currency: prediction.currency,
          model_type: 'image_based_pytorch',
          model_location: 'C:\\Users\\11 TRDs\\Desktop\\Abdullah\\Scrapping\\models\\image_price_regressor_feedback_v2'
        }
      });
    } catch (error) {
      // Clean up temp file on error
      fs.unlink(imagePath, (err) => {
        if (err) console.warn('Failed to delete temp image:', err);
      });
      
      console.error('Image-based prediction error:', error);
      return res.status(500).json({
        success: false,
        error: 'Image-based prediction failed: ' + error.message,
        details: error.toString()
      });
    }
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
 * Call Python prediction script with image path (NEW - PyTorch model)
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
