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
	import {
		Eye,
		Gift,
		AlertTriangle,
		Hand,
		Dumbbell,
		TrendingUp,
		PenLine,
		CircleCheck,
		Target,
		Lightbulb,
		Send,
		Shield
	} from 'lucide-svelte';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	const DRAFT_KEY = `feedback-draft-${data.token}`;
	const DRAFT_MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4 hours

	let showWelcome = $state(data.isFirstFeedback);
	let draftRestored = $state(false);

	let effortScore = $state<number | null>(null);
	let performanceScore = $state<number | null>(null);
	let notes = $state('');
	let isSubmitting = $state(false);
	let showReveal = $state(false);
	let scoresRequired = $state(false);
	let stakeholderScores = $state<{
		effortScore: number | null;
		performanceScore: number | null;
	} | null>(null);
	let previewIndividualScores = $state<{
		effortScore: number;
		performanceScore: number;
		participantName: string;
	} | null>(null);
	let phoneInput = $state('');
	let phoneSaved = $state(false);
	let phoneSaving = $state(false);

	const hasAtLeastOneScore = $derived(effortScore !== null || performanceScore !== null);

	const handleSubmit = (e: Event) => {
		if (!hasAtLeastOneScore && !notes.trim()) {
			e.preventDefault();
			scoresRequired = true;
			return;
		}
		scoresRequired = false;
		isSubmitting = true;
		stakeholderScores = { effortScore, performanceScore };
	};

	// Clear validation error when user selects a score or types notes
	$effect(() => {
		if (effortScore !== null || performanceScore !== null || notes.trim()) {
			scoresRequired = false;
		}
	});

	// Reset isSubmitting and phoneSaving on form response (success or error)
	$effect(() => {
		if (form) {
			isSubmitting = false;
			phoneSaving = false;
		}
	});

	// Simulate reveal for preview mode
	const simulateReveal = () => {
		stakeholderScores = { effortScore: effortScore ?? 0, performanceScore: performanceScore ?? 0 };
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
	const participantName = $derived(
		individualScores?.participantName ?? data.reflection.participantName
	);

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
			} catch {
				/* expected */
			}
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
					setTimeout(() => {
						draftRestored = false;
					}, 3000);
				} else {
					localStorage.removeItem(DRAFT_KEY);
				}
			}
		} catch {
			/* expected */
		}
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
				localStorage.setItem(
					DRAFT_KEY,
					JSON.stringify({
						effortScore: e,
						performanceScore: p,
						notes: n,
						savedAt: Date.now()
					})
				);
			} catch {
				/* expected */
			}
		}, 1000);
	});
</script>

<svelte:head>
	<title>Feedback for {data.reflection.participantName} | Forbetra</title>
</svelte:head>

