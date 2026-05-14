import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  reorderMenuItems,
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
import { DEFAULT_CATEGORIES, CATEGORY_ICONS } from '../config/categories';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import LanguageSettings from '../components/dashboard/LanguageSettings';
import CategorySettings from '../components/dashboard/CategorySettings';
import LayoutSwitcher from '../components/dashboard/LayoutSwitcher';
import CategoryOrderSection from '../components/dashboard/CategoryOrderSection';
import ItemOrderSection from '../components/dashboard/ItemOrderSection';
import MenuPreviewSection from '../components/dashboard/MenuPreviewSection';
import DiscountSettings from '../components/dashboard/DiscountSettings';

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
  { code: 'GBP', symbol: '£' },
  { code: 'CAD', symbol: 'CA$' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CHF', symbol: 'CHF' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CNY', symbol: '¥' },
  { code: 'AED', symbol: 'د.إ' },
  { code: 'SAR', symbol: '﷼' },
  { code: 'TRY', symbol: '₺' },
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
  discountPercentage: '',
  discountActive: false,
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
        discountPercentage: editItem.discount?.percentage ?? '',
        discountActive: editItem.discount?.isActive ?? false,
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
    fd.append('discountPercentage', form.discountPercentage || '0');
    fd.append('discountActive', String(form.discountActive));
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
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="py-2 px-4 rounded-lg bg-gold/10 text-gold text-sm hover:bg-gold/20 transition-colors whitespace-nowrap">
                {t.chooseFile}
              </span>
              <span className="text-sm text-gray-400 truncate">
                {form.image ? form.image.name : t.noFileChosen}
              </span>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleChange}
                className="sr-only"
              />
            </label>
            <p className="text-gray-600 text-xs mt-2 mb-1">— {t.orPasteImageUrl} —</p>
            <input
              type="text"
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleChange}
              placeholder={t.imageUrlPlaceholder}
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
                  {t.languages?.[l.code] || l.label}
                </button>
              ))}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
              {t.title}
              <span className="ml-2 text-gold/60 text-[10px] normal-case tracking-normal font-normal">
                — {t.languages?.[activeLang.code] || activeLang.label} ({activeLang.code === 'en' ? t.required : t.optional})
              </span>
            </label>
            <input
              type="text"
              value={form.title[activeLang.code] || ''}
              onChange={(e) => handleLang('title', activeLang.code, e.target.value)}
              required={activeLang.code === 'en'}
              placeholder={
                activeLang.code === 'en'
                  ? t.titlePlaceholder
                  : `Title in ${t.languages?.[activeLang.code] || activeLang.label}`
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
                {t.currency}
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
                — {t.languages?.[activeLang.code] || activeLang.label}
              </span>
            </label>
            <textarea
              value={form.ingredients[activeLang.code] || ''}
              onChange={(e) => handleLang('ingredients', activeLang.code, e.target.value)}
              rows={3}
              placeholder={
                activeLang.code === 'en'
                  ? t.ingredientsPlaceholder
                  : `Ingredients in ${t.languages?.[activeLang.code] || activeLang.label}`
              }
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Item Discount */}
          <div className="border border-dark-border rounded-xl p-4 space-y-3">
            <p className="text-xs text-gray-400 uppercase tracking-widest">{t.discountSection}</p>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setForm((p) => ({ ...p, discountActive: !p.discountActive }))}
                className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 relative ${
                  form.discountActive ? 'bg-gold' : 'bg-dark-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    form.discountActive ? 'translate-x-5' : ''
                  }`}
                />
              </div>
              <span className="text-sm text-cream">{t.discountActive}</span>
            </label>
            {form.discountActive && (
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
                  {t.discountPercent}
                </label>
                <input
                  type="number"
                  name="discountPercentage"
                  value={form.discountPercentage}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="1"
                  placeholder="0"
                  className={inputCls}
                />
              </div>
            )}
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
  const { t, lang } = useLanguage();
  const [form, setForm] = useState(EMPTY_DISCOUNT);
  const enabledLangs = SUPPORTED_LANGUAGES.filter((l) => enabledLangCodes?.includes(l.code));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editDiscount) {
      const raw = editDiscount.translations;
      const translationsObj =
        !raw ? {}
        : Array.isArray(raw) ? Object.fromEntries(raw)
        : typeof raw === 'object' ? { ...raw }
        : {};
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
              {t.discountPct} 
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
              ✦ {t.targetingLabel} <span className="text-gray-600 font-normal normal-case tracking-normal">({t.targetingHint})</span>
            </p>

            {/* Categories */}
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
                {t.menuCategories}
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
                  {t.specificItems}
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
                        <span className="text-cream text-xs flex-1">
                          {typeof mi.title === 'string' ? mi.title : (mi.title?.[lang] || mi.title?.en || getEn(mi.title))}
                        </span>
                        <span className="text-gray-600 text-[10px]">{t[mi.category] || mi.category}</span>
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
  // Layout selection
  const [menuLayout, setMenuLayout] = useState('top');
  const [layoutSaved, setLayoutSaved] = useState(false);
  // Sort order
  const [localItemOrder, setLocalItemOrder] = useState({});   // { [cat]: [_id, ...] }
  const [orderActiveCat, setOrderActiveCat] = useState('');
  const [catOrderSaved, setCatOrderSaved] = useState(false);
  const [itemOrderSaved, setItemOrderSaved] = useState(false);
  const [itemOrderError, setItemOrderError] = useState(false);
  const [savingItemOrder, setSavingItemOrder] = useState(false);

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
      if (settingsRes.data.layout === 'sidebar') setMenuLayout('sidebar');
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

  const saveLayout = async () => {
    try {
      await updateSettings({ languages: enabledLangCodes, categories: selectedCategories, layout: menuLayout });
      setLayoutSaved(true);
      setTimeout(() => setLayoutSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // ── Sort-order helpers ────────────────────────────────────────────────────

  // Rebuild localItemOrder from server data whenever items/categories change.
  // Uses server-side sortOrder so the panel always reflects persisted state.
  useEffect(() => {
    const order = {};
    selectedCategories.forEach((cat) => {
      order[cat] = items
        .filter((i) => i.category === cat)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((i) => String(i._id));
    });
    setLocalItemOrder(order);
  }, [items, selectedCategories]);

  // Keep orderActiveCat pointing at a valid category
  useEffect(() => {
    setOrderActiveCat((prev) => {
      if (!prev && selectedCategories.length > 0) return selectedCategories[0];
      if (prev && !selectedCategories.includes(prev) && selectedCategories.length > 0) return selectedCategories[0];
      return prev;
    });
  }, [selectedCategories]);

  const moveCategoryUp = (idx) => {
    if (idx === 0) return;
    setCatOrderSaved(false);
    setSelectedCategories((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveCategoryDown = (idx) => {
    setCatOrderSaved(false);
    setSelectedCategories((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const saveCategoryOrder = async () => {
    try {
      await updateSettings({ languages: enabledLangCodes, categories: selectedCategories, layout: menuLayout });
      setCatOrderSaved(true);
      setTimeout(() => setCatOrderSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const getSortedItemsForCategory = (cat) => {
    const ids = localItemOrder[cat] || [];
    return ids.map((id) => items.find((i) => i._id === id)).filter(Boolean);
  };

  const moveItemUp = (cat, idx) => {
    if (idx === 0) return;
    setItemOrderSaved(false);
    setLocalItemOrder((prev) => {
      const ids = [...(prev[cat] || [])];
      [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
      return { ...prev, [cat]: ids };
    });
  };

  const moveItemDown = (cat, idx) => {
    setItemOrderSaved(false);
    setLocalItemOrder((prev) => {
      const ids = [...(prev[cat] || [])];
      if (idx >= ids.length - 1) return prev;
      [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
      return { ...prev, [cat]: ids };
    });
  };

  const saveItemOrder = async () => {
    setSavingItemOrder(true);
    setItemOrderError(false);
    try {
      const orders = [];
      Object.entries(localItemOrder).forEach(([, ids]) => {
        ids.forEach((id, idx) => orders.push({ _id: String(id), sortOrder: idx }));
      });
      if (orders.length === 0) return;
      await reorderMenuItems(orders);
      await loadAll();
      setItemOrderSaved(true);
      setTimeout(() => setItemOrderSaved(false), 3000);
    } catch (err) {
      console.error('saveItemOrder error:', err.response?.data ?? err.message);
      setItemOrderError(true);
      setTimeout(() => setItemOrderError(false), 4000);
    } finally {
      setSavingItemOrder(false);
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

  const handleAddItem = () => {
    setEditItem(null);
    if (enabledLangCodes.length === 1) {
      setShowLangWarning(true);
    } else {
      setShowAddModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-dark pt-16">
      <DashboardHeader itemCount={items.length} onAddItem={handleAddItem} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <LanguageSettings
          enabledLangCodes={enabledLangCodes}
          langDropdownRef={langDropdownRef}
          langDropdownOpen={langDropdownOpen}
          settingsSaved={settingsSaved}
          onToggleLang={toggleLang}
          onSaveLanguageSettings={saveLanguageSettings}
          onToggleDropdown={() => setLangDropdownOpen((o) => !o)}
        />

        <CategorySettings
          selectedCategories={selectedCategories}
          categoriesSaved={categoriesSaved}
          onToggleCategory={toggleCategory}
          onSaveCategories={saveCategories}
        />

        <LayoutSwitcher
          menuLayout={menuLayout}
          layoutSaved={layoutSaved}
          onSetLayout={(option) => { setMenuLayout(option); setLayoutSaved(false); }}
          onSaveLayout={saveLayout}
        />

        {/* ── Sort Order ── */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-1">
            <div className="w-8 h-px bg-gold/40" />
            <h2 className="font-serif text-2xl text-gold">{t.sortOrder}</h2>
          </div>
          <p className="text-gray-600 text-xs uppercase tracking-widest mb-6 ml-12">
            {t.sortOrderSubtitle}
          </p>
          <CategoryOrderSection
            selectedCategories={selectedCategories}
            catOrderSaved={catOrderSaved}
            onMoveUp={moveCategoryUp}
            onMoveDown={moveCategoryDown}
            onSaveCategoryOrder={saveCategoryOrder}
          />
          <ItemOrderSection
            selectedCategories={selectedCategories}
            orderActiveCat={orderActiveCat}
            localItemOrder={localItemOrder}
            items={items}
            itemOrderSaved={itemOrderSaved}
            itemOrderError={itemOrderError}
            savingItemOrder={savingItemOrder}
            onSetActiveCat={setOrderActiveCat}
            onMoveItemUp={moveItemUp}
            onMoveItemDown={moveItemDown}
            onSaveItemOrder={saveItemOrder}
          />
        </div>

        <MenuPreviewSection
          loading={loading}
          activeFilter={activeFilter}
          selectedCategories={selectedCategories}
          filtered={filtered}
          filterCounts={filterCounts}
          onSetActiveFilter={setActiveFilter}
          onAddItem={handleAddItem}
          onEditItem={(i) => { setEditItem(i); setShowAddModal(true); }}
          onDeleteItem={setDeleteItem}
        />

        <DiscountSettings
          discounts={discounts}
          onAddDiscount={() => { setEditDiscount(null); setShowDiscountModal(true); }}
          onEditDiscount={(disc) => { setEditDiscount(disc); setShowDiscountModal(true); }}
          onDeleteDiscount={setDeleteDiscountItem}
        />
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
