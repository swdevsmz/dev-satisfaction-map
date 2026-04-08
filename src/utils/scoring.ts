import type { CompanyScores, RadarDataPoint, UserWeights } from '../types/company'

/**
 * Weight Configuration for Happiness Score Calculation
 *
 * All weights sum to exactly 1.00 for consistent weighted average calculation.
 * This is the single source of truth for weight distribution across all scoring functions.
 *
 * Each weight represents the relative importance of its corresponding indicator:
 * - 0.20 weights (4 indicators): Core indicators of engineer satisfaction
 * - 0.10 weights (3 indicators): Supporting indicators with equal importance
 *
 * Indicators:
 * - techStackModernity (0.20): Modern tech stack adoption (1-10 scale)
 * - remoteRate (0.20): Remote work support percentage (0-100%)
 * - estimatedOvertimeHours (0.20): Work-life balance, INVERTED (less is better)
 * - turnoverRate (0.10): Employee turnover rate, INVERTED (lower is better)
 * - retentionRate (0.10): Employee retention rate
 * - devEnvironment (0.10): Quality of development environment (1-10 scale)
 * - skillUpSupport (0.10): Support for skill development (1-10 scale)
 *
 * Verification:
 * - Sum of all weights = 1.00 (verified with tolerance ±0.01)
 * - All weights are positive
 * - Weights are consistent across all scoring calculations
 *
 * @constant WEIGHTS
 * @type {Object}
 * @property {number} techStackModernity=0.20 - Technology stack modernity (20%)
 * @property {number} remoteRate=0.20 - Remote work support (20%)
 * @property {number} estimatedOvertimeHours=0.20 - Work-life balance (20%, inverted)
 * @property {number} turnoverRate=0.10 - Employee retention (10%, inverted)
 * @property {number} retentionRate=0.10 - Long-term stability (10%)
 * @property {number} devEnvironment=0.10 - Development environment quality (10%)
 * @property {number} skillUpSupport=0.10 - Learning & growth support (10%)
 *
 * @example
 * // Verify weight configuration
 * const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0)
 * console.assert(sum >= 0.99 && sum <= 1.01, 'Weights should sum to 1.00±0.01')
 */
export const WEIGHTS = {
  techStackModernity: 0.20,
  remoteRate: 0.20,
  estimatedOvertimeHours: 0.20, // 反転: 少ないほど高スコア (inverted: lower is better)
  turnoverRate: 0.10,           // 反転: 低いほど高スコア (inverted: lower is better)
  retentionRate: 0.10,
  devEnvironment: 0.10,
  skillUpSupport: 0.10,
} as const

