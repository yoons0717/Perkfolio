export const focusRingClass =
  'focus:border-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg'

export const inputClass = `rounded-lg border border-line bg-surface px-3 py-3 text-base text-ink ${focusRingClass}`
export const selectClass = `rounded-lg border border-line bg-surface px-3 py-3 text-base text-ink ${focusRingClass}`
export const sectionLabelClass = 'font-mono text-xs uppercase tracking-wider text-muted'

// Auth pages (Login/Signup/ForgotPassword/ResetPassword) show a visible
// placeholder as the field's label, so this variant dims it via
// placeholder-muted and uses a shorter py-2 to match those forms' layout.
export const authInputClass = inputClass.replace('py-3', 'py-2') + ' placeholder-muted'
