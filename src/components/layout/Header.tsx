import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-gray-900 hover:text-green-700 transition-colors">
            <span className="text-2xl">🗾</span>
            <span>エンジニア幸福度マップ</span>
          </Link>
          <span className="hidden md:block text-sm text-gray-400">
            エンジニアが輝ける会社を探そう
          </span>
        </div>
      </div>
    </nav>
  )
}
