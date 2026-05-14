import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { LANGUAGES } from '../../config/languages';

export default function LanguageSettings({
  enabledLangCodes,
  langDropdownRef,
  langDropdownOpen,
  settingsSaved,
  onToggleLang,
  onSaveLanguageSettings,
  onToggleDropdown,
}) {
  const { t } = useLanguage();

  return (
    <div id="lang-settings-top" className="mb-8 border-b border-dark-border pb-8">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-8 h-px bg-gold/40" />
        <h2 className="font-serif text-2xl text-gold">{t.menuLanguages}</h2>
      </div>
      <p className="text-gray-600 text-xs uppercase tracking-widest mb-5 ml-12">
        {t.langSettingsSubtitle}
      </p>

      <div ref={langDropdownRef} className="relative inline-block mb-5">
        <button
          onClick={onToggleDropdown}
          className="flex items-center gap-2 bg-dark border border-dark-border rounded-xl px-4 py-2.5 min-w-[260px] hover:border-gold/30 transition-colors"
        >
          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            {enabledLangCodes.length === 0 ? (
              <span className="text-gray-500 text-sm">Select languages…</span>
            ) : (
              enabledLangCodes.map((code) => (
                <span
                  key={code}
                  className="flex items-center gap-1 bg-gold/10 border border-gold/20 rounded-md px-1.5 py-0.5"
                >
                  <img
                    src={LANGUAGES[code]?.flag}
                    alt={code}
                    className="w-4 h-3 object-cover rounded-sm"
                  />
                  <span className="text-gold text-[10px] font-semibold uppercase">
                    {LANGUAGES[code]?.label || code.toUpperCase()}
                  </span>
                </span>
              ))
            )}
          </div>
          <span className="text-gray-500 text-[10px] flex-shrink-0">▼</span>
        </button>

        <AnimatePresence>
          {langDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-2 bg-dark-card border border-dark-border rounded-xl shadow-2xl z-50 w-64 max-h-72 overflow-y-auto"
            >
              {Object.entries(LANGUAGES).map(([code, { label, flag }]) => {
                const checked = enabledLangCodes.includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onToggleLang(code)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-colors hover:bg-white/5 ${
                      checked ? 'text-gold' : 'text-gray-400'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] font-bold transition-colors ${
                        checked
                          ? 'bg-gold/20 border-gold/50 text-gold'
                          : 'border-dark-border text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <img src={flag} alt={code} className="w-5 h-4 object-cover rounded-sm flex-shrink-0" />
                    <span className="font-semibold uppercase tracking-widest">{label}</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onSaveLanguageSettings}
          className="px-5 py-2.5 bg-gold hover:bg-gold-light text-dark text-sm font-semibold rounded-xl transition-colors duration-200"
        >
          {t.saveLanguages}
        </button>
        {settingsSaved && (
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
