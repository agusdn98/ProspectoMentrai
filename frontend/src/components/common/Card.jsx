import clsx from 'clsx';

export default function Card({ children, className, padding = true, hover = false }) {
  return (
    <div 
      className={clsx(
        'bg-white/85 rounded-xl border border-slate-200/70 shadow-sm backdrop-blur',
        padding && 'p-6',
        hover && 'transition-shadow hover:shadow-md',
        className
      )}
    >
      {children}
    </div>
  );
}
