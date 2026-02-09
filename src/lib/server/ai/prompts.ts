/**
 * AI Prompt Templates for Forbetra Insights
 *
 * Three prompt builders that inject domain data for meaningful,
 * specific developmental feedback.
 */

import { getIntentionPromptForWeek } from '$lib/prompts/intention';

const SYSTEM_MESSAGE = `You are a developmental psychology expert embedded in Forbetra, a personal growth platform. Your role is to provide specific, pattern-based observations that help individuals grow.

Core principles:
- Be SPECIFIC. Reference actual scores, trends, and patterns. Never say "great job" without pointing to what was great.
- Be DIRECT but warm. Speak like a trusted advisor, not a cheerleader.
- Focus on PATTERNS, not single data points. Look for trends across weeks.
- Name the GAP between effort and performance when it exists. This is often the most valuable insight.
- Reference stakeholder feedback alignment/misalignment when available.
- Never use generic coaching platitudes like "keep going" or "believe in yourself."
- Ground observations in performance psychology: identity, deliberate practice, feedback loops, energy management.

Respond in plain text with markdown formatting. Keep responses concise and actionable.`;

type WeekScore = {
	weekNumber: number;
	effort: number | null;
	performance: number | null;
};

type StakeholderWeekScore = {
	weekNumber: number;
	stakeholderName: string;
	effort: number | null;
	performance: number | null;
};

export type CheckInContext = {
	objectiveTitle: string;
	subgoals: string[];
	currentWeek: number;
	thisWeekScores: { effort: number | null; performance: number | null };
	last3Weeks: WeekScore[];
	stakeholderFeedback: StakeholderWeekScore[];
	weeklyPromptTopic: string;
};

export type WeeklySynthesisContext = {
	objectiveTitle: string;
	subgoals: string[];
	currentWeek: number;
	thisWeekReflections: Array<{
		type: string;
		effort: number | null;
		performance: number | null;
		notes: string | null;
	}>;
	last3Weeks: WeekScore[];
	stakeholderFeedback: StakeholderWeekScore[];
	coachNotes: string[];
};

export type CoachPrepContext = {
	individualName: string;
	objectiveTitle: string;
	last4Weeks: WeekScore[];
	stakeholderFeedback: StakeholderWeekScore[];
	stakeholderGapTrend: Array<{ weekNumber: number; effortGap: number; performanceGap: number }>;
	stabilityScore: number | null;
	coachNotes: string[];
	alerts: string[];
};

export function buildCheckInPrompt(context: CheckInContext): string {
	const prompt = getIntentionPromptForWeek(context.currentWeek);

	const trendLines = context.last3Weeks
		.map(
			(w) =>
				`  Week ${w.weekNumber}: Effort ${w.effort ?? '--'}, Performance ${w.performance ?? '--'}`
		)
		.join('\n');

	const stakeholderLines =
		context.stakeholderFeedback.length > 0
			? context.stakeholderFeedback
					.map(
						(s) =>
							`  ${s.stakeholderName}: Effort ${s.effort ?? '--'}, Performance ${s.performance ?? '--'}`
					)
					.join('\n')
			: '  No stakeholder feedback for this week yet.';

	return `## Check-In Insight Request

**Objective**: ${context.objectiveTitle}
**Subgoals**: ${context.subgoals.join(', ')}
**Current Week**: ${context.currentWeek} (Topic: ${prompt.heading})

**This Week's Self-Scores**:
  Effort: ${context.thisWeekScores.effort ?? 'Not submitted'}
  Performance: ${context.thisWeekScores.performance ?? 'Not submitted'}

**Last 3 Weeks Trend**:
${trendLines || '  No prior data.'}

**Stakeholder Feedback (this week)**:
${stakeholderLines}

---

Provide a 2-3 sentence developmental observation. Be specific about the pattern you see. If there's an effort-performance gap, name it and explain what it might mean at this stage of their cycle. Reference the weekly theme (${prompt.heading}) if relevant.`;
}

