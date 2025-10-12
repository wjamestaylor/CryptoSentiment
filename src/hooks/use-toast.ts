interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

// Simple toast implementation
export function toast({ title, description, variant = 'default' }: Omit<Toast, 'id'>) {
  // For now, we'll use console logging and window.alert
  // In a real implementation, you'd want a proper toast system
  const message = description ? `${title}: ${description}` : title
  
  if (variant === 'destructive') {
    console.error(message)
    // You could also show a more prominent error
  } else {
    console.log(message)
  }
  
  // For immediate feedback, we can use a simple alert
  // In production, you'd replace this with a proper toast notification
  if (variant === 'destructive') {
    alert(`Error: ${message}`)
  }
}