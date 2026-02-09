import prisma from '$lib/server/prisma';
import {
	toIsoDate,
	weeksBetween,
	computeWeekNumber,
	weekNumberForDate,
	stdDev
} from './coachUtils';

type IndividualWithRelations = {
	id: string;
	email: string;
	name: string | null;
	objectives: Array<{
		id: string;
		title: string;
		description: string | null;
		subgoals: Array<{ id: string; label: string; description: string | null }>;
		cycles: Array<{
			id: string;
			label: string | null;
			startDate: Date;
			endDate: Date | null;
			status: string;
			stakeholderCadence?: string;
			autoThrottle?: boolean;
			reflections: Array<{
				id: string;
				weekNumber: number;
				reflectionType: string;
				submittedAt: Date | null;
				effortScore: number | null;
				performanceScore: number | null;
				notes: string | null;
			}>;
			coachNotes: Array<{
				id: string;
				content: string;
				weekNumber: number | null;
				createdAt: Date;
			}>;
		}>;
		stakeholders: Array<{
			id: string;
			name: string;
			email: string;
			feedbacks: Array<{
				submittedAt: Date | null;
				effortScore: number | null;
				performanceScore: number | null;
				reflection: {
					weekNumber: number;
					effortScore: number | null;
					performanceScore: number | null;
				} | null;
			}>;
		}>;
	}>;
};

type CoachClient = {
	id: string;
	individualId: string;
	createdAt: Date;
	archivedAt: Date | null;
};

export type ClientSummary = {
	id: string;
	name: string;
	email: string;
	archived: boolean;
	joinedAt: string;
	archivedAt: string | null;
	objective: {
		id: string;
		title: string;
		description: string;
		cycle: {
			id: string;
			label: string;
			startDate: string | null;
			endDate: string | null;
			status: string;
			completion: number;
			weeksElapsed: number;
			currentWeek: number | null;
			stakeholderCadence: string;
			autoThrottle: boolean;
			recentReflections: Array<{
				weekNumber: number;
				effortScore: number | null;
				performanceScore: number | null;
			}>;
		} | null;
		subgoalCount: number;
		stakeholderCount: number;
		respondedStakeholders: number;
		insights: {
			avgEffort: number | null;
			avgProgress: number | null;
			stabilityScore: number | null;
			trajectoryScore: number | null;
			alignmentRatio: number | null;
		} | null;
	} | null;
	stakeholders: Array<{
		id: string;
		name: string;
		email: string;
		lastFeedback: {
			submittedAt: string | null;
			effortScore: number | null;
			performanceScore: number | null;
			weekNumber: number | null;
		} | null;
	}>;
	alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }>;
	coachNotes: Array<{
		id: string;
		content: string;
		weekNumber: number | null;
		createdAt: string;
	}>;
	visualizationData?: {
		individual: Array<{
			weekNumber: number;
			effortScore: number | null;
			performanceScore: number | null;
		}>;
		stakeholders: Array<{
			weekNumber: number;
			stakeholderId: string;
			stakeholderName: string;
			effortScore: number | null;
			performanceScore: number | null;
		}>;
		stakeholderList: Array<{ id: string; name: string }>;
	};
};

