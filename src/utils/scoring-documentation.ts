/**
 * Scoring System - Implementation Documentation
 *
 * This module documents the complete scoring calculation pipeline used in the
 * engineer happiness map application. All calculations follow a standardized
 * normalization pattern to ensure consistency and maintainability.
 */

import type { CompanyScores, UserWeights } from '../types/company'

/**
 * WEIGHTS CONFIGURATION
 *
 * All weights sum to exactly 1.00 for consistent application across scoring.
 * This configuration is the single source of truth for weight distribution.
 *
 * @const WEIGHTS
 * @property {number} techStackModernity 0.20 - Modern tech stack adoption (20%)
 * @property {number} remoteRate 0.20 - Remote work support (20%)
 * @property {number} estimatedOvertimeHours 0.20 - Work-life balance (20%)
 * @property {number} turnoverRate 0.10 - Employee retention (10%)
 * @property {number} retentionRate 0.10 - Long-term stability (10%)
 * @property {number} devEnvironment 0.10 - Development tools/infrastructure (10%)
 * @property {number} skillUpSupport 0.10 - Learning & growth support (10%)
 *
 * Total: 1.00 (verified with tolerance ±0.01)
 *
 * @example
 * // Verify weight sum
 * const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0)
 * console.assert(sum >= 0.99 && sum <= 1.01, 'Weight sum out of range')
 */
export const WEIGHTS_DOCUMENTATION = {
  description: 'Weight configuration for happiness score calculation',
  version: '1.0',
  lastUpdated: '2026-04-08',
  weights: {
    techStackModernity: 0.20,
    remoteRate: 0.20,
    estimatedOvertimeHours: 0.20,
    turnoverRate: 0.10,
    retentionRate: 0.10,
    devEnvironment: 0.10,
    skillUpSupport: 0.10,
  },
} as const

/**
 * NORMALIZATION FUNCTIONS
 *
 * All indicators are normalized to a 0-100 scale using standardized patterns.
 * This ensures consistent handling and allows for direct comparisons.
 *
 * Three normalization patterns are used:
 * 1. Scale Conversion: Convert bounded scales (1-10) to 0-100
 * 2. Direct Percentage: Use percentage values as-is (0-100)
 * 3. Reverse/Inverse: Invert values where "less is better"
 */

/**
 * NORMALIZATION PATTERN 1: Scale Conversion (1-10 → 0-100)
 *
 * Used for: techStackModernity, devEnvironment, skillUpSupport
 * Formula: ((score - 1) / 9) * 100
 *
 * Rationale:
 * - Input range is 1-10 (9-point scale)
 * - Subtract 1 to convert to 0-9 range
 * - Divide by 9 to normalize to 0-1
 * - Multiply by 100 to get 0-100 scale
 *
 * @example
 * normalize1To10(1) = 0      // Minimum (1-1)/9*100 = 0
 * normalize1To10(5.5) = 50   // Midpoint (5.5-1)/9*100 = 50
 * normalize1To10(10) = 100   // Maximum (10-1)/9*100 = 100
 *
 * Edge case: Decimal values handled naturally
 * normalize1To10(6.5) = 61.1  // Precise calculation
 */
export const NORMALIZE_1_TO_10_DOCUMENTATION = {
  pattern: 'Scale Conversion',
  formula: '((score - 1) / 9) * 100',
  inputRange: [1, 10],
  outputRange: [0, 100],
  indicators: [
    'techStackModernity',
    'devEnvironment',
    'skillUpSupport',
  ],
  testCases: [
    { input: 1, expected: 0 },
    { input: 5.5, expected: 50 },
    { input: 10, expected: 100 },
    { input: 6.5, expected: 61.1 },
  ],
} as const