export function buildWeeklySynthesisPrompt(context: WeeklySynthesisContext): string {
	const reflectionLines = context.thisWeekReflections
		.map(
			(r) =>
				`  ${r.type}: Effort ${r.effort ?? '--'}, Performance ${r.performance ?? '--'}${r.notes ? ` | Notes: "${r.notes}"` : ''}`
		)
		.join('\n');

	const trendLines = context.last3Weeks
		.map(
			(w) =>
				`  Week ${w.weekNumber}: Effort ${w.effort ?? '--'}, Performance ${w.performance ?? '--'}`
		)
		.join('\n');

	const stakeholderLines =
		context.stakeholderFeedback.length > 0
			? context.stakeholderFeedback
					.map(
						(s) =>
							`  ${s.stakeholderName} (Week ${s.weekNumber}): Effort ${s.effort ?? '--'}, Performance ${s.performance ?? '--'}`
					)
					.join('\n')
			: '  No stakeholder feedback this week.';

	const coachNoteLines =
		context.coachNotes.length > 0
			? context.coachNotes.map((n) => `  - "${n}"`).join('\n')
			: '  No coach notes this week.';

	return `## Weekly Synthesis Request

**Objective**: ${context.objectiveTitle}
**Subgoals**: ${context.subgoals.join(', ')}
**Week**: ${context.currentWeek}

**This Week's Reflections**:
${reflectionLines || '  No reflections submitted.'}

**Previous 3 Weeks Trend**:
${trendLines || '  No prior data.'}

**Stakeholder Feedback**:
${stakeholderLines}

**Coach Notes**:
${coachNoteLines}

---

Provide a 3-5 sentence synthesis that includes:
1. **Key observation** about this week's data
2. **Effort-performance gap analysis** (if applicable)
3. **Stakeholder alignment note** (do others see what the individual sees?)
4. **One specific suggestion** for next week

Be concrete. Use numbers. Name patterns.`;
}

export type CycleReportContext = {
	objectiveTitle: string;
	subgoals: string[];
	cycleStartDate: string;
	currentWeek: number;
	totalWeeks: number;
	weeklyScores: WeekScore[];
	stakeholderFeedback: StakeholderWeekScore[];
	perceptionGaps: Array<{
		stakeholderName: string;
		latestEffortGap: number | null;
		latestPerformanceGap: number | null;
		effortGapTrend: 'widening' | 'closing' | 'stable' | null;
		performanceGapTrend: 'widening' | 'closing' | 'stable' | null;
	}>;
	stabilityScore: number | null;
	trajectoryScore: number | null;
	completionRate: number | null;
	alignmentRatio: number | null;
	weeklyIntentions: Array<{ weekNumber: number; notes: string }>;
	coachNotes: string[];
	identityAnchor: string | null;
};

export function buildCycleReportPrompt(context: CycleReportContext): string {
	const weekLines = context.weeklyScores
		.map(
			(w) =>
				`  Week ${w.weekNumber}: Effort ${w.effort ?? '--'}, Performance ${w.performance ?? '--'}`
		)
		.join('\n');

	const stakeholderLines =
		context.stakeholderFeedback.length > 0
			? context.stakeholderFeedback
					.map(
						(s) =>
							`  ${s.stakeholderName} (Week ${s.weekNumber}): Effort ${s.effort ?? '--'}, Performance ${s.performance ?? '--'}`
					)
					.join('\n')
			: '  No stakeholder feedback available.';

	const gapLines =
		context.perceptionGaps.length > 0
			? context.perceptionGaps
					.map((g) => {
						const parts = [`  ${g.stakeholderName}:`];
						if (g.latestEffortGap !== null)
							parts.push(`Effort gap ${g.latestEffortGap > 0 ? '+' : ''}${g.latestEffortGap.toFixed(1)} (${g.effortGapTrend ?? 'unknown'})`);
						if (g.latestPerformanceGap !== null)
							parts.push(`Performance gap ${g.latestPerformanceGap > 0 ? '+' : ''}${g.latestPerformanceGap.toFixed(1)} (${g.performanceGapTrend ?? 'unknown'})`);
						return parts.join(' ');
					})
					.join('\n')
			: '  No perception gap data available.';

	const intentionLines =
		context.weeklyIntentions.length > 0
			? context.weeklyIntentions
					.map((i) => `  Week ${i.weekNumber}: "${i.notes}"`)
					.join('\n')
			: '  No intentions recorded.';

	const coachNoteLines =
		context.coachNotes.length > 0
			? context.coachNotes.map((n) => `  - "${n}"`).join('\n')
			: '  No coach notes.';

	return `## Cycle Performance Report Request

**Objective**: ${context.objectiveTitle}
**Subgoals**: ${context.subgoals.join(', ')}
**Cycle Start**: ${context.cycleStartDate}
**Current Week**: ${context.currentWeek} of ${context.totalWeeks}
${context.identityAnchor ? `**Identity Anchor (Week 1 Intention)**: "${context.identityAnchor}"` : ''}

**Key Metrics**:
  Stability: ${context.stabilityScore !== null ? `${context.stabilityScore}/100` : 'N/A'}
  Trajectory: ${context.trajectoryScore !== null ? `${context.trajectoryScore}` : 'N/A'}
  Completion Rate: ${context.completionRate !== null ? `${context.completionRate}%` : 'N/A'}
  Stakeholder Alignment: ${context.alignmentRatio !== null ? `${context.alignmentRatio}%` : 'N/A'}

**Weekly Self-Scores (Full Cycle)**:
${weekLines || '  No data.'}

**Stakeholder Feedback (Full Cycle)**:
${stakeholderLines}

**Perception Gaps (Self - Stakeholder)**:
${gapLines}

**Weekly Intentions**:
${intentionLines}

**Coach Notes**:
${coachNoteLines}

---

Write a comprehensive developmental performance report. Use ## markdown headers for each section. Include exactly these six sections:

## Executive Summary
2-3 sentences. State where this individual stands relative to their objective and overall trajectory. Reference specific metrics.

## Progress Trajectory
Analyze the evolution of effort and performance scores across the full cycle. Identify inflection points, plateaus, or acceleration. Reference specific weeks.

## Perception Analysis
Name each stakeholder. Describe the direction and trend of their perception gap (effort and performance). Note where alignment is strong and where it diverges.

## Key Strengths
2-3 data-backed strengths. Each must reference specific patterns, scores, or trends from the data.

## Growth Opportunities
2-3 areas for development. Ground each in specific data patterns — not generic advice.

## Recommendations
Exactly 3 concrete, actionable recommendations. Each must tie directly to a finding from the analysis above. Be specific about what to do, not just what to think about.`;
}

