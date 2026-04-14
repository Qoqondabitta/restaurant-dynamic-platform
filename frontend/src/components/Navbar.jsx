import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const LANGS = [
  { code: 'en', label: 'ENG', flag: 'https://flagcdn.com/w40/gb.png' },
  { code: 'ru', label: 'RUS', flag: 'https://flagcdn.com/w40/ru.png' },
  { code: 'uz', label: 'UZB', flag: 'https://flagcdn.com/w40/uz.png' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { lang, setLang, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const current = LANGS.find((l) => l.code === lang);

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 bg-dark/90 backdrop-blur-md border-b border-gold/10"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <span className="text-gold text-xl leading-none">✦</span>
          <span className="font-serif text-xl text-cream tracking-wide group-hover:text-gold transition-colors duration-300">
            Luxe Kitchen
          </span>
        </Link>

        {/* Right side: Nav Links + Language Switcher */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="relative text-xs uppercase tracking-[0.2em] font-semibold transition-colors duration-300 text-gray-400 hover:text-gold"
          >
            {pathname === '/' && (
              <motion.span
                layoutId="navUnderline"
                className="absolute -bottom-1 left-0 right-0 h-px bg-gold"
              />
            )}
            <span className={pathname === '/' ? 'text-gold' : ''}>{t.menu}</span>
          </Link>

          <Link
            to="/dashboard"
            className="relative text-xs uppercase tracking-[0.2em] font-semibold transition-colors duration-300 text-gray-400 hover:text-gold"
          >
            {pathname === '/dashboard' && (
              <motion.span
                layoutId="navUnderline"
                className="absolute -bottom-1 left-0 right-0 h-px bg-gold"
              />
            )}
            <span className={pathname === '/dashboard' ? 'text-gold' : ''}>
              {t.dashboard}
            </span>
          </Link>

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 hover:text-gold transition-colors duration-200 border border-gold/20 hover:border-gold/50 rounded-lg px-3 py-1.5"
            >
              <img src={current.flag} alt={current.code} className="w-5 h-4 object-cover rounded-sm" />
              <span>{current.label}</span>
              <span className="text-[10px] opacity-60">▼</span>
            </button>

            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 bg-dark-card border border-gold/20 rounded-xl overflow-hidden shadow-xl min-w-[110px] z-50"
                >
                  {LANGS.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setLangOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest transition-colors duration-150 ${
                        lang === l.code
                          ? 'text-gold bg-gold/10'
                          : 'text-gray-400 hover:text-cream hover:bg-white/5'
                      }`}
                    >
                      <img src={l.flag} alt={l.code} className="w-5 h-4 object-cover rounded-sm" />
                      <span>{l.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
