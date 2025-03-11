interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

const useToast = () => {
  const toast = (props: ToastProps) => {
    console.log("Toast:", props)
  }

  return { toast }
}

export { useToast, type ToastProps }

