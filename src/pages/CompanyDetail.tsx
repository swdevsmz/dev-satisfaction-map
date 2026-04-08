import { useEffect } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useCompanyById } from '../hooks/useCompanyById'
import { useCompanyData } from '../hooks/useCompanyData'
import { useAnalytics } from '../hooks/useAnalytics'
import { ShareButtons } from '../components/share/ShareButtons'
import { CopyUrlButton } from '../components/share/CopyUrlButton'
import { Breadcrumb } from '../components/navigation/Breadcrumb'
import { AdUnit } from '../components/ads/AdUnit'
import { RelatedCompanies } from '../components/company/RelatedCompanies'
import ScoreBadge from '../components/company/ScoreBadge'
import ReliabilityIndicator from '../components/company/ReliabilityIndicator'
import ScoreDisplay from '../components/company/ScoreDisplay'
import RadarChartComponent from '../components/charts/RadarChartComponent'
import { getScoreColor } from '../utils/scoring'
import JsonLd from '../components/seo/JsonLd'
import {
  generateCanonicalUrl,
  generatePageTitle,
  generatePageDescription,
  generateOgpMeta,
  generateOrganizationSchema,
} from '../utils/seo'

// 企業ごとのスコア詳細を確認する画面。
export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>()
  const { company, isLoading, error } = useCompanyById(id)
  const { companies } = useCompanyData()
  const { trackEvent } = useAnalytics()

  // ページ遷移時にスクロール位置をリセット
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  // 企業データ取得後に閲覧イベントを送る。
  // company が切り替わったタイミングだけ記録したいので id を依存配列に使う。
  useEffect(() => {
    if (company) {
      trackEvent({ name: 'company_view', company_name: company.name, happiness_score: company.happinessScore })
    }
  }, [company?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    // スケルトンUI: CLSを抑制するためスピナーではなくレイアウト固定のプレースホルダーを使用
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1 space-y-3">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-16 w-full bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-20 w-20 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-96 animate-pulse" />
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse space-y-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  if (error === 'Company not found' || !company) {
    return <Navigate to="/" replace />
  }

  if (error) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/" className="inline-block text-sm text-green-700 hover:underline mb-6">
          ← 一覧に戻る
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
          データの取得に失敗しました: {error}
        </div>
      </main>
    )
  }

  const scoreColorClass = {
    green: 'text-green-700',
    yellow: 'text-yellow-700',
    red: 'text-red-700',
  }[getScoreColor(company.happinessScore)]

  const pageTitle = generatePageTitle([`${company.name} の幸福度スコア`, 'エンジニア幸福度マップ'])
  const pageDescription = generatePageDescription(
    `${company.name}のエンジニア幸福度スコアは${company.happinessScore}点。技術スタック・リモート率・残業時間・定着率などを詳細分析。`
  )
  const canonicalUrl = generateCanonicalUrl(`/company/${company.id}`)
  const ogp = generateOgpMeta({ title: pageTitle, description: pageDescription, url: canonicalUrl })
  const orgSchema = generateOrganizationSchema({ name: company.name, website: company.website })

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        {/* OGP */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={ogp.title} />
        <meta property="og:description" content={ogp.description} />
        <meta property="og:url" content={ogp.url} />
        <meta property="og:image" content={ogp.image} />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogp.title} />
        <meta name="twitter:description" content={ogp.description} />
        <meta name="twitter:image" content={ogp.image} />
      </Helmet>
      <JsonLd schema={orgSchema} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 一覧から来た文脈を失わないよう、現在地を常に表示する。 */}
        <Breadcrumb
          items={[
            { label: 'ホーム', href: '/' },
            { label: company.name },
          ]}
          className="mb-4"
        />

        {/* 企業の基本情報と幸福度スコアをまとめて見せるヘッダー領域。 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
              <p className="text-gray-500 mt-1 text-sm">
                {company.industry} · {company.location} · 従業員 {company.employeeCount.toLocaleString()}名
              </p>
              {company.website && (
                <p className="text-gray-600 mt-2">
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 hover:text-green-900 hover:underline font-medium"
                  >
                    公式サイト →
                  </a>
                </p>
              )}
              <p className="text-gray-600 mt-4 leading-relaxed">{company.description}</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ScoreBadge score={company.happinessScore} size="lg" />
              <p className={`text-xs font-medium mt-1 ${scoreColorClass}`}>幸福度スコア</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-6">
            {company.tags.map((tag) => (
              <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>

          {/* SNS共有とURLコピーの導線。 */}
          <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-gray-100">
            <span className="text-xs text-gray-400 mr-1">シェア：</span>
            <ShareButtons
              url={canonicalUrl}
              text={`${company.name}のエンジニア幸福度スコアは${company.happinessScore}点！`}
            />
            <CopyUrlButton url={canonicalUrl} />
          </div>

          {/* ソース数と更新時刻から、データの信頼感を補足する。 */}
          <ReliabilityIndicator
            dataSources={company.dataSources}
            dataUpdatedAt={company.dataUpdatedAt}
          />
        </div>

        {/* スコアの全体像と各指標の内訳を上下でなく左右に並べて把握しやすくする。 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 7指標のバランスを俯瞰するレーダーチャート。 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">スコアバランス</h2>
            <div className="h-80">
              <RadarChartComponent company={company} height={320} />
            </div>
          </div>

          {/* 総合スコアと7指標の内訳を一体で表示。 */}
          <ScoreDisplay scores={company.scores} />
        </div>

        {/* 読了の区切りに広告を挿入する。 */}
        <div className="mt-6">
          <AdUnit adSlot="1171228042" minHeight={120} />
        </div>

        {/* 幸福度が近い企業へ横移動できる導線。 */}
        <RelatedCompanies currentCompany={company} allCompanies={companies} />

        {/* 一覧画面で再検索したいユーザー向けの戻り導線。 */}
        <div className="mt-8 p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
          <p>
            <Link to="/#filters" className="text-green-700 hover:underline font-medium">
              他の条件で企業を探す →
            </Link>
            {'　'}リモート率・残業時間・スコアでフィルタリングできます。
          </p>
        </div>
      </main>
    </>
  )
}
