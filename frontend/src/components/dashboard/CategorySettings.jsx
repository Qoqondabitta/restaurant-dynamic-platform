import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { DEFAULT_CATEGORIES, CATEGORY_ICONS } from '../../config/categories';

export default function CategorySettings({
  selectedCategories,
  categoriesSaved,
  onToggleCategory,
  onSaveCategories,
}) {
  const { t } = useLanguage();

  return (
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
                onChange={() => onToggleCategory(cat)}
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
          onClick={onSaveCategories}
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
  );
}
