import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ScoreDisplay from './ScoreDisplay'
import type { CompanyScores } from '../../types/company'

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

describe('ScoreDisplay minimal', () => {
  it('renders without crashing', () => {
    const { container } = render(<ScoreDisplay scores={mockScores} />)
    expect(container).toBeDefined()
  })
})
