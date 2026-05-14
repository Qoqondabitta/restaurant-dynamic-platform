import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { resolveImage } from '../../api/menu';

const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', RUB: '₽', UZS: "so'm", PLN: 'zł' };
const fmtPrice = (price, currency) =>
  `${CURRENCY_SYMBOLS[currency] || '$'}${Number(price).toFixed(2)}`;

export default function MenuItemCard({ item, onEdit, onDelete }) {
  const { t, lang } = useLanguage();
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
          alt={typeof item.title === 'string' ? item.title : (item.title?.[lang] || item.title?.en || '')}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://placehold.co/600x400/141414/c9a84c?text=No+Image';
          }}
        />
        <span className="absolute top-3 left-3 bg-gold/90 text-dark text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
          {t[item.category] || item.category}
        </span>
        {hasDiscount && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">
            -{d.percentage}% {t.off}
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-serif text-lg text-cream leading-tight">
            {typeof item.title === 'string' ? item.title : (item.title?.[lang] || item.title?.en || '')}
          </h3>
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
          {typeof item.ingredients === 'string' ? item.ingredients : (item.ingredients?.[lang] || item.ingredients?.en || '')}
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
