const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');
require('dotenv').config();

const seedData = [
  // ── Drinks ──────────────────────────────────────────────────────────────
  {
    title: 'Black Tea',
    price: 2.99,
    category: 'Drinks',
    ingredients: 'Premium black tea leaves, hot water, optional honey or lemon',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80',
  },
  {
    title: 'Green Tea',
    price: 2.99,
    category: 'Drinks',
    ingredients: 'Japanese sencha green tea leaves, hot water, optional honey',
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&q=80',
  },

  // ── Main Dishes ──────────────────────────────────────────────────────────
  {
    title: 'Uzbek Plov',
    price: 9.99,
    category: 'Main Dishes',
    ingredients:
      'Basmati rice, tender lamb, golden carrots, onions, cotton-seed oil, cumin, barberries, garlic',
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&q=80',
  },
  {
    title: 'Xonim',
    price: 14.99,
    category: 'Main Dishes',
    ingredients:
      'Hand-rolled thin dough, minced lamb, sweet onions, pumpkin, steamed to tender perfection',
    image: 'https://images.unsplash.com/photo-1563379091339-03246963d96c?w=800&q=80',
  },
  {
    title: 'Manti',
    price: 19.99,
    category: 'Main Dishes',
    ingredients:
      'Hand-crimped dough parcels, seasoned lamb and beef, onions, aromatic spices, served with sour cream',
    image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=800&q=80',
  },

  // ── Salads ───────────────────────────────────────────────────────────────
  {
    title: 'Olivye',
    price: 4.99,
    category: 'Salads',
    ingredients:
      'Boiled potatoes, carrots, eggs, crunchy pickles, green peas, dressed with creamy mayonnaise',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
  },
  {
    title: 'Cezar',
    price: 4.99,
    category: 'Salads',
    ingredients:
      'Crisp romaine lettuce, grilled chicken breast, shaved parmesan, golden croutons, house Caesar dressing',
    image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=800&q=80',
  },
  {
    title: 'Kapriz',
    price: 4.99,
    category: 'Salads',
    ingredients:
      'Vine-ripened tomatoes, buffalo mozzarella, fresh basil, extra-virgin olive oil, aged balsamic glaze',
    image: 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=800&q=80',
  },

  // ── Soups ────────────────────────────────────────────────────────────────
  {
    title: 'Chicken Soup',
    price: 9.99,
    category: 'Soups',
    ingredients:
      'Free-range chicken, egg noodles, carrots, celery, fresh parsley, rich golden broth',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
  },
  {
    title: 'Beef Soup',
    price: 9.99,
    category: 'Soups',
    ingredients:
      'Slow-braised beef, potatoes, carrots, ripe tomatoes, bay leaves, aromatic spices',
    image: 'https://images.unsplash.com/photo-1608835291093-394b0c943a75?w=800&q=80',
  },

  // ── Desserts ─────────────────────────────────────────────────────────────
  {
    title: 'Tiramisu',
    price: 14.99,
    category: 'Desserts',
    ingredients:
      'Savoiardi ladyfingers, mascarpone cream, double espresso, Marsala, egg yolks, dusted cocoa',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80',
  },
  {
    title: 'Napaleon',
    price: 9.99,
    category: 'Desserts',
    ingredients:
      'Hundreds of golden puff-pastry layers, silky vanilla custard cream, powdered sugar',
    image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800&q=80',
  },
];

async function seed() {
  const MONGO_URI =
    process.env.MONGO_URI || 'mongodb://localhost:27017/restaurant';

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await MenuItem.deleteMany({});
    console.log('🗑  Cleared existing menu data');

    await MenuItem.insertMany(seedData);
    console.log(`🌱 Inserted ${seedData.length} menu items`);

    await mongoose.disconnect();
    console.log('✅ Done — database seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
