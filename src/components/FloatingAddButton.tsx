import { Link } from 'react-router-dom'

export default function FloatingAddButton() {
  return (
    <Link
      to="/add"
      className="fixed bottom-7 right-7 flex h-14 w-14 items-center justify-center rounded-full bg-blue text-2xl text-white shadow-lg shadow-blue/40"
      aria-label="방문 추가"
    >
      +
    </Link>
  )
}
