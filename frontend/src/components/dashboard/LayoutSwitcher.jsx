import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

export default function LayoutSwitcher({ menuLayout, layoutSaved, onSetLayout, onSaveLayout }) {
  const { t } = useLanguage();

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl p-6 mb-6">
      <h3 className="text-cream font-semibold text-base mb-1">{t.menuLayout}</h3>
      <p className="text-gray-500 text-sm mb-4">{t.menuLayoutSubtitle}</p>
      <div className="flex gap-3 mb-5">
        {['top', 'sidebar'].map((option) => (
          <button
            key={option}
            onClick={() => onSetLayout(option)}
            className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${
              menuLayout === option
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-dark-border bg-dark text-gray-400 hover:border-gold/30 hover:text-gray-200'
            }`}
          >
            {option === 'top' ? t.topLayout : t.sidebarLayout}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onSaveLayout}
          className="px-5 py-2.5 bg-gold hover:bg-gold-light text-dark text-sm font-semibold rounded-xl transition-colors duration-200"
        >
          {t.saveLayout}
        </button>
        {layoutSaved && (
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
