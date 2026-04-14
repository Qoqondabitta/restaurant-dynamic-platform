import { useState, useEffect } from 'react';
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
import { useLanguage } from '../context/LanguageContext';

const CATEGORIES = ['Drinks', 'Main Dishes', 'Salads', 'Soups', 'Desserts'];

const CATEGORY_TYPE = {
  Drinks: 'drink',
  'Main Dishes': 'meal',
  Salads: 'salad',
  Soups: 'soup',
  Desserts: 'dessert',
};

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
  title: '',
  price: '',
  category: 'Main Dishes',
  ingredients: '',
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
};

// ─── Input styles ────────────────────────────────────────────────────────────
const inputCls =
  'w-full bg-dark border border-dark-border rounded-lg px-4 py-2.5 text-cream text-sm focus:outline-none focus:border-gold/50 transition-colors placeholder-gray-600';

// ─── Item Form Modal (Add / Edit) ────────────────────────────────────────────
function ItemFormModal({ editItem, onClose, onSaved }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(EMPTY_FORM);
  const [preview, setPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editItem) {
      setForm({
        title: editItem.title,
        price: editItem.price,
        category: editItem.category,
        ingredients: editItem.ingredients,
        image: null,
        imageUrl: editItem.image.startsWith('http') ? editItem.image : '',
      });
      setPreview(resolveImage(editItem.image));
    }
  }, [editItem]);

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    if (name === 'image' && files[0]) {
      setForm((p) => ({ ...p, image: files[0], imageUrl: '' }));
      setPreview(URL.createObjectURL(files[0]));
    } else if (type === 'checkbox') {
      setForm((p) => ({ ...p, [name]: checked }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
      if (name === 'imageUrl' && value) {
        setPreview(value);
        setForm((p) => ({ ...p, image: null, imageUrl: value }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.image && !form.imageUrl && !editItem) {
      setError('Please upload an image or provide an image URL.');
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('price', form.price);
    fd.append('category', form.category);
    fd.append('ingredients', form.ingredients);
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

          {/* Title */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
              {t.title}
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="e.g. Grilled Salmon"
              className={inputCls}
            />
          </div>

          {/* Price */}
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
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Ingredients */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
              {t.ingredients}
            </label>
            <textarea
              name="ingredients"
              value={form.ingredients}
              onChange={handleChange}
              required
              rows={3}
              placeholder="List the main ingredients…"
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
  const type = CATEGORY_TYPE[item?.category] || 'item';

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
          "{item?.title}"
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
function DiscountFormModal({ editDiscount, menuItems, onClose, onSaved }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(EMPTY_DISCOUNT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editDiscount) {
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
                {CATEGORIES.map((cat) => {
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
                      {cat}
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
                        <span className="text-cream text-xs flex-1">{mi.title}</span>
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
          alt={item.title}
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
          <h3 className="font-serif text-lg text-cream leading-tight">{item.title}</h3>
          <div className="text-right">
            {hasDiscount ? (
              <>
                <span className="block text-gray-500 text-xs line-through">
                  ${item.price.toFixed(2)}
                </span>
                <span className="text-gold font-semibold text-sm">
                  ${(item.price * (1 - d.percentage / 100)).toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-gold font-semibold text-sm whitespace-nowrap">
                ${item.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-2">
          {item.ingredients}
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

// ─── Dashboard Page ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const { t } = useLanguage();
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

  const loadAll = async () => {
    try {
      const [menuRes, discountRes] = await Promise.all([fetchMenu(), fetchDiscounts()]);
      setItems(menuRes.data);
      setDiscounts(discountRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
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

  const filterCounts = ['All', ...CATEGORIES].reduce((acc, cat) => {
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
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-gold hover:bg-gold-light text-dark text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors duration-200"
          >
            <span className="text-base leading-none">+</span>
            {t.addItem}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Filter tabs ── */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-8">
          {['All', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`flex-shrink-0 px-5 py-3 rounded-xl border text-xs font-semibold uppercase tracking-widest transition-all duration-200 ${
                activeFilter === cat
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-dark-border bg-dark-card text-gray-500 hover:border-gold/20 hover:text-gray-300'
              }`}
            >
              <span className="block text-xl font-light mb-0.5">{filterCounts[cat]}</span>
              {t.categories[cat] || cat}
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
        {showAddModal && (
          <ItemFormModal
            key="form"
            editItem={editItem}
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
