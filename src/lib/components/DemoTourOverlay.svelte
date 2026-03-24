<script lang="ts">
	import { tourState, nextTourStep, prevTourStep, endTour } from '$lib/stores/demoTour.svelte';
	import { goto } from '$app/navigation';
	import { ChevronRight, ChevronLeft, X, Mic } from 'lucide-svelte';

	let lastImpersonatedUserId = '';

	const currentStep = $derived(tourState.tour ? tourState.tour.steps[tourState.stepIdx] : null);

	async function navigateToStep() {
		if (!currentStep) return;

		// Impersonate if needed
		if (currentStep.userId && currentStep.userId !== lastImpersonatedUserId) {
			await fetch('/api/admin/impersonate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId: currentStep.userId })
			});
			lastImpersonatedUserId = currentStep.userId;
		}

		// eslint-disable-next-line svelte/no-navigation-without-resolve -- dynamic tour paths
		await goto(currentStep.path, { invalidateAll: true });
	}

	async function goNext() {
		nextTourStep();
		await navigateToStep();
	}

	async function goPrev() {
		prevTourStep();
		await navigateToStep();
	}

	function stop() {
		// Clear impersonation
		fetch('/api/admin/impersonate', { method: 'DELETE' });
		lastImpersonatedUserId = '';
		endTour();
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- fixed path
		goto('/admin/demo');
	}
</script>

{#if tourState.tour && currentStep}
	{@const tour = tourState.tour}
	{@const idx = tourState.stepIdx}
	{@const total = tour.steps.length}

	<div class="fixed right-4 bottom-4 left-4 z-[9999] mx-auto max-w-lg">
		<div class="rounded-2xl border border-border-default bg-surface-raised shadow-2xl">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border-default px-5 py-3">
				<div class="flex items-center gap-2">
					<Mic class="h-4 w-4 text-accent" />
					<span class="text-xs font-bold text-accent">{tour.title}</span>
					<span class="rounded-full bg-surface-subtle px-2 py-0.5 text-xs text-text-muted">
						{idx + 1} / {total}
					</span>
				</div>
				<button
					onclick={stop}
					class="rounded-lg p-1 text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary"
					aria-label="End tour"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<!-- Body -->
			<div class="space-y-3 px-5 py-4">
				<!-- Say -->
				<div>
					<p class="mb-1 text-[10px] font-bold tracking-widest text-text-muted uppercase">Say</p>
					<p class="text-sm leading-relaxed text-text-primary">"{currentStep.say}"</p>
				</div>

				<!-- Point out -->
				<div>
					<p class="mb-1 text-[10px] font-bold tracking-widest text-text-muted uppercase">
						Point out
					</p>
					<ul class="space-y-0.5">
						{#each currentStep.pointOut as point (point)}
							<li class="flex items-start gap-1.5 text-xs text-text-secondary">
								<span class="mt-px text-accent">&#9654;</span>
								{point}
							</li>
						{/each}
					</ul>
				</div>

				{#if currentStep.tip}
					<p class="rounded-lg bg-warning-muted px-3 py-1.5 text-xs font-medium text-warning">
						Tip: {currentStep.tip}
					</p>
				{/if}
			</div>

			<!-- Footer nav -->
			<div class="flex items-center justify-between border-t border-border-default px-5 py-3">
				<button
					onclick={goPrev}
					disabled={idx === 0}
					class="flex items-center gap-1 text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary disabled:opacity-30"
				>
					<ChevronLeft class="h-3.5 w-3.5" /> Back
				</button>

				<!-- Progress dots -->
				<div class="flex gap-1">
					{#each Array.from({ length: total }, (__, i) => i) as dotIdx (dotIdx)}
						<div
							class="h-1.5 rounded-full transition-all {dotIdx === idx
								? 'w-4 bg-accent'
								: dotIdx < idx
									? 'w-1.5 bg-accent/40'
									: 'w-1.5 bg-border-strong'}"
						></div>
					{/each}
				</div>

				{#if idx < total - 1}
					<button
						onclick={goNext}
						class="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
					>
						Next <ChevronRight class="h-3.5 w-3.5" />
					</button>
				{:else}
					<button
						onclick={stop}
						class="rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-success/80"
					>
						End Tour
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
