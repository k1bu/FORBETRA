export type TourStep = {
	path: string;
	userId?: string;
	say: string;
	pointOut: string[];
	tip?: string;
};

export type Tour = {
	id: string;
	title: string;
	steps: TourStep[];
};

type TourState = {
	tour: Tour | null;
	stepIdx: number;
};

export const tourState = $state<TourState>({ tour: null, stepIdx: 0 });

export function startTour(tour: Tour) {
	tourState.tour = tour;
	tourState.stepIdx = 0;
}

export function nextTourStep() {
	if (tourState.tour && tourState.stepIdx < tourState.tour.steps.length - 1) {
		tourState.stepIdx++;
	}
}

export function prevTourStep() {
	if (tourState.stepIdx > 0) {
		tourState.stepIdx--;
	}
}

export function endTour() {
	tourState.tour = null;
	tourState.stepIdx = 0;
}
