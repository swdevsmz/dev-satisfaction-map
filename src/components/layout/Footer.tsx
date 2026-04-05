export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="font-semibold text-gray-800">🗾 エンジニア幸福度マップ</p>
            <p className="text-sm text-gray-500 mt-1">
              求人データから読み解く、エンジニアが幸せに働ける会社ランキング
            </p>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} エンジニア幸福度マップ. All rights reserved.
          </p>
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center">
          ※ 掲載スコアは公開情報・求人データを基にした推定値であり、各企業の公式見解ではありません。
        </p>
      </div>
    </footer>
  )
}
