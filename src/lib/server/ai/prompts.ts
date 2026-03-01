/**
 * AI Prompt Templates for Forbetra Insights
 *
 * Three prompt builders that inject domain data for meaningful,
 * specific developmental feedback.
 */

const SYSTEM_MESSAGE = `You are a developmental psychology expert embedded in Forbetra, a personal growth platform. Your role is to provide specific, pattern-based observations that help individuals grow.

Core principles:
- Be SPECIFIC. Reference actual scores, trends, and patterns. Never say "great job" without pointing to what was great.
- Be DIRECT but warm. Speak like a trusted advisor, not a cheerleader.
- Focus on PATTERNS, not single data points. Look for trends across weeks.
- Name the GAP between effort and performance when it exists. This is often the most valuable insight.
- Reference stakeholder feedback alignment/misalignment when available.
- Never use generic coaching platitudes like "keep going" or "believe in yourself."
- Ground observations in performance psychology: identity, deliberate practice, feedback loops, energy management.

CRITICAL: Every insight you generate MUST end with a specific, behavioral action the person can take THIS WEEK. Not "consider improving delegation" but "this week, identify one decision you currently make alone and ask your team lead to own it instead." The action must be:
1. Specific enough to visualize doing it
2. Small enough to do this week
3. Connected to the data patterns you just described
4. Phrased as an experiment, not a mandate ("Try..." or "This week, experiment with...")

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
	identityAnchor: string | null;
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
**Current Week**: ${context.currentWeek} (Topic: ${context.weeklyPromptTopic})

**This Week's Self-Scores**:
  Effort: ${context.thisWeekScores.effort ?? 'Not submitted'}
  Performance: ${context.thisWeekScores.performance ?? 'Not submitted'}

**Last 3 Weeks Trend**:
${trendLines || '  No prior data.'}

**Stakeholder Feedback (this week)**:
${stakeholderLines}

---

Provide a 2-3 sentence developmental observation. Be specific about the pattern you see. If there's an effort-performance gap, name it and explain what it might mean at this stage of their journey. Reference the weekly theme (${context.weeklyPromptTopic}) if relevant. End with a specific behavioral experiment they can try this week — something concrete enough to visualize doing it.`;
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

	const identityLine = context.identityAnchor
		? `**Identity Anchor**: "${context.identityAnchor}"`
		: '**Identity Anchor**: Not yet set';

	return `## Weekly Synthesis Request

**Objective**: ${context.objectiveTitle}
**Subgoals**: ${context.subgoals.join(', ')}
**Week**: ${context.currentWeek}
${identityLine}

**This Week's Reflections**:
${reflectionLines || '  No reflections submitted.'}

**Previous 3 Weeks Trend**:
${trendLines || '  No prior data.'}

**Stakeholder Feedback**:
${stakeholderLines}

**Coach Notes**:
${coachNoteLines}

---

Begin your synthesis by referencing the person's identity anchor (who they said they are becoming in Week 1). Connect this week's patterns to that identity. Example: "You said you're becoming a leader who trusts their team. This week's data suggests [specific pattern]."

Provide a 3-5 sentence synthesis that includes:
1. **Identity connection** — link this week's data to who they are becoming
2. **Key observation** about this week's data
3. **Effort-performance gap analysis** (if applicable)
4. **Stakeholder alignment note** (do others see what the individual sees?)
5. **One specific behavioral experiment** for next week (concrete enough to visualize doing it)

Be concrete. Use numbers. Name patterns.`;
}

export type CycleReportContext = {
	objectiveTitle: string;
	subgoals: string[];
	cycleStartDate: string;
	currentWeek: number;
	totalWeeks: number;
	identityAnchor: string | null;
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
	coachNotes: string[];
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
							parts.push(
								`Effort gap ${g.latestEffortGap > 0 ? '+' : ''}${g.latestEffortGap.toFixed(1)} (${g.effortGapTrend ?? 'unknown'})`
							);
						if (g.latestPerformanceGap !== null)
							parts.push(
								`Performance gap ${g.latestPerformanceGap > 0 ? '+' : ''}${g.latestPerformanceGap.toFixed(1)} (${g.performanceGapTrend ?? 'unknown'})`
							);
						return parts.join(' ');
					})
					.join('\n')
			: '  No perception gap data available.';

	const coachNoteLines =
		context.coachNotes.length > 0
			? context.coachNotes.map((n) => `  - "${n}"`).join('\n')
			: '  No coach notes.';

	const identityLine = context.identityAnchor
		? `**Identity Anchor**: "${context.identityAnchor}"`
		: '**Identity Anchor**: Not set';

	return `## Cycle Performance Report Request

**Objective**: ${context.objectiveTitle}
**Subgoals**: ${context.subgoals.join(', ')}
**Cycle Start**: ${context.cycleStartDate}
**Current Week**: ${context.currentWeek} of ${context.totalWeeks}
${identityLine}
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

**Coach Notes**:
${coachNoteLines}

---

Write a comprehensive developmental performance report. Use ## markdown headers for each section. Include exactly these six sections:

If an identity anchor is provided, open the report with: "X weeks ago, you said you were becoming [identity anchor]. Here's what the data shows about that journey."

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
Exactly 3 concrete, actionable recommendations. Each must tie directly to a finding from the analysis above. Each recommendation must include a specific behavioral experiment — something concrete enough to visualize doing it this week (e.g. "In your next 1:1, ask your direct report: 'What's one decision I should hand off to you?'").`;
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
4. **Behavioral experiments to propose** (2-3 specific, small experiments the coach can suggest to the client for the coming week — each must be concrete enough to visualize doing it, e.g. "In your next team meeting, try waiting 10 seconds after asking a question before filling the silence")
5. **Risk flags** (anything concerning that needs attention)

Be specific and actionable. The coach needs to walk into a session prepared.`;
}

export { SYSTEM_MESSAGE };