/**
 * NORMALIZATION PATTERN 2: Direct Percentage (0-100)
 *
 * Used for: remoteRate, retentionRate
 * Formula: value (no transformation)
 *
 * Rationale:
 * - Input is already a percentage (0-100)
 * - No transformation needed
 * - Direct mapping maintains precision
 *
 * @example
 * normalizePercent(0) = 0      // Minimum
 * normalizePercent(50) = 50    // Midpoint
 * normalizePercent(100) = 100  // Maximum
 *
 * Edge case: Decimal percentages preserved
 * normalizePercent(33.3) = 33.3
 */
export const NORMALIZE_PERCENT_DOCUMENTATION = {
  pattern: 'Direct Percentage',
  formula: 'value',
  inputRange: [0, 100],
  outputRange: [0, 100],
  indicators: ['remoteRate', 'retentionRate'],
  testCases: [
    { input: 0, expected: 0 },
    { input: 50, expected: 50 },
    { input: 100, expected: 100 },
  ],
} as const

/**
 * NORMALIZATION PATTERN 3: Reverse/Inverse (Less is Better)
 *
 * Used for: estimatedOvertimeHours (baseline: 80h), turnoverRate (baseline: 100%)
 * Formula: Math.max(0, ((baseline - actual) / baseline) * 100)
 *
 * Rationale:
 * - Lower values should produce higher scores
 * - Calculate inverse: (baseline - actual) / baseline
 * - Use Math.max(0, ...) to prevent negative scores
 *
 * For estimatedOvertimeHours (baseline = 80 hours):
 * @example
 * normalize_reverse(0, 80) = 100    // 0 hours = perfect
 * normalize_reverse(40, 80) = 50    // 40 hours = 50 points
 * normalize_reverse(80, 80) = 0     // 80 hours = baseline
 * normalize_reverse(100, 80) = 0    // Over baseline = capped at 0
 *
 * For turnoverRate (baseline = 100%):
 * normalize_reverse(0, 100) = 100   // 0% turnover = perfect
 * normalize_reverse(50, 100) = 50   // 50% turnover = 50 points
 * normalize_reverse(100, 100) = 0   // 100% turnover = 0 points
 * normalize_reverse(150, 100) = 0   // Over 100% = capped at 0
 */
export const NORMALIZE_REVERSE_DOCUMENTATION = {
  pattern: 'Reverse/Inverse',
  formula: 'Math.max(0, ((baseline - actual) / baseline) * 100)',
  inputRange: [0, Infinity],
  outputRange: [0, 100],
  baselines: {
    estimatedOvertimeHours: 80,
    turnoverRate: 100,
  },
  indicators: ['estimatedOvertimeHours', 'turnoverRate'],
  testCases: [
    {
      indicator: 'estimatedOvertimeHours',
      baseline: 80,
      input: 0,
      expected: 100,
    },
    {
      indicator: 'estimatedOvertimeHours',
      baseline: 80,
      input: 40,
      expected: 50,
    },
    {
      indicator: 'turnoverRate',
      baseline: 100,
      input: 0,
      expected: 100,
    },
    {
      indicator: 'turnoverRate',
      baseline: 100,
      input: 50,
      expected: 50,
    },
  ],
} as const

/**
 * HAPPINESS SCORE CALCULATION
 *
 * The happiness score is the weighted average of all normalized indicators,
 * clamped to 0-100 range and rounded to 1 decimal place.
 *
 * Formula:
 * score = Σ(normalized[i] * weight[i]) for all i in indicators
 * final = Math.round(Math.min(100, Math.max(0, score)) * 10) / 10
 *
 * Rounding Rule:
 * - All decimal places after the first are discarded
 * - Standard rounding (0.x5 → up) is applied
 * - Examples:
 *   - 83.26 → 83.3 (normal rounding)
 *   - 83.24 → 83.2
 *   - 83.25 → 83.3 (banker's rounding via Math.round)
 *
 * @example
 * // High-performing company
 * const company = {
 *   techStackModernity: 8,      // 77.8
 *   remoteRate: 95,             // 95.0
 *   estimatedOvertimeHours: 15, // 81.3
 *   turnoverRate: 10,           // 90.0
 *   retentionRate: 90,          // 90.0
 *   devEnvironment: 8,          // 77.8
 *   skillUpSupport: 7,          // 66.7
 * }
 * // 77.8*0.20 + 95*0.20 + 81.3*0.20 + 90*0.10 + 90*0.10 + 77.8*0.10 + 66.7*0.10
 * // = 15.56 + 19.00 + 16.26 + 9.00 + 9.00 + 7.78 + 6.67 = 83.27 → 83.3
 */
