import { useCallback } from 'react'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

// Simple toast implementation
export function toast({ title, description, variant = 'default' }: Omit<Toast, 'id'>) {
  // For now, we'll use console logging
  // In a real implementation, you'd want a proper toast system
  const message = description ? `${title}: ${description}` : title
  
  if (variant === 'destructive') {
    console.error(message)
    // Show alert with Error prefix for destructive toasts
    window.alert(`Error: ${message}`)
  } else {
    console.log(message)
  }
}

export function useToast() {
  const toastFn = useCallback((options: Omit<Toast, 'id'>) => {
    toast(options)
  }, [])

  return { toast: toastFn }
}