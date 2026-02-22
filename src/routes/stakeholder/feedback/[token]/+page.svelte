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

	import { onMount } from 'svelte';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	const DRAFT_KEY = `feedback-draft-${data.token}`;
	const DRAFT_MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4 hours

	let showWelcome = $state(data.isFirstFeedback);
	let draftRestored = $state(false);

	const reflectionLabel = (() => {
		switch (data.reflection.type) {
			case 'INTENTION':
				return 'Intention prompt';
			case 'RATING_A':
				return 'Wednesday check-in';
			case 'RATING_B':
				return 'Friday check-in';
			default:
				return 'Reflection';
		}
	})();

	const formatDate = (value: string) =>
		new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));

	let effortScore = $state(5);
	let performanceScore = $state(5);
	let notes = $state('');
	let isSubmitting = $state(false);
	let showReveal = $state(false);
	let stakeholderScores = $state<{ effortScore: number; performanceScore: number } | null>(null);
	let previewIndividualScores = $state<{ effortScore: number; performanceScore: number; participantName: string } | null>(null);

	const handleSubmit = () => {
		isSubmitting = true;
		stakeholderScores = { effortScore, performanceScore };
	};

	// Simulate reveal for preview mode
	const simulateReveal = () => {
		stakeholderScores = { effortScore, performanceScore };
		previewIndividualScores = {
			effortScore: 7,
			performanceScore: 6,
			participantName: data.reflection.participantName
		};
		setTimeout(() => {
			showReveal = true;
		}, 500);
	};

	// Get individual scores from either form response or preview data
	const individualScores = $derived(form?.individualScores ?? previewIndividualScores);
	const participantName = $derived(individualScores?.participantName ?? data.reflection.participantName);

	// Show reveal when form is successfully submitted (only if reveal is enabled)
	$effect(() => {
		if (form?.success && form?.individualScores && data.revealScores !== false) {
			// Small delay for better UX
			setTimeout(() => {
				showReveal = true;
			}, 500);
		}
	});

	// Clear draft on successful submission
	$effect(() => {
		if (form?.success) {
			try {
				localStorage.removeItem(DRAFT_KEY);
			} catch {}
		}
	});

	// Restore draft from localStorage on mount
	onMount(() => {
		if (data.isPreview) return;
		try {
			const raw = localStorage.getItem(DRAFT_KEY);
			if (raw) {
				const draft = JSON.parse(raw);
				if (draft.savedAt && Date.now() - draft.savedAt < DRAFT_MAX_AGE_MS) {
					if (typeof draft.effortScore === 'number') effortScore = draft.effortScore;
					if (typeof draft.performanceScore === 'number') performanceScore = draft.performanceScore;
					if (typeof draft.notes === 'string') notes = draft.notes;
					draftRestored = true;
					setTimeout(() => { draftRestored = false; }, 3000);
				} else {
					localStorage.removeItem(DRAFT_KEY);
				}
			}
		} catch {}
	});

	// Auto-save draft to localStorage (debounced)
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	$effect(() => {
		// Track reactive dependencies
		const e = effortScore;
		const p = performanceScore;
		const n = notes;

		if (data.isPreview) return;
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			try {
				localStorage.setItem(DRAFT_KEY, JSON.stringify({
					effortScore: e,
					performanceScore: p,
					notes: n,
					savedAt: Date.now()
				}));
			} catch {}
		}, 1000);
	});
</script>

