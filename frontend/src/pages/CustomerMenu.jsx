import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { fetchMenu, resolveImage } from '../api/menu';
import { fetchDiscounts } from '../api/discounts';
import { fetchSettings } from '../api/settings';
import { useLanguage } from '../context/LanguageContext';
import { getEffectiveDiscount } from '../utils/discountUtils';

/** Resolves a multilingual field to a string for the given language code. */
function itemText(field, lang) {
  if (!field) return '';
  if (typeof field === 'string') return field; // legacy plain-string fallback
  return field[lang] || field.en || Object.values(field)[0] || '';
}

const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', RUB: '₽', UZS: "so'm", PLN: 'zł' };
const fmtPrice = (price, currency) =>
  `${CURRENCY_SYMBOLS[currency] || '$'}${Number(price).toFixed(2)}`;

// ─── Discount helpers ────────────────────────────────────────────────────────

/** Returns the single active global discount, or undefined. */
function getActiveGlobalDiscount(discounts) {
  const now = new Date();
  return discounts.find(
    (d) =>
      d.isActive &&
      new Date(d.startTime) <= now &&
      new Date(d.endTime) >= now
  );
}


function discountedPrice(price, pct) {
  return price * (1 - pct / 100);
}

function isGlobalDiscountActive(d) {
  if (!d.isActive) return false;
  const now = new Date();
  return now >= new Date(d.startTime) && now <= new Date(d.endTime);
}

