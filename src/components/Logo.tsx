import { Link } from 'react-router-dom'

export default function Logo() {
  return (
    <Link to="/" className="mb-1 block font-display text-sm font-bold tracking-wide text-ink uppercase">
      Perk<span className="text-blue">Track</span>
    </Link>
  )
}