export function buildClientSummary(
	relationship: CoachClient,
	individual: IndividualWithRelations | null
): ClientSummary | null {
	if (!individual) {
		return null;
	}

	const objective = individual.objectives[0] ?? null;
	const cycle = objective?.cycles[0] ?? null;
	const cycleEnd = cycle?.endDate ?? null;
	const totalWeeks = cycle && cycleEnd ? weeksBetween(cycle.startDate, cycleEnd) : 0;
	const currentTime = new Date();
	const weeksElapsed = cycle
		? Math.max(
				0,
				Math.floor((currentTime.getTime() - cycle.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
			)
		: 0;
	const completion =
		totalWeeks > 0 ? Math.min(100, Math.round((weeksElapsed / totalWeeks) * 100)) : 0;
	const currentWeek = cycle ? computeWeekNumber(cycle.startDate) : null;

	const reflectionTrendMap = new Map<
		number,
		{
			weekNumber: number;
			effortScores: number[];
			performanceScores: number[];
		}
	>();

	cycle?.reflections.forEach((reflection) => {
		const weekEntry = reflectionTrendMap.get(reflection.weekNumber) ?? {
			weekNumber: reflection.weekNumber,
			effortScores: [],
			performanceScores: []
		};

		if (reflection.effortScore !== null && reflection.effortScore !== undefined) {
			weekEntry.effortScores.push(reflection.effortScore);
		}
		if (reflection.performanceScore !== null && reflection.performanceScore !== undefined) {
			weekEntry.performanceScores.push(reflection.performanceScore);
		}

		reflectionTrendMap.set(reflection.weekNumber, weekEntry);
	});

	const trendWeeks = Array.from(reflectionTrendMap.values())
		.sort((a, b) => b.weekNumber - a.weekNumber)
		.slice(0, 4);

	const effortSeries: number[] = [];
	const progressSeries: number[] = [];

	const reflectionTrend = trendWeeks.map((week) => {
		const effortAverage =
			week.effortScores.length > 0
				? Number(
						(week.effortScores.reduce((sum, score) => sum + score, 0) / week.effortScores.length).toFixed(
							1
						)
					)
				: null;
		if (effortAverage !== null) effortSeries.push(effortAverage);

		const progressAverage =
			week.performanceScores.length > 0
				? Number(
						(
							week.performanceScores.reduce((sum, score) => sum + score, 0) /
							week.performanceScores.length
						).toFixed(1)
					)
				: null;
		if (progressAverage !== null) progressSeries.push(progressAverage);

		return {
			weekNumber: week.weekNumber,
			effortScore: effortAverage,
			performanceScore: progressAverage
		};
	});

	const effortStd = stdDev(effortSeries);
	const progressStd = stdDev(progressSeries);
	const stdValues = [effortStd, progressStd].filter((value): value is number => value !== null);
	const combinedStd =
		stdValues.length > 0
			? stdValues.reduce((sum, value) => sum + value, 0) / stdValues.length
			: null;
	const stabilityScore =
		combinedStd !== null ? Math.max(0, Math.round(100 - combinedStd * 10)) : null;

	// Trajectory: linear regression slope of last 4 weeks combined effort+performance
	let trajectoryScore: number | null = null;
	if (trendWeeks.length >= 2) {
		const points: { x: number; y: number }[] = [];
		for (const week of trendWeeks) {
			const effortAvg =
				week.effortScores.length > 0
					? week.effortScores.reduce((s, v) => s + v, 0) / week.effortScores.length
					: null;
			const perfAvg =
				week.performanceScores.length > 0
					? week.performanceScores.reduce((s, v) => s + v, 0) / week.performanceScores.length
					: null;
			const vals = [effortAvg, perfAvg].filter((v): v is number => v !== null);
			if (vals.length > 0) {
				points.push({ x: week.weekNumber, y: vals.reduce((a, b) => a + b, 0) / vals.length });
			}
		}
		if (points.length >= 2) {
			const n = points.length;
			const sumX = points.reduce((s, p) => s + p.x, 0);
			const sumY = points.reduce((s, p) => s + p.y, 0);
			const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
			const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
			const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
			trajectoryScore = Math.max(-100, Math.min(100, Math.round(slope * 25)));
		}
	}

	let respondedStakeholders = 0;
	const stakeholders =
		objective?.stakeholders.map((stakeholder) => {
			const lastFeedback = stakeholder.feedbacks[0] ?? null;
			let feedbackWeek: number | null = null;
			if (lastFeedback?.submittedAt && cycle) {
				feedbackWeek = weekNumberForDate(cycle.startDate, lastFeedback.submittedAt);
				if (currentWeek !== null && feedbackWeek === currentWeek) {
					respondedStakeholders += 1;
				}
			}
			return {
				id: stakeholder.id,
				name: stakeholder.name,
				email: stakeholder.email,
				lastFeedback: lastFeedback
					? {
							submittedAt: lastFeedback.submittedAt?.toISOString() ?? null,
							effortScore: lastFeedback.effortScore,
							performanceScore: lastFeedback.performanceScore,
							weekNumber: feedbackWeek
						}
					: null
			};
		}) ?? [];

	const alignmentRatio = objective?.stakeholders.length
		? respondedStakeholders / objective.stakeholders.length
		: null;

	const avgEffort =
		effortSeries.length > 0
			? Number(
					(effortSeries.reduce((sum, value) => sum + value, 0) / effortSeries.length).toFixed(1)
				)
			: null;
	const avgProgress =
		progressSeries.length > 0
			? Number(
					(progressSeries.reduce((sum, value) => sum + value, 0) / progressSeries.length).toFixed(1)
				)
			: null;

	// Calculate alerts
	const alerts: Array<{ type: string; message: string; severity: 'low' | 'medium' | 'high' }> = [];

	if (cycle && currentWeek) {
		// Overdue reflections check
		const submittedTypes = new Set(
			cycle.reflections
				.filter((r) => r.weekNumber === currentWeek)
				.map((r) => r.reflectionType)
		);
		const overdueTypes: string[] = [];
		if (!submittedTypes.has('INTENTION')) overdueTypes.push('Monday intention');
		if (!submittedTypes.has('RATING_A')) overdueTypes.push('Wednesday check-in');
		if (!submittedTypes.has('RATING_B')) overdueTypes.push('Friday check-in');

		if (overdueTypes.length > 0) {
			alerts.push({
				type: 'overdue',
				message: `Missing: ${overdueTypes.join(', ')}`,
				severity: overdueTypes.length >= 2 ? 'high' : 'medium'
			});
		}

		// Engagement check (reflection completion rate)
		const expectedReflections = currentWeek * 3; // 3 per week (intention, effort, progress)
		const actualReflections = cycle.reflections.length;
		const completionRate = expectedReflections > 0 ? actualReflections / expectedReflections : 0;

		if (completionRate < 0.7 && currentWeek >= 2) {
			alerts.push({
				type: 'low_engagement',
				message: `Reflection completion: ${Math.round(completionRate * 100)}% (below 70%)`,
				severity: completionRate < 0.5 ? 'high' : 'medium'
			});
		}

		// Alignment check (self-other gap)
		if (objective?.stakeholders.length && cycle.reflections.length > 0) {
			const recentReflections = cycle.reflections
				.filter((r) => r.weekNumber >= currentWeek - 3 && r.weekNumber <= currentWeek)
				.filter((r) => r.effortScore !== null || r.performanceScore !== null);

			if (recentReflections.length > 0) {
				const alignmentIssues: number[] = [];
				for (const reflection of recentReflections) {
					const reflectionFeedbacks = objective.stakeholders
						.flatMap((s) => s.feedbacks)
						.filter((f) => f.reflection?.weekNumber === reflection.weekNumber);

					if (reflectionFeedbacks.length > 0) {
						const avgStakeholderEffort =
							reflectionFeedbacks
								.map((f) => f.effortScore)
								.filter((s): s is number => s !== null)
								.reduce((sum, s) => sum + s, 0) / reflectionFeedbacks.length;

						const avgStakeholderProgress =
							reflectionFeedbacks
								.map((f) => f.performanceScore)
								.filter((s): s is number => s !== null)
								.reduce((sum, s) => sum + s, 0) / reflectionFeedbacks.length;

						if (reflection.effortScore !== null) {
							const effortGap = Math.abs(reflection.effortScore - avgStakeholderEffort);
							if (effortGap > 1.5) alignmentIssues.push(reflection.weekNumber);
						}
						if (reflection.performanceScore !== null) {
							const progressGap = Math.abs(reflection.performanceScore - avgStakeholderProgress);
							if (progressGap > 1.5) alignmentIssues.push(reflection.weekNumber);
						}
					}
				}

				const uniqueWeeksWithIssues = new Set(alignmentIssues).size;
				if (uniqueWeeksWithIssues >= 3) {
					alerts.push({
						type: 'low_alignment',
						message: `Self-other gap detected in ${uniqueWeeksWithIssues} recent weeks`,
						severity: uniqueWeeksWithIssues >= 4 ? 'high' : 'medium'
					});
				}
			}
		}
	}

	// Get coach notes for this client
	const coachNotes = cycle?.coachNotes ?? [];

	// Prepare visualization data (all weeks, not just last 4)
	const allReflectionWeeks = Array.from(reflectionTrendMap.values()).sort(
		(a, b) => a.weekNumber - b.weekNumber
	);

	const individualWeeklyData = allReflectionWeeks.map((week) => {
		const effortAverage =
			week.effortScores.length > 0
				? Number((week.effortScores.reduce((sum, score) => sum + score, 0) / week.effortScores.length).toFixed(1))
				: null;
		const progressAverage =
			week.performanceScores.length > 0
				? Number((week.performanceScores.reduce((sum, score) => sum + score, 0) / week.performanceScores.length).toFixed(1))
				: null;

		return {
			weekNumber: week.weekNumber,
			effortScore: effortAverage,
			performanceScore: progressAverage
		};
	});

	// Prepare stakeholder feedback data by week for visualization
	const stakeholderWeeklyData: Array<{
		weekNumber: number;
		stakeholderId: string;
		stakeholderName: string;
		effortScore: number | null;
		performanceScore: number | null;
	}> = [];

	objective?.stakeholders.forEach((stakeholder) => {
		stakeholder.feedbacks.forEach((feedback) => {
			if (feedback.reflection) {
				stakeholderWeeklyData.push({
					weekNumber: feedback.reflection.weekNumber,
					stakeholderId: stakeholder.id,
					stakeholderName: stakeholder.name,
					effortScore: feedback.effortScore,
					performanceScore: feedback.performanceScore
				});
			}
		});
	});

	return {
		id: individual.id,
		name: individual.name ?? individual.email,
		email: individual.email,
		objective: objective
			? {
					id: objective.id,
					title: objective.title,
					description: objective.description ?? '',
					cycle: cycle
						? {
								id: cycle.id,
								label: cycle.label ?? 'Cycle',
								startDate: toIsoDate(cycle.startDate),
								endDate: toIsoDate(cycle.endDate ?? null),
								status: cycle.status,
								completion,
								weeksElapsed,
								currentWeek: currentWeek ?? null,
								stakeholderCadence: cycle.stakeholderCadence ?? 'weekly',
								autoThrottle: cycle.autoThrottle ?? true,
								recentReflections: reflectionTrend
							}
						: null,
					subgoalCount: objective.subgoals.length,
					stakeholderCount: stakeholders.length,
					respondedStakeholders,
					insights: cycle
						? {
								avgEffort,
								avgProgress,
								stabilityScore,
								trajectoryScore,
								alignmentRatio
							}
						: null
				}
			: null,
		stakeholders,
		alerts,
		coachNotes: coachNotes.map((note) => ({
			id: note.id,
			content: note.content,
			weekNumber: note.weekNumber,
			createdAt: note.createdAt.toISOString()
		})),
		archived: relationship.archivedAt !== null,
		joinedAt: relationship.createdAt.toISOString(),
		archivedAt: relationship.archivedAt?.toISOString() ?? null,
		visualizationData: cycle
			? {
					individual: individualWeeklyData,
					stakeholders: stakeholderWeeklyData,
					stakeholderList: stakeholders.map((s) => ({ id: s.id, name: s.name }))
				}
			: undefined
	};
}

