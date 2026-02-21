<script lang="ts">
	import type { PageData } from './$types';
	import {
		getScoreColor,
		getScoreBgColor
	} from '$lib/utils/scoreColors';

	const { data }: { data: PageData } = $props();

	const reflectionLabel = (type: string) => {
		switch (type) {
			case 'INTENTION':
				return 'Intention';
			case 'RATING_A':
				return 'Mid-week check-in';
			case 'RATING_B':
				return 'End-of-week check-in';
			default:
				return 'Reflection';
		}
	};

	const formatDate = (value: string) =>
		new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
</script>

<section class="mx-auto flex max-w-4xl flex-col gap-6 p-4 pb-12">
	<div class="flex items-center justify-between">
		<a
			href="/individual"
			class="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Back
		</a>
	</div>

	<div class="text-center">
		<h1 class="text-2xl font-bold text-neutral-900">Reflection History</h1>
		<p class="mt-1 text-sm text-neutral-500">
			{data.cycleLabel} &middot; {data.objectiveTitle}
		</p>
	</div>

	{#if data.weeks.length === 0}
		<div class="rounded-2xl border-2 border-neutral-200 bg-neutral-50 p-8 text-center">
			<div class="mb-3 text-4xl">📝</div>
			<p class="text-lg font-semibold text-neutral-700">No reflections yet</p>
			<p class="mt-1 text-sm text-neutral-500">Complete your first check-in to see your history here.</p>
			<a
				href="/individual"
				class="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
			>
				Go to Dashboard
			</a>
		</div>
	{:else}
		<!-- Timeline -->
		<div class="relative">
			<!-- Vertical line -->
			<div class="absolute left-6 top-0 bottom-0 w-0.5 bg-neutral-200"></div>

			<div class="space-y-6">
				{#each data.weeks as week}
					<div class="relative pl-14">
						<!-- Week marker -->
						<div class="absolute left-3.5 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white ring-4 ring-white">
							{week.weekNumber}
						</div>

						<div class="rounded-2xl border-2 border-neutral-200 bg-white p-5 shadow-sm">
							<h2 class="mb-3 text-lg font-bold text-neutral-900">Week {week.weekNumber}</h2>

							<div class="space-y-4">
								{#each week.reflections as reflection}
									<div class="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
										<div class="mb-2 flex items-center justify-between">
											<span class="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
												{reflectionLabel(reflection.type)}
											</span>
											<span class="text-xs text-neutral-400">{formatDate(reflection.checkInDate)}</span>
										</div>

										{#if reflection.effortScore !== null || reflection.performanceScore !== null}
											<div class="mb-2 flex gap-4">
												{#if reflection.effortScore !== null}
													<div class="flex items-center gap-2">
														<span class="text-xs text-neutral-500">Effort:</span>
														<div
															class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold {getScoreBgColor(reflection.effortScore, 'effort')} {getScoreColor(reflection.effortScore, 'effort')}"
														>
															{reflection.effortScore}
														</div>
													</div>
												{/if}
												{#if reflection.performanceScore !== null}
													<div class="flex items-center gap-2">
														<span class="text-xs text-neutral-500">Performance:</span>
														<div
															class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold {getScoreBgColor(reflection.performanceScore, 'performance')} {getScoreColor(reflection.performanceScore, 'performance')}"
														>
															{reflection.performanceScore}
														</div>
													</div>
												{/if}
											</div>
										{/if}

										{#if reflection.notes}
											<p class="text-sm text-neutral-700 leading-relaxed">{reflection.notes}</p>
										{/if}

										{#if reflection.feedbacks.length > 0}
											<div class="mt-3 border-t border-neutral-200 pt-3">
												<p class="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">Stakeholder Feedback</p>
												<div class="space-y-2">
													{#each reflection.feedbacks as feedback}
														<div class="rounded-lg border border-neutral-200 bg-white px-3 py-2">
															<div class="flex items-center justify-between">
																<span class="text-xs font-semibold text-neutral-700">{feedback.stakeholderName}</span>
																<div class="flex gap-3">
																	{#if feedback.effortScore !== null}
																		<span class="text-xs text-neutral-500">E: <span class="font-bold">{feedback.effortScore}</span></span>
																	{/if}
																	{#if feedback.performanceScore !== null}
																		<span class="text-xs text-neutral-500">P: <span class="font-bold">{feedback.performanceScore}</span></span>
																	{/if}
																</div>
															</div>
															{#if feedback.comment}
																<p class="mt-1 text-xs text-neutral-600">{feedback.comment}</p>
															{/if}
														</div>
													{/each}
												</div>
											</div>
										{/if}
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</section>
