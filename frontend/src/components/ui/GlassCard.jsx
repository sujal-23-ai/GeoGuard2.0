import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export default function GlassCard({ children, className, hover = false, animate = true, onClick, style }) {
  const Comp = animate ? motion.div : 'div';
  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, ease: 'easeOut' },
        ...(hover && { whileHover: { y: -2, transition: { duration: 0.2 } } }),
      }
    : {};

  return (
    <Comp
      onClick={onClick}
      style={style}
      className={cn(
        'bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-card',
        hover && 'cursor-pointer hover:bg-white/[0.07] hover:border-white/[0.15] hover:shadow-card-hover transition-all duration-300',
        className
      )}
      {...motionProps}
    >
      {children}
    </Comp>
  );
}
