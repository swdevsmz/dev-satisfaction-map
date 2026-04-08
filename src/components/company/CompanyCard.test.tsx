import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import CompanyCard from './CompanyCard'
import type { Company } from '../../types/company'

// Test data
const mockCompany: Company = {
  id: 'mercari-jp',
  name: 'メルカリ',
  description: 'オンラインマーケットプレイスのエキスパート',
  industry: 'IT・テクノロジー',
  employeeCount: 500,
  location: '東京',
  scores: {
    techStackModernity: 8,
    remoteRate: 80,
    estimatedOvertimeHours: 20,
    turnoverRate: 5,
    retentionRate: 95,
    devEnvironment: 9,
    skillUpSupport: 8,
    happinessScore: 75.5,
    reliabilityScore: 85,
    scoreColor: 'green',
  },
  happinessScore: 75.5,
  tags: ['スタートアップ', 'React', 'TypeScript'],
  dataUpdatedAt: new Date().toISOString(),
  website: 'https://www.mercari.com',
}

// Wrapper for router
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('CompanyCard', () => {
  describe('基本情報の表示', () => {
    it('企業名が表示される', () => {
      render(<CompanyCard company={mockCompany} isSelected={false} onClick={() => {}} />, {
        wrapper: Wrapper,
      })

      expect(screen.getByText('メルカリ')).toBeInTheDocument()
    })

    it('企業の説明文が表示される', () => {
      render(<CompanyCard company={mockCompany} isSelected={false} onClick={() => {}} />, {
        wrapper: Wrapper,
      })

      expect(screen.getByText(/オンラインマーケットプレイスのエキスパート/)).toBeInTheDocument()
    })

    it('業種、所在地、従業員数が表示される', () => {
      render(<CompanyCard company={mockCompany} isSelected={false} onClick={() => {}} />, {
        wrapper: Wrapper,
      })

      expect(screen.getByText(/IT・テクノロジー/)).toBeInTheDocument()
      expect(screen.getByText(/東京/)).toBeInTheDocument()
      expect(screen.getByText(/500名/)).toBeInTheDocument()
    })

    it('公式サイトリンクが表示される', () => {
      render(<CompanyCard company={mockCompany} isSelected={false} onClick={() => {}} />, {
        wrapper: Wrapper,
      })

      const officialSiteLink = screen.getByRole('link', { name: /公式サイト/ })
      expect(officialSiteLink).toHaveAttribute('href', 'https://www.mercari.com')
      expect(officialSiteLink).toHaveAttribute('target', '_blank')
    })

    it('タグが表示される', () => {
      render(<CompanyCard company={mockCompany} isSelected={false} onClick={() => {}} />, {
        wrapper: Wrapper,
      })

      mockCompany.tags.forEach((tag) => {
        expect(screen.getByText(tag)).toBeInTheDocument()
      })
    })

    it('詳細ページへのリンクが表示される', () => {
      render(<CompanyCard company={mockCompany} isSelected={false} onClick={() => {}} />, {
        wrapper: Wrapper,
      })

      const detailLink = screen.getByRole('link', { name: /詳細を見る/ })
      expect(detailLink).toHaveAttribute('href', `/company/${mockCompany.id}`)
    })
  })

  describe('スコア表示', () => {
    it('スタンダードスコアが表示される（personalScoreが未定義）', () => {
      render(<CompanyCard company={mockCompany} isSelected={false} onClick={() => {}} />, {
        wrapper: Wrapper,
      })

      // Should display the standard happiness score
      expect(screen.getByText(/75.5/)).toBeInTheDocument()
    })

    it('パーソナルスコアが表示される（personalScoreが定義される）', () => {
      const personalScore = 82.3

      render(
        <CompanyCard
          company={mockCompany}
          isSelected={false}
          onClick={() => {}}
          personalScore={personalScore}
        />,
        {
          wrapper: Wrapper,
        }
      )

      expect(screen.getByText(/82.3/)).toBeInTheDocument()
    })

    it('パーソナルスコア表示時に「マッチ度」ラベルが表示される', () => {
      render(
        <CompanyCard
          company={mockCompany}
          isSelected={false}
          onClick={() => {}}
          personalScore={82.3}
        />,
        {
          wrapper: Wrapper,
        }
      )

      expect(screen.getByText(/マッチ度/)).toBeInTheDocument()
    })

    it('スタンダードスコア表示時に「マッチ度」ラベルが表示されない', () => {
      render(<CompanyCard company={mockCompany} isSelected={false} onClick={() => {}} />, {
        wrapper: Wrapper,
      })

      expect(screen.queryByText(/マッチ度/)).not.toBeInTheDocument()
    })
  })

  describe('スコア色分け表示', () => {
    it('スコアが70以上の場合、スコアバッジが緑色で表示される', () => {
      const { container } = render(
        <CompanyCard company={mockCompany} isSelected={false} onClick={() => {}} />,
        {
          wrapper: Wrapper,
        }
      )

      // The ScoreBadge should be rendered with green colors
      const scoreBadges = container.querySelectorAll('[class*="bg-green"]')
      expect(scoreBadges.length).toBeGreaterThan(0)
    })

    it('スコアが40-69の場合、スコアバッジが黄色で表示される', () => {
      const yellowCompany = {
        ...mockCompany,
        happinessScore: 55,
        scores: {
          ...mockCompany.scores,
          happinessScore: 55,
          scoreColor: 'yellow' as const,
        },
      }

      const { container } = render(
        <CompanyCard company={yellowCompany} isSelected={false} onClick={() => {}} />,
        {
          wrapper: Wrapper,
        }
      )

      const scoreBadges = container.querySelectorAll('[class*="bg-yellow"]')
      expect(scoreBadges.length).toBeGreaterThan(0)
    })

    it('スコアが40未満の場合、スコアバッジが赤色で表示される', () => {
      const redCompany = {
        ...mockCompany,
        happinessScore: 35,
        scores: {
          ...mockCompany.scores,
          happinessScore: 35,
          scoreColor: 'red' as const,
        },
      }

      const { container } = render(
        <CompanyCard company={redCompany} isSelected={false} onClick={() => {}} />,
        {
          wrapper: Wrapper,
        }
      )

      const scoreBadges = container.querySelectorAll('[class*="bg-red"]')
      expect(scoreBadges.length).toBeGreaterThan(0)
    })
  })

  describe('カード選択状態', () => {
    it('未選択状態ではカード背景が白色', () => {
      const { container } = render(
        <CompanyCard company={mockCompany} isSelected={false} onClick={() => {}} />,
        {
          wrapper: Wrapper,
        }
      )

      const card = container.querySelector('[class*="bg-white"]')
      expect(card?.className).toContain('border-gray-200')
    })

    it('選択状態ではカード背景が緑色に変わる', () => {
      const { container } = render(
        <CompanyCard company={mockCompany} isSelected={true} onClick={() => {}} />,
        {
          wrapper: Wrapper,
        }
      )

      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('border-green-500')
      expect(card.className).toContain('ring-green-500')
    })

    it('選択状態の表示にホバーエフェクトが適用される', () => {
      const { container } = render(
        <CompanyCard company={mockCompany} isSelected={true} onClick={() => {}} />,
        {
          wrapper: Wrapper,
        }
      )

      const card = container.firstChild as HTMLElement
      expect(card.className).toContain('shadow-md')
    })
  })

  describe('ユーザーインタラクション', () => {
    it('カードをクリックするとonClickコールバックが呼ばれる', () => {
      const handleClick = vi.fn()

      const { container } = render(
        <CompanyCard company={mockCompany} isSelected={false} onClick={handleClick} />,
        {
          wrapper: Wrapper,
        }
      )

      const card = container.firstChild as HTMLElement
      fireEvent.click(card)

      expect(handleClick).toHaveBeenCalled()
    })

    it('公式サイトリンククリック時はカード選択が切り替わらない', () => {
      const handleClick = vi.fn()

      render(
        <CompanyCard company={mockCompany} isSelected={false} onClick={handleClick} />,
        {
          wrapper: Wrapper,
        }
      )

      const officialSiteLink = screen.getByRole('link', { name: /公式サイト/ })
      fireEvent.click(officialSiteLink)

      // onClick should not be called (stopPropagation should prevent it)
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('詳細ページリンククリック時はカード選択が切り替わらない', () => {
      const handleClick = vi.fn()

      render(
        <CompanyCard company={mockCompany} isSelected={false} onClick={handleClick} />,
        {
          wrapper: Wrapper,
        }
      )

      const detailLink = screen.getByRole('link', { name: /詳細を見る/ })
      fireEvent.click(detailLink)

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('レスポンシブデザイン', () => {
    it('カードが正しいレイアウトクラスを持つ', () => {
      const { container } = render(
        <CompanyCard company={mockCompany} isSelected={false} onClick={() => {}} />,
        {
          wrapper: Wrapper,
        }
      )

      const card = container.firstChild
      expect(card?.className).toContain('rounded-2xl')
      expect(card?.className).toContain('p-5')
    })
  })

  describe('データ更新日時の表示', () => {
    it('更新日時が表示される', () => {
      const recentDate = new Date()
      const companyWithDate = {
        ...mockCompany,
        dataUpdatedAt: recentDate.toISOString(),
      }

      render(<CompanyCard company={companyWithDate} isSelected={false} onClick={() => {}} />, {
        wrapper: Wrapper,
      })

      // Should display some relative date
      expect(screen.getByText(/更新:/)).toBeInTheDocument()
    })
  })

  describe('公式サイトURL未設定時', () => {
    it('公式サイトリンクが表示されない', () => {
      const companyWithoutWebsite = {
        ...mockCompany,
        website: undefined,
      }

      render(
        <CompanyCard company={companyWithoutWebsite} isSelected={false} onClick={() => {}} />,
        {
          wrapper: Wrapper,
        }
      )

      expect(screen.queryByRole('link', { name: /公式サイト/ })).not.toBeInTheDocument()
    })
  })

  describe('エッジケース', () => {
    it('スコアが100の場合、正しく表示される', () => {
      const maxScoreCompany = {
        ...mockCompany,
        happinessScore: 100,
        scores: {
          ...mockCompany.scores,
          happinessScore: 100,
        },
      }

      render(
        <CompanyCard company={maxScoreCompany} isSelected={false} onClick={() => {}} />,
        {
          wrapper: Wrapper,
        }
      )

      expect(screen.getByText(/100/)).toBeInTheDocument()
    })

    it('スコアが0の場合、正しく表示される', () => {
      const minScoreCompany = {
        ...mockCompany,
        happinessScore: 0,
        scores: {
          ...mockCompany.scores,
          happinessScore: 0,
          scoreColor: 'red' as const,
        },
      }

      render(
        <CompanyCard company={minScoreCompany} isSelected={false} onClick={() => {}} />,
        {
          wrapper: Wrapper,
        }
      )

      expect(screen.getByText(/0\.0/)).toBeInTheDocument()
    })

    it('パーソナルスコアが0の場合、正しく表示される', () => {
      render(
        <CompanyCard company={mockCompany} isSelected={false} onClick={() => {}} personalScore={0} />,
        {
          wrapper: Wrapper,
        }
      )

      expect(screen.getByText(/0\.0/)).toBeInTheDocument()
      expect(screen.getByText(/マッチ度/)).toBeInTheDocument()
    })

    it('パーソナルスコアが100の場合、正しく表示される', () => {
      render(
        <CompanyCard company={mockCompany} isSelected={false} onClick={() => {}} personalScore={100} />,
        {
          wrapper: Wrapper,
        }
      )

      expect(screen.getByText(/100/)).toBeInTheDocument()
      expect(screen.getByText(/マッチ度/)).toBeInTheDocument()
    })
  })
})
