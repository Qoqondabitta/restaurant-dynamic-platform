import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { pathname } = useLocation();

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

        {/* Nav Links */}
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
            <span className={pathname === '/' ? 'text-gold' : ''}>Menu</span>
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
              Dashboard
            </span>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
