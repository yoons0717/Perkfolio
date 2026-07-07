import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'md' | 'sm'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'rounded-lg bg-blue px-3 py-3 font-display font-bold text-white hover:bg-blue/90',
  secondary: 'rounded-lg border border-line px-3 py-3 hover:bg-overlay',
  ghost: '',
  danger: 'rounded-lg bg-danger/10 px-3 py-3 font-display font-bold text-danger hover:bg-danger/20',
}

const sizeTextClass: Record<ButtonSize, string> = {
  md: 'text-sm',
  sm: 'text-xs',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', type = 'button', className = '', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[variant]} ${sizeTextClass[size]} ${className}`}
      {...props}
    />
  )
})

export default Button
