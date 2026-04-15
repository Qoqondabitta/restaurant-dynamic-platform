import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { fetchMenu, resolveImage } from '../api/menu';
import { fetchDiscounts } from '../api/discounts';
import { fetchSettings } from '../api/settings';
import { useLanguage } from '../context/LanguageContext';

const languageOptions = {
  en: { label: 'ENG', flag: '🇬🇧' },
  ru: { label: 'RUS', flag: '🇷🇺' },
  uz: { label: 'UZB', flag: '🇺🇿' },
  pl: { label: 'PL',  flag: '🇵🇱' },
  es: { label: 'ES',  flag: '🇪🇸' },
  tr: { label: 'TR',  flag: '🇹🇷' },
  ar: { label: 'AR',  flag: '🇸🇦' },
  zh: { label: 'ZH',  flag: '🇨🇳' },
  ja: { label: 'JA',  flag: '🇯🇵' },
  ko: { label: 'KO',  flag: '🇰🇷' },
  pt: { label: 'PT',  flag: '🇵🇹' },
  fr: { label: 'FR',  flag: '🇫🇷' },
  it: { label: 'IT',  flag: '🇮🇹' },
};

const CATEGORIES = ['Drinks', 'Main Dishes', 'Salads', 'Soups', 'Desserts'];

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

/**
 * Returns { percentage, source, title?, appliesTo? } or null.
 * Discounts come exclusively from global promotions.
 * Respects category/item targeting when set; falls back to all items when empty.
 */
function getItemDiscount(item, globalDiscount) {
  if (globalDiscount) {
    const cats    = globalDiscount.categories ?? [];
    const itemIds = globalDiscount.items ?? [];
    const noFilter       = !cats.length && !itemIds.length;
    const matchesCategory = cats.includes(item.category);
    const matchesItem     = itemIds.includes(item._id);
    if (noFilter || matchesCategory || matchesItem) {
      return {
        percentage: globalDiscount.percentage,
        source: 'global',
        title: globalDiscount.title,
        appliesTo: globalDiscount.appliesTo,
      };
    }
  }
  return null;
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
function useCountdown(endTime) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(endTime) - new Date();
      if (diff <= 0) { setRemaining('Expired'); return; }
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
  const { t } = useLanguage();
  const countdown = useCountdown(discount.endTime);
  const forLabel =
    discount.appliesTo === 'Everyone' || !discount.appliesTo
      ? 'For Everyone'
      : `For ${discount.appliesTo}`;

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
            <p className="font-serif text-xl text-cream leading-snug">{discount.title}</p>
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
function SpecialOfferCard({ item, activeGlobalDiscount, menuLang }) {
  const { t } = useLanguage();
  const lang = menuLang || 'en';
  const discount = getItemDiscount(item, activeGlobalDiscount);
  const pct = discount?.percentage;
  const newPrice = pct ? discountedPrice(item.price, pct) : item.price;
  const isGlobal = discount?.source === 'global';
  const title = typeof item.title === 'string' ? item.title : item.title?.[lang] || item.title?.en;

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
        {isGlobal ? `🎉 ${discount.title}` : `🔥 ${t.sale}`}
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
            For {discount.appliesTo === 'Everyone' || !discount.appliesTo ? 'Everyone' : discount.appliesTo}
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
function MenuItemCard({ item, index, activeGlobalDiscount, menuLang }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.25 });
  const isEven = index % 2 === 0;
  const { t } = useLanguage();
  const lang = menuLang || 'en';
  const title = typeof item.title === 'string' ? item.title : item.title?.[lang] || item.title?.en;
  const ingredients = typeof item.ingredients === 'string' ? item.ingredients : item.ingredients?.[lang] || item.ingredients?.en;

  const discount  = getItemDiscount(item, activeGlobalDiscount);
  const pct       = discount?.percentage ?? null;
  const newPrice  = pct ? discountedPrice(item.price, pct) : null;
  const isGlobal  = discount?.source === 'global';

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
      className={`grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center py-16 border-b border-dark-border last:border-0 ${
        isGlobal ? 'rounded-2xl ring-1 ring-gold/20 px-4 -mx-4' : ''
      }`}
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
            {isGlobal ? `🎉 ${discount.title}` : `🔥 -${pct}% ${t.off}`}
          </motion.div>
        )}
      </motion.div>

      {/* Text */}
      <motion.div
        variants={textVariant}
        className={`flex flex-col justify-center ${isEven ? 'md:order-2' : 'md:order-1'}`}
      >
        <span className="text-gold text-xs font-bold uppercase tracking-[0.3em] mb-3">
          {t.categories[item.category] || item.category}
        </span>
        <h3 className="font-serif text-4xl md:text-5xl text-cream leading-tight mb-4">
          {title}
        </h3>

        {/* Price — discounted or normal */}
        {pct ? (
          <>
            <div className="flex items-center gap-4 mb-3">
              <span className="text-gray-500 text-2xl line-through font-light">
                {fmtPrice(item.price, item.currency)}
              </span>
              <motion.span
                className="text-gold text-3xl font-bold"
                animate={{ textShadow: ['0 0 0px #c9a84c', '0 0 12px #c9a84c', '0 0 0px #c9a84c'] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
              >
                {fmtPrice(newPrice, item.currency)}
              </motion.span>
              <span className="bg-gold/20 border border-gold/40 text-gold text-xs font-bold px-2.5 py-1 rounded-full">
                -{pct}%
              </span>
            </div>
            {/* Source label */}
            {isGlobal && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold/70 bg-gold/10 border border-gold/20 px-2.5 py-1 rounded-full">
                  🎉 {discount.title} · For{' '}
                  {discount.appliesTo === 'Everyone' || !discount.appliesTo
                    ? 'Everyone'
                    : discount.appliesTo}
                </span>
              </div>
            )}
          </>
        ) : (
          <p className="text-gold text-3xl font-light mb-6">{fmtPrice(item.price, item.currency)}</p>
        )}

        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-px bg-gold" />
          <div className="w-2 h-2 rounded-full bg-gold/60" />
          <div className="w-6 h-px bg-gold/40" />
        </div>
        <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
          {ingredients}
        </p>
      </motion.div>
    </motion.div>
  );
}

