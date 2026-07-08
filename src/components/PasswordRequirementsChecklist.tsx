import { getPasswordRequirements } from '../lib/passwordStrength'

type Props = {
  password: string
}

export default function PasswordRequirementsChecklist({ password }: Props) {
  if (!password) return null

  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
      {getPasswordRequirements(password).map((req) => (
        <li key={req.key} className={`flex items-center gap-1 ${req.met ? 'text-positive' : 'text-muted'}`}>
          <span aria-hidden="true">{req.met ? '✓' : '·'}</span>
          <span className={req.met ? 'text-positive' : 'text-muted'}>{req.label}</span>
        </li>
      ))}
    </ul>
  )
}
