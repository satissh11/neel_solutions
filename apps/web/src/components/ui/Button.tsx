import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "outline" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Base styles
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/40 disabled:pointer-events-none disabled:opacity-50"
    
    // Variants
    const variants = {
      default: "bg-emerald-800 text-white shadow-sm hover:bg-emerald-900 hover:shadow-md",
      outline: "border border-emerald-200 bg-white text-emerald-950 shadow-sm hover:bg-emerald-50",
      ghost: "hover:bg-gray-100 hover:text-gray-900",
      link: "text-emerald-800 underline-offset-4 hover:underline",
    }
    
    // Sizes
    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-8",
      icon: "h-9 w-9",
    }
    
    const combinedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`

    return (
      <Comp
        className={combinedClasses}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
