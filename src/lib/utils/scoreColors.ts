// Two-color intensity system: amber for effort, indigo for performance
// Pale at low scores, deep at high scores

export type ScoreType = 'effort' | 'performance';

// --- Text color by intensity ---
export const getScoreColor = (score: number, type: ScoreType): string => {
	if (type === 'effort') {
		if (score <= 2) return 'text-amber-300';
		if (score <= 4) return 'text-amber-400';
		if (score <= 6) return 'text-amber-500';
		if (score <= 8) return 'text-amber-600';
		return 'text-amber-700';
	} else {
		if (score <= 2) return 'text-indigo-300';
		if (score <= 4) return 'text-indigo-400';
		if (score <= 6) return 'text-indigo-500';
		if (score <= 8) return 'text-indigo-600';
		return 'text-indigo-700';
	}
};

// --- Background + border classes ---
export const getScoreBgColor = (score: number, type: ScoreType): string => {
	if (type === 'effort') {
		if (score <= 2) return 'bg-amber-50 border-amber-200';
		if (score <= 4) return 'bg-amber-100 border-amber-300';
		if (score <= 6) return 'bg-amber-200/50 border-amber-400';
		if (score <= 8) return 'bg-amber-200 border-amber-500';
		return 'bg-amber-300/60 border-amber-600';
	} else {
		if (score <= 2) return 'bg-indigo-50 border-indigo-200';
		if (score <= 4) return 'bg-indigo-100 border-indigo-300';
		if (score <= 6) return 'bg-indigo-200/50 border-indigo-400';
		if (score <= 8) return 'bg-indigo-200 border-indigo-500';
		return 'bg-indigo-300/60 border-indigo-600';
	}
};

// --- Selected button fill ---
export const getButtonSelectedColors = (score: number, type: ScoreType): string => {
	if (type === 'effort') {
		if (score <= 2) return 'border-amber-300 bg-amber-300 text-white';
		if (score <= 4) return 'border-amber-400 bg-amber-400 text-white';
		if (score <= 6) return 'border-amber-500 bg-amber-500 text-white';
		if (score <= 8) return 'border-amber-600 bg-amber-600 text-white';
		return 'border-amber-700 bg-amber-700 text-white';
	} else {
		if (score <= 2) return 'border-indigo-300 bg-indigo-300 text-white';
		if (score <= 4) return 'border-indigo-400 bg-indigo-400 text-white';
		if (score <= 6) return 'border-indigo-500 bg-indigo-500 text-white';
		if (score <= 8) return 'border-indigo-600 bg-indigo-600 text-white';
		return 'border-indigo-700 bg-indigo-700 text-white';
	}
};

// --- Hover state classes ---
export const getButtonHoverColors = (score: number, type: ScoreType): string => {
	if (type === 'effort') {
		if (score <= 2) return 'hover:border-amber-200 hover:bg-amber-50';
		if (score <= 4) return 'hover:border-amber-300 hover:bg-amber-50';
		if (score <= 6) return 'hover:border-amber-400 hover:bg-amber-100';
		if (score <= 8) return 'hover:border-amber-500 hover:bg-amber-100';
		return 'hover:border-amber-600 hover:bg-amber-100';
	} else {
		if (score <= 2) return 'hover:border-indigo-200 hover:bg-indigo-50';
		if (score <= 4) return 'hover:border-indigo-300 hover:bg-indigo-50';
		if (score <= 6) return 'hover:border-indigo-400 hover:bg-indigo-100';
		if (score <= 8) return 'hover:border-indigo-500 hover:bg-indigo-100';
		return 'hover:border-indigo-600 hover:bg-indigo-100';
	}
};

// --- Focus ring color ---
export const getFocusRing = (score: number, type: ScoreType): string => {
	if (type === 'effort') {
		if (score <= 2) return 'focus:ring-amber-300';
		if (score <= 4) return 'focus:ring-amber-400';
		if (score <= 6) return 'focus:ring-amber-500';
		if (score <= 8) return 'focus:ring-amber-600';
		return 'focus:ring-amber-700';
	} else {
		if (score <= 2) return 'focus:ring-indigo-300';
		if (score <= 4) return 'focus:ring-indigo-400';
		if (score <= 6) return 'focus:ring-indigo-500';
		if (score <= 8) return 'focus:ring-indigo-600';
		return 'focus:ring-indigo-700';
	}
};

// --- Score labels ---
export const getScoreLabel = (score: number, type: 'effort' | 'progress'): string => {
	if (type === 'effort') {
		if (score <= 2) return 'Rarely intentional';
		if (score <= 4) return 'Sporadic effort';
		if (score <= 6) return 'Steady practice';
		if (score <= 8) return 'Highly disciplined';
		return 'Relentless commitment';
	} else {
		if (score <= 2) return 'Not yet visible';
		if (score <= 4) return 'Early signs';
		if (score <= 6) return 'Noticeable progress';
		if (score <= 8) return 'Consistent results';
		return 'Transformative impact';
	}
};

// --- Nullable variant for dashboard/insights ---
export const getScoreColorNullable = (score: number | null | undefined, type: ScoreType): string => {
	if (score === null || score === undefined) return 'text-neutral-400';
	return getScoreColor(score, type);
};

// --- Stability color (stays emerald-based, not effort/performance) ---
export const getStabilityColor = (score: number | null | undefined): string => {
	if (score === null || score === undefined) return 'text-neutral-400';
	if (score < 50) return 'text-amber-600';
	if (score < 75) return 'text-blue-600';
	return 'text-emerald-600';
};

// --- Chart.js RGB constants ---
export const CHART_COLORS = {
	effort: {
		individual: {
			border: 'rgb(217, 119, 6)',       // amber-600
			bg: 'rgba(217, 119, 6, 0.1)'
		},
		stakeholder: {
			border: 'rgb(245, 158, 11)',       // amber-500
			bg: 'rgba(245, 158, 11, 0.1)'
		}
	},
	performance: {
		individual: {
			border: 'rgb(79, 70, 229)',        // indigo-600
			bg: 'rgba(79, 70, 229, 0.1)'
		},
		stakeholder: {
			border: 'rgb(99, 102, 241)',       // indigo-500
			bg: 'rgba(99, 102, 241, 0.1)'
		}
	}
} as const;