export const HAPPINESS_SCORE_DOCUMENTATION = {
  description: 'Weighted average of all normalized indicators',
  formula: 'Σ(normalized[i] * weight[i]), rounded to 1 decimal place',
  rangeMin: 0,
  rangeMax: 100,
  precision: 'First decimal place (x.x)',
  roundingMethod: 'Math.round(value * 10) / 10',
  exampleCalculation: {
    company: 'High-performing tech company',
    indicators: {
      techStackModernity: { raw: 8, normalized: 77.8, weight: 0.20 },
      remoteRate: { raw: 95, normalized: 95.0, weight: 0.20 },
      estimatedOvertimeHours: { raw: 15, normalized: 81.3, weight: 0.20 },
      turnoverRate: { raw: 10, normalized: 90.0, weight: 0.10 },
      retentionRate: { raw: 90, normalized: 90.0, weight: 0.10 },
      devEnvironment: { raw: 8, normalized: 77.8, weight: 0.10 },
      skillUpSupport: { raw: 7, normalized: 66.7, weight: 0.10 },
    },
    calculation: '77.8*0.20 + 95*0.20 + 81.3*0.20 + 90*0.10 + 90*0.10 + 77.8*0.10 + 66.7*0.10',
    intermediate: 83.27,
    final: 83.3,
  },
} as const

/**
 * BONUS POINTS SYSTEM
 *
 * Additional points can be awarded for company cultural indicators:
 * - GitHub Activity: 0-5 points (based on engineering culture)
 * - Connpass Events: 0-5 points (community engagement)
 * - Maximum bonus: 10 points
 * - Final score capped at 100
 *
 * Formula:
 * finalScore = Math.min(100, happinessScore + githubBonus + connpassBonus)
 *
 * @example
 * // Company with strong cultural indicators
 * happinessScore = 85
 * githubBonus = 5    // Active GitHub presence
 * connpassBonus = 5  // Regular Connpass events
 * finalScore = min(100, 85 + 5 + 5) = min(100, 95) = 95
 *
 * // Company with perfect base score
 * happinessScore = 97
 * githubBonus = 5
 * connpassBonus = 5
 * finalScore = min(100, 97 + 5 + 5) = min(100, 107) = 100 (capped)
 */
export const BONUS_POINTS_DOCUMENTATION = {
  description: 'Additional points for cultural indicators',
  sources: {
    github: { max: 5, description: 'GitHub activity and presence' },
    connpass: { max: 5, description: 'Connpass event hosting' },
  },
  maxTotal: 10,
  finalCapFinal: 100,
  formula: 'finalScore = min(100, happinessScore + githubBonus + connpassBonus)',
  examples: [
    {
      happinessScore: 80,
      githubBonus: 5,
      connpassBonus: 5,
      finalScore: 90,
    },
    {
      happinessScore: 97,
      githubBonus: 5,
      connpassBonus: 5,
      finalScore: 100,
    },
  ],
} as const

