import { Helmet } from 'react-helmet-async'
import { useCompanyData } from '../hooks/useCompanyData'
import { usePersonalWeights } from '../hooks/usePersonalWeights'
import { calculatePersonalScore } from '../utils/scoring'
import CompanyCard from '../components/company/CompanyCard'
import RadarChartComponent from '../components/charts/RadarChartComponent'
import ComparisonBarChart from '../components/charts/ComparisonBarChart'
import PersonalWeightPanel from '../components/filter/PersonalWeightPanel'

export default function Home() {
  const { companies, ranked, selectedId, setSelectedId, selectedCompany, isLoading, error } = useCompanyData()
  const { weights, updateWeight, resetWeights, isPersonalized, sortByPersonal } = usePersonalWeights()

  const displayList = isPersonalized ? sortByPersonal(companies) : companies
  const rankedList  = isPersonalized ? sortByPersonal(ranked)    : ranked

  return (
    <>
      <Helmet>
        <title>エンジニア幸福度マップ | エンジニアが輝ける会社を探そう</title>
        <meta
          name="description"
          content="技術スタック・リモート率・残業時間・定着率などを独自スコアで可視化。エンジニア転職で本当に良い会社を見つけよう。"
        />
      </Helmet>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            エンジニア幸福度マップ
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            求人データから読み解く、エンジニアが幸せに働ける会社ランキング
          </p>
        </section>

        {isLoading && (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
            データの取得に失敗しました: {error}
          </div>
        )}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Personal filter + Company cards */}
            <div className="lg:col-span-2">
              <PersonalWeightPanel
                weights={weights}
                isPersonalized={isPersonalized}
                onUpdate={updateWeight}
                onReset={resetWeights}
              />

              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">企業一覧</h2>
                <span className="text-xs text-gray-400">
                  {isPersonalized ? '🎯 マッチ度順' : '🏆 幸福度スコア順'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayList.map((company) => (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    isSelected={selectedId === company.id}
                    onClick={() => setSelectedId(company.id)}
                    personalScore={
                      isPersonalized
                        ? calculatePersonalScore(company.scores, weights)
                        : undefined
                    }
                  />
                ))}
              </div>
            </div>

            {/* Right: Charts panel */}
            <div className="space-y-6">
              {selectedCompany && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    {selectedCompany.name}
                  </h2>
                  <p className="text-xs text-gray-400 mb-4">スコアバランス（カードをクリックで切替）</p>
                  <div className="h-72">
                    <RadarChartComponent company={selectedCompany} height={288} />
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                  {isPersonalized ? 'マッチ度ランキング' : '幸福度ランキング'}
                </h2>
                <ComparisonBarChart companies={rankedList} />
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
