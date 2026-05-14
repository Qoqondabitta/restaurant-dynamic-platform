import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import MenuItemCard from './MenuItemCard';

export default function MenuPreviewSection({
  loading,
  activeFilter,
  selectedCategories,
  filtered,
  filterCounts,
  onSetActiveFilter,
  onAddItem,
  onEditItem,
  onDeleteItem,
}) {
  const { t } = useLanguage();

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-8">
        {['All', ...selectedCategories].map((cat) => (
          <button
            key={cat}
            onClick={() => onSetActiveFilter(cat)}
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

      {/* Grid */}
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
                  <MenuItemCard
                    key={item._id}
                    item={item}
                    onEdit={onEditItem}
                    onDelete={onDeleteItem}
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
                onClick={onAddItem}
                className="mt-4 text-gold text-sm underline hover:text-gold-light"
              >
                {t.addFirstItem}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