/**
 * PERSONAL SCORE CALCULATION
 *
 * Users can customize the score by adjusting the weight of each indicator.
 * Weight values range from 0-3 (0=don't care, 1=somewhat, 2=important, 3=very important).
 *
 * Algorithm:
 * 1. Sum all user weights: totalWeight = Σ(userWeights[i])
 * 2. If totalWeight = 0: return standard happinessScore (fallback)
 * 3. Otherwise: calculate weighted average using custom weights
 *    personalScore = Σ(normalized[i] * (userWeights[i] / totalWeight))
 * 4. Clamp to 0-100 and round to 1 decimal place
 *
 * @example
 * // User who prioritizes remote work and low overtime
 * userWeights = {
 *   techStackModernity: 0,      // Don't care
 *   remoteRate: 3,              // Very important
 *   estimatedOvertimeHours: 3,  // Very important
 *   turnoverRate: 0,
 *   retentionRate: 0,
 *   devEnvironment: 0,
 *   skillUpSupport: 0,
 * }
 * totalWeight = 0+3+3+0+0+0+0 = 6
 *
 * Company with: remoteRate=100 (100 normalized), overtimeHours=20 (75 normalized)
 * personalScore = (100 * 3/6) + (75 * 3/6) = 50 + 37.5 = 87.5
 *
 * // User who doesn't customize (all weights = 0)
 * userWeights = { all: 0 }
 * totalWeight = 0
 * → Returns standard happinessScore (fallback behavior)
 */
export const PERSONAL_SCORE_DOCUMENTATION = {
  description: 'User-customized happiness score based on individual preferences',
  weightScale: {
    0: 'Don\'t care (気にしない)',
    1: 'Somewhat important (やや重視)',
    2: 'Important (重視)',
    3: 'Very important (最重視)',
  },
  formula: 'if (totalWeight === 0) return happinessScore; else return Σ(normalized[i] * (weight[i] / totalWeight))',
  rangeMin: 0,
  rangeMax: 100,
  precision: 'First decimal place (x.x)',
  persistence: {
    method: 'localStorage',
    key: 'happiness_map:user_weights',
    format: 'JSON object with 7 indicator properties',
  },
  fallbackBehavior: 'If user has not set any preferences (all weights = 0), returns standard happiness score',
  exampleCustomization: {
    scenario: 'Remote work focused user',
    userWeights: {
      techStackModernity: 0,
      remoteRate: 3,
      estimatedOvertimeHours: 3,
      turnoverRate: 0,
      retentionRate: 0,
      devEnvironment: 0,
      skillUpSupport: 0,
    },
    totalWeight: 6,
    companyIndicators: {
      remoteRate: { raw: 100, normalized: 100 },
      estimatedOvertimeHours: { raw: 20, normalized: 75 },
    },
    calculation: '(100 * 3/6) + (75 * 3/6) = 50 + 37.5 = 87.5',
    result: 87.5,
  },
} as const

/**
 * COLOR CLASSIFICATION
 *
 * Scores are classified into three color categories for visual interpretation:
 * - Green (🟢): 70-100 points - Excellent working environment
 * - Yellow (🟡): 40-69 points - Average working environment
 * - Red (🔴): 0-39 points - Needs improvement
 *
 * @example
 * getScoreColor(85) → 'green'   // Excellent
 * getScoreColor(55) → 'yellow'  // Average
 * getScoreColor(25) → 'red'     // Below average
 */
export const COLOR_CLASSIFICATION_DOCUMENTATION = {
  description: 'Visual color coding for score ranges',
  classifications: [
    {
      color: 'green',
      emoji: '🟢',
      meaning: 'Excellent (優秀)',
      scoreRange: [70, 100],
      description: 'Excellent working environment for engineers',
    },
    {
      color: 'yellow',
      emoji: '🟡',
      meaning: 'Average (標準)',
      scoreRange: [40, 69],
      description: 'Average working environment',
    },
    {
      color: 'red',
      emoji: '🔴',
      meaning: 'Below Average (要改善)',
      scoreRange: [0, 39],
      description: 'Working environment needs improvement',
    },
  ],
  boundaryValues: {
    green: 70,
    yellow: 40,
  },
} as const

