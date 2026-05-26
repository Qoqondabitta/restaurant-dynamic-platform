import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

function getItemTitle(item, lang) {
  const title = item.title;
  if (!title) return 'Unknown';
  if (typeof title === 'string') return title;
  return title[lang] || title.en || Object.values(title)[0] || 'Unknown';
}

export default function ItemOrderSection({
  items,
  selectedCategories,
  localItemOrder,
  activeCat,
  itemOrderSaved,
  onSetActiveCat,
  onMoveUp,
  onMoveDown,
  onSaveItemOrder,
}) {
  const { t, lang } = useLanguage();

  const orderedIds = Array.isArray(localItemOrder[activeCat]) ? localItemOrder[activeCat] : [];
  const itemMap = Object.fromEntries(items.map((i) => [String(i._id), i]));
  const orderedItems = orderedIds.map((id) => itemMap[id]).filter(Boolean);

  return (
    <div>
      <p className="text-gold text-xs font-bold uppercase tracking-[0.3em] mb-3">{t.itemOrder}</p>

      {selectedCategories.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {selectedCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => onSetActiveCat(cat)}
              className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold uppercase tracking-wide transition-colors ${
                activeCat === cat
                  ? 'bg-gold/20 border-gold/40 text-gold'
                  : 'border-dark-border text-gray-500 hover:text-gray-300'
              }`}
            >
              {t[cat] || cat}
            </button>
          ))}
        </div>
      )}

      {orderedItems.length === 0 ? (
        <p className="text-gray-600 text-sm">{t.noItemsInCategory}</p>
      ) : (
        <div className="space-y-2">
          {orderedItems.map((item, idx) => (
            <div
              key={String(item._id)}
              className="flex items-center gap-3 bg-dark border border-dark-border rounded-xl px-4 py-2.5"
            >
              <span className="text-gray-600 text-xs font-mono w-5 text-center">{idx + 1}</span>
              <span className="text-cream text-sm font-semibold flex-1 truncate">
                {getItemTitle(item, lang)}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => onMoveUp(idx)}
                  disabled={idx === 0}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-dark-border text-gray-500 hover:border-gold/40 hover:text-gold disabled:opacity-25 disabled:cursor-not-allowed transition-all text-xs"
                >↑</button>
                <button
                  onClick={() => onMoveDown(idx)}
                  disabled={idx === orderedItems.length - 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-dark-border text-gray-500 hover:border-gold/40 hover:text-gold disabled:opacity-25 disabled:cursor-not-allowed transition-all text-xs"
                >↓</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={onSaveItemOrder}
          className="px-5 py-2.5 bg-gold hover:bg-gold-light text-dark text-sm font-semibold rounded-xl transition-colors duration-200"
        >
          {t.saveItemOrder}
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
      </div>
    </div>
  );
}
