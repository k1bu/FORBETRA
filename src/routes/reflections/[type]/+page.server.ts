import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { ReflectionType } from '@prisma/client';

const typeMap: Record<string, ReflectionType> = {
	rating_a: 'RATING_A',
	'rating-a': 'RATING_A',
	ratinga: 'RATING_A',
	rating_b: 'RATING_B',
	'rating-b': 'RATING_B',
	ratingb: 'RATING_B'
};

function resolveRedirect(param: string | undefined): string {
	if (!param) return '/individual';
	const normalized = param.toLowerCase();

	const mapped = typeMap[normalized];
	if (mapped) {
		return `/reflections/checkin?type=${mapped}`;
	}

	return '/individual';
}

export const load: PageServerLoad = async (event) => {
	throw redirect(303, resolveRedirect(event.params.type));
};

export const actions: Actions = {
	default: async (event) => {
		throw redirect(303, resolveRedirect(event.params.type));
	}
};
