import { useLanguage } from '../../context/LanguageContext';

export default function DashboardHeader({ itemCount, onAddItem }) {
  const { t } = useLanguage();

  return (
    <div className="bg-dark-card border-b border-dark-border px-6 py-5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-gold">{t.restaurantDashboard}</h1>
          <p className="text-gray-600 text-xs mt-0.5 uppercase tracking-wider">
            {itemCount} {t.itemsInMenu}
          </p>
        </div>
        <button
          onClick={onAddItem}
          className="flex items-center gap-2 bg-gold hover:bg-gold-light text-dark text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors duration-200"
        >
          <span className="text-base leading-none">+</span>
          {t.addItem}
        </button>
      </div>
    </div>
  );
}