/**
 * RELIABILITY SCORE
 *
 * Indicates how much confidence to place in the calculated happiness score.
 * Based on data sources and their freshness.
 *
 * Source Weights (max 6 points total):
 * - OpenWork: 2 points (authoritative, paid data)
 * - Job Posting Sites: 2 points (direct company information)
 * - GitHub: 1 point (estimated from activity)
 * - Connpass: 1 point (estimated from community)
 *
 * Freshness Coefficients (applied multiplicatively):
 * - 0-30 days old: 1.0 (full weight)
 * - 31-90 days old: 0.7 (70% weight)
 * - 91-180 days old: 0.4 (40% weight)
 * - 180+ days old: 0.1 (10% weight)
 *
 * Formula:
 * score = (Σ(sourceWeight * freshnessCoefficient) / 6) * 100
 *
 * Level Classification:
 * - High (高): 70-100 - Very trustworthy
 * - Medium (中): 40-69 - Reasonably trustworthy
 * - Low (低): 0-39 - Use with caution
 *
 * @example
 * // All sources fresh
 * sources = [openwork, jobPosting, github, connpass] (all within 30 days)
 * weights = 2 + 2 + 1 + 1 = 6
 * freshness = 1.0 * 6 = 6
 * score = (6 / 6) * 100 = 100 (high reliability)
 *
 * // Mixed freshness
 * openwork: 2 * 1.0 = 2.0 (fresh)
 * jobPosting: 2 * 0.7 = 1.4 (60 days old)
 * github: 1 * 0.4 = 0.4 (120 days old)
 * connpass: 0 * 0 = 0 (missing)
 * total = 3.8 / 6 * 100 = 63.3 (medium reliability)
 */
export const RELIABILITY_SCORE_DOCUMENTATION = {
  description: 'Confidence level in the calculated happiness score',
  sourceWeights: {
    openwork: { weight: 2, description: 'OpenWork survey data' },
    jobPosting: { weight: 2, description: 'Job posting site information' },
    github: { weight: 1, description: 'GitHub activity analysis' },
    connpass: { weight: 1, description: 'Connpass event participation' },
  },
  maxWeight: 6,
  freshnessCoefficients: {
    '0-30_days': { coefficient: 1.0, description: 'Very fresh' },
    '31-90_days': { coefficient: 0.7, description: 'Moderately fresh' },
    '91-180_days': { coefficient: 0.4, description: 'Somewhat stale' },
    '180+_days': { coefficient: 0.1, description: 'Very stale' },
  },
  formula: 'score = (Σ(weight * freshness) / 6) * 100',
  classification: {
    high: { range: [70, 100], meaning: '高 (High)', description: 'Very trustworthy' },
    medium: { range: [40, 69], meaning: '中 (Medium)', description: 'Reasonably trustworthy' },
    low: { range: [0, 39], meaning: '低 (Low)', description: 'Use with caution' },
  },
} as const

/**
 * TYPE DEFINITIONS AND INTERFACES
 *
 * This section documents the TypeScript interfaces used throughout the scoring system.
 */

/**
 * CompanyScores Interface
 *
 * Represents all scoring data for a single company.
 * All fields are required and must have valid values.
 *
 * @interface CompanyScores
 * @property {number} techStackModernity - Range: 1-10 (1=legacy, 10=cutting-edge)
 * @property {number} remoteRate - Range: 0-100 (percentage of remote-capable roles)
 * @property {number} estimatedOvertimeHours - Range: 0-150+ (monthly hours)
 * @property {number} turnoverRate - Range: 0-100 (percentage)
 * @property {number} retentionRate - Range: 0-100 (percentage)
 * @property {number} devEnvironment - Range: 1-10 (quality of dev environment)
 * @property {number} skillUpSupport - Range: 1-10 (support for skill development)
 * @property {number} happinessScore - Range: 0-100 (calculated, 1 decimal place)
 * @property {number} reliabilityScore - Range: 0-100 (calculated)
 * @property {'green' | 'yellow' | 'red'} scoreColor - Color classification
 */
