import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { fetchMenu, resolveImage } from '../api/menu';

const CATEGORIES = ['Drinks', 'Main Dishes', 'Salads', 'Soups', 'Desserts'];
const ALL_TABS = ['All', ...CATEGORIES];

// ─── Single menu item with alternating slide animation ───────────────────────
function MenuItemCard({ item, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.25 });
  const isEven = index % 2 === 0;

  const imgVariant = {
    hidden: { x: isEven ? -80 : 80, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  const textVariant = {
    hidden: { x: isEven ? 80 : -80, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center py-16 border-b border-dark-border last:border-0"
    >
      {/* Image */}
      <motion.div
        variants={imgVariant}
        className={`relative overflow-hidden rounded-2xl aspect-[4/3] ${
          isEven ? 'md:order-1' : 'md:order-2'
        }`}
      >
        <img
          src={resolveImage(item.image)}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
          onError={(e) => {
            e.target.src = 'https://placehold.co/600x400/141414/c9a84c?text=No+Image';
          }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark/50 via-transparent to-transparent pointer-events-none" />
        {/* Gold corner accent */}
        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-gold/60 rounded-tr-sm" />
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-gold/60 rounded-bl-sm" />
      </motion.div>

      {/* Text */}
      <motion.div
        variants={textVariant}
        className={`flex flex-col justify-center ${
          isEven ? 'md:order-2' : 'md:order-1'
        }`}
      >
        <span className="text-gold text-xs font-bold uppercase tracking-[0.3em] mb-3">
          {item.category}
        </span>
        <h3 className="font-serif text-4xl md:text-5xl text-cream leading-tight mb-4">
          {item.title}
        </h3>
        <p className="text-gold text-3xl font-light mb-6">
          ${item.price.toFixed(2)}
        </p>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-px bg-gold" />
          <div className="w-2 h-2 rounded-full bg-gold/60" />
          <div className="w-6 h-px bg-gold/40" />
        </div>
        <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
          {item.ingredients}
        </p>
      </motion.div>
    </motion.div>
  );
}

// ─── Category section heading ────────────────────────────────────────────────
function CategoryHeading({ name }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6 }}
      className="flex items-center gap-6 mb-4 pt-4"
    >
      <div className="w-8 h-px bg-gold/40" />
      <span className="text-gold text-xs uppercase tracking-[0.35em] font-semibold">
        {name}
      </span>
      <div className="flex-1 h-px bg-gold/10" />
    </motion.div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function CustomerMenu() {
  const [menuItems, setMenuItems] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMenu()
      .then((res) => {
        setMenuItems(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load menu. Is the backend running?');
        setLoading(false);
      });
  }, []);

  // Group items by category, respecting active tab filter
  const visibleCategories =
    activeTab === 'All' ? CATEGORIES : [activeTab];

  const grouped = visibleCategories.reduce((acc, cat) => {
    const items = menuItems.filter((i) => i.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-dark">
      {/* ── Hero ── */}
      <section className="relative h-screen flex items-center justify-center text-center overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark/60 via-dark/50 to-dark" />

        <motion.div
          className="relative z-10 px-4"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          {/* Decorative top */}
          <motion.div
            className="flex items-center justify-center gap-4 mb-8"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div className="w-16 h-px bg-gold/60" />
            <span className="text-gold text-lg">✦</span>
            <div className="w-16 h-px bg-gold/60" />
          </motion.div>

          <p className="text-gold uppercase tracking-[0.5em] text-xs font-semibold mb-4">
            Fine Dining Experience
          </p>
          <h1 className="font-serif text-7xl md:text-9xl text-cream leading-none mb-6">
            Our{' '}
            <em className="text-gold not-italic">Menu</em>
          </h1>
          <p className="text-gray-400 max-w-sm mx-auto text-base leading-relaxed">
            Authentic flavors from Central Asia, crafted with the finest ingredients
          </p>

          {/* Animated arrow */}
          <motion.div
            className="mt-16 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <span className="text-gray-500 text-xs uppercase tracking-widest">Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
              className="w-px h-10 bg-gradient-to-b from-gold/60 to-transparent"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Sticky Category Nav ── */}
      <nav className="sticky top-16 z-40 bg-dark/95 backdrop-blur-md border-b border-dark-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            {ALL_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] whitespace-nowrap transition-colors duration-300 ${
                  activeTab === tab
                    ? 'text-gold'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.span
                    layoutId="categoryUnderline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Menu Content ── */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Loading menu…</p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-64">
            <p className="text-red-400 text-center">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {Object.entries(grouped).map(([cat, items]) => (
                <section key={cat} id={cat.replace(' ', '-')}>
                  <CategoryHeading name={cat} />
                  {items.map((item, idx) => (
                    <MenuItemCard key={item._id} item={item} index={idx} />
                  ))}
                </section>
              ))}

              {Object.keys(grouped).length === 0 && (
                <div className="text-center py-32">
                  <p className="text-gray-600 text-lg font-serif">No items in this category yet.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-dark-card border-t border-dark-border py-16 text-center mt-8">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-12 h-px bg-gold/40" />
          <span className="text-gold">✦</span>
          <div className="w-12 h-px bg-gold/40" />
        </div>
        <p className="font-serif text-3xl text-gold mb-2">Luxe Kitchen</p>
        <p className="text-gray-500 text-sm tracking-widest uppercase">
          Authentic Flavors · Crafted With Love
        </p>
        <p className="text-gray-700 text-xs mt-8">© 2024 Luxe Kitchen. All rights reserved.</p>
      </footer>
    </div>
  );
}