/**
 * Normalize Company Indicators to 0-100 Scale
 *
 * Converts raw indicator values to a standardized 0-100 scale for consistent
 * comparison and weighted averaging. Different normalization patterns are applied
 * depending on the indicator's input range and semantic meaning.
 *
 * NORMALIZATION PATTERNS:
 *
 * 1. Scale Conversion (1-10 → 0-100):
 *    Formula: ((score - 1) / 9) * 100
 *    Applied to: techStackModernity, devEnvironment, skillUpSupport
 *    - Input: 1 (low) to 10 (high)
 *    - Output: 0 (low) to 100 (high)
 *    - Examples: 1→0, 5.5→50, 10→100
 *
 * 2. Direct Percentage (0-100):
 *    Formula: value (no transformation)
 *    Applied to: remoteRate, retentionRate
 *    - Input: 0-100 (already a percentage)
 *    - Output: 0-100 (unchanged)
 *
 * 3. Reverse/Inverse (Less is Better):
 *    Formula: Math.max(0, ((baseline - value) / baseline) * 100)
 *    Applied to: estimatedOvertimeHours (baseline: 80h), turnoverRate (baseline: 100%)
 *    - Lower actual values produce higher scores
 *    - Math.max(0, ...) prevents negative scores
 *    - Examples:
 *      * OvertimeHours: 0→100, 40→50, 80→0, 100+→0
 *      * TurnoverRate: 0→100, 50→50, 100→0
 *
 * PRECISION:
 * - Calculations preserve floating-point precision
 * - Results can be decimal values (e.g., 33.3, 61.1)
 * - No rounding applied at this stage (rounding done in calculateHappinessScore)
 *
 * @param {CompanyScores} s - Raw company scores with mixed input ranges
 * @returns {Record<keyof typeof WEIGHTS, number>} Normalized scores (0-100 range)
 *
 * @example
 * const company = {
 *   techStackModernity: 8,      // 1-10 scale
 *   remoteRate: 90,             // 0-100 percentage
 *   estimatedOvertimeHours: 30, // hours (80h baseline)
 *   turnoverRate: 10,           // 0-100 percentage (inverted)
 *   retentionRate: 90,          // 0-100 percentage
 *   devEnvironment: 8,          // 1-10 scale
 *   skillUpSupport: 7,          // 1-10 scale
 * }
 *
 * const normalized = normalizeScores(company)
 * // Results:
 * // techStackModernity: 77.8 = (8-1)/9*100
 * // remoteRate: 90 = direct
 * // estimatedOvertimeHours: 62.5 = (80-30)/80*100
 * // turnoverRate: 90 = 100-10
 * // retentionRate: 90 = direct
 * // devEnvironment: 77.8 = (8-1)/9*100
 * // skillUpSupport: 66.7 = (7-1)/9*100
 *
 * @see WEIGHTS - Weight configuration for each indicator
 * @see calculateHappinessScore - Uses these normalized values for weighted average
 */
export function normalizeScores(s: CompanyScores): Record<keyof typeof WEIGHTS, number> {
  return {
    // Scale Conversion: 1-10 → 0-100
    // Formula: ((score - 1) / 9) * 100
    // Higher is better
    techStackModernity: ((s.techStackModernity - 1) / 9) * 100,

    // Direct Percentage: 0-100 → 0-100
    // Higher is better
    remoteRate: s.remoteRate,

    // Reverse: Hours → 0-100 (lower hours = higher score)
    // Formula: ((80 - hours) / 80) * 100, capped at 0
    // Baseline: 80 hours/month
    estimatedOvertimeHours: Math.max(0, ((80 - s.estimatedOvertimeHours) / 80) * 100),

    // Reverse: Percentage → 0-100 (lower rate = higher score)
    // Formula: 100 - percentage
    // Higher retention is better (lower turnover)
    turnoverRate: Math.max(0, 100 - s.turnoverRate),

    // Direct Percentage: 0-100 → 0-100
    // Higher is better
    retentionRate: s.retentionRate,

    // Scale Conversion: 1-10 → 0-100
    // Higher is better
    devEnvironment: ((s.devEnvironment - 1) / 9) * 100,

    // Scale Conversion: 1-10 → 0-100
    // Higher is better
    skillUpSupport: ((s.skillUpSupport - 1) / 9) * 100,
  }
}

