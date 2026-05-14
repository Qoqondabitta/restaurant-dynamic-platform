import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { CATEGORY_ICONS } from '../../config/categories';
import { resolveImage } from '../../api/menu';

function getEn(field) {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.en || Object.values(field)[0] || '';
}

export default function ItemOrderSection({
  selectedCategories,
  orderActiveCat,
  localItemOrder,
  items,
  itemOrderSaved,
  itemOrderError,
  savingItemOrder,
  onSetActiveCat,
  onMoveItemUp,
  onMoveItemDown,
  onSaveItemOrder,
}) {
  const { t } = useLanguage();

  const getSortedItemsForCategory = (cat) => {
    const ids = localItemOrder[cat] || [];
    return ids.map((id) => items.find((i) => i._id === id)).filter(Boolean);
  };

  return (
    <div>
      <p className="text-gold text-xs font-bold uppercase tracking-[0.3em] mb-3">{t.itemOrder}</p>
      {selectedCategories.length === 0 ? (
        <p className="text-gray-600 text-sm">{t.noCategories}</p>
      ) : (
        <>
          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4">
            {selectedCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => onSetActiveCat(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl border text-xs font-semibold uppercase tracking-widest transition-all duration-200 ${
                  orderActiveCat === cat
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-dark-border text-gray-500 hover:border-gold/20 hover:text-gray-300'
                }`}
              >
                {CATEGORY_ICONS[cat] || ''} {t[cat] || cat}
              </button>
            ))}
          </div>

          {/* Items list for active category */}
          {orderActiveCat && (() => {
            const catItems = getSortedItemsForCategory(orderActiveCat);
            return catItems.length === 0 ? (
              <p className="text-gray-600 text-sm py-3">{t.noItemsInCategory}</p>
            ) : (
              <div className="space-y-2">
                {catItems.map((item, idx) => (
                  <div
                    key={item._id}
                    className="flex items-center gap-3 bg-dark border border-dark-border rounded-xl px-4 py-2.5"
                  >
                    <span className="text-gray-600 text-xs font-mono w-5 text-center">{idx + 1}</span>
                    <img
                      src={resolveImage(item.image)}
                      alt=""
                      className="w-10 h-8 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => { e.target.src = 'https://placehold.co/40x32/141414/c9a84c?text=·'; }}
                    />
                    <span className="text-cream text-sm flex-1 min-w-0 truncate">
                      {getEn(item.title)}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onMoveItemUp(orderActiveCat, idx)}
                        disabled={idx === 0}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-dark-border text-gray-500 hover:border-gold/40 hover:text-gold disabled:opacity-25 disabled:cursor-not-allowed transition-all text-xs"
                      >↑</button>
                      <button
                        onClick={() => onMoveItemDown(orderActiveCat, idx)}
                        disabled={idx === catItems.length - 1}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-dark-border text-gray-500 hover:border-gold/40 hover:text-gold disabled:opacity-25 disabled:cursor-not-allowed transition-all text-xs"
                      >↓</button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={onSaveItemOrder}
              disabled={savingItemOrder}
              className="px-5 py-2.5 bg-gold hover:bg-gold-light text-dark text-sm font-semibold rounded-xl transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {savingItemOrder ? t.saving : t.saveItemOrder}
            </button>
            {itemOrderSaved && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-emerald-400 text-sm"
              >
                ✓ {t.saved}
              </motion.span>
            )}
            {itemOrderError && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-400 text-sm"
              >
                {t.orderSaveError}
              </motion.span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
