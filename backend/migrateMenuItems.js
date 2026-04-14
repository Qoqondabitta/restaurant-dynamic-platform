/**
 * One-time migration: convert menu items that still have string title/ingredients
 * to the multilingual object format { en, ru, uz }.
 *
 * Run once from the backend directory:
 *   node migrateMenuItems.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant';

// Use the raw schema here so we can read the old string value before Mongoose
// coerces it — the updated model would silently drop a plain string.
const rawSchema = new mongoose.Schema({}, { strict: false });
const RawItem = mongoose.model('RawItem', rawSchema, 'menuitems');

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const items = await RawItem.find({});
  let migrated = 0;

  for (const item of items) {
    const raw = item.toObject();
    let changed = false;

    // title is still a plain string
    if (typeof raw.title === 'string') {
      item.title = { en: raw.title, ru: '', uz: '' };
      changed = true;
    }

    // ingredients is still a plain string (or missing)
    if (typeof raw.ingredients === 'string' || !raw.ingredients) {
      item.ingredients = { en: raw.ingredients || '', ru: '', uz: '' };
      changed = true;
    }

    if (changed) {
      await item.save();
      migrated++;
      console.log(`  ✅ Migrated: ${raw.title || raw._id}`);
    }
  }

  console.log(`\nDone — migrated ${migrated} / ${items.length} items.`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