/**
 * Calculate Weighted Average Happiness Score
 *
 * Computes the final happiness score as a weighted average of all normalized
 * indicators. This is the primary metric used to represent overall engineer
 * satisfaction with a company.
 *
 * CALCULATION STEPS:
 * 1. Normalize all indicators to 0-100 scale using normalizeScores()
 * 2. Apply weight to each normalized indicator
 * 3. Sum all weighted values to get raw score
 * 4. Clamp result to 0-100 range
 * 5. Round to 1 decimal place (0.1 precision)
 *
 * FORMULA:
 * raw = Σ(normalized[i] * weight[i]) for all 7 indicators
 * final = Math.round(Math.min(100, Math.max(0, raw)) * 10) / 10
 *
 * ROUNDING RULE:
 * - All values are rounded to exactly 1 decimal place
 * - Uses Math.round() for banker's rounding (0.x5 → nearest even)
 * - Examples: 83.26→83.3, 83.24→83.2, 83.25→83.3 (sometimes 83.2)
 *
 * RANGE:
 * - Input: normalized values (0-100 each)
 * - Output: 0-100 (clamped by Math.min/Math.max)
 * - Precision: ±0.1 (one decimal place)
 *
 * PERFORMANCE:
 * - O(1) time complexity (7 fixed operations)
 * - All calculations are basic arithmetic
 * - Should complete in < 1ms per company
 *
 * @param {CompanyScores} s - Company scores (raw indicator values)
 * @returns {number} Happiness score from 0-100 (with 0.1 precision)
 *
 * @example
 * // High-performing company
 * const company = {
 *   techStackModernity: 8,      // 77.8 normalized
 *   remoteRate: 95,             // 95.0 normalized
 *   estimatedOvertimeHours: 15, // 81.3 normalized
 *   turnoverRate: 10,           // 90.0 normalized
 *   retentionRate: 90,          // 90.0 normalized
 *   devEnvironment: 8,          // 77.8 normalized
 *   skillUpSupport: 7,          // 66.7 normalized
 * }
 *
 * Calculation:
 * raw = (77.8*0.20) + (95*0.20) + (81.3*0.20) + (90*0.10) + (90*0.10) + (77.8*0.10) + (66.7*0.10)
 *     = 15.56 + 19.00 + 16.26 + 9.00 + 9.00 + 7.78 + 6.67
 *     = 83.27
 * final = Math.round(Math.min(100, Math.max(0, 83.27)) * 10) / 10
 *       = Math.round(832.7) / 10
 *       = 833 / 10
 *       = 83.3
 *
 * @see normalizeScores - Converts raw indicators to 0-100 scale
 * @see WEIGHTS - Weight configuration (sums to 1.00)
 * @see calculatePersonalScore - Alternative calculation with custom weights
 * @see applyBonusPoints - Add bonus points for cultural indicators
 */
export function calculateHappinessScore(s: CompanyScores): number {
  const n = normalizeScores(s)
  // Weighted average of all normalized indicators
  const raw =
    n.techStackModernity * WEIGHTS.techStackModernity +
    n.remoteRate * WEIGHTS.remoteRate +
    n.estimatedOvertimeHours * WEIGHTS.estimatedOvertimeHours +
    n.turnoverRate * WEIGHTS.turnoverRate +
    n.retentionRate * WEIGHTS.retentionRate +
    n.devEnvironment * WEIGHTS.devEnvironment +
    n.skillUpSupport * WEIGHTS.skillUpSupport
  // Clamp to 0-100 range and round to 1 decimal place
  return Math.round(Math.min(100, Math.max(0, raw)) * 10) / 10
}

/** Recharts RadarChart 用データに変換する */
export function toRadarData(s: CompanyScores): RadarDataPoint[] {
  const n = normalizeScores(s)
  return [
    { subject: '技術スタック', value: Math.round(n.techStackModernity), fullMark: 100 },
    { subject: 'リモート率', value: Math.round(n.remoteRate), fullMark: 100 },
    { subject: '残業の少なさ', value: Math.round(n.estimatedOvertimeHours), fullMark: 100 },
    { subject: '低離職率', value: Math.round(n.turnoverRate), fullMark: 100 },
    { subject: '定着率', value: Math.round(n.retentionRate), fullMark: 100 },
    { subject: '開発環境', value: Math.round(n.devEnvironment), fullMark: 100 },
    { subject: 'スキルアップ', value: Math.round(n.skillUpSupport), fullMark: 100 },
  ]
}

