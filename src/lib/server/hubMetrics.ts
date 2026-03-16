import { parseCheckInDays } from '$lib/utils/checkInDays';

// ---------- Shared types ----------

export interface ReflectionData {
	id: string;
	reflectionType: string;
	weekNumber: number;
	effortScore: number | null;
	performanceScore: number | null;
}

export interface FeedbackData {
	stakeholderId: string;
	effortScore: number | null;
	performanceScore: number | null;
	reflection: { weekNumber: number } | null;
}

export interface StakeholderRef {
	id: string;
	name: string;
}

// ---------- Helpers ----------

function avg(arr: number[]): number | null {
	return arr.length > 0 ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : null;
}

// ---------- Completion metrics ----------

export function computeCompletionMetrics(
	reflections: ReflectionData[],
	currentWeek: number,
	checkInFrequency: string
) {
	const checkInDays = parseCheckInDays(checkInFrequency);
	const checksPerWeek = checkInDays.length;
	const totalExpected = currentWeek * checksPerWeek;
	const totalCompleted = reflections.length;
	const completionRate =
		totalExpected > 0 ? Math.min(100, Math.round((totalCompleted / totalExpected) * 100)) : 0;

	const currentWeekReflections = reflections.filter((r) => r.weekNumber === currentWeek);
	const ratingACount = currentWeekReflections.filter((r) => r.reflectionType === 'RATING_A').length;
	const openExperiences = Math.max(0, checksPerWeek - ratingACount);

	// Current streak
	const completedSet = new Set<string>();
	reflections.forEach((r) => completedSet.add(`${r.weekNumber}-${r.reflectionType}`));

	const expectedSequence: Array<{ week: number; type: string }> = [];
	for (let week = 1; week <= currentWeek; week++) {
		for (let d = 0; d < checkInDays.length; d++) {
			expectedSequence.push({ week, type: 'RATING_A' });
		}
	}

	let currentStreak = 0;
	for (let i = expectedSequence.length - 1; i >= 0; i--) {
		const key = `${expectedSequence[i].week}-${expectedSequence[i].type}`;
		if (completedSet.has(key)) {
			currentStreak++;
		} else {
			break;
		}
	}

	return { completionRate, currentStreak, totalExpected, totalCompleted, openExperiences };
}

// ---------- Next action ----------

export function computeNextAction(
	reflections: ReflectionData[],
	currentWeek: number,
	checkInFrequency: string
): { type: 'RATING_A'; label: string; url: string | null; state: 'open' | 'missed' | 'upcoming' } {
	const checkInDays = parseCheckInDays(checkInFrequency);
	const ratingACount = reflections.filter(
		(r) => r.weekNumber === currentWeek && r.reflectionType === 'RATING_A'
	).length;

	if (ratingACount < checkInDays.length) {
		return {
			type: 'RATING_A',
			label: 'Complete your check-in',
			url: '/individual/checkin',
			state: 'open'
		};
	}
	return {
		type: 'RATING_A',
		label: 'All check-ins complete this week',
		url: null,
		state: 'upcoming'
	};
}

// ---------- My last ratings ----------

export function computeMyLastRatings(reflections: ReflectionData[]) {
	const withRatings = reflections
		.filter((r) => r.effortScore !== null || r.performanceScore !== null)
		.sort((a, b) => {
			if (a.weekNumber !== b.weekNumber) return b.weekNumber - a.weekNumber;
			const order: Record<string, number> = { RATING_A: 0, RATING_B: 1 };
			return (order[b.reflectionType] ?? 0) - (order[a.reflectionType] ?? 0);
		});

	if (withRatings.length === 0) return null;

	const latestWeek = withRatings[0].weekNumber;
	const latestWeekRefs = withRatings.filter((r) => r.weekNumber === latestWeek);

	const latestEffort = avg(
		latestWeekRefs.map((r) => r.effortScore).filter((v): v is number => v !== null)
	);
	const latestPerformance = avg(
		latestWeekRefs.map((r) => r.performanceScore).filter((v): v is number => v !== null)
	);

	let previousEffort: number | null = null;
	let previousPerformance: number | null = null;

	if (latestWeek > 1) {
		const prevRefs = reflections.filter((r) => r.weekNumber === latestWeek - 1);
		previousEffort = avg(prevRefs.map((r) => r.effortScore).filter((v): v is number => v !== null));
		previousPerformance = avg(
			prevRefs.map((r) => r.performanceScore).filter((v): v is number => v !== null)
		);
	}

	return {
		effort: latestEffort,
		performance: latestPerformance,
		effortChange:
			latestEffort !== null && previousEffort !== null ? latestEffort - previousEffort : null,
		performanceChange:
			latestPerformance !== null && previousPerformance !== null
				? latestPerformance - previousPerformance
				: null,
		weekNumber: latestWeek
	};
}

