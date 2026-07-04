import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61C3.06 8.64 1 12 1 12s4 7 11 7a9.26 9.26 0 0 0 5.39-1.61M1 1l22 22" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    </svg>
  )
}

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export default function PasswordInput({ className = '', ...props }: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input type={visible ? 'text' : 'password'} className={`w-full pr-10 ${className}`} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? '비밀번호 숨기기' : '비밀번호 표시'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}
