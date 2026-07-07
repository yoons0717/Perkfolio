import { Link } from 'react-router-dom'

export default function FloatingAddButton() {
  return (
    <Link
      to="/add"
      className="fixed bottom-7 right-7 flex items-center gap-1.5 rounded-full bg-blue px-5 py-3.5 font-display text-sm font-bold text-white shadow-lg shadow-blue/40"
      aria-label="체험단 추가"
    >
      <span aria-hidden="true" className="text-xl leading-none">
        +
      </span>
      체험단 추가
    </Link>
  )
}
