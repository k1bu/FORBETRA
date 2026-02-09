<script lang="ts">
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

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
	<section class="mx-auto max-w-4xl space-y-8 p-4 pb-12 pt-8">
		{#if data.isPreview}
			<div class="fixed top-4 right-4 z-50 max-w-xs rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-3 text-xs text-blue-800 shadow-lg">
				<p class="font-semibold">👁️ Preview Mode</p>
				<p class="mt-1 text-xs">Submissions will be saved normally.</p>
			</div>
		{/if}

		<!-- Core Framing Message -->
		<div class="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-8 text-center shadow-lg">
			<h1 class="mb-4 text-3xl font-bold text-slate-900">Set Your Starting Point</h1>
			<p class="text-lg leading-relaxed text-slate-700">
				These ratings capture where you feel you are right now as you begin working toward
				<span class="font-semibold text-blue-900">{data.isPreview ? "your development objective" : data.objective.title}</span>.
			</p>
			<p class="mt-3 text-base text-slate-600">
				There's no right or wrong answer—this simply gives us a baseline to measure change over time.
			</p>
		</div>

		<div aria-live="polite">
			{#if form?.error}
				<div class="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
					<p class="font-medium">⚠️ {form.error}</p>
				</div>
			{/if}

			{#if form?.success}
				<div class="mx-auto max-w-2xl animate-in fade-in slide-in-from-top-2 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 text-center">
					<div class="mb-2 text-4xl">🎉</div>
					<p class="text-lg font-semibold text-emerald-900">Ratings saved!</p>
					<p class="mt-1 text-sm text-emerald-700">Your starting point has been recorded.</p>
				</div>
			{/if}
		</div>

		<form method="post" onsubmit={handleSubmit} class="mx-auto w-full max-w-2xl space-y-8">
			<input type="hidden" name="effortScore" value={effortScore} />
			<input type="hidden" name="performanceScore" value={performanceScore} />

			<!-- Focused Effort Rating -->
			<div class="rounded-2xl border-2 border-neutral-200 bg-white p-8 shadow-sm">
				<div class="mb-6">
					<label for="effort-score" class="block text-xl font-bold text-neutral-900 mb-3">
						Focused Effort – Initial Rating
					</label>
					<p class="text-base text-neutral-700 leading-relaxed">
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
								: 'border-neutral-300 bg-white text-neutral-700 ' + hoverColors} focus:outline-none focus:ring-2 {focusRing} focus:ring-offset-2"
						>
							{i}
						</button>
					{/each}
				</div>

				<div class="flex items-center justify-between">
					<span class="text-xs font-medium text-neutral-500">Rarely intentional</span>
					<div
						class="rounded-full px-3 py-1 text-xs font-semibold {getScoreBgColor(
							effortScore, 'effort'
						)} {getScoreColor(effortScore, 'effort')}"
					>
						{getScoreLabel(effortScore, 'effort')}
					</div>
					<span class="text-xs font-medium text-neutral-500">Relentless commitment</span>
				</div>
			</div>

			<!-- Effort-Performance Gap Explanation -->
			<div class="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 px-6 py-5">
				<p class="text-sm font-semibold text-blue-900 mb-1">Why two scores?</p>
				<p class="text-sm leading-relaxed text-slate-700">
					The gap between effort and results is the most powerful growth signal. We track both so patterns become visible — where effort isn't translating to performance, and where results come easier than expected.
				</p>
			</div>

			<!-- Performance Rating -->
			<div class="rounded-2xl border-2 border-neutral-200 bg-white p-8 shadow-sm">
				<div class="mb-6">
					<label for="performance-score" class="block text-xl font-bold text-neutral-900 mb-3">
						Performance – Initial Rating
					</label>
					<p class="text-base text-neutral-700 leading-relaxed">
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
								: 'border-neutral-300 bg-white text-neutral-700 ' + hoverColors} focus:outline-none focus:ring-2 {focusRing} focus:ring-offset-2"
						>
							{i}
						</button>
					{/each}
				</div>

				<div class="flex items-center justify-between">
					<span class="text-xs font-medium text-neutral-500">Not yet visible</span>
					<div
						class="rounded-full px-3 py-1 text-xs font-semibold {getScoreBgColor(
							performanceScore, 'performance'
						)} {getScoreColor(performanceScore, 'performance')}"
					>
						{getScoreLabel(performanceScore, 'progress')}
					</div>
					<span class="text-xs font-medium text-neutral-500">Transformative impact</span>
				</div>
			</div>

			<!-- Reassurance Message -->
			<div class="rounded-xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-center">
				<p class="text-sm text-slate-600">
					This is just your starting point. What matters most is how these numbers move over time.
				</p>
			</div>

			<!-- Submit Button -->
			<div class="flex flex-col gap-4 rounded-2xl border-2 border-neutral-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex-1">
					<p class="font-semibold text-neutral-900">Ready to continue?</p>
					<p class="mt-1 text-xs text-neutral-600">
						Your baseline ratings help track your progress throughout the cycle.
					</p>
				</div>
				<button
					type="submit"
					disabled={isSubmitting}
					class="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3.5 font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 focus-visible:ring-2 focus-visible:ring-offset-2"
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