export function buildCoachPrepPrompt(context: CoachPrepContext): string {
	const weekLines = context.last4Weeks
		.map(
			(w) =>
				`  Week ${w.weekNumber}: Effort ${w.effort ?? '--'}, Performance ${w.performance ?? '--'}`
		)
		.join('\n');

	const stakeholderLines =
		context.stakeholderFeedback.length > 0
			? context.stakeholderFeedback
					.map(
						(s) =>
							`  ${s.stakeholderName} (Week ${s.weekNumber}): Effort ${s.effort ?? '--'}, Performance ${s.performance ?? '--'}`
					)
					.join('\n')
			: '  No recent stakeholder feedback.';

	const gapLines =
		context.stakeholderGapTrend.length > 0
			? context.stakeholderGapTrend
					.map(
						(g) =>
							`  Week ${g.weekNumber}: Effort gap ${g.effortGap > 0 ? '+' : ''}${g.effortGap.toFixed(1)}, Performance gap ${g.performanceGap > 0 ? '+' : ''}${g.performanceGap.toFixed(1)}`
					)
					.join('\n')
			: '  No gap data available.';

	const coachNoteLines =
		context.coachNotes.length > 0
			? context.coachNotes.map((n) => `  - "${n}"`).join('\n')
			: '  No recent coach notes.';

	const alertLines =
		context.alerts.length > 0
			? context.alerts.map((a) => `  - ${a}`).join('\n')
			: '  No active alerts.';

	return `## Coach Prep Briefing Request

**Individual**: ${context.individualName}
**Objective**: ${context.objectiveTitle}
**Stability Score**: ${context.stabilityScore !== null ? `${context.stabilityScore}/100` : 'N/A'}

**Last 4 Weeks Self-Scores**:
${weekLines || '  No data.'}

**Stakeholder Feedback (last 4 weeks)**:
${stakeholderLines}

**Self-Other Gap Trend**:
${gapLines}

**Recent Coach Notes**:
${coachNoteLines}

**Active Alerts**:
${alertLines}

---

Provide a structured coach prep briefing:
1. **Headline** (1 sentence summary of where this client is)
2. **Key data points** (3-4 bullet points of notable patterns)
3. **Suggested conversation starters** (2-3 questions the coach could ask)
4. **Risk flags** (anything concerning that needs attention)

Be specific and actionable. The coach needs to walk into a session prepared.`;
}

export { SYSTEM_MESSAGE };