// ---------- Stakeholders last ratings ----------

export function computeStakeholdersLastRatings(feedbacks: FeedbackData[]) {
	if (feedbacks.length === 0) return null;

	const byWeek = new Map<
		number,
		Array<{ effortScore: number | null; performanceScore: number | null }>
	>();
	for (const fb of feedbacks) {
		if (!fb.reflection) continue;
		const wk = fb.reflection.weekNumber;
		if (!byWeek.has(wk)) byWeek.set(wk, []);
		byWeek.get(wk)!.push({ effortScore: fb.effortScore, performanceScore: fb.performanceScore });
	}

	if (byWeek.size === 0) return null;

	const latestWeek = Math.max(...byWeek.keys());
	const latestFeedbacks = byWeek.get(latestWeek)!;

	const latestEffort = avg(
		latestFeedbacks.map((f) => f.effortScore).filter((v): v is number => v !== null)
	);
	const latestPerformance = avg(
		latestFeedbacks.map((f) => f.performanceScore).filter((v): v is number => v !== null)
	);

	let previousEffort: number | null = null;
	let previousPerformance: number | null = null;

	const prevWeek = latestWeek - 1;
	if (byWeek.has(prevWeek)) {
		const prevFeedbacks = byWeek.get(prevWeek)!;
		previousEffort = avg(
			prevFeedbacks.map((f) => f.effortScore).filter((v): v is number => v !== null)
		);
		previousPerformance = avg(
			prevFeedbacks.map((f) => f.performanceScore).filter((v): v is number => v !== null)
		);
	}

	return {
		effort: latestEffort,
		performance: latestPerformance,
		effortChange:
			latestEffort !== null && previousEffort !== null ? latestEffort - previousEffort : null,
		performanceChange:
			latestPerformance !== null && previousPerformance !== null
				? latestPerformance - previousPerformance
				: null,
		weekNumber: latestWeek
	};
}

// ---------- Heat map ----------

