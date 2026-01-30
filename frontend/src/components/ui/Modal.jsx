import { cn } from './utils'
export default function Modal({ open, onClose, title, children, actions }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-soft">
          <div className="px-5 pt-5">
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
          </div>
          <div className="p-5">{children}</div>
          <div className={cn('px-5 pb-5 pt-2 flex justify-end gap-2')}>
            {actions}
          </div>
        </div>
      </div>
    </div>
  )
}