// ─── Category section heading ────────────────────────────────────────────────
function CategoryHeading({ name }) {
  const { t } = useLanguage();
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
        {t.categories[name] || name}
      </span>
      <div className="flex-1 h-px bg-gold/10" />
    </motion.div>
  );
}

// ─── Debug Panel ─────────────────────────────────────────────────────────────
function DebugPanel({ discounts }) {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (dt) => (dt ? new Date(dt).toISOString() : '—');

  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono text-xs">
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-dark-card border border-gold/40 text-gold px-3 py-1.5 rounded-lg shadow-lg hover:bg-gold/10 transition-colors"
      >
        🐛 Debug {open ? '▲' : '▼'}
      </button>

      {open && (
        <div className="mt-2 w-[420px] max-h-[60vh] overflow-y-auto bg-dark-card border border-gold/20 rounded-xl p-4 shadow-2xl space-y-3">
          {/* Current time */}
          <div className="border-b border-dark-border pb-2">
            <p className="text-gold font-bold mb-1">⏰ Current Time</p>
            <p className="text-cream">{now.toISOString()}</p>
            <p className="text-gray-500">Local: {now.toLocaleString()}</p>
          </div>

          {/* Global discounts */}
          <div className="border-b border-dark-border pb-2">
            <p className="text-gold font-bold mb-1">🌐 Global Discounts ({discounts.length})</p>
            {discounts.length === 0 && <p className="text-gray-500">None</p>}
            {discounts.map((d) => {
              const start = new Date(d.startTime);
              const end = new Date(d.endTime);
              const active = d.isActive && now >= start && now <= end;
              console.log('[Discount Debug] Global:', {
                title: d.title,
                now: now.toISOString(),
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                isActive: d.isActive,
                inTimeRange: now >= start && now <= end,
                effectivelyActive: active,
              });
              return (
                <div key={d._id} className="mb-2 pl-2 border-l-2 border-gold/20">
                  <p className="text-cream">{d.title} — -{d.percentage}%</p>
                  <p className="text-gray-500">Start: {fmt(d.startTime)}</p>
                  <p className="text-gray-500">End:   {fmt(d.endTime)}</p>
                  <p className={active ? 'text-emerald-400' : 'text-red-400'}>
                    {active ? '✅ ACTIVE' : '❌ NOT ACTIVE'}{' '}
                    {!d.isActive && '(isActive=false)'}
                    {d.isActive && now < start && '(not started yet)'}
                    {d.isActive && now > end && '(expired)'}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
const POLL_INTERVAL = 15000; // 15 s — balance between freshness and requests

export default function CustomerMenu() {
  const [menuItems, setMenuItems] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Increments every 10 s to force re-evaluation of time-based discount logic
  // even when the fetched data hasn't changed (discount becomes active/expired).
  const [tick, setTick] = useState(0);
  const { t } = useLanguage();

  // ── Menu language state (independent from UI language) ────────────────────
  const [menuLang, setMenuLang] = useState('en');
  const [allowedLanguages, setAllowedLanguages] = useState(['en']);
  const [langSwitcherOpen, setLangSwitcherOpen] = useState(false);

  // Part 6: force default to 'en' on first load, then respect allowedLanguages
  useEffect(() => {
    fetchSettings()
      .then((res) => {
        const langs = res.data.languages || ['en'];
        setAllowedLanguages(langs);
        const defaultLang = langs.includes('en') ? 'en' : langs[0];
        setMenuLang(defaultLang);
      })
      .catch(() => {});
  }, []);

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

    // ── Initial load ───────────────────────────────────────────────────────
    loadMenu();
    loadDiscounts();

    // ── Poll every 15 s (picks up newly created / updated discounts) ───────
    const pollId = setInterval(() => {
      loadMenu();
      loadDiscounts();
    }, POLL_INTERVAL);

    // ── Refetch when the user returns to this tab ──────────────────────────
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadMenu();
        loadDiscounts();
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

  const ALL_TABS = ['All', ...CATEGORIES];

  // Single active global discount — recomputed on every tick so time-window
  // transitions (active → expired, upcoming → active) are caught without a fetch.
  const activeGlobalDiscount = useMemo(
    () => getActiveGlobalDiscount(discounts),
    [discounts, tick] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Banners: all currently-active global discounts
  const activeGlobalDiscounts = discounts.filter(isGlobalDiscountActive);

  // Items that have any discount (item-level OR global)
  const saleItems = menuItems.filter(
    (i) => getItemDiscount(i, activeGlobalDiscount) !== null
  );

  // Group items by category — discounted items float to top
  const visibleCategories = activeTab === 'All' ? CATEGORIES : [activeTab];

  const grouped = visibleCategories.reduce((acc, cat) => {
    const items = menuItems
      .filter((i) => i.category === cat)
      .sort((a, b) => {
        const aHas = getItemDiscount(a, activeGlobalDiscount) !== null ? 1 : 0;
        const bHas = getItemDiscount(b, activeGlobalDiscount) !== null ? 1 : 0;
        return bHas - aHas;
      });
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
            Our{' '}
            <em className="text-gold not-italic">{t.menu}</em>
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
                Current Promotions
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
                  menuLang={menuLang}
                />
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Sticky Category Nav ── */}
      <nav className="sticky top-16 z-40 bg-dark/95 backdrop-blur-md border-b border-dark-border">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            {ALL_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] whitespace-nowrap transition-colors duration-300 ${
                  activeTab === tab ? 'text-gold' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t.categories[tab] || tab}
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

          {/* ── Menu Language Switcher (only if multiple languages allowed) ── */}
          {allowedLanguages.length > 1 && (
            <div className="relative flex-shrink-0 ml-4">
              <button
                onClick={() => setLangSwitcherOpen((o) => !o)}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 hover:text-gold transition-colors duration-200 border border-gold/20 hover:border-gold/50 rounded-lg px-3 py-1.5"
              >
                <span>{languageOptions[menuLang]?.flag || '🌐'}</span>
                <span>{languageOptions[menuLang]?.label || menuLang.toUpperCase()}</span>
                <span className="text-[10px] opacity-60">▼</span>
              </button>

              <AnimatePresence>
                {langSwitcherOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 bg-dark-card border border-gold/20 rounded-xl overflow-hidden shadow-xl min-w-[110px] z-50"
                  >
                    {allowedLanguages.map((code) => {
                      const opt = languageOptions[code] || { label: code.toUpperCase(), flag: '🌐' };
                      return (
                        <button
                          key={code}
                          onClick={() => { setMenuLang(code); setLangSwitcherOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors duration-150 ${
                            menuLang === code
                              ? 'text-gold bg-gold/10'
                              : 'text-gray-400 hover:text-cream hover:bg-white/5'
                          }`}
                        >
                          <span>{opt.flag}</span>
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </nav>

      {/* ── Menu Content ── */}
      <main className="max-w-6xl mx-auto px-4 py-12">
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
                <section key={cat} id={cat.replace(' ', '-')}>
                  <CategoryHeading name={cat} />
                  {items.map((item, idx) => (
                    <MenuItemCard
                      key={item._id}
                      item={item}
                      index={idx}
                      activeGlobalDiscount={activeGlobalDiscount}
                      menuLang={menuLang}
                    />
                  ))}
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

      {/* ── Debug Panel (fixed bottom-right, toggle with 🐛 button) ── */}
      <DebugPanel discounts={discounts} />

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
