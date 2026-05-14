import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { CATEGORY_ICONS } from '../../config/categories';

export default function CategoryOrderSection({
  selectedCategories,
  catOrderSaved,
  onMoveUp,
  onMoveDown,
  onSaveCategoryOrder,
}) {
  const { t } = useLanguage();

  return (
    <div className="mb-8">
      <p className="text-gold text-xs font-bold uppercase tracking-[0.3em] mb-3">{t.categoryOrder}</p>
      {selectedCategories.length === 0 ? (
        <p className="text-gray-600 text-sm">{t.noCategories}</p>
      ) : (
        <div className="space-y-2">
          {selectedCategories.map((cat, idx) => (
            <div
              key={cat}
              className="flex items-center gap-3 bg-dark border border-dark-border rounded-xl px-4 py-2.5"
            >
              <span className="text-gray-600 text-xs font-mono w-5 text-center">{idx + 1}</span>
              <span className="text-base leading-none">{CATEGORY_ICONS[cat] || '·'}</span>
              <span className="text-cream text-sm font-semibold flex-1 truncate">{t[cat] || cat}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => onMoveUp(idx)}
                  disabled={idx === 0}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-dark-border text-gray-500 hover:border-gold/40 hover:text-gold disabled:opacity-25 disabled:cursor-not-allowed transition-all text-xs"
                >↑</button>
                <button
                  onClick={() => onMoveDown(idx)}
                  disabled={idx === selectedCategories.length - 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-dark-border text-gray-500 hover:border-gold/40 hover:text-gold disabled:opacity-25 disabled:cursor-not-allowed transition-all text-xs"
                >↓</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={onSaveCategoryOrder}
          className="px-5 py-2.5 bg-gold hover:bg-gold-light text-dark text-sm font-semibold rounded-xl transition-colors duration-200"
        >
          {t.saveCategoryOrder}
        </button>
        {catOrderSaved && (
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
