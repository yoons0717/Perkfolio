import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'md' | 'sm'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'rounded-lg bg-blue px-3 py-3 font-display font-bold text-white hover:bg-blue/90',
  secondary: 'rounded-lg border border-line px-3 py-3 hover:bg-white/5',
  ghost: '',
}

const sizeTextClass: Record<ButtonSize, string> = {
  md: 'text-sm',
  sm: 'text-xs',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`cursor-pointer transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClass[variant]} ${sizeTextClass[size]} ${className}`}
      {...props}
    />
  )
}
