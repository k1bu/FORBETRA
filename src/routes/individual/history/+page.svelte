<script lang="ts">
	import type { PageData } from './$types';
	import { SvelteSet } from 'svelte/reactivity';
	import { getScoreColor, getScoreBgColor } from '$lib/utils/scoreColors';

	import { FileText, ChevronDown, Search } from 'lucide-svelte';

	const { data }: { data: PageData } = $props();

	// Only expand the latest 2 weeks by default
	const initialExpanded = data.weeks.slice(0, 2).map((w: { weekNumber: number }) => w.weekNumber);
	const expandedWeeks = new SvelteSet<number>(initialExpanded);

	let searchQuery = $state('');

	const toggleWeek = (weekNumber: number) => {
		if (expandedWeeks.has(weekNumber)) {
			expandedWeeks.delete(weekNumber);
		} else {
			expandedWeeks.add(weekNumber);
		}
	};

	const reflectionLabel = (type: string) => {
		switch (type) {
			case 'RATING_A':
				return 'Check-in';
			case 'RATING_B':
				return 'Check-in';
			default:
				return 'Reflection';
		}
	};

	const formatDate = (value: string) =>
		new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));

	const filteredWeeks = $derived(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return data.weeks;
		return data.weeks
			.map(
				(week: {
					weekNumber: number;
					reflections: Array<{
						id: string;
						type: string;
						effortScore: number | null;
						performanceScore: number | null;
						notes: string | null;
						checkInDate: string;
						feedbacks: Array<{
							stakeholderName: string;
							effortScore: number | null;
							performanceScore: number | null;
							comment: string | null;
						}>;
					}>;
				}) => {
					const matchingReflections = week.reflections.filter((r) => {
						if (r.notes?.toLowerCase().includes(q)) return true;
						return r.feedbacks.some(
							(f) =>
								f.comment?.toLowerCase().includes(q) || f.stakeholderName.toLowerCase().includes(q)
						);
					});
					if (matchingReflections.length === 0) return null;
					return { ...week, reflections: matchingReflections };
				}
			)
			.filter((w): w is NonNullable<typeof w> => w !== null);
	});
</script>

<svelte:head>
	<title>History | Forbetra</title>