{#if data.isAlreadySubmitted}
	<div class="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
		<div class="max-w-md rounded-xl border border-border-default bg-surface-raised p-8 shadow-lg">
			<div
				class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-muted"
			>
				<svg
					class="h-6 w-6 text-success"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
				</svg>
			</div>
			<h1 class="mb-2 text-xl font-bold text-text-primary">Feedback Already Submitted</h1>
			<p class="text-sm text-text-secondary">
				You've already submitted your feedback for {data.reflection?.participantName ??
					'this person'}. Thank you for your input!
			</p>
			{#if data.historicRatings && data.historicRatings.length > 0}
				<p class="mt-2 text-xs text-text-muted">
					You've contributed {data.historicRatings.length} time{data.historicRatings.length !== 1
						? 's'
						: ''} this cycle — that consistency makes a real difference.
				</p>
			{/if}
		</div>
	</div>
{:else}
	<section class="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-4 pb-12">
		<!-- Forbetra brand header -->
		<div class="pt-2 pb-1 text-center">
			<p
				class="text-lg text-text-primary"
				style="font-style: italic; font-weight: 700; letter-spacing: 0.02em;"
			>
				forbetra
			</p>
			<p class="text-xs text-text-tertiary">You. And Improved.</p>
		</div>

		{#if data.isPreview}
			<div
				class="fixed top-4 right-4 z-50 max-w-xs rounded-lg border border-accent/30 bg-accent-muted p-3 text-xs text-accent"
			>
				<p class="font-semibold"><Eye class="inline h-4 w-4" /> Preview Mode</p>
				<p class="mt-1 text-xs">Submissions are disabled.</p>
				{#if !showReveal}
					<button
						type="button"
						onclick={simulateReveal}
						class="mt-2 w-full rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-accent-hover"
					>
						<Gift class="inline h-4 w-4" /> Preview Reveal
					</button>
				{/if}
			</div>
		{/if}
		{#if draftRestored}
			<div
				class="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-success-muted bg-success-muted px-4 py-2 text-sm font-medium text-success transition-opacity"
			>
				Draft restored
			</div>
		{/if}
		<header class="space-y-3 text-center">
			<div class="flex items-center justify-center gap-2">
				<div
					class="inline-flex items-center gap-2 rounded-full bg-accent-muted px-4 py-1.5 text-xs font-medium text-accent"
				>
					<span class="h-2 w-2 rounded-full bg-accent"></span>
					Week {data.reflection.weekNumber} Check-in
				</div>
				{#if !data.isFirstFeedback && data.historicRatings && data.historicRatings.length > 0}
					<span
						class="rounded-full bg-success-muted px-3 py-1.5 text-[10px] font-semibold text-success"
					>
						Contribution #{data.historicRatings.length + 1}
					</span>
				{/if}
			</div>
			<h1 class="text-3xl font-bold text-text-primary">
				Share feedback for {data.reflection.participantName}
			</h1>
			<p class="text-base text-text-secondary">
				Cycle: {data.reflection.cycleLabel}. Your perspective helps keep progress aligned.
			</p>
		</header>

		<div aria-live="polite">
			{#if form?.error}
				<div
					class="mx-auto max-w-2xl rounded-xl border border-error-muted bg-error-muted p-4 text-sm text-error"
				>
					<p class="font-medium"><AlertTriangle class="inline h-4 w-4" /> {form.error}</p>
				</div>
			{/if}
		</div>

		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		{#if showWelcome && !form?.success}
			<div
				class="mx-auto max-w-2xl space-y-6"
				role="region"
				onkeydown={(e) => {
					if (e.key === 'Escape') showWelcome = false;
				}}
			>
				<div class="rounded-2xl border border-accent/30 bg-surface-base p-8">
					<div class="mb-5 text-center">
						<div
							class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent"
						>
							<Hand class="h-7 w-7 text-white" />
						</div>
						<h2 class="text-2xl font-bold text-text-primary">Welcome, {data.stakeholder.name}</h2>
						<p class="mt-2 text-base text-text-secondary">
							<strong>{data.reflection.participantName}</strong> is working on their growth and values
							your honest perspective. What takes you 60 seconds gives them insights they can't get any
							other way.
						</p>
					</div>

					<div class="mb-5 rounded-xl border border-accent/30 bg-surface-raised p-4">
						<p class="mb-1 text-xs font-semibold tracking-wide text-accent uppercase">
							Their objective
						</p>
						<p class="text-base font-bold text-text-primary">{data.reflection.objectiveTitle}</p>
					</div>

					<div class="mb-5 rounded-lg border border-border-default bg-surface-raised p-4">
						<p class="mb-2 text-xs font-semibold tracking-wide text-text-primary uppercase">
							Three quick steps
						</p>
						<ul class="space-y-1.5 text-sm text-text-secondary">
							<li class="flex items-center gap-2">
								<Dumbbell class="h-4 w-4 shrink-0 text-accent" />
								Rate their <strong>effort</strong> — how much energy are they investing?
							</li>
							<li class="flex items-center gap-2">
								<TrendingUp class="h-4 w-4 shrink-0 text-accent" />
								Rate their <strong>performance</strong> — what results are you seeing?
							</li>
							<li class="flex items-center gap-2">
								<PenLine class="h-4 w-4 shrink-0 text-accent" />
								Add a quick note if anything stands out
							</li>
						</ul>
					</div>

					<div class="mb-5 flex items-center gap-2 text-xs text-text-muted">
						<Shield class="h-3.5 w-3.5 shrink-0" />
						<span
							>Your feedback goes to {data.reflection.participantName} and their coach. No anonymous
							aggregation — your name is attached, which keeps feedback honest and actionable.</span
						>
					</div>

					<div class="text-center">
						<button
							type="button"
							onclick={() => {
								showWelcome = false;
							}}
							class="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3.5 font-semibold text-white transition-all hover:bg-accent-hover"
						>
							Rate now &middot; ~60 sec
							<span>&#8594;</span>
						</button>
					</div>
				</div>
			</div>
		{:else if form?.success || (data.isPreview && showReveal)}
			<div class="mx-auto max-w-2xl space-y-6">
				<!-- Initial Success Message -->
				<div
					aria-live="polite"
					class="animate-in fade-in slide-in-from-top-2 rounded-xl border border-success-muted bg-success-muted p-6 text-center"
				>
					<CircleCheck class="mx-auto mb-2 h-10 w-10 text-success" />
					<p class="text-lg font-semibold text-success">
						Thank you, {data.stakeholder.name}!
					</p>
					<p class="mt-1 text-sm text-success">
						Your perspective helps {data.reflection.participantName} see what they can't see themselves.
					</p>
					{#if data.historicRatings && data.historicRatings.length > 0}
						<p class="mt-2 text-xs text-success/80">
							Contribution #{data.historicRatings.length + 1} this cycle — your consistency amplifies
							impact.
						</p>
					{/if}
				</div>

				<!-- What happens next -->
				<div class="rounded-xl border border-border-default bg-surface-raised p-5">
					<p class="mb-3 text-sm font-semibold text-text-primary">How your feedback gets used</p>
					<ul class="space-y-2.5 text-xs text-text-secondary">
						<li class="flex items-start gap-2">
							<span
								class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[9px] font-bold text-accent"
								>1</span
							>
							Your scores are compared against {data.reflection.participantName}'s self-ratings to
							reveal blind spots
						</li>
						<li class="flex items-start gap-2">
							<span
								class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[9px] font-bold text-accent"
								>2</span
							>
							AI synthesizes all perspectives into actionable coaching insights by Sunday evening
						</li>
						<li class="flex items-start gap-2">
							<span
								class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[9px] font-bold text-accent"
								>3</span
							>
							Their coach uses your input to guide the next session
						</li>
					</ul>
					<p class="mt-3 text-[10px] text-text-muted">
						Your feedback is shared with {data.reflection.participantName} and their coach. Your name
						is attached to your ratings.
					</p>
				</div>

				<!-- Reveal Section (only when revealScores is enabled) -->
				{#if showReveal && individualScores && data.revealScores !== false}
					<div
						class="slide-in-from-bottom-4 rounded-2xl border border-accent/30 bg-surface-base p-8"
					>
						<div class="mb-6 text-center">
							<Gift class="mx-auto mb-3 h-12 w-12 text-accent" />
							<h2 class="text-2xl font-bold text-text-primary">
								Here's what {participantName} rated themselves:
							</h2>
							<p class="mt-2 text-sm text-text-secondary">
								Compare your perspective with their self-assessment
							</p>
						</div>

						<div class="grid gap-6 md:grid-cols-2">
							<!-- Focused Effort Comparison -->
							<div class="rounded-xl border border-border-default bg-surface-raised p-6">
								<div class="mb-4 flex items-center justify-between">
									<div>
										<p class="text-sm font-semibold text-text-secondary">Focused Effort</p>
										<p class="mt-1 text-xs text-text-tertiary">How much energy invested</p>
									</div>
								</div>
								<div class="space-y-3">
									<div
										class="flex items-center justify-between rounded-lg border border-border-default bg-surface-subtle px-4 py-3"
									>
										<span class="text-sm font-medium text-text-secondary">Your rating:</span>
										<div class="flex items-center gap-2">
											<div
												class="flex h-10 w-10 items-center justify-center rounded-full border-2 {getScoreBgColor(
													stakeholderScores?.effortScore ?? 0,
													'effort'
												)}"
											>
												<span
													class="text-lg font-bold {getScoreColor(
														stakeholderScores?.effortScore ?? 0,
														'effort'
													)}"
												>
													{stakeholderScores?.effortScore ?? 0}
												</span>
											</div>
										</div>
									</div>
									<div
										class="flex items-center justify-between rounded-lg border-2 border-accent/30 bg-accent-muted px-4 py-3"
									>
										<span class="text-sm font-medium text-text-secondary"
											>{participantName}'s rating:</span
										>
										<div class="flex items-center gap-2">
											<div
												class="flex h-10 w-10 items-center justify-center rounded-full border-2 {getScoreBgColor(
													individualScores?.effortScore ?? 0,
													'effort'
												)}"
											>
												<span
													class="text-lg font-bold {getScoreColor(
														individualScores?.effortScore ?? 0,
														'effort'
													)}"
												>
													{individualScores?.effortScore ?? '—'}
												</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							<!-- Performance Comparison -->
							<div class="rounded-xl border border-border-default bg-surface-raised p-6">
								<div class="mb-4 flex items-center justify-between">
									<div>
										<p class="text-sm font-semibold text-text-secondary">Performance</p>
										<p class="mt-1 text-xs text-text-tertiary">Satisfaction with progress</p>
									</div>
								</div>
								<div class="space-y-3">
									<div
										class="flex items-center justify-between rounded-lg border border-border-default bg-surface-subtle px-4 py-3"
									>
										<span class="text-sm font-medium text-text-secondary">Your rating:</span>
										<div class="flex items-center gap-2">
											<div
												class="flex h-10 w-10 items-center justify-center rounded-full border-2 {getScoreBgColor(
													stakeholderScores?.performanceScore ?? 0,
													'performance'
												)}"
											>
												<span
													class="text-lg font-bold {getScoreColor(
														stakeholderScores?.performanceScore ?? 0,
														'performance'
													)}"
												>
													{stakeholderScores?.performanceScore ?? 0}
												</span>
											</div>
										</div>
									</div>
									<div
										class="flex items-center justify-between rounded-lg border-2 border-accent/30 bg-accent-muted px-4 py-3"
									>
										<span class="text-sm font-medium text-text-secondary"
											>{participantName}'s rating:</span
										>
										<div class="flex items-center gap-2">
											<div
												class="flex h-10 w-10 items-center justify-center rounded-full border-2 {getScoreBgColor(
													individualScores?.performanceScore ?? 0,
													'performance'
												)}"
											>
												<span
													class="text-lg font-bold {getScoreColor(
														individualScores?.performanceScore ?? 0,
														'performance'
													)}"
												>
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

				<!-- Phone opt-in (only if stakeholder has no phone on file) -->
				{#if !data.stakeholder.phone && !data.isPreview}
					<div class="rounded-2xl border border-border-default bg-surface-raised p-6">
						{#if phoneSaved || form?.phoneSaved}
							<div
								class="rounded-lg border border-success/20 bg-success-muted px-4 py-3 text-sm text-success"
							>
								Phone saved! You'll get a text next time feedback is requested.
							</div>
						{:else}
							<p class="mb-3 text-sm font-semibold text-text-primary">
								Get future reminders via text?
							</p>
							<p class="mb-4 text-xs text-text-secondary">
								We'll send a quick SMS when {data.reflection.participantName} requests feedback. No spam,
								ever.
							</p>
							{#if form?.phoneError}
								<p class="mb-3 text-xs text-error">{form.phoneError}</p>
							{/if}
							<form
								method="post"
								action="?/updatePhone"
								onsubmit={() => {
									phoneSaving = true;
								}}
								class="flex items-center gap-3"
							>
								<input type="hidden" name="stakeholderId" value={data.stakeholder.id} />
								<input
									name="phone"
									type="tel"
									placeholder="+1 (555) 123-4567"
									bind:value={phoneInput}
									class="flex-1 rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
								/>
								<button
									type="submit"
									disabled={!phoneInput.trim() || phoneSaving}
									class="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
								>
									{phoneSaving ? 'Saving...' : 'Save'}
								</button>
							</form>
						{/if}
					</div>
				{/if}
			</div>
		{/if}

		{#if !form?.success && !(data.isPreview && showReveal) && !showWelcome}
			<div class="mx-auto w-full max-w-2xl space-y-6">
				<!-- Returning stakeholder impact summary -->
				{#if !data.isFirstFeedback && data.historicRatings && data.historicRatings.length > 0}
					{@const avgEffort =
						data.historicRatings.filter((r) => r.effortScore !== null).length > 0
							? Math.round(
									(data.historicRatings
										.filter((r) => r.effortScore !== null)
										.reduce((sum, r) => sum + (r.effortScore ?? 0), 0) /
										data.historicRatings.filter((r) => r.effortScore !== null).length) *
										10
								) / 10
							: null}
					{@const avgPerf =
						data.historicRatings.filter((r) => r.performanceScore !== null).length > 0
							? Math.round(
									(data.historicRatings
										.filter((r) => r.performanceScore !== null)
										.reduce((sum, r) => sum + (r.performanceScore ?? 0), 0) /
										data.historicRatings.filter((r) => r.performanceScore !== null).length) *
										10
								) / 10
							: null}
					<div
						class="rounded-xl border border-accent/20 bg-gradient-to-r from-accent/5 to-transparent p-4"
					>
						<p class="mb-2 text-xs font-semibold tracking-wide text-accent uppercase">
							Your impact so far
						</p>
						<div class="flex flex-wrap items-center gap-x-5 gap-y-2">
							<div class="flex items-center gap-1.5">
								<span
									class="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-[10px] font-bold text-accent"
								>
									{data.historicRatings.length}
								</span>
								<span class="text-xs text-text-secondary"
									>week{data.historicRatings.length !== 1 ? 's' : ''} of feedback</span
								>
							</div>
							{#if avgEffort !== null}
								<div class="flex items-center gap-1.5">
									<span class="text-xs text-text-muted">Avg effort:</span>
									<span class="text-xs font-bold text-cyan-300">{avgEffort}</span>
								</div>
							{/if}
							{#if avgPerf !== null}
								<div class="flex items-center gap-1.5">
									<span class="text-xs text-text-muted">Avg perf:</span>
									<span class="text-xs font-bold text-amber-300">{avgPerf}</span>
								</div>
							{/if}
						</div>
						<p class="mt-2 text-[10px] text-text-tertiary">
							Your ongoing perspective helps {data.reflection.participantName}'s coach track real
							progress over time.
						</p>
					</div>
				{/if}

				<!-- Step indicator -->
				<div class="flex items-center justify-center gap-2">
					<div class="flex items-center gap-1.5">
						<span
							class="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold {effortScore !==
							null
								? 'bg-accent text-white'
								: 'bg-surface-subtle text-text-muted'}">1</span
						>
						<span class="text-[10px] text-text-muted">Effort</span>
					</div>
					<div class="h-px w-6 bg-border-default"></div>
					<div class="flex items-center gap-1.5">
						<span
							class="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold {performanceScore !==
							null
								? 'bg-accent text-white'
								: 'bg-surface-subtle text-text-muted'}">2</span
						>
						<span class="text-[10px] text-text-muted">Performance</span>
					</div>
					<div class="h-px w-6 bg-border-default"></div>
					<div class="flex items-center gap-1.5">
						<span
							class="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold {notes.trim()
								? 'bg-accent text-white'
								: 'bg-surface-subtle text-text-muted'}">3</span
						>
						<span class="text-[10px] text-text-muted">Comment</span>
					</div>
				</div>

				<form method="post" onsubmit={handleSubmit} class="space-y-6">
					<input type="hidden" name="token" value={data.token} />
					<!-- Hidden inputs for form submission (only included when a score is selected) -->
					{#if effortScore !== null}
						<input type="hidden" name="effortScore" value={effortScore} />
					{/if}
					{#if performanceScore !== null}
						<input type="hidden" name="performanceScore" value={performanceScore} />
					{/if}

					<!-- Objective Display -->
					<div class="rounded-xl border border-border-default bg-surface-subtle px-5 py-4">
						<div class="flex items-center gap-3 text-base text-text-secondary">
							<Target class="h-5 w-5 text-accent" />
							<span class="font-medium">Objective:</span>
							<span class="text-lg font-semibold text-text-primary"
								>{data.reflection.objectiveTitle || 'the objective'}</span
							>
						</div>
					</div>

					{#if data.subgoals && data.subgoals.length > 0}
						<div class="rounded-xl border border-accent/30 bg-surface-base px-5 py-4">
							<p class="mb-3 text-sm font-semibold text-accent">Behaviors to observe</p>
							<div class="space-y-2">
								{#each data.subgoals as subgoal (subgoal.label)}
									<div class="rounded-lg border border-border-default bg-surface-raised px-4 py-3">
										<p class="text-sm font-semibold text-text-primary">{subgoal.label}</p>
										{#if subgoal.description}
											<p class="mt-1 text-xs text-text-secondary">{subgoal.description}</p>
										{/if}
									</div>
								{/each}
							</div>
							<p class="mt-3 text-xs text-accent">
								Keep these in mind as you rate effort and performance below.
							</p>
						</div>
					{/if}

					{#if data.previousRatings && (data.previousRatings.effortScore !== null || data.previousRatings.performanceScore !== null)}
						{@const historicRatings = data.historicRatings ?? []}
						<div class="rounded-xl border border-accent/30 bg-accent-muted p-4">
							<div class="mb-3">
								<p class="text-sm font-semibold text-accent">
									Your last ratings for {data.reflection.participantName}:
								</p>
							</div>
							<div class="flex gap-6 text-sm">
								{#if data.previousRatings.effortScore !== null}
									<div class="flex items-center gap-2">
										<span class="text-accent">Effort:</span>
										<span class="text-lg font-bold text-accent"
											>{data.previousRatings.effortScore}</span
										>
									</div>
								{/if}
								{#if data.previousRatings.performanceScore !== null}
									<div class="flex items-center gap-2">
										<span class="text-accent">Performance:</span>
										<span class="text-lg font-bold text-accent"
											>{data.previousRatings.performanceScore}</span
										>
									</div>
								{/if}
							</div>
							<p class="mt-2 text-xs text-accent">
								Use this as context - adjust freely based on this week.
							</p>
							{#if historicRatings.length > 1}
								<div class="mt-4">
									<HistoricRatingsChart {historicRatings} />
								</div>
							{/if}
						</div>
					{/if}

					<!-- Effort Score with Enhanced UI -->
					<div
						class="group rounded-2xl border border-border-default bg-surface-raised p-6 transition-all hover:border-border-strong"
					>
						<div class="mb-4 flex items-center justify-between">
							<div class="flex items-center gap-3">
								<Dumbbell class="h-6 w-6 text-accent" />
								<div>
									<label for="effort-score" class="text-lg font-bold text-text-primary">
										Focused Effort
									</label>
									<p class="text-xs text-text-tertiary">
										{#if data.subgoals && data.subgoals.length > 0}
											How much focused effort did {data.reflection.participantName} invest in the behaviors
											listed above this week?
										{:else}
											How much attention did {data.reflection.participantName} give to their objective:
											"{data.reflection.objectiveTitle || 'the objective'}" this week?
										{/if}
									</p>
								</div>
							</div>
							<div
								class="flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all {effortScore !==
								null
									? getScoreBgColor(effortScore, 'effort')
									: 'border-border-default bg-surface-subtle'}"
							>
								<span
									class="text-2xl font-bold {effortScore !== null
										? getScoreColor(effortScore, 'effort')
										: 'text-text-muted'}">{effortScore !== null ? effortScore : '—'}</span
								>
							</div>
						</div>

						<!-- Button Grid (Primary Input) -->
						<div
							class="mb-4 grid grid-cols-6 gap-2 sm:grid-cols-11"
							role="radiogroup"
							aria-label="Effort score selection"
						>
							{#each Array.from({ length: 11 }, (_, i) => i) as i (i)}
								{@const isSelected = effortScore === i}
								{@const buttonColors = getButtonSelectedColors(i, 'effort')}
								{@const hoverColors = getButtonHoverColors(i, 'effort')}
								{@const focusRing = getFocusRing(i, 'effort')}
								<button
									type="button"
									onclick={() => (effortScore = i)}
									aria-pressed={isSelected}
									aria-label="Score {i} out of 10"
									class="flex h-10 w-full items-center justify-center rounded-lg border-2 text-sm font-semibold transition-all {isSelected
										? buttonColors
										: 'border-border-default bg-surface-raised text-text-secondary ' +
											hoverColors} focus:ring-2 focus:outline-none {focusRing} focus:ring-offset-2"
								>
									{i}
								</button>
							{/each}
						</div>

						<div class="mb-2 flex items-center justify-between">
							<span class="text-xs font-medium text-text-tertiary">Rarely intentional</span>
							{#if effortScore !== null}
								<div
									class="rounded-full px-3 py-1 text-xs font-semibold {getScoreBgColor(
										effortScore,
										'effort'
									)} {getScoreColor(effortScore, 'effort')}"
								>
									{getScoreLabel(effortScore, 'effort')}
								</div>
							{:else}
								<div
									class="rounded-full bg-surface-subtle px-3 py-1 text-xs font-semibold text-text-muted"
								>
									Select a score
								</div>
							{/if}
							<span class="text-xs font-medium text-text-tertiary">Relentless commitment</span>
						</div>
						<p class="text-xs text-text-muted italic">
							<strong>0–3</strong> Rarely visible · <strong>4–6</strong> Some attention ·
							<strong>7–10</strong> Proactive, consistent effort
						</p>
					</div>

					<!-- Progress Score with Enhanced UI -->
					<div
						class="group rounded-2xl border border-border-default bg-surface-raised p-6 transition-all hover:border-border-strong"
					>
						<div class="mb-4 flex items-center justify-between">
							<div class="flex items-center gap-3">
								<TrendingUp class="h-6 w-6 text-accent" />
								<div>
									<label for="progress-score" class="text-lg font-bold text-text-primary">
										Performance
									</label>
									<p class="text-xs text-text-tertiary">
										{#if data.subgoals && data.subgoals.length > 0}
											How visible were the results of these behaviors from your perspective this
											week?
										{:else}
											How effective was {data.reflection.participantName}'s performance related to
											their objective: "{data.reflection.objectiveTitle || 'the objective'}" this
											week?
										{/if}
									</p>
								</div>
							</div>
							<div
								class="flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all {performanceScore !==
								null
									? getScoreBgColor(performanceScore, 'performance')
									: 'border-border-default bg-surface-subtle'}"
							>
								<span
									class="text-2xl font-bold {performanceScore !== null
										? getScoreColor(performanceScore, 'performance')
										: 'text-text-muted'}">{performanceScore !== null ? performanceScore : '—'}</span
								>
							</div>
						</div>

						<!-- Button Grid (Primary Input) -->
						<div
							class="mb-4 grid grid-cols-6 gap-2 sm:grid-cols-11"
							role="radiogroup"
							aria-label="Performance score selection"
						>
							{#each Array.from({ length: 11 }, (_, i) => i) as i (i)}
								{@const isSelected = performanceScore === i}
								{@const buttonColors = getButtonSelectedColors(i, 'performance')}
								{@const hoverColors = getButtonHoverColors(i, 'performance')}
								{@const focusRing = getFocusRing(i, 'performance')}
								<button
									type="button"
									onclick={() => (performanceScore = i)}
									aria-pressed={isSelected}
									aria-label="Score {i} out of 10"
									class="flex h-10 w-full items-center justify-center rounded-lg border-2 text-sm font-semibold transition-all {isSelected
										? buttonColors
										: 'border-border-default bg-surface-raised text-text-secondary ' +
											hoverColors} focus:ring-2 focus:outline-none {focusRing} focus:ring-offset-2"
								>
									{i}
								</button>
							{/each}
						</div>

						<div class="mb-2 flex items-center justify-between">
							<span class="text-xs font-medium text-text-tertiary">Not yet visible</span>
							{#if performanceScore !== null}
								<div
									class="rounded-full px-3 py-1 text-xs font-semibold {getScoreBgColor(
										performanceScore,
										'performance'
									)} {getScoreColor(performanceScore, 'performance')}"
								>
									{getScoreLabel(performanceScore, 'performance')}
								</div>
							{:else}
								<div
									class="rounded-full bg-surface-subtle px-3 py-1 text-xs font-semibold text-text-muted"
								>
									Select a score
								</div>
							{/if}
							<span class="text-xs font-medium text-text-tertiary">Transformative impact</span>
						</div>
						<p class="text-xs text-text-muted italic">
							<strong>0–3</strong> No visible change · <strong>4–6</strong> Some improvement ·
							<strong>7–10</strong> Clear, consistent results
						</p>
					</div>

					<!-- Impact reinforcement (appears after both scores are filled) -->
					{#if effortScore !== null && performanceScore !== null}
						<div
							class="flex items-center gap-2.5 rounded-xl border border-success/10 bg-gradient-to-r from-success/5 to-transparent px-4 py-2.5"
						>
							<CircleCheck class="h-4 w-4 shrink-0 text-success" />
							<p class="text-xs text-text-secondary">
								Both scores recorded. Your perspective helps {data.reflection.participantName} see blind
								spots they can't see alone.
							</p>
						</div>
					{/if}

					<!-- Notes with Better UX -->
					<div
						class="rounded-2xl border border-border-default bg-surface-raised p-6 transition-all hover:border-accent/30"
					>
						<div class="mb-3 flex items-center gap-2">
							<PenLine class="h-5 w-5 text-accent" />
							<label for="comment" class="text-base font-semibold text-text-primary">
								Share your observations
							</label>
						</div>
						<textarea
							name="comment"
							id="comment"
							rows="4"
							maxlength="500"
							bind:value={notes}
							class="w-full rounded-xl border border-border-default bg-surface-subtle px-4 py-3 text-sm text-text-secondary placeholder:text-text-muted focus:border-accent focus:bg-surface-raised focus:ring-2 focus:ring-accent/30 focus:outline-none"
							placeholder="Share a specific example — something {data.reflection
								.participantName} did well, or an area where they could grow."
						></textarea>
						<div class="mt-2 flex items-center justify-between">
							<p class="text-xs text-text-tertiary">
								<Lightbulb class="inline h-3.5 w-3.5 text-text-tertiary" /> Tip: Your observations help
								{data.reflection.participantName} and their coach see the full picture of their growth.
							</p>
							<span class="text-xs text-text-muted">{notes.length} / 500</span>
						</div>
					</div>

					<!-- Validation message -->
					{#if scoresRequired}
						<div class="rounded-xl border border-error-muted bg-error-muted p-4 text-sm text-error">
							<p class="font-medium">
								<AlertTriangle class="inline h-4 w-4" /> Please select at least one score or write an
								observation before submitting.
							</p>
						</div>
					{/if}

					<!-- Submit Button with Enhanced Design -->
					<div
						class="flex flex-col gap-4 rounded-2xl border border-border-default bg-surface-base p-6 sm:flex-row sm:items-center sm:justify-between"
					>
						<div class="flex-1">
							<p class="font-semibold text-text-primary">Ready to submit your feedback?</p>
							<p class="mt-1 flex items-center gap-1.5 text-xs text-text-secondary">
								<Shield class="h-3.5 w-3.5 shrink-0 text-success" />
								Shared only with {data.reflection.participantName} and their coach.
							</p>
						</div>
						<div class="flex items-center gap-3">
							<button
								type="submit"
								disabled={isSubmitting || data.isPreview}
								class="rounded-xl bg-accent px-8 py-3.5 font-semibold text-white transition-all hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
							>
								<span class="flex items-center gap-2">
									{#if isSubmitting}
										<span
											class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
										></span>
										Submitting...
									{:else}
										<Send class="h-4 w-4" />
										Submit Feedback
									{/if}
								</span>
							</button>
						</div>
					</div>
				</form>
			</div>
		{/if}
	</section>
{/if}

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
		animation:
			fade-in 0.3s ease-out,
			slide-in-from-top-2 0.3s ease-out;
	}

	.slide-in-from-bottom-4 {
		animation:
			fade-in 0.5s ease-out,
			slide-in-from-bottom-4 0.5s ease-out;
	}

	@media (prefers-reduced-motion: reduce) {
		.animate-in,
		.slide-in-from-bottom-4 {
			animation: none;
		}
	}
</style>
