import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { generateCanonicalUrl, generatePageTitle, generatePageDescription } from '../utils/seo'

const PAGE_TITLE = generatePageTitle(['プライバシーポリシー', 'エンジニア幸福度マップ'])
const PAGE_DESCRIPTION = generatePageDescription(
  'エンジニア幸福度マップのプライバシーポリシー。収集するデータ・利用目的・第三者提供（Google Analytics・AdSense）・オプトアウト方法を説明します。'
)
const CANONICAL_URL = generateCanonicalUrl('/privacy-policy')

export default function PrivacyPolicy() {
  return (
    <>
      <Helmet>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <link rel="canonical" href={CANONICAL_URL} />
      </Helmet>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link to="/" className="inline-block text-sm text-green-700 hover:underline mb-6">
          ← ホームに戻る
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. 基本方針</h2>
            <p>
              エンジニア幸福度マップ（以下「当サービス」）は、ユーザーの個人情報の取り扱いについて、
              個人情報保護法その他の法令を遵守し、適切に管理します。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. 収集する情報</h2>
            <p>当サービスでは、以下の情報を自動的に収集することがあります。</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>アクセスログ（IPアドレス、ブラウザの種類、アクセス日時）</li>
              <li>閲覧したページのURL</li>
              <li>参照元URL（リファラー）</li>
              <li>Cookie およびそれに類する技術を通じた情報</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. 情報の利用目的</h2>
            <p>収集した情報は以下の目的に利用します。</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>サービスの利用状況の分析および改善</li>
              <li>ユーザー体験の向上</li>
              <li>不正アクセスや不正利用の検知・防止</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. 第三者への提供</h2>
            <p>
              当サービスは、以下のサードパーティサービスを利用しており、これらのサービスが情報を収集することがあります。
            </p>

            <div className="mt-4 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-1">Google Analytics 4</h3>
                <p className="text-sm">
                  サイトのアクセス解析のために Google Analytics 4 を使用しています。
                  Google はデータを匿名化して収集し、利用状況の統計情報を提供します。
                  Google のプライバシーポリシーについては、
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 hover:underline ml-1"
                  >
                    こちら
                  </a>
                  をご覧ください。
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-1">Google AdSense</h3>
                <p className="text-sm">
                  広告配信のために Google AdSense を使用しています。
                  Google はユーザーの興味や過去の閲覧履歴に基づいて広告を表示するために Cookie を使用することがあります。
                  Google の広告に関するポリシーについては、
                  <a
                    href="https://policies.google.com/technologies/ads"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 hover:underline ml-1"
                  >
                    こちら
                  </a>
                  をご覧ください。
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Cookie について</h2>
            <p>
              当サービスでは、Google Analytics および Google AdSense の機能のために Cookie を使用しています。
              ブラウザの設定により Cookie を無効化することができますが、一部の機能が利用できなくなる場合があります。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. オプトアウト</h2>
            <p>
              Google Analytics によるデータ収集を停止したい場合は、
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-700 hover:underline mx-1"
              >
                Google アナリティクス オプトアウト アドオン
              </a>
              をご利用ください。
              また、ブラウザの「Do Not Track」設定を有効にすることで、当サービスのトラッキングを無効化できます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">7. プライバシーポリシーの変更</h2>
            <p>
              本ポリシーは、法令の改正やサービス内容の変更に応じて予告なく改定することがあります。
              最新の内容は本ページにてご確認ください。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">8. お問い合わせ</h2>
            <p>
              本ポリシーに関するお問い合わせは、当サービスのお問い合わせフォームよりご連絡ください。
            </p>
          </section>

          <p className="text-xs text-gray-400 pt-4 border-t border-gray-100">
            制定日：2026年4月7日
          </p>
        </div>
      </main>
    </>
  )
}