function fmtTime(dt) {
  return new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Countdown hook ──────────────────────────────────────────────────────────
function useCountdown(endTime, expiredLabel = 'Expired') {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(endTime) - new Date();
      if (diff <= 0) { setRemaining(expiredLabel); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(
        h > 0 ? `${h}h ${m}m ${s}s` :
        m > 0 ? `${m}m ${s}s` :
                `${s}s`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);
  return remaining;
}

// ─── Global Discount Banner ──────────────────────────────────────────────────
function DiscountBanner({ discount, index }) {
  const { t, lang } = useLanguage();
  const countdown = useCountdown(discount.endTime, t.expired);
  const displayTitle = discount.translations?.[lang] || discount.translations?.en || discount.title;
  const forLabel =
    discount.appliesTo === 'Everyone' || !discount.appliesTo
      ? t.forEveryone
      : `${t.for} ${discount.appliesTo}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26, delay: index * 0.08 }}
      className="relative overflow-hidden rounded-2xl border border-gold/50 shadow-[0_0_30px_rgba(201,168,76,0.12)]"
      style={{
        background:
          'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(10,10,10,0.95) 40%, rgba(10,10,10,0.95) 60%, rgba(201,168,76,0.10) 100%)',
      }}
    >
      {/* Moving shimmer */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(105deg, transparent 40%, rgba(201,168,76,0.08) 50%, transparent 60%)',
        }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ repeat: Infinity, duration: 3.2, ease: 'linear' }}
      />
      {/* Top gold line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/80 to-transparent" />
      {/* Bottom gold line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

      <div className="relative z-10 px-6 py-5 flex flex-col sm:flex-row items-center gap-5 sm:gap-0 sm:justify-between">
        {/* Left — emoji + title + "for" label */}
        <div className="flex items-center gap-4">
          <motion.span
            className="text-3xl select-none"
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            🎉
          </motion.span>
          <div>
            <p className="font-serif text-xl text-cream leading-snug">{displayTitle}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold/70 bg-gold/10 border border-gold/20 px-2.5 py-0.5 rounded-full">
                👥 {forLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Center — percentage */}
        <div className="flex flex-col items-center px-6 sm:border-l sm:border-r sm:border-gold/15">
          <motion.p
            className="font-serif text-5xl font-bold leading-none"
            style={{ color: '#c9a84c' }}
            animate={{ textShadow: ['0 0 0px #c9a84c40', '0 0 20px #c9a84c80', '0 0 0px #c9a84c40'] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          >
            -{discount.percentage}%
          </motion.p>
          <p className="text-[10px] uppercase tracking-[0.35em] text-gray-500 mt-1">{t.off}</p>
        </div>

        {/* Right — time range + countdown */}
        <div className="flex flex-col items-center sm:items-end gap-1.5 min-w-[130px]">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <span className="text-gold/60">⏰</span>
            <span>{fmtTime(discount.startTime)}</span>
            <span className="text-gold/40">–</span>
            <span>{fmtTime(discount.endTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-gray-600">{t.until}</span>
            <span className="font-mono text-sm font-bold text-gold bg-gold/10 border border-gold/25 px-2.5 py-0.5 rounded-lg tabular-nums">
              {countdown}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Special Offers Card ─────────────────────────────────────────────────────
function SpecialOfferCard({ item, activeGlobalDiscount }) {
  const { t, lang } = useLanguage();
  const discount = getEffectiveDiscount(item, activeGlobalDiscount);
  const pct = discount?.percentage;
  const newPrice = pct ? discountedPrice(item.price, pct) : item.price;
  const isGlobal = discount?.source === 'global';
  const title = typeof item.title === 'string' ? item.title : item.title?.[lang] || item.title?.en;
  const discountTitle = discount?.translations?.[lang] || discount?.translations?.en || discount?.title;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      className={`flex-shrink-0 w-56 bg-dark-card border rounded-2xl overflow-hidden relative group transition-all duration-300 ${
        isGlobal ? 'border-gold/50 ring-1 ring-gold/30' : 'border-gold/30'
      }`}
    >
      {/* Badge — context-aware */}
      <div className="absolute top-3 left-3 z-10 bg-gold text-dark text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg">
        {isGlobal ? `🎉 ${discountTitle}` : `🔥 ${t.sale}`}
      </div>

      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={resolveImage(item.image)}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://placehold.co/600x400/141414/c9a84c?text=No+Image';
          }}
        />
      </div>

      <div className="p-4">
        <p className="text-cream font-serif text-base leading-tight mb-1 line-clamp-1">
          {title}
        </p>
        {/* "For [group]" label when sourced from a global discount */}
        {isGlobal && (
          <p className="text-gold/60 text-[10px] uppercase tracking-widest mb-2">
            {discount.appliesTo === 'Everyone' || !discount.appliesTo ? t.forEveryone : `${t.for} ${discount.appliesTo}`}
          </p>
        )}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm line-through">{fmtPrice(item.price, item.currency)}</span>
          <span className="text-gold font-bold text-lg">{fmtPrice(newPrice, item.currency)}</span>
          <span className="text-gold/70 text-xs font-semibold">-{pct}%</span>
        </div>
      </div>

      {/* Gold glow border on hover */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-gold/0 group-hover:ring-gold/50 transition-all duration-300 pointer-events-none" />
    </motion.div>
  );
}

// ─── Single menu item with alternating slide animation ───────────────────────
function MenuItemCard({ item, index, activeGlobalDiscount }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.25 });
  const isEven = index % 2 === 0;
  const [preview, setPreview] = useState(null);
  const { t, lang } = useLanguage();
  const title = typeof item.title === 'string' ? item.title : item.title?.[lang] || item.title?.en;
  const ingredients = typeof item.ingredients === 'string' ? item.ingredients : item.ingredients?.[lang] || item.ingredients?.en;

  const discount  = getEffectiveDiscount(item, activeGlobalDiscount);
  const pct       = discount?.percentage ?? null;
  const newPrice  = pct ? discountedPrice(item.price, pct) : null;
  const isGlobal  = discount?.source === 'global';
  const discountTitle = discount?.translations?.[lang] || discount?.translations?.en || discount?.title;

  const imgVariant = {
    hidden: { x: isEven ? -80 : 80, opacity: 0 },
    visible: {
      x: 0, opacity: 1,
      transition: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  const textVariant = {
    hidden: { x: isEven ? 80 : -80, opacity: 0 },
    visible: {
      x: 0, opacity: 1,
      transition: { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={`flex flex-col lg:grid lg:grid-cols-2 gap-5 md:gap-6 lg:gap-16 lg:items-center pt-5 pb-7 md:pt-6 md:pb-9 lg:py-16 border-b border-dark-border last:border-0 ${
        isGlobal ? 'rounded-2xl ring-1 ring-gold/20' : ''
      }`}
    >
      {/* Image */}
      <motion.div
        variants={imgVariant}
        className={`relative overflow-hidden rounded-2xl aspect-video md:aspect-[4/3] w-full cursor-pointer ${
          isEven ? 'lg:order-1' : 'lg:order-2'
        }`}
        onClick={() => setPreview(resolveImage(item.image))}
      >
        <img
          src={resolveImage(item.image)}
          alt={title}
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

        {/* Discount badge on image — context-aware */}
        {pct && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="absolute top-4 left-4 bg-gold text-dark text-[11px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg"
          >
            {isGlobal ? `🎉 ${discountTitle}` : `🔥 -${pct}% ${t.off}`}
          </motion.div>
        )}
      </motion.div>

      {/* Text */}
      <motion.div
        variants={textVariant}
        className={`flex flex-col justify-center w-full lg:flex-1 lg:min-w-0 px-3 sm:px-4 lg:px-0 ${
          isEven ? 'lg:order-2' : 'lg:order-1'
        }`}
      >
        {/* Category label — tablet/desktop only */}
        <span className="hidden lg:block text-gold text-xs font-bold uppercase tracking-[0.3em] mb-3">
          {item._categoryDisplayName || item.category}
        </span>

        {/* ── Mobile: title + price side by side ── */}
        <div className="flex items-start justify-between gap-3 mb-4 lg:hidden">
          <h3 className="font-serif text-base md:text-xl text-cream leading-tight flex-1 min-w-0">
            {title}
          </h3>
          <div className="flex-shrink-0 text-right">
            {pct ? (
              <div>
                <span className="text-gray-400 text-xs line-through block leading-snug">
                  {fmtPrice(item.price, item.currency)}
                </span>
                <span className="text-gold text-sm font-bold">
                  {fmtPrice(newPrice, item.currency)}
                </span>
              </div>
            ) : (
              <span className="text-gold text-sm font-semibold">
                {fmtPrice(item.price, item.currency)}
              </span>
            )}
          </div>
        </div>

        {/* Mobile discount badge */}
        {pct && (
          <div className="flex items-center gap-2 mb-4 lg:hidden">
            <span className="bg-gold/20 border border-gold/40 text-gold text-[10px] font-bold px-2 py-0.5 rounded-full">
              -{pct}%{isGlobal ? ` · ${discountTitle}` : ` ${t.off}`}
            </span>
          </div>
        )}

        {/* ── Tablet/desktop: large title ── */}
        <h3 className="hidden lg:block font-serif text-5xl text-cream leading-tight mb-3">
          {title}
        </h3>

        {/* Tablet/desktop: full price section */}
        {pct ? (
          <div className="hidden lg:block">
            <div className="flex items-center gap-4 mb-3">
              <span className="text-gray-500 text-base md:text-xl lg:text-2xl line-through font-light">
                {fmtPrice(item.price, item.currency)}
              </span>
              <motion.span
                className="text-gold text-lg md:text-2xl lg:text-3xl font-bold"
                animate={{ textShadow: ['0 0 0px #c9a84c', '0 0 12px #c9a84c', '0 0 0px #c9a84c'] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
              >
                {fmtPrice(newPrice, item.currency)}
              </motion.span>
              <span className="bg-gold/20 border border-gold/40 text-gold text-xs font-bold px-2.5 py-1 rounded-full">
                -{pct}%
              </span>
            </div>
            {isGlobal && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold/70 bg-gold/10 border border-gold/20 px-2.5 py-1 rounded-full">
                  🎉 {discountTitle} · {discount.appliesTo === 'Everyone' || !discount.appliesTo ? t.forEveryone : `${t.for} ${discount.appliesTo}`}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="hidden lg:block text-gold text-3xl font-light mb-6">
            {fmtPrice(item.price, item.currency)}
          </p>
        )}

        <div className="hidden lg:flex items-center gap-4 mb-6">
          <div className="w-12 h-px bg-gold" />
          <div className="w-2 h-2 rounded-full bg-gold/60" />
          <div className="w-6 h-px bg-gold/40" />
        </div>
        <p className="hidden lg:block text-gray-400 text-sm leading-relaxed max-w-sm">
          {ingredients}
        </p>
      </motion.div>

      {/* Ingredients — full-width row on mobile & tablet; hidden at desktop where it lives inside text column */}
      <div className="w-full order-3 lg:hidden px-3 sm:px-4">
        <div className="flex items-center gap-4 mb-3 mt-3">
          <div className="w-12 h-px bg-gold" />
          <div className="w-2 h-2 rounded-full bg-gold/60" />
          <div className="w-6 h-px bg-gold/40" />
        </div>
        <p className="text-gray-400 text-xs leading-relaxed pb-2">{ingredients}</p>
      </div>

      {/* Image preview modal */}
      <AnimatePresence>
        {preview && (
          <motion.div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreview(null)}
          >
            <motion.img
              src={preview}
              alt={title}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setPreview(null)}
              className="absolute top-4 right-4 text-white text-2xl leading-none hover:text-gold transition-colors w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Category section heading ────────────────────────────────────────────────
function CategoryHeading({ displayName }) {
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
        {displayName}
      </span>
      <div className="flex-1 h-px bg-gold/10" />
    </motion.div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
const POLL_INTERVAL = 15000; // 15 s — balance between freshness and requests

export default function CustomerMenu() {
  const [menuItems, setMenuItems] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Increments every 10 s to force re-evaluation of time-based discount logic
  // even when the fetched data hasn't changed (discount becomes active/expired).
  const [tick, setTick] = useState(0);
  const [menuLayout, setMenuLayout] = useState('top');
  const [activeSidebarCat, setActiveSidebarCat] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { t, lang, refreshSettings } = useLanguage();

  // Prevent body scroll while mobile drawer is open
  useEffect(() => {
    if (mobileDrawerOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileDrawerOpen]);


  useEffect(() => {
    // ── Fetch helpers ──────────────────────────────────────────────────────
    const loadMenu = () =>
      fetchMenu()
        .then((res) => { setMenuItems(res.data); setLoading(false); })
        .catch(() => { setError('Failed to load menu. Is the backend running?'); setLoading(false); });

    const loadDiscounts = () =>
      fetchDiscounts()
        .then((res) => setDiscounts(res.data))
        .catch(() => {}); // silent — discount failure must not break the menu

    const loadSettings = () =>
      fetchSettings()
        .then((res) => {
          const cats = res.data.categories;
          setSelectedCategories(Array.isArray(cats) && cats.length ? cats : ['main']);
          if (res.data.layout) setMenuLayout(res.data.layout);
        })
        .catch(() => {});

    // ── Initial load ───────────────────────────────────────────────────────
    loadMenu();
    loadDiscounts();
    loadSettings();

    // ── Poll every 15 s (picks up newly created / updated discounts) ───────
    const pollId = setInterval(() => {
      loadMenu();
      loadDiscounts();
    }, POLL_INTERVAL);

    // ── Refetch when the user returns to this tab ──────────────────────────
    // refreshSettings updates allowedLanguages in context (Navbar picks it up)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadMenu();
        loadDiscounts();
        loadSettings();
        refreshSettings();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // ── Tick every 10 s to re-evaluate time conditions without a full fetch ─
    const tickId = setInterval(() => setTick((n) => n + 1), 10000);

    return () => {
      clearInterval(pollId);
      clearInterval(tickId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // 'all' is always first and never stored in DB
  const ALL_TABS = ['all', ...selectedCategories];

  // Single active global discount — recomputed on every tick so time-window
  // transitions (active → expired, upcoming → active) are caught without a fetch.
  const activeGlobalDiscount = useMemo(
    () => getActiveGlobalDiscount(discounts),
    [discounts, tick] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Banners: all currently-active global discounts
  const activeGlobalDiscounts = discounts.filter(isGlobalDiscountActive);

  // All categories grouped — used by sidebar layout (always shows all)
  const sidebarGrouped = useMemo(
    () =>
      selectedCategories.reduce((acc, cat) => {
        const items = menuItems
          .filter((i) => i.category === cat)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        if (items.length) acc[cat] = items;
        return acc;
      }, {}),
    [selectedCategories, menuItems] // eslint-disable-line
  );

  // Initialise sidebar active category when layout or categories change
  useEffect(() => {
    if (menuLayout === 'sidebar' && selectedCategories.length > 0) {
      setActiveSidebarCat((prev) => prev || selectedCategories[0]);
    }
  }, [menuLayout, selectedCategories]);

  // Scroll-spy for sidebar: highlight the category whose section is in view
  useEffect(() => {
    if (menuLayout !== 'sidebar') return;
    const handleScroll = () => {
      for (let i = selectedCategories.length - 1; i >= 0; i--) {
        const el = document.getElementById(`category-${selectedCategories[i]}`);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSidebarCat(selectedCategories[i]);
          return;
        }
      }
      if (selectedCategories.length) setActiveSidebarCat(selectedCategories[0]);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menuLayout, selectedCategories]);

  // Items that have any discount (item-level OR global)
  const saleItems = menuItems.filter(
    (i) => getEffectiveDiscount(i, activeGlobalDiscount) !== null
  );

  // Group items by category — ordered by owner-saved sortOrder
  const visibleCategories = activeTab === 'all' ? selectedCategories : [activeTab];

  const grouped = visibleCategories.reduce((acc, cat) => {
    const items = menuItems
      .filter((i) => i.category === cat)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-dark">
      {/* ── Hero ── */}
      <section className="relative h-screen flex items-center justify-center text-center overflow-hidden">
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
            {t.hero.tagline}
          </p>
          <h1 className="font-serif text-7xl md:text-9xl text-cream leading-none mb-6">
            {t.heroTitle}
          </h1>
          <p className="text-gray-400 max-w-sm mx-auto text-base leading-relaxed">
            {t.hero.subtitle}
          </p>

          <motion.div
            className="mt-16 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <span className="text-gray-500 text-xs uppercase tracking-widest">{t.hero.scroll}</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
              className="w-px h-10 bg-gradient-to-b from-gold/60 to-transparent"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Global Discount Banners ── */}
      <AnimatePresence>
        {activeGlobalDiscounts.length > 0 && (
          <motion.section
            key="global-discounts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto px-4 pt-10 pb-4"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center gap-5 mb-5"
            >
              <div className="w-8 h-px bg-gold/40" />
              <span className="text-gold text-xs uppercase tracking-[0.35em] font-semibold">
                {t.currentPromotions}
              </span>
              <div className="flex-1 h-px bg-gold/10" />
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="text-gold text-base"
              >
                ✦
              </motion.span>
            </motion.div>

            <div className="space-y-3">
              {activeGlobalDiscounts.map((d, i) => (
                <DiscountBanner key={d._id} discount={d} index={i} />
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Special Offers Section ── */}
      <AnimatePresence>
        {saleItems.length > 0 && (
          <motion.section
            key="special-offers"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto px-4 pt-10 pb-4"
          >
            <div className="flex items-center gap-6 mb-6">
              <div className="w-8 h-px bg-gold/40" />
              <span className="text-gold font-serif text-2xl">{t.specialOffers}</span>
              <div className="flex-1 h-px bg-gold/10" />
              <span className="text-gold text-lg">✦</span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {saleItems.map((item) => (
                <SpecialOfferCard
                  key={item._id}
                  item={item}
                  activeGlobalDiscount={activeGlobalDiscount}
                />
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {menuLayout === 'sidebar' ? (
        /* ── Sidebar Layout ── */
        <div className="flex max-w-7xl mx-auto">

          {/* ── Mobile drawer overlay ── */}
          {mobileDrawerOpen && (
            <div
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMobileDrawerOpen(false)}
            />
          )}

          {/* ── Mobile drawer panel ── */}
          <div
            className={`fixed top-0 left-0 h-full w-64 bg-dark-card border-r border-dark-border z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
              mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between px-4 py-5 border-b border-dark-border">
              <span className="text-cream text-xs font-semibold uppercase tracking-widest">{t.menuCategories}</span>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="text-gray-400 hover:text-cream text-lg leading-none transition-colors duration-200"
              >
                ✕
              </button>
            </div>
            <nav className="py-4 px-3 overflow-y-auto h-[calc(100%-64px)] scrollbar-hide">
              {selectedCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    document.getElementById(`category-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setActiveSidebarCat(cat);
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-r-lg text-xs font-semibold uppercase tracking-widest transition-all duration-200 mb-1 border-l-2 ${
                    activeSidebarCat === cat
                      ? 'bg-gold/20 text-gold border-gold'
                      : 'text-gray-400 hover:text-cream hover:bg-dark/60 border-transparent'
                  }`}
                >
                  {t[cat] || cat}
                </button>
              ))}
            </nav>
          </div>

          {/* ── Desktop / tablet aside (unchanged) ── */}
          <aside className="sticky top-20 self-start max-h-[calc(100vh-100px)] w-52 flex-shrink-0 overflow-y-auto border-r border-dark-border bg-dark/95 backdrop-blur-md hidden md:block scrollbar-hide">
            <nav className="py-6 px-2">
              {selectedCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    document.getElementById(`category-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setActiveSidebarCat(cat);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-r-lg text-xs font-semibold uppercase tracking-widest transition-all duration-200 mb-1 border-l-2 ${
                    activeSidebarCat === cat
                      ? 'bg-gold/20 text-gold border-gold'
                      : 'text-gray-400 hover:text-cream hover:bg-dark-card/60 border-transparent'
                  }`}
                >
                  {t[cat] || cat}
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 min-w-0 px-6 md:px-8 py-12">
            {/* ── Mobile categories toggle button ── */}
            <div className="md:hidden mb-6">
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-dark-card border border-dark-border rounded-xl text-gray-300 text-sm font-semibold hover:border-gold/40 hover:text-cream transition-all duration-200"
              >
                <span className="text-base leading-none">☰</span>
                <span>{t.menuCategories}</span>
              </button>
            </div>
            {loading && (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 text-sm">{t.loading}</p>
              </div>
            )}
            {error && (
              <div className="flex items-center justify-center h-64">
                <p className="text-red-400 text-center">{error}</p>
              </div>
            )}
            {!loading && !error && (
              <div>
                {Object.entries(sidebarGrouped).map(([cat, items]) => (
                  <section key={cat} id={`category-${cat}`}>
                    <CategoryHeading displayName={t[cat] || cat} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
                      {items.map((item, idx) => (
                        <MenuItemCard
                          key={item._id}
                          item={{ ...item, _categoryDisplayName: t[item.category] || item.category }}
                          index={idx}
                          activeGlobalDiscount={activeGlobalDiscount}
                        />
                      ))}
                    </div>
                  </section>
                ))}
                {Object.keys(sidebarGrouped).length === 0 && (
                  <div className="text-center py-32">
                    <p className="text-gray-600 text-lg font-serif">{t.noItems}</p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      ) : (
        /* ── Top Layout ── */
        <>
          {/* ── Category Nav ── */}
          <nav className="sticky top-[60px] md:top-16 z-40 bg-dark md:bg-dark/95 md:backdrop-blur-md border-b border-dark-border">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex gap-0 overflow-x-auto scrollbar-hide">
                {ALL_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] whitespace-nowrap transition-colors duration-300 ${
                      activeTab === tab ? 'text-gold' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {t[tab] || tab}
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
          <main className="max-w-7xl mx-auto px-6 py-12">
            {loading && (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 text-sm">{t.loading}</p>
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
                    <section key={cat} id={`category-${cat}`}>
                      <CategoryHeading displayName={t[cat] || cat} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
                        {items.map((item, idx) => (
                          <MenuItemCard
                            key={item._id}
                            item={{ ...item, _categoryDisplayName: t[item.category] || item.category }}
                            index={idx}
                            activeGlobalDiscount={activeGlobalDiscount}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                  {Object.keys(grouped).length === 0 && (
                    <div className="text-center py-32">
                      <p className="text-gray-600 text-lg font-serif">{t.noItems}</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </main>
        </>
      )}

      {/* ── Footer ── */}
      <footer className="bg-dark-card border-t border-dark-border py-16 text-center mt-8">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="w-12 h-px bg-gold/40" />
          <span className="text-gold">✦</span>
          <div className="w-12 h-px bg-gold/40" />
        </div>
        <p className="font-serif text-3xl text-gold mb-2">Luxe Kitchen</p>
        <p className="text-gray-500 text-sm tracking-widest uppercase">
          {t.footerTagline}
        </p>
        <p className="text-gray-700 text-xs mt-8">{t.footerRights}</p>
      </footer>
    </div>
  );
}
