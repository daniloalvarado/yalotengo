import { cn } from './utils'

export function Label({ className, ...p }){
  return <label className={cn('text-sm font-medium text-ink-700', className)} {...p} />
}

export function Input({ className, ...p }){
  return (
    <input
      className={cn(
        'w-full h-11 px-3 rounded-xl border bg-white placeholder:text-slate-400',
        'focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400',
        className
      )}
      {...p}
    />
  )
}
