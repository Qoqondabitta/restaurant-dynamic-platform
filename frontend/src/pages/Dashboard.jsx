import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  resolveImage,
} from '../api/menu';

const CATEGORIES = ['Drinks', 'Main Dishes', 'Salads', 'Soups', 'Desserts'];

const CATEGORY_TYPE = {
  Drinks: 'drink',
  'Main Dishes': 'meal',
  Salads: 'salad',
  Soups: 'soup',
  Desserts: 'dessert',
};

const EMPTY_FORM = {
  title: '',
  price: '',
  category: 'Main Dishes',
  ingredients: '',
  image: null,
  imageUrl: '',
};

// ─── Form Modal (Add / Edit) ─────────────────────────────────────────────────
function ItemFormModal({ editItem, onClose, onSaved }) {
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
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
            {editItem ? 'Edit Item' : 'Add New Item'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-cream text-xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 max-h-[75vh] overflow-y-auto"
        >
          {/* Image preview + upload */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
              Image
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
              className="w-full bg-dark border border-dark-border rounded-lg px-4 py-2.5 text-cream text-sm focus:outline-none focus:border-gold/50 transition-colors placeholder-gray-600"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="e.g. Grilled Salmon"
              className="w-full bg-dark border border-dark-border rounded-lg px-4 py-2.5 text-cream text-sm focus:outline-none focus:border-gold/50 transition-colors placeholder-gray-600"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
              Price (USD)
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
              className="w-full bg-dark border border-dark-border rounded-lg px-4 py-2.5 text-cream text-sm focus:outline-none focus:border-gold/50 transition-colors placeholder-gray-600"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-widest mb-2">
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full bg-dark border border-dark-border rounded-lg px-4 py-2.5 text-cream text-sm focus:outline-none focus:border-gold/50 transition-colors"
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
              Ingredients
            </label>
            <textarea
              name="ingredients"
              value={form.ingredients}
              onChange={handleChange}
              required
              rows={3}
              placeholder="List the main ingredients…"
              className="w-full bg-dark border border-dark-border rounded-lg px-4 py-2.5 text-cream text-sm focus:outline-none focus:border-gold/50 transition-colors resize-none placeholder-gray-600"
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-gold hover:bg-gold-light text-dark font-semibold rounded-xl transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving…' : editItem ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteModal({ item, onClose, onConfirm }) {
  const type = CATEGORY_TYPE[item?.category] || 'item';

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-sm bg-dark-card border border-red-500/20 rounded-2xl p-8 text-center shadow-2xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
          <span className="text-red-400 text-2xl">⚠</span>
        </div>

        <h3 className="font-serif text-2xl text-cream mb-2">Confirm Delete</h3>
        <p className="text-gray-400 mb-3">
          Do you really want to delete this {type}?
        </p>
        <p className="text-gold font-semibold font-serif text-lg mb-6">
          "{item?.title}"
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-dark-border text-gray-400 rounded-xl hover:bg-white/5 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Yes, Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Menu Item Card (dashboard) ──────────────────────────────────────────────
function DashboardCard({ item, onEdit, onDelete }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden hover:border-gold/20 transition-all duration-300 group"
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={resolveImage(item.image)}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src =
              'https://placehold.co/600x400/141414/c9a84c?text=No+Image';
          }}
        />
        <span className="absolute top-3 left-3 bg-gold/90 text-dark text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
          {item.category}
        </span>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-serif text-lg text-cream leading-tight">{item.title}</h3>
          <span className="text-gold font-semibold text-sm whitespace-nowrap">
            ${item.price.toFixed(2)}
          </span>
        </div>
        <p className="text-gray-500 text-xs leading-relaxed mb-4 line-clamp-2">
          {item.ingredients}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(item)}
            className="flex-1 py-2 text-xs font-semibold uppercase tracking-widest border border-gold/30 text-gold rounded-lg hover:bg-gold hover:text-dark transition-all duration-200"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(item)}
            className="flex-1 py-2 text-xs font-semibold uppercase tracking-widest border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all duration-200"
          >
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Dashboard Page ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const loadItems = async () => {
    try {
      const res = await fetchMenu();
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleDeleteConfirm = async () => {
    try {
      await deleteMenuItem(deleteItem._id);
      setDeleteItem(null);
      await loadItems();
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
            <h1 className="font-serif text-2xl text-gold">Restaurant Dashboard</h1>
            <p className="text-gray-600 text-xs mt-0.5 uppercase tracking-wider">
              {items.length} items in the menu
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
            Add Item
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Stats / Filter tabs ── */}
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
              <span className="block text-xl font-light mb-0.5">
                {filterCounts[cat]}
              </span>
              {cat}
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
                <p className="text-gray-600 font-serif text-xl">No items yet.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 text-gold text-sm underline hover:text-gold-light"
                >
                  Add your first item
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
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
            onSaved={loadItems}
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
      </AnimatePresence>
    </div>
  );
}
