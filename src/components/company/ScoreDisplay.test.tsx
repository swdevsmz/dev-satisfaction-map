import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ScoreDisplay from './ScoreDisplay'
import type { CompanyScores } from '../../types/company'

// Test data
const mockScores: CompanyScores = {
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
}

const mockLowScores: CompanyScores = {
  techStackModernity: 2,
  remoteRate: 10,
  estimatedOvertimeHours: 80,
  turnoverRate: 50,
  retentionRate: 50,
  devEnvironment: 2,
  skillUpSupport: 2,
  happinessScore: 35.2,
  reliabilityScore: 30,
  scoreColor: 'red',
}

const mockMediumScores: CompanyScores = {
  techStackModernity: 5,
  remoteRate: 50,
  estimatedOvertimeHours: 40,
  turnoverRate: 20,
  retentionRate: 80,
  devEnvironment: 5,
  skillUpSupport: 5,
  happinessScore: 52.0,
  reliabilityScore: 50,
  scoreColor: 'yellow',
}

describe('ScoreDisplay', () => {
  describe('総合スコア表示', () => {
    it('幸福度スコアと「/ 100」を表示する', () => {
      render(<ScoreDisplay scores={mockScores} />)
      expect(screen.getByText(/75\.5/)).toBeInTheDocument()
      expect(screen.getByText(/\/ 100/)).toBeInTheDocument()
    })

    it('スコアが70以上の場合、緑色でハイライトされる', () => {
      const { container } = render(<ScoreDisplay scores={mockScores} />)
      const scoreContainer = container.querySelector('[data-testid="happiness-score-container"]')
      expect(scoreContainer).toHaveClass('bg-green-100')
      expect(scoreContainer).toHaveClass('text-green-800')
      expect(scoreContainer).toHaveClass('border-green-200')
    })

    it('スコアが40以上70未満の場合、黄色でハイライトされる', () => {
      const { container } = render(<ScoreDisplay scores={mockMediumScores} />)
      const scoreContainer = container.querySelector('[data-testid="happiness-score-container"]')
      expect(scoreContainer).toHaveClass('bg-yellow-100')
      expect(scoreContainer).toHaveClass('text-yellow-800')
      expect(scoreContainer).toHaveClass('border-yellow-200')
    })

    it('スコアが40未満の場合、赤色でハイライトされる', () => {
      const { container } = render(<ScoreDisplay scores={mockLowScores} />)
      const scoreContainer = container.querySelector('[data-testid="happiness-score-container"]')
      expect(scoreContainer).toHaveClass('bg-red-100')
      expect(scoreContainer).toHaveClass('text-red-800')
      expect(scoreContainer).toHaveClass('border-red-200')
    })

    it('スコア値の小数点第1位を表示する', () => {
      const { rerender } = render(<ScoreDisplay scores={mockScores} />)
      expect(screen.getByText('75.5')).toBeInTheDocument()

      const scoresWithDecimal = { ...mockScores, happinessScore: 42.7 }
      rerender(<ScoreDisplay scores={scoresWithDecimal} />)
      expect(screen.getByText('42.7')).toBeInTheDocument()
    })
  })

  describe('7指標の個別スコア表示', () => {
    it('7つの指標が全て表示される', () => {
      render(<ScoreDisplay scores={mockScores} />)
      expect(screen.getByText('技術スタックの新しさ')).toBeInTheDocument()
      expect(screen.getByText('リモート率')).toBeInTheDocument()
      expect(screen.getByText('月間残業時間')).toBeInTheDocument()
      expect(screen.getByText('離職率')).toBeInTheDocument()
      expect(screen.getByText('定着率')).toBeInTheDocument()
      expect(screen.getByText('開発環境スコア')).toBeInTheDocument()
      expect(screen.getByText('スキルアップ支援')).toBeInTheDocument()
    })

    it('各指標の値が正しい単位で表示される', () => {
      render(<ScoreDisplay scores={mockScores} />)
      // techStackModernity: 8/10
      expect(screen.getByText(/8\s*\/\s*10/)).toBeInTheDocument()
      // remoteRate: 80%
      expect(screen.getByText(/80\s*%/)).toBeInTheDocument()
      // estimatedOvertimeHours: 20時間
      expect(screen.getByText(/20\s*時間/)).toBeInTheDocument()
      // turnoverRate: 5%
      expect(screen.getByText(/5\s*%/)).toBeInTheDocument()
      // retentionRate: 95%
      expect(screen.getByText(/95\s*%/)).toBeInTheDocument()
      // devEnvironment: 9/10
      expect(screen.getByText(/9\s*\/\s*10/)).toBeInTheDocument()
      // skillUpSupport: 8/10
      expect(screen.getByText(/8\s*\/\s*10/)).toBeInTheDocument()
    })

    it('各指標のプログレスバーが表示される', () => {
      const { container } = render(<ScoreDisplay scores={mockScores} />)
      const progressBars = container.querySelectorAll('[data-testid="metric-progress-bar"]')
      expect(progressBars.length).toBe(7)
    })

    it('プログレスバーは正規化スコアに基づいて表示される', () => {
      const { container } = render(<ScoreDisplay scores={mockScores} />)
      const progressBars = container.querySelectorAll('[data-testid="metric-progress-bar"]')

      // Each progress bar should have a width style set
      progressBars.forEach((bar) => {
        const style = (bar as HTMLElement).getAttribute('style')
        expect(style).toMatch(/width:/)
      })
    })

    it('スコアの色分けがプログレスバーに反映される', () => {
      const { container } = render(<ScoreDisplay scores={mockScores} />)
      // Get the first progress bar (techStackModernity = 8, normalized = 77.78 -> green)
      const progressBar = container.querySelector('[data-testid="metric-progress-bar"]') as HTMLElement
      const innerDiv = progressBar?.querySelector('div')
      expect(innerDiv).toHaveClass('bg-green-500')
    })

    it('反転指標（残業時間、離職率）の表示が正しい', () => {
      render(<ScoreDisplay scores={mockScores} />)
      const monthlyOvertimeElement = screen.getByText(/20\s*時間/)
      expect(monthlyOvertimeElement).toBeInTheDocument()
      // Should show "少ないほど良い" label for inverted metrics
      const labels = screen.queryAllByText(/少ないほど良い/)
      expect(labels.length).toBeGreaterThan(0)
    })
  })

  describe('レイアウトと構造', () => {
    it('総合スコアと詳細が構造的に分離されている', () => {
      const { container } = render(<ScoreDisplay scores={mockScores} />)
      const summarySection = container.querySelector('[data-testid="score-summary"]')
      const detailSection = container.querySelector('[data-testid="score-details"]')
      expect(summarySection).toBeInTheDocument()
      expect(detailSection).toBeInTheDocument()
    })

    it('スコアの数値がスケーラブルに表示される', () => {
      const { container } = render(<ScoreDisplay scores={mockScores} />)
      const scoreValue = container.querySelector('[data-testid="happiness-score-value"]') as HTMLElement
      expect(scoreValue?.textContent).toContain('75.5')
      // Should have large font size for prominence
      const styles = window.getComputedStyle(scoreValue)
      const fontSize = parseFloat(styles.fontSize)
      expect(fontSize).toBeGreaterThan(20) // Large font
    })
  })

  describe('エッジケース', () => {
    it('スコアが100の場合、正しく表示される', () => {
      const maxScores = { ...mockScores, happinessScore: 100 }
      render(<ScoreDisplay scores={maxScores} />)
      expect(screen.getByText('100')).toBeInTheDocument()
    })

    it('スコアが0の場合、正しく表示される', () => {
      const minScores = { ...mockScores, happinessScore: 0 }
      render(<ScoreDisplay scores={minScores} />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('指標値が最大値・最小値の場合、プログレスバーが正しく表示される', () => {
      const extremeScores: CompanyScores = {
        techStackModernity: 10,
        remoteRate: 100,
        estimatedOvertimeHours: 0,
        turnoverRate: 0,
        retentionRate: 100,
        devEnvironment: 10,
        skillUpSupport: 10,
        happinessScore: 100,
        reliabilityScore: 100,
        scoreColor: 'green',
      }
      const { container } = render(<ScoreDisplay scores={extremeScores} />)
      const progressBars = container.querySelectorAll('[data-testid="metric-progress-bar"]')
      expect(progressBars.length).toBe(7)
    })
  })
})
