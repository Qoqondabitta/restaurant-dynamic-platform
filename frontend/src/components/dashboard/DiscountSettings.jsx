import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

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

export default function DiscountSettings({ discounts, onAddDiscount, onEditDiscount, onDeleteDiscount }) {
  const { t } = useLanguage();

  return (
    <div className="mt-16 border-t border-dark-border pt-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-8 h-px bg-gold/40" />
          <h2 className="font-serif text-2xl text-gold">{t.globalDiscounts}</h2>
        </div>
        <button
          onClick={onAddDiscount}
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
                onEdit={onEditDiscount}
                onDelete={onDeleteDiscount}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
