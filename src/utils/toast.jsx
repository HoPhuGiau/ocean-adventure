// Simple toast notification system
import React from 'react'

class ToastManager {
  constructor() {
    this.toasts = []
    this.listeners = []
  }

  subscribe(listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  notify(toast) {
    const id = Date.now() + Math.random()
    const toastWithId = { ...toast, id }
    this.toasts.push(toastWithId)
    this.listeners.forEach((listener) => listener([...this.toasts]))

    // Auto remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        this.remove(id)
      }, toast.duration || 5000)
    }

    return id
  }

  remove(id) {
    this.toasts = this.toasts.filter((t) => t.id !== id)
    this.listeners.forEach((listener) => listener([...this.toasts]))
  }

  clear() {
    this.toasts = []
    this.listeners.forEach((listener) => listener([]))
  }
}

const toastManager = new ToastManager()

export function showToast(message, type = 'info', duration = 5000) {
  return toastManager.notify({ message, type, duration })
}

export function showSuccess(message, duration = 5000) {
  return showToast(message, 'success', duration)
}

export function showError(message, duration = 7000) {
  return showToast(message, 'error', duration)
}

export function showInfo(message, duration = 5000) {
  return showToast(message, 'info', duration)
}

export function showLoading(message) {
  return toastManager.notify({ message, type: 'loading', duration: 0 })
}

export function removeToast(id) {
  toastManager.remove(id)
}

export function useToasts() {
  const [toasts, setToasts] = React.useState([])

  React.useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts)
    return unsubscribe
  }, [])

  return toasts
}

// React component for displaying toasts
export function ToastContainer() {
  const toasts = useToasts()

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[10000] flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-right ${
            toast.type === 'success'
              ? 'bg-emerald-500/90 border-emerald-300 text-white'
              : toast.type === 'error'
                ? 'bg-red-500/90 border-red-300 text-white'
                : toast.type === 'loading'
                  ? 'bg-blue-500/90 border-blue-300 text-white'
                  : 'bg-blue-500/90 border-blue-300 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            {toast.type === 'loading' && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {toast.type === 'success' && <span>✅</span>}
            {toast.type === 'error' && <span>❌</span>}
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            {toast.duration !== 0 && (
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 text-white/80 hover:text-white"
              >
                ×
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