<section class="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-4 pb-12">
	{#if data.isPreview}
		<div class="fixed top-4 right-4 z-50 max-w-xs rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-3 text-xs text-blue-800 shadow-lg">
			<p class="font-semibold">👁️ Preview Mode</p>
			<p class="mt-1 text-xs">Submissions are disabled.</p>
			{#if !showReveal}
				<button
					type="button"
					onclick={simulateReveal}
					class="mt-2 w-full rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-blue-700"
				>
					🎁 Preview Reveal
				</button>
			{/if}
		</div>
	{/if}
	{#if draftRestored}
		<div class="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 shadow-lg transition-opacity">
			Draft restored
		</div>
	{/if}
	<header class="space-y-3 text-center">
		<div class="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-700">
			<span class="h-2 w-2 rounded-full bg-blue-500"></span>
			Week {data.reflection.weekNumber} Check-in
		</div>
		<h1 class="text-3xl font-bold text-neutral-900">Share feedback for {data.reflection.participantName}</h1>
		<p class="text-base text-neutral-600">
			Cycle: {data.reflection.cycleLabel}. Your perspective helps keep progress aligned.
		</p>
	</header>

	<div aria-live="polite">
		{#if form?.error}
			<div class="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
				<p class="font-medium">⚠️ {form.error}</p>
			</div>
		{/if}
	</div>

	{#if showWelcome && !form?.success}
		<div class="mx-auto max-w-2xl space-y-6">
			<div class="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8 shadow-lg">
				<div class="mb-6 text-center">
					<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-200">
						<span class="text-3xl">👋</span>
					</div>
					<h2 class="text-2xl font-bold text-neutral-900">Welcome, {data.stakeholder.name}</h2>
					<p class="mt-2 text-base text-neutral-600">
						<strong>{data.reflection.participantName}</strong> has invited you to help track their development.
					</p>
				</div>

				<div class="mb-6 rounded-xl border-2 border-blue-100 bg-white p-5">
					<p class="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600">What they're working on</p>
					<p class="text-lg font-bold text-neutral-900">{data.reflection.objectiveTitle}</p>
				</div>

				<div class="mb-6 space-y-3">
					<p class="text-sm font-semibold text-neutral-800">What you'll do:</p>
					<div class="space-y-2">
						<div class="flex items-start gap-3 rounded-lg bg-white p-3 border border-neutral-200">
							<span class="mt-0.5 text-lg">💪</span>
							<div>
								<p class="text-sm font-semibold text-neutral-900">Rate their effort</p>
								<p class="text-xs text-neutral-600">How intentional and consistent their focus has been (0-10)</p>
							</div>
						</div>
						<div class="flex items-start gap-3 rounded-lg bg-white p-3 border border-neutral-200">
							<span class="mt-0.5 text-lg">📈</span>
							<div>
								<p class="text-sm font-semibold text-neutral-900">Rate their performance</p>
								<p class="text-xs text-neutral-600">How visible the results are from your perspective (0-10)</p>
							</div>
						</div>
						<div class="flex items-start gap-3 rounded-lg bg-white p-3 border border-neutral-200">
							<span class="mt-0.5 text-lg">✍️</span>
							<div>
								<p class="text-sm font-semibold text-neutral-900">Optionally share observations</p>
								<p class="text-xs text-neutral-600">A sentence or two about what you've noticed</p>
							</div>
						</div>
					</div>
				</div>

				<div class="mb-6 rounded-lg bg-purple-50 border border-purple-200 p-4">
					<p class="text-sm text-purple-800 leading-relaxed">
						<strong>Why it matters:</strong> Your perspective reveals blind spots. The gap between self-perception and external feedback is the most powerful growth signal.
					</p>
				</div>

				<div class="text-center space-y-3">
					<p class="text-xs text-neutral-500">Takes about 60 seconds</p>
					<button
						type="button"
						onclick={() => { showWelcome = false; }}
						class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3.5 font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:scale-105"
					>
						Got it, let's go
						<span>&#8594;</span>
					</button>
				</div>
			</div>
		</div>
	{:else if form?.success || (data.isPreview && showReveal)}
		<div class="mx-auto max-w-2xl space-y-6">
			<!-- Initial Success Message -->
			<div aria-live="polite" class="animate-in fade-in slide-in-from-top-2 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 text-center">
				<div class="mb-2 text-4xl">🎉</div>
				<p class="text-lg font-semibold text-emerald-900">Feedback submitted!</p>
				<p class="mt-1 text-sm text-emerald-700">Thank you for sharing your perspective. Your feedback has been recorded.</p>
			</div>

			<!-- Reveal Section (only when revealScores is enabled) -->
			{#if showReveal && individualScores && data.revealScores !== false}
				<div class="slide-in-from-bottom-4 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 p-8 shadow-lg">
					<div class="mb-6 text-center">
						<div class="mb-3 text-5xl">🎁</div>
						<h2 class="text-2xl font-bold text-neutral-900">Here's what {participantName} rated themselves:</h2>
						<p class="mt-2 text-sm text-neutral-600">Compare your perspective with their self-assessment</p>
					</div>

					<div class="grid gap-6 md:grid-cols-2">
						<!-- Focused Effort Comparison -->
						<div class="rounded-xl border-2 border-neutral-200 bg-white p-6">
							<div class="mb-4 flex items-center justify-between">
								<div>
									<p class="text-sm font-semibold text-neutral-600">Focused Effort</p>
									<p class="mt-1 text-xs text-neutral-500">How much energy invested</p>
								</div>
							</div>
							<div class="space-y-3">
								<div class="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
									<span class="text-sm font-medium text-neutral-700">Your rating:</span>
									<div class="flex items-center gap-2">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-full border-2 {getScoreBgColor(
												stakeholderScores?.effortScore ?? 0, 'effort'
											)}"
										>
											<span class="text-lg font-bold {getScoreColor(stakeholderScores?.effortScore ?? 0, 'effort')}">
												{stakeholderScores?.effortScore ?? 0}
											</span>
										</div>
									</div>
								</div>
								<div class="flex items-center justify-between rounded-lg border-2 border-purple-300 bg-purple-50 px-4 py-3">
									<span class="text-sm font-medium text-neutral-700">{participantName}'s rating:</span>
									<div class="flex items-center gap-2">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-full border-2 {getScoreBgColor(
												individualScores?.effortScore ?? 0, 'effort'
											)}"
										>
											<span class="text-lg font-bold {getScoreColor(individualScores?.effortScore ?? 0, 'effort')}">
												{individualScores?.effortScore ?? '—'}
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>

						<!-- Performance Comparison -->
						<div class="rounded-xl border-2 border-neutral-200 bg-white p-6">
							<div class="mb-4 flex items-center justify-between">
								<div>
									<p class="text-sm font-semibold text-neutral-600">Performance</p>
									<p class="mt-1 text-xs text-neutral-500">Satisfaction with progress</p>
								</div>
							</div>
							<div class="space-y-3">
								<div class="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
									<span class="text-sm font-medium text-neutral-700">Your rating:</span>
									<div class="flex items-center gap-2">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-full border-2 {getScoreBgColor(
												stakeholderScores?.performanceScore ?? 0, 'performance'
											)}"
										>
											<span class="text-lg font-bold {getScoreColor(stakeholderScores?.performanceScore ?? 0, 'performance')}">
												{stakeholderScores?.performanceScore ?? 0}
											</span>
										</div>
									</div>
								</div>
								<div class="flex items-center justify-between rounded-lg border-2 border-purple-300 bg-purple-50 px-4 py-3">
									<span class="text-sm font-medium text-neutral-700">{participantName}'s rating:</span>
									<div class="flex items-center gap-2">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-full border-2 {getScoreBgColor(
												individualScores?.performanceScore ?? 0, 'performance'
											)}"
										>
											<span class="text-lg font-bold {getScoreColor(individualScores?.performanceScore ?? 0, 'performance')}">
												{individualScores?.performanceScore ?? '—'}
											</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	{#if !form?.success && !(data.isPreview && showReveal) && !showWelcome}
		<div class="mx-auto w-full max-w-2xl space-y-6">
			<form method="post" onsubmit={handleSubmit} class="space-y-6">
			<input type="hidden" name="token" value={data.token} />
			<!-- Hidden inputs for form submission -->
			<input type="hidden" name="effortScore" value={effortScore} />
			<input type="hidden" name="performanceScore" value={performanceScore} />

			<!-- Objective Display -->
			<div class="rounded-xl border border-neutral-200 bg-neutral-50/50 px-5 py-4">
				<div class="flex items-center gap-3 text-base text-neutral-600">
					<span class="text-xl" role="img" aria-label="target">🎯</span>
					<span class="font-medium">Objective:</span>
					<span class="font-semibold text-lg text-neutral-900">{data.reflection.objectiveTitle || 'the objective'}</span>
				</div>
			</div>

			{#if data.subgoals && data.subgoals.length > 0}
				<div class="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 px-5 py-4">
					<p class="mb-3 text-sm font-semibold text-indigo-900">Behaviors to observe</p>
					<div class="space-y-2">
						{#each data.subgoals as subgoal}
							<div class="rounded-lg border border-indigo-100 bg-white px-4 py-3">
								<p class="text-sm font-semibold text-neutral-900">{subgoal.label}</p>
								{#if subgoal.description}
									<p class="mt-1 text-xs text-neutral-600">{subgoal.description}</p>
								{/if}
							</div>
						{/each}
					</div>
					<p class="mt-3 text-xs text-indigo-600">Keep these in mind as you rate effort and performance below.</p>
				</div>
			{/if}

			{#if data.previousRatings && (data.previousRatings.effortScore !== null || data.previousRatings.performanceScore !== null)}
				{@const historicRatings = data.historicRatings ?? []}
				<div class="rounded-xl border border-blue-100/50 bg-gradient-to-br from-blue-50/40 to-blue-50/60 p-4">
					<div class="mb-3">
						<p class="text-sm font-semibold text-blue-800">Your last ratings for {data.reflection.participantName}:</p>
					</div>
					<div class="flex gap-6 text-sm">
						{#if data.previousRatings.effortScore !== null}
							<div class="flex items-center gap-2">
								<span class="text-blue-600">Effort:</span>
								<span class="font-bold text-lg text-blue-800">{data.previousRatings.effortScore}</span>
							</div>
						{/if}
						{#if data.previousRatings.performanceScore !== null}
							<div class="flex items-center gap-2">
								<span class="text-blue-600">Performance:</span>
								<span class="font-bold text-lg text-blue-800">{data.previousRatings.performanceScore}</span>
							</div>
						{/if}
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
								{#if data.subgoals && data.subgoals.length > 0}
									How much focused effort did {data.reflection.participantName} invest in the behaviors listed above this week?
								{:else}
									How much attention did {data.reflection.participantName} give to their objective: "{data.reflection.objectiveTitle || 'the objective'}" this week?
								{/if}
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
							class="flex h-10 w-full items-center justify-center rounded-lg border-2 text-sm font-semibold transition-all {isSelected
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
								{#if data.subgoals && data.subgoals.length > 0}
									How visible were the results of these behaviors from your perspective this week?
								{:else}
									How effective was {data.reflection.participantName}'s performance related to their objective: "{data.reflection.objectiveTitle || 'the objective'}" this week?
								{/if}
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
							class="flex h-10 w-full items-center justify-center rounded-lg border-2 text-sm font-semibold transition-all {isSelected
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
					<label for="comment" class="text-base font-semibold text-neutral-900">
						Reflection Notes
						<span class="ml-2 text-xs font-normal text-neutral-500">(optional)</span>
					</label>
				</div>
				<textarea
					name="comment"
					id="comment"
					rows="4"
					bind:value={notes}
					class="w-full rounded-xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200"
					placeholder="Share what you observed about {data.reflection.participantName}'s progress, any wins you noticed, or encouragement..."
				></textarea>
				<p class="mt-2 text-xs text-neutral-500">
					💡 Tip: Your observations help {data.reflection.participantName} and their coach see the full picture of their growth.
				</p>
			</div>

			<!-- Submit Button with Enhanced Design -->
			<div class="flex flex-col gap-4 rounded-2xl border-2 border-neutral-200 bg-gradient-to-r from-blue-50 to-purple-50 p-6 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex-1">
					<p class="font-semibold text-neutral-900">Ready to submit your feedback?</p>
					<p class="mt-1 text-xs text-neutral-600">
						Your perspective helps track progress and keeps {data.reflection.participantName} accountable.
					</p>
				</div>
				<div class="flex items-center gap-3">
					<button
						type="submit"
						disabled={isSubmitting || data.isPreview}
						class="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3.5 font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 focus-visible:ring-2 focus-visible:ring-offset-2"
					>
						<span class="relative z-10 flex items-center gap-2">
							{#if isSubmitting}
								<span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
								Submitting...
							{:else}
								<span role="img" aria-label="sparkles">✨</span>
								Submit Feedback
							{/if}
						</span>
						<div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity group-hover:opacity-100"></div>
					</button>
				</div>
			</div>
		</form>
		</div>
	{/if}
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

	@keyframes slide-in-from-bottom-4 {
		from {
			transform: translateY(1rem);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.animate-in {
		animation: fade-in 0.3s ease-out, slide-in-from-top-2 0.3s ease-out;
	}

	.slide-in-from-bottom-4 {
		animation: fade-in 0.5s ease-out, slide-in-from-bottom-4 0.5s ease-out;
	}
</style>
