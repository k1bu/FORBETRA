<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import HistoricRatingsChart from '$lib/components/HistoricRatingsChart.svelte';
	import {
		getScoreColor,
		getScoreBgColor,
		getButtonSelectedColors,
		getButtonHoverColors,
		getFocusRing,
		getScoreLabel
	} from '$lib/utils/scoreColors';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	let effortScore = $state(data.previousEntry?.effortScore ?? 5);
	let performanceScore = $state(data.previousEntry?.performanceScore ?? 5);
	let isSubmitting = $state(false);
	let showBehavioralIndicators = $state(false);

	// Update scores when previousEntry changes
	$effect(() => {
		if (data.previousEntry) {
			effortScore = data.previousEntry.effortScore ?? 5;
			performanceScore = data.previousEntry.performanceScore ?? 5;
		}
	});

	const formatDate = (value: string) =>
		new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));

	const handleSubmit = () => {
		isSubmitting = true;
	};
</script>

<section class="mx-auto flex max-w-4xl flex-col gap-6 p-4 pb-12">
	<!-- Back to Dashboard Link -->
	<div class="flex items-center justify-between">
		<a
			href="/individual"
			class="group flex items-center gap-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
		>
			<svg
				class="h-4 w-4 transition-transform group-hover:-translate-x-1"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Back to Dashboard
		</a>
	</div>

	{#if data.isPreview}
		<div class="fixed top-4 right-4 z-50 max-w-xs rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-3 text-xs text-blue-800 shadow-lg">
			<p class="font-semibold">👁️ Preview Mode</p>
			<p class="mt-1 text-xs">Submissions will be saved normally.</p>
		</div>
	{/if}
	<!-- Header with encouraging messaging -->
	<header class="space-y-3 text-center">
		<div class="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-700">
			<span class="h-2 w-2 rounded-full bg-blue-500"></span>
			Week {data.currentWeek} Check-in
		</div>
		<h1 class="text-3xl font-bold text-neutral-900">{data.checkInLabel}</h1>
		<p class="text-base text-neutral-600">
			Take a moment to reflect on your progress. Every check-in moves you forward.
		</p>
		{#if !data.isPreview && !data.isAvailable}
			<div class="mx-auto max-w-md rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-4 text-sm text-amber-800">
				<p class="font-medium">⏰ Coming soon</p>
				<p class="mt-1">This check-in will be available on {formatDate(data.availableDate)}.</p>
			</div>
		{:else if data.isLocked}
			<div class="mx-auto max-w-md rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
				<p class="font-medium">🔒 Check-in locked</p>
				<p class="mt-1">This check-in can no longer be edited because the next Monday intention has been submitted.</p>
			</div>
		{/if}
	</header>

	<div aria-live="polite">
		{#if form?.error}
			<div class="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
				<p class="font-medium">⚠️ {form.error}</p>
			</div>
		{/if}

		{#if form?.success}
			<div class="mx-auto max-w-2xl animate-in fade-in slide-in-from-top-2 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 text-center">
				<div class="mb-2 text-4xl">🎉</div>
				<p class="text-lg font-semibold text-emerald-900">Check-in saved!</p>
				{#if form.streak && form.streak >= 3}
					<p class="mt-1 text-sm font-semibold text-orange-700">
						🔥 You're on a {form.streak} check-in streak!{#if form.streak >= 12} Incredible consistency!{:else if form.streak >= 9} Outstanding!{:else if form.streak >= 6} Keep it going!{/if}
					</p>
				{:else}
					<p class="mt-1 text-sm text-emerald-700">Your reflection has been recorded. Keep up the great work!</p>
				{/if}
				<a
					href="/individual"
					class="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg"
				>
					Return to Dashboard
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</a>
			</div>
		{/if}
	</div>

	<div class="mx-auto w-full max-w-2xl space-y-6">
		<!-- Interactive Check-in Form -->
		<form method="post" onsubmit={handleSubmit} class="space-y-6">
			<!-- Hidden inputs for form submission -->
			<input type="hidden" name="effortScore" value={effortScore} />
			<input type="hidden" name="performanceScore" value={performanceScore} />
			
			<!-- Simple Objective Display -->
			<div class="rounded-xl border border-neutral-200 bg-neutral-50/50 px-5 py-4">
				<div class="flex items-center gap-3 text-base text-neutral-600">
					<span class="text-xl" role="img" aria-label="target">🎯</span>
					<span class="font-medium">Objective:</span>
					<span class="font-semibold text-lg text-neutral-900">{data.objective.title}</span>
				</div>
			</div>
			
			<!-- Collapsible Behavioral Indicators -->
			<div class="rounded-xl border border-neutral-200 bg-white">
				<button
					type="button"
					onclick={() => (showBehavioralIndicators = !showBehavioralIndicators)}
					class="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-neutral-50"
				>
					<div class="flex items-center gap-2">
						<span class="text-lg" role="img" aria-label="clipboard">📋</span>
						<span class="text-sm font-medium text-neutral-700">View behavioral indicators</span>
					</div>
					<svg
						class="h-5 w-5 text-neutral-500 transition-transform {showBehavioralIndicators
							? 'rotate-180'
							: ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>
				{#if showBehavioralIndicators}
					<div class="border-t border-neutral-200 px-4 py-4">
						<p class="mb-3 text-xs leading-relaxed text-neutral-600">
							Use these as reference points when rating your overall effort and progress. They help define what success looks like for your objective.
						</p>
						<div class="space-y-2">
							{#each data.subgoals as subgoal, index (subgoal.id)}
								<div class="flex items-start gap-3 rounded-lg border border-neutral-100 bg-neutral-50/50 p-3">
									<span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
										{index + 1}
									</span>
									<div class="flex-1">
										<p class="font-semibold text-neutral-900">{subgoal.label}</p>
										{#if subgoal.description}
											<p class="mt-1 text-xs text-neutral-600">{subgoal.description}</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
			
			{#if data.currentWeek > 1 && data.previousRatings}
				{@const historicRatings = data.historicRatings ?? []}
				<div class="rounded-xl border border-blue-100/50 bg-gradient-to-br from-blue-50/40 to-blue-50/60 p-4">
					<div class="mb-3">
						<p class="text-sm font-semibold text-blue-800">Your last ratings:</p>
					</div>
					<div class="flex gap-6 text-sm">
						<div class="flex items-center gap-2">
							<span class="text-blue-600">Effort:</span>
							<span class="font-bold text-lg text-blue-800">
								{data.previousRatings.effortScore !== null ? data.previousRatings.effortScore : '—'}
							</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-blue-600">Performance:</span>
							<span class="font-bold text-lg text-blue-800">
								{data.previousRatings.performanceScore !== null ? data.previousRatings.performanceScore : '—'}
							</span>
						</div>
					</div>
					<p class="mt-2 text-xs text-blue-600">Use this as context - adjust freely based on this week.</p>
					{#if historicRatings.length > 1}
						<div class="mt-4">
							<HistoricRatingsChart historicRatings={historicRatings} />
						</div>
					{/if}
				</div>
			{/if}
			<!-- Effort Score with Enhanced UI -->
			<div class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-neutral-400 hover:shadow-md">
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<span class="text-2xl" role="img" aria-label="flexed biceps">💪</span>
						<div>
							<label for="effort-score" class="text-lg font-bold text-neutral-900">
								Focused Effort
							</label>
							<p class="text-xs text-neutral-500">
								How much attention did you give to your objective: "{data.objective.title}" this week?
							</p>
						</div>
					</div>
					<div
						class="flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all {getScoreBgColor(
							effortScore, 'effort'
						)}"
					>
						<span class="text-2xl font-bold {getScoreColor(effortScore, 'effort')}">{effortScore}</span>
					</div>
				</div>

				<!-- Button Grid (Primary Input) -->
				<div class="mb-4 grid grid-cols-6 gap-2 sm:grid-cols-11">
					{#each Array(11) as _, i}
						{@const isSelected = effortScore === i}
						{@const buttonColors = getButtonSelectedColors(i, 'effort')}
						{@const hoverColors = getButtonHoverColors(i, 'effort')}
						{@const focusRing = getFocusRing(i, 'effort')}
						<button
							type="button"
							onclick={() => (effortScore = i)}
							disabled={!data.isAvailable || data.isLocked}
							class="flex h-10 w-full items-center justify-center rounded-lg border-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 {isSelected
								? buttonColors + ' shadow-md'
								: 'border-neutral-300 bg-white text-neutral-700 ' + hoverColors} focus:outline-none focus:ring-2 {focusRing} focus:ring-offset-2"
						>
							{i}
						</button>
					{/each}
				</div>

				<div class="mb-2 flex items-center justify-between">
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
				<p class="text-xs text-neutral-400 italic">
					Consider attention, preparation, and prioritization toward the objective.
				</p>
			</div>

			<!-- Progress Score with Enhanced UI -->
			<div class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-neutral-400 hover:shadow-md">
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<span class="text-2xl" role="img" aria-label="chart trending up">📈</span>
						<div>
							<label for="progress-score" class="text-lg font-bold text-neutral-900">
								Performance
							</label>
							<p class="text-xs text-neutral-500">
								How effective was your performance related to your objective: "{data.objective.title}" this week?
							</p>
						</div>
					</div>
					<div
						class="flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all {getScoreBgColor(
							performanceScore, 'performance'
						)}"
					>
						<span class="text-2xl font-bold {getScoreColor(performanceScore, 'performance')}">{performanceScore}</span>
					</div>
				</div>

				<!-- Button Grid (Primary Input) -->
				<div class="mb-4 grid grid-cols-6 gap-2 sm:grid-cols-11">
					{#each Array(11) as _, i}
						{@const isSelected = performanceScore === i}
						{@const buttonColors = getButtonSelectedColors(i, 'performance')}
						{@const hoverColors = getButtonHoverColors(i, 'performance')}
						{@const focusRing = getFocusRing(i, 'performance')}
						<button
							type="button"
							onclick={() => (performanceScore = i)}
							disabled={!data.isAvailable || data.isLocked}
							class="flex h-10 w-full items-center justify-center rounded-lg border-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 {isSelected
								? buttonColors + ' shadow-md'
								: 'border-neutral-300 bg-white text-neutral-700 ' + hoverColors} focus:outline-none focus:ring-2 {focusRing} focus:ring-offset-2"
						>
							{i}
						</button>
					{/each}
				</div>

				<div class="mb-2 flex items-center justify-between">
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
				<p class="text-xs text-neutral-400 italic">
					Consider outcomes, behavior change, and visible impact related to the objective.
				</p>
			</div>

			<!-- Notes with Better UX -->
			<div class="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-purple-300 hover:shadow-md">
				<div class="mb-3 flex items-center gap-2">
					<span class="text-xl" role="img" aria-label="writing hand">✍️</span>
					<label for="notes" class="text-base font-semibold text-neutral-900">
						Reflection Notes
						<span class="ml-2 text-xs font-normal text-neutral-500">(optional)</span>
					</label>
				</div>
				<textarea
					name="notes"
					id="notes"
					rows="4"
					disabled={!data.isAvailable || data.isLocked}
					class="w-full rounded-xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:opacity-60"
					placeholder="Share a win, an obstacle you overcame, or something you learned this week..."
				>{data.previousEntry?.notes ?? ''}</textarea>
				<p class="mt-2 text-xs text-neutral-500">
					💡 Tip: Capturing context helps you and your coach see the full picture of your growth.
				</p>
			</div>

			<!-- Submit Button with Enhanced Design -->
			<div class="flex flex-col gap-4 rounded-2xl border-2 border-neutral-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex-1">
					{#if data.isLocked || data.previousEntry}
						<p class="font-semibold text-neutral-900">Viewing completed check-in</p>
						<p class="mt-1 text-xs text-neutral-600">
							This check-in has been completed and can no longer be edited.
						</p>
					{:else}
						<p class="font-semibold text-neutral-900">Ready to save your check-in?</p>
						<p class="mt-1 text-xs text-neutral-600">
							Your reflection helps track progress and keeps you accountable.
						</p>
					{/if}
				</div>
				<div class="flex items-center gap-3">
					<a
						href="/individual"
						class="rounded-xl border-2 border-neutral-300 bg-white px-6 py-3.5 text-sm font-semibold text-neutral-700 transition-all hover:border-neutral-400 hover:bg-neutral-50"
					>
						Back to Dashboard
					</a>
					<button
						type="submit"
						disabled={!data.isAvailable || data.isLocked || isSubmitting}
						class="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3.5 font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 focus-visible:ring-2 focus-visible:ring-offset-2"
					>
						<span class="relative z-10 flex items-center gap-2">
							{#if isSubmitting}
								<span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
								Saving...
							{:else}
								<span role="img" aria-label="sparkles">✨</span>
								Save Check-in
							{/if}
						</span>
						<div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity group-hover:opacity-100"></div>
					</button>
				</div>
			</div>
		</form>
	</div>
</section>

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