</svelte:head>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<section class="mx-auto flex max-w-4xl flex-col gap-6 p-4 pb-12">
	<div class="text-center">
		<h1 class="text-2xl font-bold text-text-primary">Reflection History</h1>
		<p class="mt-1 text-sm text-text-tertiary">
			{data.cycleLabel} &middot; {data.objectiveTitle}
		</p>
	</div>

	{#if data.weeks.length === 0}
		<div class="rounded-2xl border border-border-default bg-surface-raised p-8 text-center">
			<FileText class="mx-auto mb-3 h-10 w-10 text-text-muted" />
			<p class="text-lg font-semibold text-text-secondary">No check-ins yet</p>
			<p class="mt-1 text-sm text-text-tertiary">
				Complete your first check-in to see your history here.
			</p>
			<a
				href="/individual"
				class="mt-4 inline-block rounded-lg bg-accent px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
			>
				Go to Dashboard
			</a>
		</div>
	{:else}
		<!-- Search -->
		{#if data.weeks.length > 2}
			<div class="relative">
				<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-muted" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search notes and feedback..."
					class="w-full rounded-xl border border-border-default bg-surface-raised py-2.5 pr-3 pl-9 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
				/>
			</div>
		{/if}

		{#if filteredWeeks().length === 0}
			<div class="rounded-2xl border border-border-default bg-surface-raised p-8 text-center">
				<p class="text-sm text-text-secondary">
					No results for "{searchQuery}". Try a different search.
				</p>
			</div>
		{:else}
			<!-- Timeline -->
			<div class="relative">
				<!-- Vertical line -->
				<div class="absolute top-0 bottom-0 left-6 w-0.5 bg-border-default"></div>

				<div class="space-y-6">
					{#each filteredWeeks() as week (week.weekNumber)}
						{@const isExpanded = expandedWeeks.has(week.weekNumber) || searchQuery.trim() !== ''}
						<div class="relative pl-14">
							<!-- Week marker -->
							<div
								class="absolute top-1 left-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white ring-4 ring-surface-base"
							>
								{week.weekNumber}
							</div>

							<div class="rounded-2xl border border-border-default bg-surface-raised p-5">
								<button
									type="button"
									onclick={() => toggleWeek(week.weekNumber)}
									aria-expanded={isExpanded}
									class="flex w-full items-center justify-between text-left"
								>
									<div class="flex items-center gap-3">
										<h2 class="text-lg font-bold text-text-primary">
											Week {week.weekNumber}
										</h2>
										<span class="text-xs text-text-muted">
											{week.reflections.length} check-in{week.reflections.length !== 1 ? 's' : ''}
										</span>
									</div>
									<ChevronDown
										class="h-5 w-5 text-text-muted transition-transform {isExpanded
											? 'rotate-180'
											: ''}"
									/>
								</button>

								{#if isExpanded}
									<div class="mt-3 space-y-4">
										{#each week.reflections as reflection (reflection.id)}
											<div class="rounded-xl border border-border-default bg-surface-subtle p-4">
												<div class="mb-2 flex items-center justify-between">
													<span
														class="rounded-full bg-accent-muted px-2.5 py-0.5 text-xs font-semibold text-accent"
													>
														{reflectionLabel(reflection.type)}
													</span>
													<span class="text-xs text-text-muted"
														>{formatDate(reflection.checkInDate)}</span
													>
												</div>

												{#if reflection.effortScore !== null || reflection.performanceScore !== null}
													<div class="mb-2 flex gap-4">
														{#if reflection.effortScore !== null}
															<div class="flex items-center gap-2">
																<span class="text-xs text-text-tertiary">Effort:</span>
																<div
																	class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold {getScoreBgColor(
																		reflection.effortScore,
																		'effort'
																	)} {getScoreColor(reflection.effortScore, 'effort')}"
																>
																	{reflection.effortScore}
																</div>
															</div>
														{/if}
														{#if reflection.performanceScore !== null}
															<div class="flex items-center gap-2">
																<span class="text-xs text-text-tertiary">Performance:</span>
																<div
																	class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold {getScoreBgColor(
																		reflection.performanceScore,
																		'performance'
																	)} {getScoreColor(reflection.performanceScore, 'performance')}"
																>
																	{reflection.performanceScore}
																</div>
															</div>
														{/if}
													</div>
												{/if}

												{#if reflection.notes}
													<p class="text-sm leading-relaxed text-text-secondary">
														{reflection.notes}
													</p>
												{/if}

												{#if reflection.feedbacks.length > 0}
													<div class="mt-3 border-t border-border-default pt-3">
														<p
															class="mb-2 text-xs font-semibold tracking-wider text-text-muted uppercase"
														>
															Stakeholder Feedback
														</p>
														<div class="space-y-2">
															{#each reflection.feedbacks as feedback (feedback.stakeholderName)}
																<div
																	class="rounded-lg border border-border-default bg-surface-raised px-3 py-2"
																>
																	<div class="flex items-center justify-between">
																		<span class="text-xs font-semibold text-text-secondary"
																			>{feedback.stakeholderName}</span
																		>
																		<div class="flex gap-3">
																			{#if feedback.effortScore !== null}
																				<span class="text-xs text-text-tertiary"
																					>E: <span class="font-bold">{feedback.effortScore}</span
																					></span
																				>
																			{/if}
																			{#if feedback.performanceScore !== null}
																				<span class="text-xs text-text-tertiary"
																					>P: <span class="font-bold"
																						>{feedback.performanceScore}</span
																					></span
																				>
																			{/if}
																		</div>
																	</div>
																	{#if feedback.comment}
																		<p class="mt-1 text-xs text-text-secondary">
																			{feedback.comment}
																		</p>
																	{/if}
																</div>
															{/each}
														</div>
													</div>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</section>