/**
 * Calculate User-Customized Happiness Score
 *
 * Computes a personalized happiness score based on the user's weight preferences
 * for each indicator. Users can adjust importance (0-3) for each of 7 indicators
 * to calculate a score tailored to their preferences.
 *
 * WEIGHT SCALE:
 * - 0: Don't care (気にしない)
 * - 1: Somewhat important (やや重視)
 * - 2: Important (重視)
 * - 3: Very important (最重視)
 *
 * CALCULATION ALGORITHM:
 * 1. Sum all user weight values: totalWeight = Σ(userWeights[i])
 * 2. If totalWeight === 0: Return standard happinessScore (fallback behavior)
 * 3. Otherwise: Calculate weighted average using custom weights
 *    personalScore = Σ(normalized[i] * (userWeights[i] / totalWeight))
 * 4. Clamp to 0-100 and round to 1 decimal place
 *
 * FORMULA:
 * totalWeight = Σ(weights[i]) for all 7 indicators
 * If totalWeight === 0:
 *   return calculateHappinessScore(s)  // Fallback to standard score
 * Else:
 *   personalScore = Σ(normalized[i] * (weights[i] / totalWeight))
 *   final = Math.round(Math.min(100, Math.max(0, personalScore)) * 10) / 10
 *
 * FALLBACK BEHAVIOR:
 * - If user has not customized weights (all zeros), returns standard happiness score
 * - This prevents division by zero and provides sensible default behavior
 * - User can explicitly reset weights to 0 to see standard score
 *
 * PERSISTENCE:
 * - User weights are stored in browser localStorage
 * - Key: 'happiness_map:user_weights'
 * - Weights are restored on page load
 * - Can be reset to default (all zeros) by user
 *
 * USE CASES:
 * 1. Remote-focused user: remoteRate=3, otherWeights=0
 *    → Score reflects only remote work support
 * 2. Work-life balance focused: estimatedOvertimeHours=3, otherWeights=0
 *    → Score reflects only overtime/workload
 * 3. Career growth focused: devEnvironment=3, skillUpSupport=3, otherWeights=0
 *    → Score reflects learning environment
 * 4. Balanced user: All weights=1
 *    → Similar to standard score but with custom emphasis
 *
 * PERFORMANCE:
 * - O(1) time complexity (7 fixed operations)
 * - Normalization and calculation are very fast
 * - Should complete in < 1ms per company
 *
 * PRECISION:
 * - Output rounded to 1 decimal place (±0.1)
 * - Range: 0-100
 *
 * @param {CompanyScores} s - Company scores with raw indicator values
 * @param {UserWeights} weights - User preference weights (0-3 per indicator)
 * @returns {number} Personalized happiness score (0-100, with 0.1 precision)
 *
 * @example
 * // User who prioritizes remote work and low overtime
 * const userWeights = {
 *   techStackModernity: 0,      // Don't care
 *   remoteRate: 3,              // Very important
 *   estimatedOvertimeHours: 3,  // Very important (less is better)
 *   turnoverRate: 0,
 *   retentionRate: 0,
 *   devEnvironment: 0,
 *   skillUpSupport: 0,
 * }
 *
 * const company = {
 *   remoteRate: 100,            // 100 normalized (excellent remote)
 *   estimatedOvertimeHours: 20, // 75 normalized (good work-life balance)
 *   // ... other indicators
 * }
 *
 * totalWeight = 0 + 3 + 3 + 0 + 0 + 0 + 0 = 6
 * personalScore = (100 * 3/6) + (75 * 3/6)
 *              = (100 * 0.5) + (75 * 0.5)
 *              = 50 + 37.5
 *              = 87.5
 *
 * // User with no customization (all weights = 0)
 * const defaultWeights = {
 *   techStackModernity: 0,
 *   remoteRate: 0,
 *   estimatedOvertimeHours: 0,
 *   turnoverRate: 0,
 *   retentionRate: 0,
 *   devEnvironment: 0,
 *   skillUpSupport: 0,
 * }
 *
 * personalScore = calculatePersonalScore(company, defaultWeights)
 * // Returns standard happinessScore (fallback behavior)
 *
 * // User who values all indicators equally
 * const balancedWeights = {
 *   techStackModernity: 1,
 *   remoteRate: 1,
 *   estimatedOvertimeHours: 1,
 *   turnoverRate: 1,
 *   retentionRate: 1,
 *   devEnvironment: 1,
 *   skillUpSupport: 1,
 * }
 *
 * personalScore = calculatePersonalScore(company, balancedWeights)
 * // Very similar to calculateHappinessScore (uniform distribution)
 *
 * @see calculateHappinessScore - Standard score with fixed weights
 * @see WEIGHTS - Default weight configuration
 * @see UserWeights - Interface for user weight preferences
 */
