import { cn } from './utils'

export default function Button({ as:Tag='button', variant='primary', size='md', className, ...props }){
  const base = 'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'
  const variants = {
    primary:'bg-ink-900 text-white hover:bg-ink-700 focus:ring-brand-400',
    secondary:'bg-white text-ink-900 border hover:bg-muted focus:ring-brand-400',
    subtle:'bg-ink-900/5 text-ink-900 hover:bg-ink-900/10',
    danger:'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-300'
  }
  const sizes = {
    sm:'h-9 px-3 text-sm',
    md:'h-11 px-4',
    lg:'h-12 px-5 text-lg'
  }
  return <Tag className={cn(base, variants[variant], sizes[size], className)} {...props} />
}
