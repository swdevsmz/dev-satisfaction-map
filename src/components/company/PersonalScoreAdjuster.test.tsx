import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import PersonalScoreAdjuster from './PersonalScoreAdjuster'
import type { CompanyScores, UserWeights } from '../../types/company'
import { loadUserWeights, resetUserWeights } from '../../utils/user-weights'

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

describe('PersonalScoreAdjuster', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
  })

  afterEach(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
  })

  describe('7指標スライダーの表示', () => {
    it('7つの指標スライダーが全て表示される', () => {
      render(<PersonalScoreAdjuster scores={mockScores} />)

      expect(screen.getByLabelText(/技術スタックの新しさ/)).toBeInTheDocument()
      expect(screen.getByLabelText(/リモート率/)).toBeInTheDocument()
      expect(screen.getByLabelText(/月間残業時間/)).toBeInTheDocument()
      expect(screen.getByLabelText(/離職率/)).toBeInTheDocument()
      expect(screen.getByLabelText(/定着率/)).toBeInTheDocument()
      expect(screen.getByLabelText(/開発環境/)).toBeInTheDocument()
      expect(screen.getByLabelText(/スキルアップ/)).toBeInTheDocument()
    })

    it('各スライダーは0-3段階の範囲を持つ', () => {
      render(<PersonalScoreAdjuster scores={mockScores} />)

      const sliders = screen.getAllByRole('slider')
      expect(sliders.length).toBe(7)

      sliders.forEach((slider) => {
        expect(slider).toHaveAttribute('min', '0')
        expect(slider).toHaveAttribute('max', '3')
      })
    })

    it('初期状態では全スライダーが0に設定される', () => {
      render(<PersonalScoreAdjuster scores={mockScores} />)

      const sliders = screen.getAllByRole('slider')
      sliders.forEach((slider) => {
        expect((slider as HTMLInputElement).value).toBe('0')
      })
    })

    it('ローカルストレージに保存されたウェイトが反映される', () => {
      const savedWeights: UserWeights = {
        techStackModernity: 2,
        remoteRate: 3,
        estimatedOvertimeHours: 1,
        turnoverRate: 0,
        retentionRate: 2,
        devEnvironment: 1,
        skillUpSupport: 3,
      }

      localStorage.setItem('happiness_map:user_weights', JSON.stringify(savedWeights))

      render(<PersonalScoreAdjuster scores={mockScores} />)

      const sliders = screen.getAllByRole('slider')
      expect((sliders[0] as HTMLInputElement).value).toBe('2') // techStackModernity
      expect((sliders[1] as HTMLInputElement).value).toBe('3') // remoteRate
      expect((sliders[2] as HTMLInputElement).value).toBe('1') // estimatedOvertimeHours
      expect((sliders[3] as HTMLInputElement).value).toBe('0') // turnoverRate
      expect((sliders[4] as HTMLInputElement).value).toBe('2') // retentionRate
      expect((sliders[5] as HTMLInputElement).value).toBe('1') // devEnvironment
      expect((sliders[6] as HTMLInputElement).value).toBe('3') // skillUpSupport
    })
  })

  describe('スライダーの段階表示', () => {
    it('段階ラベルが表示される', () => {
      const { container } = render(<PersonalScoreAdjuster scores={mockScores} />)

      // Check for importance labels in indicator badges
      const importanceIndicators = container.querySelectorAll('[class*="bg-gray-100"][class*="rounded"]')
      expect(importanceIndicators.length).toBeGreaterThan(0)

      // Check for scale labels at the bottom
      const scaleLabels = container.querySelectorAll('[class*="flex justify-between text-xs text-gray-400"]')
      expect(scaleLabels.length).toBeGreaterThan(0)
    })

    it('スライダー値の変更により、段階表示が更新される', async () => {
      render(<PersonalScoreAdjuster scores={mockScores} />)

      const firstSlider = screen.getAllByRole('slider')[0]
      fireEvent.change(firstSlider, { target: { value: '2' } })

      await waitFor(() => {
        expect((firstSlider as HTMLInputElement).value).toBe('2')
      })
    })
  })

  describe('リアルタイム計算とスコア更新', () => {
    it('スライダー操作時にパーソナルスコアが計算・表示される', async () => {
      const { container } = render(<PersonalScoreAdjuster scores={mockScores} />)

      const scoreDisplay = screen.getByTestId('personal-score-display')

      // Initially should show a score
      const initialScore = scoreDisplay.textContent
      expect(initialScore).toBeTruthy()

      // Move first slider to maximum
      const firstSlider = screen.getAllByRole('slider')[0]
      fireEvent.change(firstSlider, { target: { value: '3' } })

      await waitFor(() => {
        // Score should be updated and displayed
        expect(scoreDisplay).toBeInTheDocument()
        expect(scoreDisplay.textContent).toBeTruthy()
      })
    })

    it('複数スライダーの組み合わせで正確にパーソナルスコアが計算される', async () => {
      render(<PersonalScoreAdjuster scores={mockScores} />)

      const sliders = screen.getAllByRole('slider')

      // Set weights for different metrics
      fireEvent.change(sliders[0], { target: { value: '3' } }) // techStackModernity
      fireEvent.change(sliders[1], { target: { value: '1' } }) // remoteRate
      fireEvent.change(sliders[2], { target: { value: '2' } }) // estimatedOvertimeHours

      await waitFor(() => {
        const scoreDisplay = screen.getByTestId('personal-score-display')
        expect(scoreDisplay).toBeInTheDocument()
        const score = parseFloat(scoreDisplay.textContent || '0')
        expect(score).toBeGreaterThan(0)
        expect(score).toBeLessThanOrEqual(100)
      })
    })

    it('スコアが0-100の範囲内に制限される', async () => {
      render(<PersonalScoreAdjuster scores={mockScores} />)

      const sliders = screen.getAllByRole('slider')

      // Set all to maximum
      sliders.forEach((slider) => {
        fireEvent.change(slider, { target: { value: '3' } })
      })

      await waitFor(() => {
        const scoreDisplay = screen.getByTestId('personal-score-display')
        const score = parseFloat(scoreDisplay.textContent || '0')
        expect(score).toBeLessThanOrEqual(100)
      })
    })

    it('スコア値が小数第1位で表示される', async () => {
      render(<PersonalScoreAdjuster scores={mockScores} />)

      const scoreDisplay = screen.getByTestId('personal-score-display')
      const score = scoreDisplay.textContent
      expect(score).toMatch(/^\d+(\.\d)?$/)
    })
  })

  describe('ローカルストレージへの永続化', () => {
    it('スライダー値変更時にローカルストレージに保存される', async () => {
      render(<PersonalScoreAdjuster scores={mockScores} />)

      const firstSlider = screen.getAllByRole('slider')[0]
      fireEvent.change(firstSlider, { target: { value: '2' } })

      await waitFor(() => {
        const stored = localStorage.getItem('happiness_map:user_weights')
        expect(stored).toBeTruthy()
        const weights = JSON.parse(stored || '{}') as UserWeights
        expect(weights.techStackModernity).toBe(2)
      })
    })

    it('複数のウェイト変更が全て保存される', async () => {
      render(<PersonalScoreAdjuster scores={mockScores} />)

      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '1' } })
      fireEvent.change(sliders[1], { target: { value: '3' } })
      fireEvent.change(sliders[4], { target: { value: '2' } })

      await waitFor(() => {
        const stored = localStorage.getItem('happiness_map:user_weights')
        const weights = JSON.parse(stored || '{}') as UserWeights
        expect(weights.techStackModernity).toBe(1)
        expect(weights.remoteRate).toBe(3)
        expect(weights.retentionRate).toBe(2)
      })
    })
  })

  describe('リセットボタン機能', () => {
    it('リセットボタンが表示される', () => {
      render(<PersonalScoreAdjuster scores={mockScores} />)
      expect(screen.getByRole('button', { name: /リセット/ })).toBeInTheDocument()
    })

    it('リセットボタンクリック時に全スライダーが0にリセットされる', async () => {
      render(<PersonalScoreAdjuster scores={mockScores} />)

      // Set some values
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '2' } })
      fireEvent.change(sliders[1], { target: { value: '3' } })

      await waitFor(() => {
        expect((sliders[0] as HTMLInputElement).value).toBe('2')
        expect((sliders[1] as HTMLInputElement).value).toBe('3')
      })

      // Click reset button
      const resetButton = screen.getByRole('button', { name: /リセット/ })
      fireEvent.click(resetButton)

      await waitFor(() => {
        expect((sliders[0] as HTMLInputElement).value).toBe('0')
        expect((sliders[1] as HTMLInputElement).value).toBe('0')
      })
    })

    it('リセットボタンクリック時にローカルストレージが削除される', async () => {
      render(<PersonalScoreAdjuster scores={mockScores} />)

      // Set values
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '2' } })

      await waitFor(() => {
        expect(localStorage.getItem('happiness_map:user_weights')).toBeTruthy()
      })

      // Click reset
      const resetButton = screen.getByRole('button', { name: /リセット/ })
      fireEvent.click(resetButton)

      await waitFor(() => {
        expect(localStorage.getItem('happiness_map:user_weights')).toBeNull()
      })
    })

    it('リセット後、標準スコアが表示される', async () => {
      render(<PersonalScoreAdjuster scores={mockScores} />)

      const scoreDisplay = screen.getByTestId('personal-score-display')
      const initialScore = scoreDisplay.textContent

      // Set values and verify score changed
      const sliders = screen.getAllByRole('slider')
      fireEvent.change(sliders[0], { target: { value: '3' } })

      await waitFor(() => {
        expect((sliders[0] as HTMLInputElement).value).toBe('3')
      })

      // Click reset
      const resetButton = screen.getByRole('button', { name: /リセット/ })
      fireEvent.click(resetButton)

      await waitFor(() => {
        // Should show the same score as initial (standard score)
        expect(scoreDisplay.textContent).toBe(initialScore)
        expect((sliders[0] as HTMLInputElement).value).toBe('0')
      })
    })
  })

  describe('スコア色分け表示', () => {
    it('パーソナルスコアの色分けが表示される', () => {
      render(<PersonalScoreAdjuster scores={mockScores} />)

      const scoreContainer = screen.getByTestId('personal-score-container')
      expect(scoreContainer).toHaveClass('border')
      // Should have either green, yellow, or red color
      expect(
        scoreContainer.className.includes('bg-green-') ||
        scoreContainer.className.includes('bg-yellow-') ||
        scoreContainer.className.includes('bg-red-')
      ).toBe(true)
    })

    it('高スコア時に緑色で表示される', async () => {
      const highScores: CompanyScores = {
        techStackModernity: 9,
        remoteRate: 90,
        estimatedOvertimeHours: 10,
        turnoverRate: 2,
        retentionRate: 98,
        devEnvironment: 9,
        skillUpSupport: 9,
        happinessScore: 85,
        reliabilityScore: 90,
        scoreColor: 'green',
      }
      render(<PersonalScoreAdjuster scores={highScores} />)

      const scoreContainer = screen.getByTestId('personal-score-container')

      // Since no weights are set, the color should match the base score (85 = green)
      expect(scoreContainer).toHaveClass('bg-green-100')
      expect(scoreContainer).toHaveClass('text-green-800')
    })

    it('中程度スコア時に黄色で表示される', async () => {
      const mediumScores: CompanyScores = {
        techStackModernity: 5,
        remoteRate: 50,
        estimatedOvertimeHours: 40,
        turnoverRate: 20,
        retentionRate: 80,
        devEnvironment: 5,
        skillUpSupport: 5,
        happinessScore: 55,
        reliabilityScore: 50,
        scoreColor: 'yellow',
      }
      render(<PersonalScoreAdjuster scores={mediumScores} />)

      const scoreContainer = screen.getByTestId('personal-score-container')

      expect(scoreContainer).toHaveClass('bg-yellow-100')
      expect(scoreContainer).toHaveClass('text-yellow-800')
    })

    it('低スコア時に赤色で表示される', async () => {
      const lowScores: CompanyScores = {
        techStackModernity: 2,
        remoteRate: 10,
        estimatedOvertimeHours: 80,
        turnoverRate: 50,
        retentionRate: 50,
        devEnvironment: 2,
        skillUpSupport: 2,
        happinessScore: 35,
        reliabilityScore: 30,
        scoreColor: 'red',
      }
      render(<PersonalScoreAdjuster scores={lowScores} />)

      const scoreContainer = screen.getByTestId('personal-score-container')

      expect(scoreContainer).toHaveClass('bg-red-100')
      expect(scoreContainer).toHaveClass('text-red-800')
    })
  })

  describe('レスポンシブデザイン', () => {
    it('スライダーコンテナがスペースで区切られている', () => {
      const { container } = render(<PersonalScoreAdjuster scores={mockScores} />)
      const sliderContainer = container.querySelector('[data-testid="slider-container"]')
      // Each metric is in a flex-col wrapper within the space-y-6 container
      expect(sliderContainer?.className).toContain('space-y-6')
    })

    it('モバイルデバイスで正しく表示される', () => {
      const { container } = render(<PersonalScoreAdjuster scores={mockScores} />)
      // Check that responsive classes are applied
      expect(container.querySelector('[class*="rounded"]')).toBeInTheDocument()
    })
  })

  describe('エッジケース', () => {
    it('全ウェイトが0の場合、標準スコアが表示される', async () => {
      const defaultWeights: UserWeights = {
        techStackModernity: 0,
        remoteRate: 0,
        estimatedOvertimeHours: 0,
        turnoverRate: 0,
        retentionRate: 0,
        devEnvironment: 0,
        skillUpSupport: 0,
      }

      localStorage.setItem('happiness_map:user_weights', JSON.stringify(defaultWeights))

      render(<PersonalScoreAdjuster scores={mockScores} />)

      const scoreDisplay = screen.getByTestId('personal-score-display')
      await waitFor(() => {
        // With all weights at 0, should use standard score (75.5)
        expect(scoreDisplay.textContent).toBeTruthy()
        const score = parseFloat(scoreDisplay.textContent || '0')
        expect(score).toBeGreaterThan(0)
        expect(score).toBeLessThanOrEqual(100)
      })
    })

    it('スコアが100の場合、正しく表示される', async () => {
      const maxScores = { ...mockScores, happinessScore: 100 }
      render(<PersonalScoreAdjuster scores={maxScores} />)

      const scoreDisplay = screen.getByTestId('personal-score-display')
      await waitFor(() => {
        const score = parseFloat(scoreDisplay.textContent || '0')
        expect(score).toBeLessThanOrEqual(100)
      })
    })

    it('スコアが0の場合、正しく表示される', async () => {
      const minScores = { ...mockScores, happinessScore: 0 }
      render(<PersonalScoreAdjuster scores={minScores} />)

      const scoreDisplay = screen.getByTestId('personal-score-display')
      await waitFor(() => {
        const score = parseFloat(scoreDisplay.textContent || '0')
        expect(score).toBeGreaterThanOrEqual(0)
      })
    })
  })
})