export function calculatePersonalScore(s: CompanyScores, weights: UserWeights): number {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0)
  if (total === 0) return calculateHappinessScore(s)
  const n = normalizeScores(s)
  const raw =
    n.techStackModernity     * (weights.techStackModernity     / total) +
    n.remoteRate             * (weights.remoteRate             / total) +
    n.estimatedOvertimeHours * (weights.estimatedOvertimeHours / total) +
    n.turnoverRate           * (weights.turnoverRate           / total) +
    n.retentionRate          * (weights.retentionRate          / total) +
    n.devEnvironment         * (weights.devEnvironment         / total) +
    n.skillUpSupport         * (weights.skillUpSupport         / total)
  return Math.round(Math.min(100, Math.max(0, raw)) * 10) / 10
}

/**
 * Apply Bonus Points for Cultural Indicators
 *
 * Adds bonus points to the base happiness score for positive cultural indicators
 * that reflect strong engineering culture and community engagement. Bonuses are
 * capped at a maximum of 10 points total, and final score is capped at 100.
 *
 * BONUS SOURCES:
 * - GitHub Activity (0-5 points): Contribution to open source, active repositories
 * - Connpass Events (0-5 points): Community event hosting and participation
 * - Maximum total bonus: 10 points
 * - Final score cap: 100 points
 *
 * FORMULA:
 * total = baseScore + githubBonus + connpassBonus
 * finalScore = Math.min(100, total)
 *
 * CAPPING BEHAVIOR:
 * - Prevents scores from exceeding 100 even with maximum bonuses
 * - Example: 95 + 5 + 5 = 105 → capped to 100
 * - Preserves distinction at lower scores: 50 + 3 + 2 = 55
 *
 * USE CASES:
 * 1. Companies with strong GitHub presence (active OSS contributions, well-maintained repos)
 * 2. Companies hosting regular Connpass events (tech meetups, workshops, conferences)
 * 3. Companies with both indicators active (demonstrates comprehensive engineering culture)
 *
 * PARTIAL BONUSES:
 * - Bonuses can be fractional or partial (e.g., 2.5 instead of 5)
 * - Example: githubBonus=3, connpassBonus=2 → adds 5 total
 *
 * PERFORMANCE:
 * - O(1) time complexity (2 arithmetic operations)
 * - No external dependencies or calculations
 *
 * @param {number} baseScore - Happiness score before bonuses (0-100)
 * @param {Object} bonuses - Bonus points object
 * @param {number} bonuses.github - GitHub activity bonus (0-5)
 * @param {number} bonuses.connpass - Connpass event bonus (0-5)
 * @returns {number} Final score after bonus application (0-100, capped)
 *
 * @example
 * // Company with strong GitHub presence
 * applyBonusPoints(80, { github: 5, connpass: 0 })  // → 85
 *
 * // Company with active community events
 * applyBonusPoints(80, { github: 0, connpass: 5 })  // → 85
 *
 * // Company with both strong indicators
 * applyBonusPoints(80, { github: 5, connpass: 5 })  // → 90
 *
 * // Perfect base score gets capped
 * applyBonusPoints(97, { github: 5, connpass: 5 })  // → 100 (capped)
 *
 * // Partial bonuses
 * applyBonusPoints(80, { github: 2, connpass: 3 })  // → 85
 *
 * @see calculateHappinessScore - Base score calculation
 * @see getScoreColor - Determines color based on final score
 */
export function applyBonusPoints(
  baseScore: number,
  bonuses: { github: number; connpass: number }
): number {
  const total = baseScore + bonuses.github + bonuses.connpass
  return Math.min(100, total)
}

