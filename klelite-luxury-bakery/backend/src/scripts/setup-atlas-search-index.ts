/**
 * MongoDB Atlas Search Index Setup Instructions
 *
 * This script provides instructions for setting up Atlas Search index via MongoDB Atlas UI.
 * Atlas Search indexes are managed through the Atlas UI, not through MongoDB drivers.
 *
 * PREREQUISITES:
 * - MongoDB Atlas cluster (M0 free tier or higher)
 * - Database: klelite_bakery
 * - Collection: products
 *
 * SETUP STEPS:
 *
 * 1. Navigate to MongoDB Atlas Dashboard (https://cloud.mongodb.com)
 * 2. Select your cluster
 * 3. Click "Search" tab
 * 4. Click "Create Search Index"
 * 5. Choose "JSON Editor"
 * 6. Select database: klelite_bakery, collection: products
 * 7. Paste the following index definition:
 */

export const atlasSearchIndexDefinition = {
  name: 'products_search',
  mappings: {
    dynamic: false,
    fields: {
      name: [
        {
          // Full-text search on name
          type: 'string',
          analyzer: 'lucene.standard',
        },
        {
          // Autocomplete on name
          type: 'autocomplete',
          analyzer: 'lucene.standard',
          tokenization: 'edgeGram',
          minGrams: 2,
          maxGrams: 15,
          foldDiacritics: true,
        },
      ],
      description: {
        type: 'string',
        analyzer: 'lucene.standard',
      },
      tags: {
        type: 'string',
        analyzer: 'lucene.standard',
      },
      category: {
        type: 'objectId',
      },
      price: {
        type: 'number',
      },
      rating: {
        type: 'number',
      },
      isAvailable: {
        type: 'boolean',
      },
      isFeatured: {
        type: 'boolean',
      },
    },
  },
};

/**
 * VERIFICATION STEPS:
 *
 * 1. After creating the index, wait for status to be "Active" (may take 1-2 minutes)
 * 2. Update your .env file:
 *    USE_ATLAS_SEARCH=true
 *    ATLAS_SEARCH_INDEX_NAME=products_search
 * 3. Restart backend server
 * 4. Test search: GET /api/search?q=chocolate
 * 5. Test autocomplete: GET /api/search/suggest?q=choc
 *
 * FALLBACK BEHAVIOR:
 * - If USE_ATLAS_SEARCH=false or index not found, system falls back to MongoDB text search
 * - Text search uses existing text index on name, description, tags fields
 *
 * MULTILINGUAL SUPPORT (Vietnamese + English):
 * - Uses lucene.standard analyzer which supports multilingual text
 * - Diacritic folding enabled for Vietnamese characters (à, ă, â, etc.)
 * - Both languages searchable without additional configuration
 *
 * TROUBLESHOOTING:
 * - Index not working? Check index status is "Active" in Atlas UI
 * - No results? Verify collection has data: db.products.countDocuments()
 * - Errors? Check backend logs for connection issues
 * - Performance issues? Index may need time to build initially
 */

console.log('Atlas Search Index Definition:');
console.log(JSON.stringify(atlasSearchIndexDefinition, null, 2));
console.log('\n📖 See comments above for setup instructions');
console.log('🌐 Atlas Dashboard: https://cloud.mongodb.com');
