<script lang="ts">
	import { tourState, nextTourStep, prevTourStep, endTour } from '$lib/stores/demoTour.svelte';
	import { goto } from '$app/navigation';
	import { ChevronRight, ChevronLeft, X, Mic, ChevronUp, ChevronDown } from 'lucide-svelte';

	let lastImpersonatedUserId = '';
	let showDetail = $state(true);

	const currentStep = $derived(tourState.tour ? tourState.tour.steps[tourState.stepIdx] : null);

	async function navigateToStep() {
		if (!currentStep) return;

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

	<!-- Bottom bar -->
	<div
		class="fixed right-0 bottom-0 left-0 z-[9999] border-t border-border-default bg-surface-raised/95 shadow-lg backdrop-blur-sm"
	>
		<!-- Compact bar (always visible) -->
		<div class="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2">
			<!-- Back -->
			<button
				onclick={goPrev}
				disabled={idx === 0}
				class="shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary disabled:opacity-30"
				aria-label="Previous step"
			>
				<ChevronLeft class="h-4 w-4" />
			</button>

			<!-- Progress bar -->
			<div class="flex shrink-0 gap-0.5">
				{#each Array.from({ length: total }, (__, i) => i) as dotIdx (dotIdx)}
					<div
						class="h-1 rounded-full transition-all {dotIdx === idx
							? 'w-5 bg-accent'
							: dotIdx < idx
								? 'w-2 bg-accent/40'
								: 'w-2 bg-border-strong'}"
					></div>
				{/each}
			</div>

			<!-- Talking point preview -->
			<button
				onclick={() => (showDetail = !showDetail)}
				class="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-surface-subtle"
			>
				<Mic class="h-3.5 w-3.5 shrink-0 text-accent" />
				<span class="truncate text-xs text-text-primary">{currentStep.say}</span>
				{#if showDetail}
					<ChevronDown class="h-3.5 w-3.5 shrink-0 text-text-muted" />
				{:else}
					<ChevronUp class="h-3.5 w-3.5 shrink-0 text-text-muted" />
				{/if}
			</button>

			<!-- Next / Done -->
			{#if idx < total - 1}
				<button
					onclick={goNext}
					class="flex shrink-0 items-center gap-1 rounded-lg bg-accent px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-accent-hover"
				>
					Next <ChevronRight class="h-3.5 w-3.5" />
				</button>
			{:else}
				<button
					onclick={stop}
					class="shrink-0 rounded-lg bg-success px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-success/80"
				>
					Done
				</button>
			{/if}

			<!-- Close -->
			<button
				onclick={stop}
				class="shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary"
				aria-label="End tour"
			>
				<X class="h-3.5 w-3.5" />
			</button>
		</div>

		<!-- Expanded detail panel -->
		{#if showDetail}
			<div class="border-t border-border-default bg-surface-subtle/50 px-4 py-3">
				<div class="mx-auto flex max-w-5xl gap-6">
					<!-- Say -->
					<div class="flex-1">
						<p class="mb-1 text-[10px] font-bold tracking-widest text-accent uppercase">Say</p>
						<p class="text-sm leading-relaxed text-text-primary">"{currentStep.say}"</p>
					</div>

					<!-- Point out + Tip -->
					<div class="w-60 shrink-0">
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
						{#if currentStep.tip}
							<p class="mt-2 rounded bg-warning-muted px-2 py-1 text-xs font-medium text-warning">
								{currentStep.tip}
							</p>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	:global(body:has(.fixed.z-\[9999\])) {
		padding-bottom: 3rem;
	}
</style>
