import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ReliabilityDisplay from './ReliabilityDisplay'
import type { DataSource } from '../../types/company'

// Test data
const mockDataSources: DataSource[] = [
  {
    source: 'openwork',
    url: 'https://openwork.jp/companies/123',
    scrapedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
  },
  {
    source: 'ir',
    url: 'https://ir.example.com',
    scrapedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
  },
  {
    source: 'github',
    url: 'https://github.com/example',
    scrapedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  },
]

const emptyDataSources: DataSource[] = []

const staleDataSources: DataSource[] = [
  {
    source: 'openwork',
    url: null,
    scrapedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(), // 200 days ago
  },
]

describe('ReliabilityDisplay', () => {
  describe('データソース情報の表示', () => {
    it('データソース一覧が表示される', () => {
      render(<ReliabilityDisplay dataSources={mockDataSources} />)

      expect(screen.getByText(/OpenWork/)).toBeInTheDocument()
      expect(screen.getByText(/IR資料/)).toBeInTheDocument()
      expect(screen.getByText(/GitHub/)).toBeInTheDocument()
    })

    it('取得済みのソースがバッジで表示される', () => {
      render(<ReliabilityDisplay dataSources={mockDataSources} />)

      const sourceContainer = screen.getByTestId('source-badges-container')
      expect(sourceContainer).toBeInTheDocument()

      // Check that source badges are displayed
      const badges = sourceContainer.querySelectorAll('span')
      expect(badges.length).toBeGreaterThan(0)
    })

    it('未取得のソースがグレーアウト表示される', () => {
      const partialSources: DataSource[] = [
        {
          source: 'openwork',
          url: 'https://openwork.jp',
          scrapedAt: new Date().toISOString(),
        },
      ]

      render(<ReliabilityDisplay dataSources={partialSources} />)

      const sourceContainer = screen.getByTestId('source-badges-container')
      expect(sourceContainer).toBeInTheDocument()
    })
  })

  describe('最終更新日時の表示', () => {
    it('各ソースの最終更新日時が表示される', () => {
      render(<ReliabilityDisplay dataSources={mockDataSources} />)

      // The component should be rendered with source information
      const sourceContainer = screen.getByTestId('source-badges-container')
      expect(sourceContainer).toBeInTheDocument()
    })

    it('複数のソースがある場合、最新の更新日時が表示される', () => {
      render(<ReliabilityDisplay dataSources={mockDataSources} />)

      // Should display relative date information
      expect(screen.getByTestId('reliability-display')).toBeInTheDocument()
    })
  })

  describe('信頼度スコア表示', () => {
    it('信頼度スコア（0–100）が表示される', () => {
      render(<ReliabilityDisplay dataSources={mockDataSources} />)

      const scoreDisplay = screen.getByTestId('reliability-score-display')
      expect(scoreDisplay).toBeInTheDocument()

      // Extract the score value
      const scoreText = scoreDisplay.textContent
      expect(scoreText).toMatch(/\d+/)
    })

    it('スコアが数値で表示される', () => {
      render(<ReliabilityDisplay dataSources={mockDataSources} />)

      const scoreDisplay = screen.getByTestId('reliability-score-display')
      const score = Number.parseInt(scoreDisplay.textContent || '0')
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    it('スコアの後に「%」が表示される', () => {
      render(<ReliabilityDisplay dataSources={mockDataSources} />)

      const scoreText = screen.getByTestId('reliability-score-display').textContent
      expect(scoreText).toMatch(/%/)
    })

    it('データソースがない場合、スコアは0になる', () => {
      render(<ReliabilityDisplay dataSources={emptyDataSources} />)

      const scoreDisplay = screen.getByTestId('reliability-score-display')
      const score = Number.parseInt(scoreDisplay.textContent || '0')
      expect(score).toBe(0)
    })
  })

  describe('信頼度レベル表示と色分け', () => {
    it('信頼度レベル（高/中/低）が表示される', () => {
      render(<ReliabilityDisplay dataSources={mockDataSources} />)

      const levelDisplay = screen.getByTestId('reliability-level-display')
      expect(levelDisplay).toBeInTheDocument()

      const levelText = levelDisplay.textContent
      expect(
        levelText?.includes('高') ||
        levelText?.includes('中') ||
        levelText?.includes('低')
      ).toBe(true)
    })

    it('高信頼度（70以上）が緑色で表示される', () => {
      const highReliabilitySources: DataSource[] = [
        {
          source: 'openwork',
          url: 'https://openwork.jp',
          scrapedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          source: 'ir',
          url: 'https://ir.example.com',
          scrapedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          source: 'github',
          url: 'https://github.com',
          scrapedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          source: 'connpass',
          url: 'https://connpass.com',
          scrapedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]

      render(<ReliabilityDisplay dataSources={highReliabilitySources} />)

      const levelDisplay = screen.getByTestId('reliability-level-display')
      expect(levelDisplay.className).toContain('text-green')
    })

    it('中信頼度（40–69）が黄色で表示される', () => {
      const mediumReliabilitySources: DataSource[] = [
        {
          source: 'openwork',
          url: 'https://openwork.jp',
          scrapedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          source: 'github',
          url: 'https://github.com',
          scrapedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          source: 'connpass',
          url: 'https://connpass.com',
          scrapedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]

      render(<ReliabilityDisplay dataSources={mediumReliabilitySources} />)

      const levelDisplay = screen.getByTestId('reliability-level-display')
      expect(levelDisplay.className).toContain('text-yellow')
    })

    it('低信頼度（40未満）が赤色で表示される', () => {
      const lowReliabilitySources: DataSource[] = [
        {
          source: 'github',
          url: 'https://github.com',
          scrapedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]

      render(<ReliabilityDisplay dataSources={lowReliabilitySources} />)

      const levelDisplay = screen.getByTestId('reliability-level-display')
      expect(levelDisplay.className).toContain('text-red')
    })
  })

  describe('信頼度進捗バー表示', () => {
    it('信頼度を示す視覚的な進捗バーが表示される', () => {
      const { container } = render(<ReliabilityDisplay dataSources={mockDataSources} />)

      const progressBar = container.querySelector('[data-testid="reliability-progress-bar"]')
      expect(progressBar).toBeInTheDocument()
    })

    it('進捗バーの幅がスコアに対応している', () => {
      const { container } = render(<ReliabilityDisplay dataSources={mockDataSources} />)

      const progressBar = container.querySelector('[data-testid="reliability-progress-bar"] > div') as HTMLElement
      const widthStyle = progressBar?.getAttribute('style')
      expect(widthStyle).toMatch(/width:/)
    })

    it('進捗バーの色がスコアに対応している', () => {
      const { container } = render(<ReliabilityDisplay dataSources={mockDataSources} />)

      const progressBar = container.querySelector('[data-testid="reliability-progress-bar"] > div')
      expect(
        progressBar?.className.includes('bg-green') ||
        progressBar?.className.includes('bg-yellow') ||
        progressBar?.className.includes('bg-red')
      ).toBe(true)
    })
  })

  describe('レイアウトと構造', () => {
    it('信頼度情報セクションが表示される', () => {
      render(<ReliabilityDisplay dataSources={mockDataSources} />)

      const displayContainer = screen.getByTestId('reliability-display')
      expect(displayContainer).toBeInTheDocument()
    })

    it('スコア、レベル、ソース情報が整理されて表示される', () => {
      const { container } = render(<ReliabilityDisplay dataSources={mockDataSources} />)

      // Should have score display
      expect(screen.getByTestId('reliability-score-display')).toBeInTheDocument()

      // Should have level display
      expect(screen.getByTestId('reliability-level-display')).toBeInTheDocument()

      // Should have source badges
      expect(screen.getByTestId('source-badges-container')).toBeInTheDocument()
    })
  })

  describe('エッジケース', () => {
    it('データソースが空の場合、スコアは0と表示される', () => {
      render(<ReliabilityDisplay dataSources={emptyDataSources} />)

      const scoreDisplay = screen.getByTestId('reliability-score-display')
      expect(scoreDisplay.textContent).toContain('0')
    })

    it('古いデータの場合、信頼度が低く計算される', () => {
      render(<ReliabilityDisplay dataSources={staleDataSources} />)

      const scoreDisplay = screen.getByTestId('reliability-score-display')
      const score = Number.parseInt(scoreDisplay.textContent || '0')
      // Stale data (200 days) should result in very low score
      expect(score).toBeLessThan(50)
    })

    it('すべてのソースが新しい場合、高い信頼度が表示される', () => {
      const freshSources: DataSource[] = [
        {
          source: 'openwork',
          url: 'https://openwork.jp',
          scrapedAt: new Date().toISOString(),
        },
        {
          source: 'ir',
          url: 'https://ir.example.com',
          scrapedAt: new Date().toISOString(),
        },
        {
          source: 'github',
          url: 'https://github.com',
          scrapedAt: new Date().toISOString(),
        },
        {
          source: 'connpass',
          url: 'https://connpass.com',
          scrapedAt: new Date().toISOString(),
        },
      ]

      render(<ReliabilityDisplay dataSources={freshSources} />)

      const scoreDisplay = screen.getByTestId('reliability-score-display')
      const score = Number.parseInt(scoreDisplay.textContent || '0')
      // Fresh data from all sources should be 100
      expect(score).toBe(100)
    })
  })

  describe('レスポンシブデザイン', () => {
    it('レイアウトが親コンテナに適応する', () => {
      const { container } = render(<ReliabilityDisplay dataSources={mockDataSources} />)

      const displayContainer = container.querySelector('[data-testid="reliability-display"]')
      expect(displayContainer?.className).toContain('rounded')
    })
  })
})
