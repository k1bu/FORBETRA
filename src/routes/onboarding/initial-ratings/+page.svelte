<script lang="ts">
	import { onMount } from 'svelte';
	import type { ActionData, PageData } from './$types';
	import {
		getScoreColor,
		getScoreBgColor,
		getButtonSelectedColors,
		getButtonHoverColors,
		getFocusRing,
		getScoreLabel
	} from '$lib/utils/scoreColors';

	const { data, form }: { data: PageData; form: (ActionData & { success?: boolean }) | null } = $props();

	// Clear onboarding draft on mount (user reached initial-ratings = onboarding form complete)
	onMount(() => {
		try {
			localStorage.removeItem('forbetra-onboarding-draft');
		} catch {}
	});

	let effortScore = $state(data.previousEntry?.effortScore ?? 5);
	let performanceScore = $state(data.previousEntry?.performanceScore ?? 5);
	let isSubmitting = $state(false);

	// Update scores when previousEntry changes
	$effect(() => {
		if (data.previousEntry) {
			effortScore = data.previousEntry.effortScore ?? 5;
			performanceScore = data.previousEntry.performanceScore ?? 5;
		}
	});

	const handleSubmit = () => {
		isSubmitting = true;
	};
</script>

<div class="min-h-screen bg-surface-base">
	<section class="mx-auto max-w-4xl space-y-8 p-4 pb-12 pt-8">
		{#if data.isPreview}
			<div class="fixed top-4 right-4 z-50 max-w-xs rounded-lg border border-accent/30 bg-accent-muted p-3 text-xs text-accent">
				<p class="font-semibold">Preview Mode</p>
				<p class="mt-1 text-xs">Submissions will be saved normally.</p>
			</div>
		{/if}

		<!-- Core Framing Message -->
		<div class="rounded-2xl border border-accent/30 bg-accent-muted p-8 text-center">
			<h1 class="mb-4 text-3xl font-bold text-text-primary">Set Your Starting Point</h1>
			<p class="text-lg leading-relaxed text-text-secondary">
				These ratings capture where you feel you are right now as you begin working toward
				<span class="font-semibold text-accent">{data.isPreview ? "your development objective" : data.objective.title}</span>.
			</p>
			<p class="mt-3 text-base text-text-secondary">
				There's no right or wrong answer—this simply gives us a baseline to measure change over time.
			</p>
		</div>

		<div aria-live="polite">
			{#if form?.error}
				<div class="mx-auto max-w-2xl rounded-xl border border-error/30 bg-error-muted p-4 text-sm text-error">
					<p class="font-medium">{form.error}</p>
				</div>
			{/if}

			{#if form?.success}
				<div class="mx-auto max-w-2xl animate-in fade-in slide-in-from-top-2 rounded-xl border border-success/30 bg-success-muted p-6 text-center">
					<div class="mb-2 text-4xl">🎉</div>
					<p class="text-lg font-semibold text-success">Ratings saved!</p>
					<p class="mt-1 text-sm text-success">Your starting point has been recorded.</p>
				</div>
			{/if}
		</div>

		<form method="post" onsubmit={handleSubmit} class="mx-auto w-full max-w-2xl space-y-8">
			<input type="hidden" name="effortScore" value={effortScore} />
			<input type="hidden" name="performanceScore" value={performanceScore} />

			<!-- Focused Effort Rating -->
			<div class="rounded-2xl border border-border-default bg-surface-raised p-8">
				<div class="mb-6">
					<label for="effort-score" class="block text-xl font-bold text-text-primary mb-3">
						Focused Effort – Initial Rating
					</label>
					<p class="text-base text-text-secondary leading-relaxed">
						Over the past few weeks, how consistently have you been putting deliberate effort toward
						improving your {data.isPreview ? "your development objective" : data.objective.title}?
					</p>
				</div>

				<!-- Button Grid -->
				<div class="mb-5 grid grid-cols-6 gap-2 sm:grid-cols-11">
					{#each Array(11) as _, i}
						{@const isSelected = effortScore === i}
						{@const buttonColors = getButtonSelectedColors(i, 'effort')}
						{@const hoverColors = getButtonHoverColors(i, 'effort')}
						{@const focusRing = getFocusRing(i, 'effort')}
						<button
							type="button"
							onclick={() => (effortScore = i)}
							class="flex h-10 w-full items-center justify-center rounded-lg border-2 text-sm font-semibold transition-all {isSelected
								? buttonColors + ' shadow-md'
								: 'border-border-default bg-surface-raised text-text-secondary ' + hoverColors} focus:outline-none focus:ring-2 {focusRing} focus:ring-offset-2"
						>
							{i}
						</button>
					{/each}
				</div>

				<div class="flex items-center justify-between">
					<span class="text-xs font-medium text-text-tertiary">Rarely intentional</span>
					<div
						class="rounded-full px-3 py-1 text-xs font-semibold {getScoreBgColor(
							effortScore, 'effort'
						)} {getScoreColor(effortScore, 'effort')}"
					>
						{getScoreLabel(effortScore, 'effort')}
					</div>
					<span class="text-xs font-medium text-text-tertiary">Relentless commitment</span>
				</div>
			</div>

			<!-- Effort-Performance Gap Explanation -->
			<div class="rounded-xl border border-accent/30 bg-accent-muted px-6 py-5">
				<p class="text-sm font-semibold text-accent mb-1">Why two scores?</p>
				<p class="text-sm leading-relaxed text-text-secondary">
					The gap between effort and results is the most powerful growth signal. We track both so patterns become visible — where effort isn't translating to performance, and where results come easier than expected.
				</p>
			</div>

			<!-- Performance Rating -->
			<div class="rounded-2xl border border-border-default bg-surface-raised p-8">
				<div class="mb-6">
					<label for="performance-score" class="block text-xl font-bold text-text-primary mb-3">
						Performance – Initial Rating
					</label>
					<p class="text-base text-text-secondary leading-relaxed">
						Based on recent situations, how effectively have you been showing up in line with your goal
						of improving your {data.isPreview ? "your development objective" : data.objective.title}?
					</p>
				</div>

				<!-- Button Grid -->
				<div class="mb-5 grid grid-cols-6 gap-2 sm:grid-cols-11">
					{#each Array(11) as _, i}
						{@const isSelected = performanceScore === i}
						{@const buttonColors = getButtonSelectedColors(i, 'performance')}
						{@const hoverColors = getButtonHoverColors(i, 'performance')}
						{@const focusRing = getFocusRing(i, 'performance')}
						<button
							type="button"
							onclick={() => (performanceScore = i)}
							class="flex h-10 w-full items-center justify-center rounded-lg border-2 text-sm font-semibold transition-all {isSelected
								? buttonColors + ' shadow-md'
								: 'border-border-default bg-surface-raised text-text-secondary ' + hoverColors} focus:outline-none focus:ring-2 {focusRing} focus:ring-offset-2"
						>
							{i}
						</button>
					{/each}
				</div>

				<div class="flex items-center justify-between">
					<span class="text-xs font-medium text-text-tertiary">Not yet visible</span>
					<div
						class="rounded-full px-3 py-1 text-xs font-semibold {getScoreBgColor(
							performanceScore, 'performance'
						)} {getScoreColor(performanceScore, 'performance')}"
					>
						{getScoreLabel(performanceScore, 'progress')}
					</div>
					<span class="text-xs font-medium text-text-tertiary">Relentless commitment</span>
				</div>
			</div>

			<!-- Reassurance Message -->
			<div class="rounded-xl border border-border-default bg-surface-subtle px-5 py-4 text-center">
				<p class="text-sm text-text-secondary">
					This is just your starting point. What matters most is how these numbers move over time.
				</p>
			</div>

			<!-- Submit Button -->
			<div class="flex flex-col gap-4 rounded-2xl border border-border-default bg-accent-muted p-6 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex-1">
					<p class="font-semibold text-text-primary">Ready to continue?</p>
					<p class="mt-1 text-xs text-text-secondary">
						Your baseline ratings help track your progress throughout the cycle.
					</p>
				</div>
				<button
					type="submit"
					disabled={isSubmitting}
					class="group relative overflow-hidden rounded-xl bg-accent px-8 py-3.5 font-semibold text-white shadow-lg transition-all hover:bg-accent-hover hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
				>
					<span class="relative z-10 flex items-center gap-2">
						{#if isSubmitting}
							<span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
							Saving...
						{:else}
							<span role="img" aria-label="sparkles">✨</span>
							Continue
						{/if}
					</span>
					<div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity group-hover:opacity-100"></div>
				</button>
			</div>
		</form>
	</section>
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slide-in-from-top-2 {
		from {
			transform: translateY(-0.5rem);
		}
		to {
			transform: translateY(0);
		}
	}

	.animate-in {
		animation: fade-in 0.3s ease-out, slide-in-from-top-2 0.3s ease-out;
	}
</style>
