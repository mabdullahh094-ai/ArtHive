const db = require('../config/db');

async function createCategories() {
  try {
    const categories = [
      // Main Categories
      { name: 'Abstract Paintings', slug: 'abstract-paintings', description: 'Non-representational art focusing on forms, colors, and lines', icon: '🎨' },
      { name: 'Compositions', slug: 'compositions', description: 'Structured arrangements of visual elements', icon: '🎨' },
      { name: 'Improvisations', slug: 'improvisations', description: 'Spontaneous and expressive works', icon: '🎨' },
      { name: 'Lyrical Abstractions', slug: 'lyrical-abstractions', description: 'Emotional and expressive abstract art', icon: '🎨' },
      { name: 'Color Fields', slug: 'color-fields', description: 'Large areas of flat, solid color', icon: '🎨' },
      { name: 'Geometric Abstractions', slug: 'geometric-abstractions', description: 'Precise geometric forms and shapes', icon: '📐' },
      { name: 'Black Paintings', slug: 'black-paintings', description: 'Monochromatic works in black tones', icon: '⬛' },
      { name: 'White Paintings', slug: 'white-paintings', description: 'Monochromatic works in white tones', icon: '⬜' },
      { name: 'Zips', slug: 'zips', description: 'Vertical divisions in color field paintings', icon: '🎨' },
      { name: 'Vibrations', slug: 'vibrations', description: 'Op art creating visual movement', icon: '〰️' },
      { name: 'Elegies', slug: 'elegies', description: 'Mournful or contemplative works', icon: '🎨' },
      { name: 'Murals', slug: 'murals', description: 'Large-scale wall paintings', icon: '🖼️' },
      { name: 'Tondos', slug: 'tondos', description: 'Circular or round paintings', icon: '⭕' },
      { name: 'Diptychs', slug: 'diptychs', description: 'Two-panel artworks', icon: '🖼️' },
      { name: 'Triptychs', slug: 'triptychs', description: 'Three-panel artworks', icon: '🖼️' },
      { name: 'Polyptychs', slug: 'polyptychs', description: 'Multi-panel artworks', icon: '🖼️' },
      
      // Abstract Sculptures
      { name: 'Abstract Sculptures', slug: 'abstract-sculptures', description: 'Three-dimensional non-representational art', icon: '🗿' },
      { name: 'Stabiles', slug: 'stabiles', description: 'Stationary abstract sculptures', icon: '🗿' },
      { name: 'Mobiles', slug: 'mobiles', description: 'Moving suspended sculptures', icon: '🎐' },
      { name: 'Spatial Constructions', slug: 'spatial-constructions', description: 'Sculptures exploring space and form', icon: '🗿' },
      { name: 'Cubi', slug: 'cubi', description: 'Geometric cubic sculptures', icon: '🔲' },
      { name: 'Upright Motives', slug: 'upright-motives', description: 'Vertical standing sculptures', icon: '🗿' },
      { name: 'Shears', slug: 'shears', description: 'Angular cut sculptures', icon: '🗿' },
      { name: 'Accumulations', slug: 'accumulations', description: 'Assembled repetitive elements', icon: '🗿' },
      { name: 'Expansion', slug: 'expansion', description: 'Sculptures exploring growth and space', icon: '🗿' },
      
      // Calligraphy
      { name: 'Calligraphy', slug: 'calligraphy', description: 'Decorative handwriting or lettering', icon: '✍️' },
      { name: 'Hanging Scrolls', slug: 'hanging-scrolls', description: 'Vertical scroll paintings', icon: '📜' },
      { name: 'Handscrolls', slug: 'handscrolls', description: 'Horizontal scroll paintings', icon: '📜' },
      { name: 'Album Leaves', slug: 'album-leaves', description: 'Small paintings for albums', icon: '📖' },
      { name: 'Fan Paintings', slug: 'fan-paintings', description: 'Artworks on fan surfaces', icon: '🪭' },
      { name: 'Single-Character Works', slug: 'single-character-works', description: 'Calligraphy of single characters', icon: '✍️' },
      { name: 'Couplets', slug: 'couplets', description: 'Paired poetic phrases', icon: '✍️' },
      { name: 'Inscriptions', slug: 'inscriptions', description: 'Written texts on artworks', icon: '✍️' },
      { name: 'Monograms', slug: 'monograms', description: 'Stylized initials or signatures', icon: '✍️' },
      { name: 'Sigils', slug: 'sigils', description: 'Symbolic signatures or marks', icon: '✍️' },
      
      // Modern/Contemporary
      { name: 'Modern/Contemporary', slug: 'modern-contemporary', description: 'Contemporary art movements', icon: '🎨' },
      { name: 'Readymades', slug: 'readymades', description: 'Found objects presented as art', icon: '🏺' },
      { name: 'Combines', slug: 'combines', description: 'Mixed media assemblages', icon: '🎨' },
      { name: 'Assemblages', slug: 'assemblages', description: 'Three-dimensional collages', icon: '🎨' },
      { name: 'Box Constructions', slug: 'box-constructions', description: 'Enclosed three-dimensional works', icon: '📦' },
      { name: 'Light Installations', slug: 'light-installations', description: 'Art using light as medium', icon: '💡' },
      { name: 'Sound Art', slug: 'sound-art', description: 'Art incorporating sound elements', icon: '🔊' },
      { name: 'Kinetic Art', slug: 'kinetic-art', description: 'Art with moving parts', icon: '⚙️' },
      { name: 'Neon Works', slug: 'neon-works', description: 'Art using neon lights', icon: '💡' },
      { name: 'Text-Based Art', slug: 'text-based-art', description: 'Art using words and language', icon: '📝' },
      { name: 'Word Paintings', slug: 'word-paintings', description: 'Paintings incorporating text', icon: '📝' },
      { name: 'Mirror Pieces', slug: 'mirror-pieces', description: 'Art using mirrors', icon: '🪞' },
      { name: 'Infinity Rooms', slug: 'infinity-rooms', description: 'Immersive mirrored installations', icon: '🪞' },
      { name: 'Soft Sculptures', slug: 'soft-sculptures', description: 'Sculptures made from fabric or soft materials', icon: '🧸' },
      { name: 'Site-Specific Works', slug: 'site-specific-works', description: 'Art created for specific locations', icon: '🏛️' },
      { name: 'Ephemeral Art', slug: 'ephemeral-art', description: 'Temporary or transient artworks', icon: '🎨' },
      
      // Traditional categories
      { name: 'Painting', slug: 'painting', description: 'Traditional and digital paintings', icon: '🎨' },
      { name: 'Photography', slug: 'photography', description: 'Photographic artworks', icon: '📸' },
      { name: 'Sculpture', slug: 'sculpture', description: '3D art forms', icon: '🗿' },
      { name: 'Digital Art', slug: 'digital-art', description: 'Digital creations', icon: '💻' },
      { name: 'Mixed Media', slug: 'mixed-media', description: 'Combination of different mediums', icon: '🖼️' },
      { name: 'Drawing', slug: 'drawing', description: 'Pencil, ink, and charcoal works', icon: '✏️' },
      { name: 'Printmaking', slug: 'printmaking', description: 'Etching, lithography, and screen printing', icon: '🖨️' },
      { name: 'Textile Art', slug: 'textile-art', description: 'Fabric and fiber artworks', icon: '🧵' }
    ];

    console.log(`📦 Starting to create ${categories.length} categories...`);
    
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const cat of categories) {
      const check = await db.query('SELECT id FROM categories WHERE name = $1', [cat.name]);
      if (check.rows.length === 0) {
        await db.query(
          `INSERT INTO categories (name, description) 
           VALUES ($1, $2)`,
          [cat.name, cat.description]
        );
        console.log(`✅ Created category: ${cat.name}`);
        created++;
      } else {
        // Update existing category
        await db.query(
          `UPDATE categories 
           SET description = $1
           WHERE name = $2`,
          [cat.description, cat.name]
        );
        console.log(`🔄 Updated category: ${cat.name}`);
        updated++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Created: ${created}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`\n✨ All categories processed successfully!`);
    
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

createCategories();