export const COMPANY_SCORES_INTERFACE_DOCUMENTATION = {
  interfaceName: 'CompanyScores',
  description: 'Complete scoring data for a company',
  properties: {
    techStackModernity: { type: 'number', range: [1, 10], description: '技術スタック現代性' },
    remoteRate: { type: 'number', range: [0, 100], description: 'リモート対応率' },
    estimatedOvertimeHours: { type: 'number', range: [0, Infinity], description: '月間残業時間' },
    turnoverRate: { type: 'number', range: [0, 100], description: '離職率' },
    retentionRate: { type: 'number', range: [0, 100], description: '定着率' },
    devEnvironment: { type: 'number', range: [1, 10], description: '開発環境スコア' },
    skillUpSupport: { type: 'number', range: [1, 10], description: 'スキルアップ支援度' },
    happinessScore: { type: 'number', range: [0, 100], description: '幸福度スコア（計算済み）' },
    reliabilityScore: { type: 'number', range: [0, 100], description: '信頼度スコア（計算済み）' },
    scoreColor: { type: 'string', enum: ['green', 'yellow', 'red'], description: 'スコア色分け' },
  },
} as const

/**
 * UserWeights Interface
 *
 * Represents user customization of indicator importance.
 * Persisted in browser localStorage for preference tracking.
 *
 * @interface UserWeights
 * @property {number} [indicator] - Range: 0-3 for each of 7 indicators
 *   0 = Don't care (気にしない)
 *   1 = Somewhat important (やや重視)
 *   2 = Important (重視)
 *   3 = Very important (最重視)
 */
export const USER_WEIGHTS_INTERFACE_DOCUMENTATION = {
  interfaceName: 'UserWeights',
  description: 'User-customized weight preferences for indicators',
  persistenceMethod: 'Browser localStorage',
  persistenceKey: 'happiness_map:user_weights',
  properties: {
    techStackModernity: { type: 'number', range: [0, 3] },
    remoteRate: { type: 'number', range: [0, 3] },
    estimatedOvertimeHours: { type: 'number', range: [0, 3] },
    turnoverRate: { type: 'number', range: [0, 3] },
    retentionRate: { type: 'number', range: [0, 3] },
    devEnvironment: { type: 'number', range: [0, 3] },
    skillUpSupport: { type: 'number', range: [0, 3] },
  },
  defaultValue: 'All properties initialized to 0',
  resetFunction: 'resetUserWeights() → sets all to 0',
} as const

/**
 * DataSource Interface
 *
 * Represents metadata about a data source used in reliability calculation.
 *
 * @interface DataSource
 * @property {'connpass' | 'openwork' | 'ir' | 'github'} source - Source identifier
 * @property {string | null} url - URL to source data (optional)
 * @property {string} scrapedAt - ISO 8601 timestamp of data collection
 */
export const DATA_SOURCE_INTERFACE_DOCUMENTATION = {
  interfaceName: 'DataSource',
  description: 'Metadata about a data source',
  properties: {
    source: { type: 'string', enum: ['connpass', 'openwork', 'ir', 'github'] },
    url: { type: 'string | null', description: 'Link to source data' },
    scrapedAt: { type: 'string', format: 'ISO 8601', description: 'Data collection timestamp' },
  },
} as const

export default {
  WEIGHTS_DOCUMENTATION,
  NORMALIZE_1_TO_10_DOCUMENTATION,
  NORMALIZE_PERCENT_DOCUMENTATION,
  NORMALIZE_REVERSE_DOCUMENTATION,
  HAPPINESS_SCORE_DOCUMENTATION,
  BONUS_POINTS_DOCUMENTATION,
  PERSONAL_SCORE_DOCUMENTATION,
  COLOR_CLASSIFICATION_DOCUMENTATION,
  RELIABILITY_SCORE_DOCUMENTATION,
  COMPANY_SCORES_INTERFACE_DOCUMENTATION,
  USER_WEIGHTS_INTERFACE_DOCUMENTATION,
  DATA_SOURCE_INTERFACE_DOCUMENTATION,
}