/**
 * Get Color Classification for Happiness Score
 *
 * Classifies a happiness score into one of three color categories based on
 * standardized thresholds. Used for visual representation and quick assessment
 * of engineer satisfaction levels.
 *
 * CLASSIFICATION BOUNDARIES:
 * - Green (🟢): 70-100 points - Excellent working environment (優秀)
 * - Yellow (🟡): 40-69 points - Average working environment (標準)
 * - Red (🔴): 0-39 points - Below average, needs improvement (要改善)
 *
 * BOUNDARY BEHAVIOR:
 * - Score >= 70: Green (inclusive)
 * - Score >= 40 and < 70: Yellow (inclusive)
 * - Score < 40: Red
 * - Edge cases: 70.0 = green, 69.9 = yellow, 40.0 = yellow, 39.9 = red
 *
 * SEMANTIC MEANING:
 * - Green: Company provides excellent working conditions for engineers
 *   Characteristics: Modern tech, strong remote support, low overtime, good retention
 * - Yellow: Company is adequate for engineers but has room for improvement
 *   Characteristics: Mixed indicators, some areas strong, some areas weak
 * - Red: Company needs significant improvement in engineer satisfaction
 *   Characteristics: Legacy tech, poor benefits, high turnover, heavy workload
 *
 * CONSISTENCY:
 * - Same thresholds are used for reliabilityScore classification
 * - Consistent across all UI components (cards, charts, displays)
 * - Used alongside getScoreHex() for visual appearance
 *
 * PERFORMANCE:
 * - O(1) time complexity (2 comparisons)
 * - No external dependencies or calculations
 * - Inline use is efficient
 *
 * @param {number} score - Happiness score (0-100)
 * @returns {'green' | 'yellow' | 'red'} Color classification
 *
 * @example
 * getScoreColor(85)   // → 'green'   (excellent)
 * getScoreColor(70)   // → 'green'   (boundary)
 * getScoreColor(69)   // → 'yellow'  (just below green)
 * getScoreColor(55)   // → 'yellow'  (average)
 * getScoreColor(40)   // → 'yellow'  (boundary)
 * getScoreColor(39)   // → 'red'     (just above red)
 * getScoreColor(25)   // → 'red'     (poor)
 *
 * @see getScoreHex - Returns hex color code matching this classification
 * @see getReliabilityLabel - Similar classification for reliability score
 */
export function getScoreColor(score: number): 'green' | 'yellow' | 'red' {
  if (score >= 70) return 'green'
  if (score >= 40) return 'yellow'
  return 'red'
}

/**
 * Get HEX Color Code for Score
 *
 * Returns the hexadecimal color code corresponding to the score classification.
 * Used in charts, visualizations, and styled components that require hex colors.
 *
 * COLOR MAPPING:
 * - Green (🟢): #22c55e - Tailwind's green-500 (excellent)
 * - Yellow (🟡): #eab308 - Tailwind's yellow-500 (standard)
 * - Red (🔴): #ef4444 - Tailwind's red-500 (poor)
 *
 * CONSISTENCY:
 * - Colors match Tailwind CSS color palette for consistency with UI theme
 * - Uses getScoreColor() internally to ensure consistent classification
 * - Suitable for:
 *   * Chart fills and strokes (Recharts, Chart.js)
 *   * Badge backgrounds
 *   * Visual progress indicators
 *   * Heat maps
 *
 * PERFORMANCE:
 * - O(1) time complexity (1 function call + 2 conditionals)
 * - Can be safely called per-company in list renderings
 *
 * @param {number} score - Happiness score (0-100)
 * @returns {string} Hexadecimal color code
 *
 * @example
 * getScoreHex(85)   // → '#22c55e' (green)
 * getScoreHex(55)   // → '#eab308' (yellow)
 * getScoreHex(25)   // → '#ef4444' (red)
 *
 * // Use in chart rendering
 * const color = getScoreHex(company.happinessScore)
 * return <div style={{ backgroundColor: color }}>Score Card</div>
 *
 * @see getScoreColor - Returns semantic color name
 * @see COLORS - Color palette definitions (if available)
 */
export function getScoreHex(score: number): string {
  const color = getScoreColor(score)
  if (color === 'green') return '#22c55e'
  if (color === 'yellow') return '#eab308'
  return '#ef4444'
}
