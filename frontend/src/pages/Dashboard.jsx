import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  resolveImage,
} from '../api/menu';
import {
  fetchDiscounts,
  addDiscount,
  updateDiscount,
  deleteDiscount,
} from '../api/discounts';
import { fetchSettings, updateSettings } from '../api/settings';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES } from '../config/languages';
import { DEFAULT_CATEGORIES, CATEGORY_ICONS } from '../config/categories';

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Russian' },
  { code: 'uz', label: 'Uzbek' },
  { code: 'pl', label: 'Polish' },
  { code: 'es', label: 'Spanish' },
  { code: 'tr', label: 'Turkish' },
  { code: 'ar', label: 'Arabic' },
  { code: 'zh', label: 'Mandarin' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'fr', label: 'French' },
  { code: 'it', label: 'Italian' },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'RUB', symbol: '₽' },
  { code: 'UZS', symbol: "so'm" },
  { code: 'PLN', symbol: 'zł' },
];

// Converts a stored UTC date string into the local "YYYY-MM-DDTHH:mm" value
// needed by <input type="datetime-local">, without shifting to UTC.
function toLocalDatetime(date) {
  if (!date) return '';
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

const EMPTY_FORM = {
  title: {},
  ingredients: {},
  price: '',
  currency: 'USD',
  category: 'main',
  image: null,
  imageUrl: '',
};

const EMPTY_DISCOUNT = {
  title: '',
  percentage: '',
  appliesToType: 'everyone',
  appliesTo: 'Everyone',
  specificGroup: '',
  startTime: '',
  endTime: '',
  isActive: true,
  categories: [],
  items: [],
  translations: {},
  showTranslations: false,
};

// ─── Input styles ────────────────────────────────────────────────────────────
const inputCls =
  'w-full bg-dark border border-dark-border rounded-lg px-4 py-2.5 text-cream text-sm focus:outline-none focus:border-gold/50 transition-colors placeholder-gray-600';

// ─── Item Form Modal (Add / Edit) ────────────────────────────────────────────
function ItemFormModal({ editItem, enabledLangs, onClose, onSaved }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(EMPTY_FORM);
  const [langTab, setLangTab] = useState(enabledLangs?.[0]?.code || 'en');
  const [preview, setPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset active tab when enabled languages change
  useEffect(() => {
    if (enabledLangs?.length) setLangTab(enabledLangs[0].code);
  }, [enabledLangs]);

  useEffect(() => {
    if (editItem) {
      const rawTitle = editItem.title || {};
      const rawIng   = editItem.ingredients || {};
      // Handle both legacy string format and new plain-object (Map) format
      const titleObj = typeof rawTitle === 'string' ? { en: rawTitle } : rawTitle;
      const ingObj   = typeof rawIng   === 'string' ? { en: rawIng   } : rawIng;
      setForm({
        title: titleObj,
        ingredients: ingObj,
        price: editItem.price,
        currency: editItem.currency || 'USD',
        category: editItem.category,
        image: null,
        imageUrl: editItem.image.startsWith('http') ? editItem.image : '',
      });
      setPreview(resolveImage(editItem.image));
    }
  }, [editItem]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image' && files[0]) {
      setForm((p) => ({ ...p, image: files[0], imageUrl: '' }));
      setPreview(URL.createObjectURL(files[0]));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
      if (name === 'imageUrl' && value) {
        setPreview(value);
        setForm((p) => ({ ...p, image: null, imageUrl: value }));
      }
    }
  };

  const handleLang = (field, code, val) =>
    setForm((p) => ({ ...p, [field]: { ...p[field], [code]: val } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.image && !form.imageUrl && !editItem) {
      setError('Please upload an image or provide an image URL.');
      return;
    }

    // Validate all enabled languages have a title
    const missing = (enabledLangs || []).filter((l) => !form.title[l.code]?.trim());
    if (missing.length) {
      setError(`Title required in: ${missing.map((l) => l.label).join(', ')}`);
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.append('title',       JSON.stringify(form.title));
    fd.append('ingredients', JSON.stringify(form.ingredients));
    fd.append('price',    form.price);
    fd.append('currency', form.currency || 'USD');
    fd.append('category', form.category);
    if (form.image) fd.append('image', form.image);
    else if (form.imageUrl) fd.append('imageUrl', form.imageUrl);

    try {
      if (editItem) {
        await updateMenuItem(editItem._id, fd);
      } else {
        await addMenuItem(fd);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const activeLang = (enabledLangs || []).find((l) => l.code === langTab)
    || enabledLangs?.[0]
    || { code: 'en', label: 'English' };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative w-full max-w-lg bg-dark-card border border-gold/20 rounded-2xl overflow-hidden shadow-2xl"
        initial={{ scale: 0.92, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 24, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-dark-border">
          <h2 className="font-serif text-2xl text-gold">
            {editItem ? t.editItem : t.addItem}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-cream text-xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Image */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
              {t.image}
            </label>
            {preview && (
              <div className="mb-3 rounded-xl overflow-hidden aspect-video border border-dark-border">
                <img
                  src={preview}
                  alt="preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src =
                      'https://placehold.co/600x400/141414/c9a84c?text=Invalid+URL';
                  }}
                />
              </div>
            )}
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gold/10 file:text-gold hover:file:bg-gold/20 cursor-pointer file:transition-colors"
            />
            <p className="text-gray-600 text-xs mt-2 mb-1">— or paste an image URL —</p>
            <input
              type="text"
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className={inputCls}
            />
          </div>

          {/* Language tabs (shared by Title + Ingredients) */}
          {enabledLangs && enabledLangs.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {enabledLangs.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLangTab(l.code)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold uppercase tracking-wide transition-colors ${
                    langTab === l.code
                      ? 'bg-gold/20 border-gold/40 text-gold'
                      : 'border-dark-border text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
              {t.title}
              <span className="ml-2 text-gold/60 text-[10px] normal-case tracking-normal font-normal">
                — {activeLang.label}{activeLang.code === 'en' ? ' (required)' : ' (optional)'}
              </span>
            </label>
            <input
              type="text"
              value={form.title[activeLang.code] || ''}
              onChange={(e) => handleLang('title', activeLang.code, e.target.value)}
              required={activeLang.code === 'en'}
              placeholder={
                activeLang.code === 'en'
                  ? 'e.g. Grilled Salmon'
                  : `Title in ${activeLang.label}`
              }
              className={inputCls}
            />
          </div>

          {/* Price + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
                {t.price}
              </label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                placeholder="0.00"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
                Currency
              </label>
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className={inputCls}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
              {t.category}
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className={inputCls}
            >
              {DEFAULT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t[cat] || cat}
                </option>
              ))}
            </select>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
              {t.ingredients}
              <span className="ml-2 text-gold/60 text-[10px] normal-case tracking-normal font-normal">
                — {activeLang.label}
              </span>
            </label>
            <textarea
              value={form.ingredients[activeLang.code] || ''}
              onChange={(e) => handleLang('ingredients', activeLang.code, e.target.value)}
              rows={3}
              placeholder={
                activeLang.code === 'en'
                  ? 'List the main ingredients…'
                  : `Ingredients in ${activeLang.label}`
              }
              className={`${inputCls} resize-none`}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-dark-border text-gray-400 rounded-xl hover:bg-white/5 transition-colors text-sm"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-gold hover:bg-gold-light text-dark font-semibold rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? t.saving : editItem ? t.update : t.addItem}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteModal({ item, onClose, onConfirm }) {
  const { t } = useLanguage();
  const type = item?.category || 'item';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-sm bg-dark-card border border-red-500/20 rounded-2xl p-8 text-center shadow-2xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
          <span className="text-red-400 text-2xl">⚠</span>
        </div>
        <h3 className="font-serif text-2xl text-cream mb-2">{t.confirmDelete}</h3>
        <p className="text-gray-400 mb-3">
          {t.doYouWantToDelete} this {type}?
        </p>
        <p className="text-gold font-semibold font-serif text-lg mb-6">
          "{getEn(item?.title)}"
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-dark-border text-gray-400 rounded-xl hover:bg-white/5 transition-colors text-sm"
          >
            {t.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {t.yesDelete}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Discount Form Modal ─────────────────────────────────────────────────────
function DiscountFormModal({ editDiscount, menuItems, enabledLangCodes, onClose, onSaved }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(EMPTY_DISCOUNT);
  const enabledLangs = SUPPORTED_LANGUAGES.filter((l) => enabledLangCodes?.includes(l.code));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editDiscount) {
      const translationsObj = Object.fromEntries(editDiscount.translations || {});
      setForm({
        title: editDiscount.title,
        percentage: editDiscount.percentage,
        appliesToType: editDiscount.appliesTo === 'Everyone' ? 'everyone' : 'group',
        appliesTo: editDiscount.appliesTo,
        specificGroup: editDiscount.appliesTo !== 'Everyone' ? editDiscount.appliesTo : '',
        startTime: toLocalDatetime(editDiscount.startTime),
        endTime: toLocalDatetime(editDiscount.endTime),
        isActive: editDiscount.isActive,
        categories: editDiscount.categories ?? [],
        items: (editDiscount.items ?? []).map((id) => String(id)),
        translations: translationsObj,
        showTranslations: Object.keys(translationsObj).length > 0,
      });
    }
  }, [editDiscount]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const payload = {
      title: form.title,
      percentage: parseFloat(form.percentage),
      appliesTo: form.appliesToType === 'everyone' ? 'Everyone' : form.specificGroup,
      startTime: form.startTime ? new Date(form.startTime).toISOString() : '',
      endTime: form.endTime ? new Date(form.endTime).toISOString() : '',
      isActive: form.isActive,
      categories: form.categories,
      items: form.items,
      translations: form.translations,
    };
    try {
      if (editDiscount) {
        await updateDiscount(editDiscount._id, payload);
      } else {
        await addDiscount(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md bg-dark-card border border-gold/20 rounded-2xl overflow-hidden shadow-2xl"
        initial={{ scale: 0.92, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 24, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-dark-border">
          <h2 className="font-serif text-2xl text-gold">
            {editDiscount ? t.edit : t.addDiscount}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-cream text-xl transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
              {t.discountTitle}
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder='e.g. "Canada Day"'
              className={inputCls}
            />
          </div>

          {/* Optional per-language display name */}
          {enabledLangs.length > 1 && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={form.showTranslations}
                  onChange={() => setForm((p) => ({ ...p, showTranslations: !p.showTranslations }))}
                  className="accent-gold"
                />
                <span className="text-xs text-gray-400 uppercase tracking-widest">
                  {t.translateDiscount}
                </span>
              </label>
              {form.showTranslations && (
                <div className="space-y-3">
                  {enabledLangs.filter((l) => l.code !== 'en').map((l) => (
                    <div key={l.code}>
                      <label className="block text-xs text-gray-400 uppercase tracking-widest mb-1.5">
                        {t.discountDisplayName} — {l.label}
                      </label>
                      <input
                        type="text"
                        value={form.translations[l.code] || ''}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            translations: { ...p.translations, [l.code]: e.target.value },
                          }))
                        }
                        placeholder={`e.g. discount name in ${l.label}`}
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
              {t.discountPct} (%)
            </label>
            <input
              type="number"
              name="percentage"
              value={form.percentage}
              onChange={handleChange}
              min="1"
              max="100"
              required
              placeholder="e.g. 15"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
              {t.appliesTo}
            </label>
            <div className="flex gap-3 mb-3">
              {['everyone', 'group'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, appliesToType: opt }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest transition-all ${
                    form.appliesToType === opt
                      ? 'bg-gold/20 border border-gold/50 text-gold'
                      : 'border border-dark-border text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {opt === 'everyone' ? t.everyone : t.specificGroup}
                </button>
              ))}
            </div>
            {form.appliesToType === 'group' && (
              <input
                type="text"
                name="specificGroup"
                value={form.specificGroup}
                onChange={handleChange}
                placeholder='e.g. "Taxi Drivers"'
                className={inputCls}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
                {t.startTime}
              </label>
              <input
                type="datetime-local"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                required
                className={`${inputCls} text-gray-300`}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
                {t.endTime}
              </label>
              <input
                type="datetime-local"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                required
                className={`${inputCls} text-gray-300`}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
              className={`w-10 h-5 rounded-full transition-colors duration-200 cursor-pointer ${
                form.isActive ? 'bg-gold' : 'bg-dark-border'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 mt-0.5 ${
                  form.isActive ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
                }`}
              />
            </div>
            <span className="text-xs text-gray-400 uppercase tracking-widest">{t.active}</span>
          </label>

          {/* ── Targeting ── */}
          <div className="border border-gold/20 rounded-xl p-4 space-y-4 bg-gold/5">
            <p className="text-gold text-xs font-bold uppercase tracking-[0.25em]">
              ✦ Targeting <span className="text-gray-600 font-normal normal-case tracking-normal">(leave empty = all items)</span>
            </p>

            {/* Categories */}
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
                Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_CATEGORIES.map((cat) => {
                  const selected = form.categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          categories: selected
                            ? p.categories.filter((c) => c !== cat)
                            : [...p.categories, cat],
                        }))
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                        selected
                          ? 'bg-gold/20 border border-gold/50 text-gold'
                          : 'border border-dark-border text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {CATEGORY_ICONS[cat]} {t[cat] || cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Items */}
            {menuItems.length > 0 && (
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
                  Specific Items
                </label>
                <div className="max-h-36 overflow-y-auto border border-dark-border rounded-lg divide-y divide-dark-border">
                  {menuItems.map((mi) => {
                    const id = String(mi._id);
                    const selected = form.items.includes(id);
                    return (
                      <div
                        key={id}
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            items: selected
                              ? p.items.filter((i) => i !== id)
                              : [...p.items, id],
                          }))
                        }
                        className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                            selected ? 'bg-gold border-gold' : 'border-dark-border'
                          }`}
                        >
                          {selected && <span className="text-dark text-[10px] font-bold leading-none">✓</span>}
                        </div>
                        <span className="text-cream text-xs flex-1">{getEn(mi.title)}</span>
                        <span className="text-gray-600 text-[10px]">{mi.category}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-dark-border text-gray-400 rounded-xl hover:bg-white/5 transition-colors text-sm"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-gold hover:bg-gold-light text-dark font-semibold rounded-xl transition-colors text-sm disabled:opacity-50"
            >
              {submitting ? t.saving : editDiscount ? t.update : t.addDiscount}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Delete Discount Confirm ─────────────────────────────────────────────────
function DeleteDiscountModal({ discount, onClose, onConfirm }) {
  const { t } = useLanguage();
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-sm bg-dark-card border border-red-500/20 rounded-2xl p-8 text-center shadow-2xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
          <span className="text-red-400 text-2xl">⚠</span>
        </div>
        <h3 className="font-serif text-2xl text-cream mb-2">{t.confirmDelete}</h3>
        <p className="text-gold font-semibold font-serif text-lg mb-6">"{discount?.title}"</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-dark-border text-gray-400 rounded-xl hover:bg-white/5 transition-colors text-sm"
          >
            {t.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {t.yesDelete}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Resolves a multilingual field to its English value for dashboard display.
function getEn(field) {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.en || Object.values(field)[0] || '';
}

const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', RUB: '₽', UZS: "so'm", PLN: 'zł' };
const fmtPrice = (price, currency) =>
  `${CURRENCY_SYMBOLS[currency] || '$'}${Number(price).toFixed(2)}`;

// ─── Menu Item Card (dashboard) ──────────────────────────────────────────────
function DashboardCard({ item, onEdit, onDelete }) {
  const { t } = useLanguage();
  const d = item.discount;
  const hasDiscount = d && d.isActive && d.percentage > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden hover:border-gold/20 transition-all duration-300 group"
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={resolveImage(item.image)}
          alt={getEn(item.title)}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://placehold.co/600x400/141414/c9a84c?text=No+Image';
          }}
        />
        <span className="absolute top-3 left-3 bg-gold/90 text-dark text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
          {item.category}
        </span>
        {hasDiscount && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">
            -{d.percentage}% {t.off}
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-serif text-lg text-cream leading-tight">{getEn(item.title)}</h3>
          <div className="text-right">
            {hasDiscount ? (
              <>
                <span className="block text-gray-500 text-xs line-through">
                  {fmtPrice(item.price, item.currency)}
                </span>
                <span className="text-gold font-semibold text-sm">
                  {fmtPrice(item.price * (1 - d.percentage / 100), item.currency)}
                </span>
              </>
            ) : (
              <span className="text-gold font-semibold text-sm whitespace-nowrap">
                {fmtPrice(item.price, item.currency)}
              </span>
            )}
          </div>
        </div>
        <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-2">
          {getEn(item.ingredients)}
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(item)}
            className="flex-1 py-2 text-xs font-semibold uppercase tracking-widest border border-gold/30 text-gold rounded-lg hover:bg-gold hover:text-dark transition-all duration-200"
          >
            {t.edit}
          </button>
          <button
            onClick={() => onDelete(item)}
            className="flex-1 py-2 text-xs font-semibold uppercase tracking-widest border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200"
          >
            {t.delete}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Discount Row ─────────────────────────────────────────────────────────────
function DiscountRow({ discount, onEdit, onDelete }) {
  const { t } = useLanguage();
  const now = new Date();
  const isLive =
    discount.isActive &&
    now >= new Date(discount.startTime) &&
    now <= new Date(discount.endTime);

  const fmtDt = (dt) =>
    new Date(dt).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-dark border border-dark-border rounded-xl hover:border-gold/20 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <span className="font-serif text-cream text-base">{discount.title}</span>
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t.activeNow}
            </span>
          )}
          {!discount.isActive && (
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest bg-dark-border px-2 py-0.5 rounded-full">
              Off
            </span>
          )}
        </div>
        <p className="text-gray-500 text-xs">
          {discount.appliesTo} · {fmtDt(discount.startTime)} → {fmtDt(discount.endTime)}
        </p>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <span className="text-gold font-serif text-2xl font-bold">-{discount.percentage}%</span>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(discount)}
            className="px-3 py-1.5 text-xs font-semibold uppercase tracking-widest border border-gold/30 text-gold rounded-lg hover:bg-gold hover:text-dark transition-all"
          >
            {t.edit}
          </button>
          <button
            onClick={() => onDelete(discount)}
            className="px-3 py-1.5 text-xs font-semibold uppercase tracking-widest border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
          >
            {t.delete}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Translation Warning Modal ───────────────────────────────────────────────
function TranslationWarningModal({ warnings, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 20 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="bg-dark-card border border-dark-border rounded-2xl p-8 max-w-lg w-full shadow-2xl flex flex-col max-h-[80vh]"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <h3 className="font-serif text-xl text-gold">Missing Translations</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-cream text-xl leading-none transition-colors">✕</button>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">
          Languages saved. Some menu items are missing translations for the newly added languages.
          You can add them later by editing each item.
        </p>
        <div className="overflow-y-auto flex-1 space-y-2 mb-5">
          {warnings.map((w) => (
            <div key={w.id} className="bg-dark border border-dark-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold/60 bg-gold/10 border border-gold/20 px-2 py-0.5 rounded-full">
                  {w.type === 'category' ? 'Category' : 'Item'}
                </span>
                <p className="text-cream text-sm font-semibold">{w.name}</p>
              </div>
              <p className="text-gray-500 text-xs font-mono">Missing: {w.missing.join(', ')}</p>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full px-4 py-2.5 bg-gold hover:bg-gold-light text-dark text-sm font-semibold rounded-xl transition-colors duration-200"
        >
          Got it, I'll fix later
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Language Warning Modal ──────────────────────────────────────────────────
function LangWarningModal({ singleLang, onAddLanguages, onContinue }) {
  const langLabel = singleLang?.label || 'English';
  return (
    <motion.div
      key="lang-warning"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 20 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="bg-dark-card border border-dark-border rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🌐</span>
          <h3 className="font-serif text-xl text-gold">Single Language Detected</h3>
        </div>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          You are currently using only <span className="text-cream font-semibold">{langLabel}</span>.
          Do you want to add more languages for a better customer experience?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onAddLanguages}
            className="flex-1 px-4 py-2.5 bg-gold hover:bg-gold-light text-dark text-sm font-semibold rounded-xl transition-colors duration-200"
          >
            Add Languages
          </button>
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-2.5 border border-dark-border text-gray-400 hover:text-cream text-sm font-semibold rounded-xl transition-colors duration-200"
          >
            Continue Anyway
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Dashboard Page ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const { t, setAllowedLanguages } = useLanguage();
  const [items, setItems] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editDiscount, setEditDiscount] = useState(null);
  const [deleteDiscountItem, setDeleteDiscountItem] = useState(null);
  // Language settings
  const [enabledLangCodes, setEnabledLangCodes] = useState(['en']);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showLangWarning, setShowLangWarning] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [translationWarnings, setTranslationWarnings] = useState([]);
  const langDropdownRef = useRef(null);
  // Category selection
  const [selectedCategories, setSelectedCategories] = useState(['main']);
  const [categoriesSaved, setCategoriesSaved] = useState(false);

  const enabledLangs = SUPPORTED_LANGUAGES.filter((l) =>
    enabledLangCodes.includes(l.code)
  );

  const loadAll = async () => {
    try {
      const [menuRes, discountRes, settingsRes] = await Promise.all([
        fetchMenu(),
        fetchDiscounts(),
        fetchSettings(),
      ]);
      setItems(menuRes.data);
      setDiscounts(discountRes.data);
      setEnabledLangCodes(settingsRes.data.languages || ['en']);
      const cats = settingsRes.data.categories;
      setSelectedCategories(Array.isArray(cats) && cats.length ? cats : ['main']);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleLang = (code) => {
    setSettingsSaved(false);
    setEnabledLangCodes((prev) =>
      prev.includes(code)
        ? prev.length > 1 ? prev.filter((c) => c !== code) : prev // min 1
        : [...prev, code]
    );
  };

  const saveLanguageSettings = async () => {
    try {
      const res = await updateSettings({ languages: enabledLangCodes });
      setSettingsSaved(true);
      // Sync Navbar immediately — no page reload needed
      setAllowedLanguages(enabledLangCodes);
      setTimeout(() => setSettingsSaved(false), 3000);
      if (res.data.warning) {
        const warnings = [];
        for (const w of (res.data.missingTranslations || [])) {
          warnings.push({ type: 'item', id: w.itemId, name: w.itemName, missing: w.missing });
        }
        for (const w of (res.data.missingCategoryTranslations || [])) {
          warnings.push({ type: 'category', id: w.categoryId, name: w.categoryName, missing: w.missing });
        }
        if (warnings.length > 0) setTranslationWarnings(warnings);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCategory = (cat) => {
    setCategoriesSaved(false);
    setSelectedCategories((prev) =>
      prev.includes(cat)
        ? prev.length > 1 ? prev.filter((c) => c !== cat) : prev // keep at least 1
        : [...prev, cat]
    );
  };

  const saveCategories = async () => {
    try {
      await updateSettings({ languages: enabledLangCodes, categories: selectedCategories });
      setCategoriesSaved(true);
      setTimeout(() => setCategoriesSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Close language dropdown on outside click
  useEffect(() => {
    const handleOutside = (e) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleDeleteConfirm = async () => {
    try {
      await deleteMenuItem(deleteItem._id);
      setDeleteItem(null);
      await loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDiscountConfirm = async () => {
    try {
      await deleteDiscount(deleteDiscountItem._id);
      setDeleteDiscountItem(null);
      await loadAll();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered =
    activeFilter === 'All'
      ? items
      : items.filter((i) => i.category === activeFilter);

  const filterCounts = ['All', ...selectedCategories].reduce((acc, cat) => {
    acc[cat] =
      cat === 'All' ? items.length : items.filter((i) => i.category === cat).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-dark pt-16">
      {/* ── Top bar ── */}
      <div className="bg-dark-card border-b border-dark-border px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl text-gold">{t.restaurantDashboard}</h1>
            <p className="text-gray-600 text-xs mt-0.5 uppercase tracking-wider">
              {items.length} {t.itemsInMenu}
            </p>
          </div>
          <button
            onClick={() => {
              setEditItem(null);
              if (enabledLangCodes.length === 1) {
                setShowLangWarning(true);
              } else {
                setShowAddModal(true);
              }
            }}
            className="flex items-center gap-2 bg-gold hover:bg-gold-light text-dark text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors duration-200"
          >
            <span className="text-base leading-none">+</span>
            {t.addItem}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Menu Language Settings ── */}
        <div id="lang-settings-top" className="mb-8 border-b border-dark-border pb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-8 h-px bg-gold/40" />
            <h2 className="font-serif text-2xl text-gold">{t.menuLanguages}</h2>
          </div>
          <p className="text-gray-600 text-xs uppercase tracking-widest mb-5 ml-12">
            {t.langSettingsSubtitle}
          </p>

          {/* Multi-select language dropdown */}
          <div ref={langDropdownRef} className="relative inline-block mb-5">
            <button
              onClick={() => setLangDropdownOpen((o) => !o)}
              className="flex items-center gap-2 bg-dark border border-dark-border rounded-xl px-4 py-2.5 min-w-[260px] hover:border-gold/30 transition-colors"
            >
              <div className="flex items-center gap-1.5 flex-wrap flex-1">
                {enabledLangCodes.length === 0 ? (
                  <span className="text-gray-500 text-sm">Select languages…</span>
                ) : (
                  enabledLangCodes.map((code) => (
                    <span
                      key={code}
                      className="flex items-center gap-1 bg-gold/10 border border-gold/20 rounded-md px-1.5 py-0.5"
                    >
                      <img
                        src={LANGUAGES[code]?.flag}
                        alt={code}
                        className="w-4 h-3 object-cover rounded-sm"
                      />
                      <span className="text-gold text-[10px] font-semibold uppercase">
                        {LANGUAGES[code]?.label || code.toUpperCase()}
                      </span>
                    </span>
                  ))
                )}
              </div>
              <span className="text-gray-500 text-[10px] flex-shrink-0">▼</span>
            </button>

            <AnimatePresence>
              {langDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 top-full mt-2 bg-dark-card border border-dark-border rounded-xl shadow-2xl z-50 w-64 max-h-72 overflow-y-auto"
                >
                  {Object.entries(LANGUAGES).map(([code, { label, flag }]) => {
                    const checked = enabledLangCodes.includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => toggleLang(code)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-colors hover:bg-white/5 ${
                          checked ? 'text-gold' : 'text-gray-400'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] font-bold transition-colors ${
                            checked
                              ? 'bg-gold/20 border-gold/50 text-gold'
                              : 'border-dark-border text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                        <img src={flag} alt={code} className="w-5 h-4 object-cover rounded-sm flex-shrink-0" />
                        <span className="font-semibold uppercase tracking-widest">{label}</span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={saveLanguageSettings}
              className="px-5 py-2.5 bg-gold hover:bg-gold-light text-dark text-sm font-semibold rounded-xl transition-colors duration-200"
            >
              {t.saveLanguages}
            </button>
            {settingsSaved && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-emerald-400 text-sm"
              >
                ✓ {t.saved}
              </motion.span>
            )}
          </div>
        </div>

        {/* ── Menu Categories Section ── */}
        <div className="mb-8 border-b border-dark-border pb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-8 h-px bg-gold/40" />
            <h2 className="font-serif text-2xl text-gold">{t.menuCategories}</h2>
          </div>
          <p className="text-gray-600 text-xs uppercase tracking-widest mb-5 ml-12">
            {t.categorySettingsSubtitle}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-5">
            {DEFAULT_CATEGORIES.map((cat) => {
              const checked = selectedCategories.includes(cat);
              return (
                <label
                  key={cat}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-150 select-none ${
                    checked
                      ? 'bg-gold/10 border-gold/40 text-gold'
                      : 'border-dark-border text-gray-500 hover:border-gold/20 hover:text-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(cat)}
                    className="sr-only"
                  />
                  <span className="text-base leading-none">{CATEGORY_ICONS[cat]}</span>
                  <span className="text-xs font-semibold uppercase tracking-wide truncate">
                    {t[cat] || cat}
                  </span>
                  {checked && (
                    <span className="ml-auto text-gold text-[10px] font-bold leading-none">✓</span>
                  )}
                </label>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={saveCategories}
              className="px-5 py-2.5 bg-gold hover:bg-gold-light text-dark text-sm font-semibold rounded-xl transition-colors duration-200"
            >
              {t.saveCategories}
            </button>
            {categoriesSaved && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-emerald-400 text-sm"
              >
                ✓ {t.saved}
              </motion.span>
            )}
          </div>
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-8">
          {['All', ...selectedCategories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`flex-shrink-0 px-5 py-3 rounded-xl border text-xs font-semibold uppercase tracking-widest transition-all duration-200 ${
                activeFilter === cat
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-dark-border bg-dark-card text-gray-500 hover:border-gold/20 hover:text-gray-300'
              }`}
            >
              <span className="block text-xl font-light mb-0.5">{filterCounts[cat] ?? 0}</span>
              {cat === 'All' ? t.all : (t[cat] || cat)}
            </button>
          ))}
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filtered.length > 0 ? (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              >
                <AnimatePresence>
                  {filtered.map((item) => (
                    <DashboardCard
                      key={item._id}
                      item={item}
                      onEdit={(i) => {
                        setEditItem(i);
                        setShowAddModal(true);
                      }}
                      onDelete={setDeleteItem}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-32"
              >
                <p className="text-gray-600 font-serif text-xl">{t.noItemsYet}</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 text-gold text-sm underline hover:text-gold-light"
                >
                  {t.addFirstItem}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* ── Global Discounts Section ── */}
        <div className="mt-16 border-t border-dark-border pt-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-8 h-px bg-gold/40" />
              <h2 className="font-serif text-2xl text-gold">{t.globalDiscounts}</h2>
            </div>
            <button
              onClick={() => {
                setEditDiscount(null);
                setShowDiscountModal(true);
              }}
              className="flex items-center gap-2 border border-gold/40 text-gold text-xs font-semibold px-4 py-2 rounded-xl hover:bg-gold/10 transition-colors uppercase tracking-widest"
            >
              <span>+</span> {t.addDiscount}
            </button>
          </div>

          {discounts.length === 0 ? (
            <p className="text-gray-600 text-sm font-serif text-center py-12">
              {t.noDiscounts}
            </p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {discounts.map((d) => (
                  <DiscountRow
                    key={d._id}
                    discount={d}
                    onEdit={(disc) => {
                      setEditDiscount(disc);
                      setShowDiscountModal(true);
                    }}
                    onDelete={setDeleteDiscountItem}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {translationWarnings.length > 0 && (
          <TranslationWarningModal
            key="translation-warning"
            warnings={translationWarnings}
            onClose={() => setTranslationWarnings([])}
          />
        )}

        {showLangWarning && (
          <LangWarningModal
            key="lang-warning"
            singleLang={enabledLangs[0]}
            onAddLanguages={() => {
              setShowLangWarning(false);
              document.getElementById('lang-settings-top')?.scrollIntoView({ behavior: 'smooth' });
            }}
            onContinue={() => {
              setShowLangWarning(false);
              setShowAddModal(true);
            }}
          />
        )}

        {showAddModal && (
          <ItemFormModal
            key="form"
            editItem={editItem}
            enabledLangs={enabledLangs}
            onClose={() => {
              setShowAddModal(false);
              setEditItem(null);
            }}
            onSaved={loadAll}
          />
        )}

        {deleteItem && (
          <DeleteModal
            key="delete"
            item={deleteItem}
            onClose={() => setDeleteItem(null)}
            onConfirm={handleDeleteConfirm}
          />
        )}

        {showDiscountModal && (
          <DiscountFormModal
            key="discount-form"
            editDiscount={editDiscount}
            menuItems={items}
            enabledLangCodes={enabledLangCodes}
            onClose={() => {
              setShowDiscountModal(false);
              setEditDiscount(null);
            }}
            onSaved={loadAll}
          />
        )}

        {deleteDiscountItem && (
          <DeleteDiscountModal
            key="discount-delete"
            discount={deleteDiscountItem}
            onClose={() => setDeleteDiscountItem(null)}
            onConfirm={handleDeleteDiscountConfirm}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