export function computeHeatMap(
	reflections: ReflectionData[],
	currentWeek: number,
	cycleStartDate: Date,
	cycleEndDate: Date | null
) {
	const totalWeeks = cycleEndDate
		? Math.max(
				1,
				Math.ceil((cycleEndDate.getTime() - cycleStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
			)
		: currentWeek;

	const weekMap = new Map<number, { efforts: number[]; performances: number[] }>();
	for (const r of reflections) {
		if (!weekMap.has(r.weekNumber)) weekMap.set(r.weekNumber, { efforts: [], performances: [] });
		const w = weekMap.get(r.weekNumber)!;
		if (r.effortScore !== null) w.efforts.push(r.effortScore);
		if (r.performanceScore !== null) w.performances.push(r.performanceScore);
	}

	const weeks: Array<{ weekNumber: number; effort: number | null; performance: number | null }> =
		[];
	for (let wk = 1; wk <= totalWeeks; wk++) {
		const d = weekMap.get(wk);
		weeks.push({
			weekNumber: wk,
			effort: d ? avg(d.efforts) : null,
			performance: d ? avg(d.performances) : null
		});
	}

	return { weeks, totalWeeks };
}

// ---------- Visualization data ----------

export function computeVisualizationData(
	heatMapWeeks: Array<{ weekNumber: number; effort: number | null; performance: number | null }>,
	feedbacks: FeedbackData[],
	stakeholders: StakeholderRef[]
) {
	const nameMap = new Map(stakeholders.map((s) => [s.id, s.name]));

	const individual = heatMapWeeks.map((w) => ({
		weekNumber: w.weekNumber,
		effortScore: w.effort,
		performanceScore: w.performance
	}));

	const stakeholderData = feedbacks
		.filter((fb) => fb.reflection !== null)
		.map((fb) => ({
			weekNumber: fb.reflection!.weekNumber,
			stakeholderId: fb.stakeholderId,
			stakeholderName: nameMap.get(fb.stakeholderId) ?? 'Unknown',
			effortScore: fb.effortScore,
			performanceScore: fb.performanceScore
		}));

	const stakeholderList = stakeholders.map((s) => ({ id: s.id, name: s.name }));

	return { individual, stakeholders: stakeholderData, stakeholderList };
}

// ---------- Perception gaps ----------

export function computePerceptionGaps(
	feedbacks: FeedbackData[],
	reflections: ReflectionData[],
	stakeholders: StakeholderRef[]
) {
	const nameMap = new Map(stakeholders.map((s) => [s.id, s.name]));

	// Build per-stakeholder, per-week feedback buckets
	const shWeekMap = new Map<string, Map<number, { efforts: number[]; performances: number[] }>>();
	for (const fb of feedbacks) {
		if (!fb.reflection) continue;
		const wk = fb.reflection.weekNumber;
		const shId = fb.stakeholderId;
		if (!shWeekMap.has(shId)) shWeekMap.set(shId, new Map());
		const shWeeks = shWeekMap.get(shId)!;
		if (!shWeeks.has(wk)) shWeeks.set(wk, { efforts: [], performances: [] });
		const w = shWeeks.get(wk)!;
		if (fb.effortScore !== null) w.efforts.push(fb.effortScore);
		if (fb.performanceScore !== null) w.performances.push(fb.performanceScore);
	}

	// Self scores per week
	const selfWeekMap = new Map<number, { efforts: number[]; performances: number[] }>();
	for (const r of reflections) {
		if (!selfWeekMap.has(r.weekNumber))
			selfWeekMap.set(r.weekNumber, { efforts: [], performances: [] });
		const w = selfWeekMap.get(r.weekNumber)!;
		if (r.effortScore !== null) w.efforts.push(r.effortScore);
		if (r.performanceScore !== null) w.performances.push(r.performanceScore);
	}

	return Array.from(shWeekMap.entries())
		.map(([shId, shWeeks]) => {
			const pairedWeeks: Array<{
				weekNumber: number;
				selfEffort: number;
				selfPerf: number;
				stkEffort: number;
				stkPerf: number;
			}> = [];

			for (const [wk, stkScores] of shWeeks) {
				const selfScores = selfWeekMap.get(wk);
				if (!selfScores) continue;

				const selfEff = avg(selfScores.efforts);
				const selfPrf = avg(selfScores.performances);
				const stkEff = avg(stkScores.efforts);
				const stkPrf = avg(stkScores.performances);

				if (selfEff !== null && selfPrf !== null && stkEff !== null && stkPrf !== null) {
					pairedWeeks.push({
						weekNumber: wk,
						selfEffort: selfEff,
						selfPerf: selfPrf,
						stkEffort: stkEff,
						stkPerf: stkPrf
					});
				}
			}

			pairedWeeks.sort((a, b) => a.weekNumber - b.weekNumber);

			if (pairedWeeks.length === 0) {
				return {
					stakeholderId: shId,
					stakeholderName: nameMap.get(shId) ?? 'Unknown',
					effortGap: null as number | null,
					performanceGap: null as number | null,
					effortGapTrend: null as 'widening' | 'closing' | 'stable' | null,
					performanceGapTrend: null as 'widening' | 'closing' | 'stable' | null,
					maxAbsGap: 0
				};
			}

			const latest = pairedWeeks[pairedWeeks.length - 1];
			const effortGap = Number((latest.selfEffort - latest.stkEffort).toFixed(1));
			const performanceGap = Number((latest.selfPerf - latest.stkPerf).toFixed(1));

			const effortGapTrend = computeTrend(
				pairedWeeks,
				(p) => p.selfEffort,
				(p) => p.stkEffort
			);
			const performanceGapTrend = computeTrend(
				pairedWeeks,
				(p) => p.selfPerf,
				(p) => p.stkPerf
			);

			return {
				stakeholderId: shId,
				stakeholderName: nameMap.get(shId) ?? 'Unknown',
				effortGap,
				performanceGap,
				effortGapTrend,
				performanceGapTrend,
				maxAbsGap: Math.max(Math.abs(effortGap), Math.abs(performanceGap))
			};
		})
		.filter((g) => g.effortGap !== null || g.performanceGap !== null);
}

function computeTrend<T>(
	pairs: T[],
	getSelf: (p: T) => number,
	getStk: (p: T) => number
): 'widening' | 'closing' | 'stable' | null {
	if (pairs.length < 2) return null;
	const recent = pairs.slice(-3);
	const gaps = recent.map((p) => Math.abs(getSelf(p) - getStk(p)));
	if (gaps.length < 2) return null;

	let totalDelta = 0;
	for (let i = 1; i < gaps.length; i++) totalDelta += gaps[i] - gaps[i - 1];
	const avgDelta = totalDelta / (gaps.length - 1);

	if (avgDelta > 0.5) return 'widening';
	if (avgDelta < -0.5) return 'closing';
	return 'stable';
}

// ---------- Next check-in day ----------

export function computeNextCheckInDay(checkInFrequency: string): string {
	const dayNameMap: Record<string, string> = {
		mon: 'Monday',
		tue: 'Tuesday',
		wed: 'Wednesday',
		thu: 'Thursday',
		fri: 'Friday',
		sat: 'Saturday',
		sun: 'Sunday'
	};
	const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

	const labels = parseCheckInDays(checkInFrequency).map((d) => dayNameMap[d] ?? d);
	if (labels.length === 0) return 'Friday';

	const todayIndex = new Date().getDay();
	return labels
		.map((d) => ({ day: d, dist: (dayOrder.indexOf(d) - todayIndex + 7) % 7 || 7 }))
		.sort((a, b) => a.dist - b.dist)[0].day;
}
