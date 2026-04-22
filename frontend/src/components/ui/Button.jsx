import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const variants = {
  primary:   'bg-primary hover:bg-primary-glow text-white shadow-glow-blue hover:shadow-[0_0_24px_rgba(59,130,246,0.5)]',
  secondary: 'bg-white/10 hover:bg-white/[0.15] text-white border border-white/15 hover:border-white/25',
  ghost:     'bg-transparent hover:bg-white/8 text-white/80 hover:text-white border border-transparent',
  danger:    'bg-red-500/80 hover:bg-red-500 text-white shadow-glow-red',
  success:   'bg-emerald-500/80 hover:bg-emerald-500 text-white',
  glass:     'bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-white/20 text-white',
};

const sizes = {
  sm:   'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md:   'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg:   'px-7 py-3.5 text-sm font-bold rounded-xl gap-2.5',
  icon: 'p-2.5 rounded-xl',
};

export default function Button({
  children, variant = 'primary', size = 'md',
  className, disabled, loading, onClick, type = 'button', ...props
}) {
  return (
    <motion.button
      type={type}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : children}
    </motion.button>
  );
}
