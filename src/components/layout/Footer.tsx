import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div>
            <p className="font-semibold text-gray-800">🗾 エンジニア幸福度マップ</p>
            <p className="text-sm text-gray-500 mt-1">
              求人データから読み解く、エンジニアが幸せに働ける会社ランキング
            </p>
          </div>
          <nav aria-label="フッターナビゲーション">
            <ul className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-gray-500">
              <li>
                <Link to="/" className="inline-flex items-center min-h-[44px] px-2 hover:text-gray-800 transition-colors">
                  企業一覧
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="inline-flex items-center min-h-[44px] px-2 hover:text-gray-800 transition-colors">
                  プライバシーポリシー
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} エンジニア幸福度マップ. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 text-center sm:text-right">
            ※ 掲載スコアは公開情報・求人データを基にした推定値であり、各企業の公式見解ではありません。
          </p>
        </div>
      </div>
    </footer>
  )
}
