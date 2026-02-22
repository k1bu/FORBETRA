import { redirect } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { requireRole } from '$lib/server/auth';
import { computeWeekNumber } from '$lib/server/coachUtils';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const { dbUser } = requireRole(event, 'INDIVIDUAL');

	const objective = await prisma.objective.findFirst({
		where: { userId: dbUser.id, active: true },
		orderBy: { createdAt: 'desc' },
		include: {
			subgoals: { orderBy: { createdAt: 'asc' } },
			cycles: {
				orderBy: { startDate: 'desc' },
				take: 1,
				include: {
					reflections: {
						select: {
							id: true,
							reflectionType: true,
							weekNumber: true,
							effortScore: true,
							performanceScore: true,
							notes: true
						}
					}
				}
			},
			stakeholders: {
				orderBy: { createdAt: 'asc' }
			}
		}
	});

	if (!objective || objective.cycles.length === 0) {
		throw redirect(303, '/individual');
	}

	const cycle = objective.cycles[0];
	const currentWeek = computeWeekNumber(cycle.startDate);

	const cycleEnd = cycle.endDate ?? null;
	const totalWeeks = cycleEnd
		? Math.max(1, Math.ceil((cycleEnd.getTime() - cycle.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)))
		: currentWeek;

	// Week navigation via query param
	const weekParam = event.url.searchParams.get('week');
	const viewWeek = weekParam ? Math.max(1, Math.min(totalWeeks, parseInt(weekParam, 10) || currentWeek)) : currentWeek;

	// Build stakeholder name map
	const stakeholderNameMap = new Map<string, string>();
	for (const sh of objective.stakeholders) {
		stakeholderNameMap.set(sh.id, sh.name);
	}

	// Load all feedbacks for this cycle
	const allFeedbacks = await prisma.feedback.findMany({
		where: {
			stakeholder: { objectiveId: objective.id },
			reflection: { cycleId: cycle.id }
		},
		select: {
			stakeholderId: true,
			effortScore: true,
			performanceScore: true,
			comment: true,
			reflection: { select: { weekNumber: true } }
		}
	});

	// Self scores: average effort/performance for viewWeek
	const selfReflections = cycle.reflections.filter(r => r.weekNumber === viewWeek);
	const selfEfforts = selfReflections.map(r => r.effortScore).filter((v): v is number => v !== null);
	const selfPerfs = selfReflections.map(r => r.performanceScore).filter((v): v is number => v !== null);
	const avg = (arr: number[]) => arr.length > 0 ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : null;

	const myEffort = avg(selfEfforts);
	const myPerformance = avg(selfPerfs);

	// Self notes for this week
	const selfNotes = selfReflections
		.filter(r => r.notes && r.notes.trim().length > 0)
		.map(r => r.notes!)
		.slice(0, 3);

	// Build per-stakeholder scorecard for viewWeek
	type ScorecardRow = {
		stakeholderId: string;
		stakeholderName: string;
		stakeholderEffort: number | null;
		stakeholderPerformance: number | null;
		comment: string | null;
		effortGap: number | null;
		performanceGap: number | null;
		effortGapTrend: 'widening' | 'closing' | 'stable' | null;
		performanceGapTrend: 'widening' | 'closing' | 'stable' | null;
		maxAbsGap: number;
	};

	const scorecard: ScorecardRow[] = [];

	// Group feedbacks by stakeholder and week
	const shWeekMap = new Map<string, Map<number, { efforts: number[]; performances: number[]; comments: string[] }>>();
	for (const fb of allFeedbacks) {
		if (!fb.reflection) continue;
		const wk = fb.reflection.weekNumber;
		const shId = fb.stakeholderId;

		if (!shWeekMap.has(shId)) shWeekMap.set(shId, new Map());
		const shWeeks = shWeekMap.get(shId)!;
		if (!shWeeks.has(wk)) shWeeks.set(wk, { efforts: [], performances: [], comments: [] });
		const w = shWeeks.get(wk)!;
		if (fb.effortScore !== null) w.efforts.push(fb.effortScore);
		if (fb.performanceScore !== null) w.performances.push(fb.performanceScore);
		if (fb.comment && fb.comment.trim().length > 0) w.comments.push(fb.comment.trim());
	}

	// Self scores per week (for trend computation)
	const selfWeekMap = new Map<number, { effort: number | null; performance: number | null }>();
	for (let wk = 1; wk <= totalWeeks; wk++) {
		const refs = cycle.reflections.filter(r => r.weekNumber === wk);
		const effs = refs.map(r => r.effortScore).filter((v): v is number => v !== null);
		const prfs = refs.map(r => r.performanceScore).filter((v): v is number => v !== null);
		selfWeekMap.set(wk, { effort: avg(effs), performance: avg(prfs) });
	}

	function computeTrend(
		shWeeks: Map<number, { efforts: number[]; performances: number[] }>,
		getSelf: (wk: number) => number | null,
		getStk: (wk: number, data: { efforts: number[]; performances: number[] }) => number | null
	): 'widening' | 'closing' | 'stable' | null {
		const pairedGaps: number[] = [];
		const weeks = Array.from(shWeeks.keys()).sort((a, b) => a - b);
		for (const wk of weeks) {
			const s = getSelf(wk);
			const stk = getStk(wk, shWeeks.get(wk)!);
			if (s !== null && stk !== null) pairedGaps.push(Math.abs(s - stk));
		}
		if (pairedGaps.length < 2) return null;
		const recent = pairedGaps.slice(-3);
		let totalDelta = 0;
		for (let i = 1; i < recent.length; i++) totalDelta += recent[i] - recent[i - 1];
		const avgDelta = totalDelta / (recent.length - 1);
		if (avgDelta > 0.5) return 'widening';
		if (avgDelta < -0.5) return 'closing';
		return 'stable';
	}

	for (const sh of objective.stakeholders) {
		const shWeeks = shWeekMap.get(sh.id);
		const viewData = shWeeks?.get(viewWeek);

		const stkEffort = viewData ? avg(viewData.efforts) : null;
		const stkPerf = viewData ? avg(viewData.performances) : null;
		const comment = viewData?.comments[viewData.comments.length - 1] ?? null;

		const effortGap = (myEffort !== null && stkEffort !== null) ? Number((myEffort - stkEffort).toFixed(1)) : null;
		const perfGap = (myPerformance !== null && stkPerf !== null) ? Number((myPerformance - stkPerf).toFixed(1)) : null;

		const effortGapTrend = shWeeks ? computeTrend(
			shWeeks,
			(wk) => selfWeekMap.get(wk)?.effort ?? null,
			(wk, data) => avg(data.efforts)
		) : null;
		const performanceGapTrend = shWeeks ? computeTrend(
			shWeeks,
			(wk) => selfWeekMap.get(wk)?.performance ?? null,
			(wk, data) => avg(data.performances)
		) : null;

		scorecard.push({
			stakeholderId: sh.id,
			stakeholderName: stakeholderNameMap.get(sh.id) ?? sh.name,
			stakeholderEffort: stkEffort,
			stakeholderPerformance: stkPerf,
			comment,
			effortGap,
			performanceGap: perfGap,
			effortGapTrend,
			performanceGapTrend,
			maxAbsGap: Math.max(Math.abs(effortGap ?? 0), Math.abs(perfGap ?? 0))
		});
	}

	return {
		viewWeek,
		currentWeek,
		totalWeeks,
		myEffort,
		myPerformance,
		selfNotes,
		scorecard,
		objectiveTitle: objective.title
	};
};
