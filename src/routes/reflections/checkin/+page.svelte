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
	import { addToast } from '$lib/stores/toasts.svelte';
	import { CircleCheck, Target, ClipboardList, Dumbbell, TrendingUp, PenLine, Send } from 'lucide-svelte';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	$effect(() => {
		if (form?.success) {
			addToast('Check-in submitted!', 'success');
		}
	});

	let effortScore = $state(data.previousEntry?.effortScore ?? 5);
	let performanceScore = $state(data.previousEntry?.performanceScore ?? 5);
	let notes = $state(data.previousEntry?.notes ?? '');
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

<svelte:head>
	<title>Check-in | Forbetra</title>
</svelte:head>

<section class="mx-auto flex max-w-4xl flex-col gap-6 p-4 pb-12">
	<!-- Back to Today Link -->
	<div class="flex items-center justify-between">
		<a
			href="/individual"
			class="group flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
		>
			<svg
				class="h-4 w-4 transition-transform group-hover:-translate-x-1"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Back to Today
		</a>
	</div>

	{#if data.isPreview}
		<div class="fixed top-4 right-4 z-50 max-w-xs rounded-lg border border-accent/30 bg-accent-muted p-3 text-xs text-accent">
			<p class="font-semibold">Preview Mode</p>
			<p class="mt-1 text-xs">Submissions will be saved normally.</p>
		</div>
	{/if}
	<!-- Header with encouraging messaging -->
	<header class="space-y-3 text-center">
		<div class="inline-flex items-center gap-2 rounded-full bg-accent-muted px-4 py-1.5 text-xs font-medium text-accent">
			<span class="h-2 w-2 rounded-full bg-accent"></span>
			Week {data.currentWeek} Check-in
		</div>
		<h1 class="text-3xl font-bold text-text-primary">{data.checkInLabel}</h1>
		<p class="text-base text-text-secondary">
			Take a moment to reflect on your progress. Every check-in moves you forward.
		</p>
		{#if !data.isPreview && !data.isAvailable}
			<div class="mx-auto max-w-md rounded-xl border border-warning/30 bg-warning-muted p-4 text-sm text-warning">
				<p class="font-medium">Check-in not yet available</p>
				<p class="mt-1">This check-in opens on {formatDate(data.availableDate)}. Check back then to record your reflection.</p>
			</div>
		{:else if data.isLocked}
			<div class="mx-auto max-w-md rounded-xl border border-border-default bg-surface-raised p-4 text-sm text-text-secondary">
				<p class="font-medium">Check-in locked</p>
				<p class="mt-1">This check-in is locked because your next week's Monday intention has already been submitted. Check-ins lock 48 hours after the following week begins.</p>
			</div>
		{/if}
	</header>

	<div aria-live="polite">
		{#if form?.error}
			<div class="mx-auto max-w-2xl rounded-xl border border-error/30 bg-error-muted p-4 text-sm text-error">
				<p class="font-medium">{form.error}</p>
			</div>
		{/if}

		{#if form?.success}
			<div class="mx-auto max-w-2xl animate-in fade-in slide-in-from-top-2 rounded-xl border border-success/30 bg-success-muted p-6 text-center">
				<CircleCheck class="mx-auto mb-2 h-10 w-10 text-success" />
				<p class="text-lg font-semibold text-success">Check-in saved!</p>
				{#if form.streak && form.streak >= 3}
					<p class="mt-1 text-sm font-semibold text-warning">
						You're on a {form.streak} check-in streak!{#if form.streak >= 12} Incredible consistency!{:else if form.streak >= 9} Outstanding!{:else if form.streak >= 6} Keep it going!{/if}
					</p>
				{:else}
					<p class="mt-1 text-sm text-success">Your reflection has been recorded. Keep up the great work!</p>
				{/if}
				<a
					href="/individual"
					class="mt-4 inline-flex items-center gap-2 rounded-lg bg-success px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-success/90"
				>
					Return to Today
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
			<div class="rounded-xl border border-border-default bg-surface-subtle px-5 py-4">
				<div class="flex items-center gap-3 text-base text-text-secondary">
					<Target class="h-5 w-5 text-accent" />
					<span class="font-medium">Objective:</span>
					<span class="font-semibold text-lg text-text-primary">{data.objective.title}</span>
				</div>
			</div>

			<!-- Collapsible Behavioral Indicators -->
			<div class="rounded-xl border border-border-default bg-surface-raised">
				<button
					type="button"
					onclick={() => (showBehavioralIndicators = !showBehavioralIndicators)}
					class="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-surface-subtle"
				>
					<div class="flex items-center gap-2">
						<ClipboardList class="h-5 w-5 text-text-secondary" />
						<span class="text-sm font-medium text-text-secondary">View behavioral indicators</span>
					</div>
					<svg
						class="h-5 w-5 text-text-tertiary transition-transform {showBehavioralIndicators
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
					<div class="border-t border-border-default px-4 py-4">
						<p class="mb-3 text-xs leading-relaxed text-text-secondary">
							Use these as reference points when rating your overall effort and progress. They help define what success looks like for your objective.
						</p>
						<div class="space-y-2">
							{#each data.subgoals as subgoal, index (subgoal.id)}
								<div class="flex items-start gap-3 rounded-lg border border-border-default bg-surface-subtle p-3">
									<span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-bold text-accent">
										{index + 1}
									</span>
									<div class="flex-1">
										<p class="font-semibold text-text-primary">{subgoal.label}</p>
										{#if subgoal.description}
											<p class="mt-1 text-xs text-text-secondary">{subgoal.description}</p>
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
				<div class="rounded-xl border border-accent/30 bg-accent-muted p-4">
					<div class="mb-3">
						<p class="text-sm font-semibold text-accent">Your last ratings:</p>
					</div>
					<div class="flex gap-6 text-sm">
						<div class="flex items-center gap-2">
							<span class="text-accent">Effort:</span>
							<span class="font-bold text-lg text-accent">
								{data.previousRatings.effortScore !== null ? data.previousRatings.effortScore : '—'}
							</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-accent">Performance:</span>
							<span class="font-bold text-lg text-accent">
								{data.previousRatings.performanceScore !== null ? data.previousRatings.performanceScore : '—'}
							</span>
						</div>
					</div>
					<p class="mt-2 text-xs text-accent">Use this as context - adjust freely based on this week.</p>
					{#if historicRatings.length > 1}
						<div class="mt-4">
							<HistoricRatingsChart historicRatings={historicRatings} />
						</div>
					{/if}
				</div>
			{/if}
			<!-- Effort Score with Enhanced UI -->
			<div class="group rounded-2xl border border-border-default bg-surface-raised p-6 transition-all hover:border-border-strong">
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<Dumbbell class="h-6 w-6 text-accent" />
						<div>
							<label for="effort-score" class="text-lg font-bold text-text-primary">
								Focused Effort
							</label>
							<p class="text-xs text-text-tertiary">
								How much attention did you give to your objective: "{data.objective.title}" this week?
							</p>
						</div>
					</div>
					<div
						class="flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all {getScoreBgColor(
							effortScore, 'effort'
						)}"
						aria-valuetext="Effort score: {effortScore} out of 10"
					>
						<span class="text-2xl font-bold {getScoreColor(effortScore, 'effort')}">{effortScore}</span>
					</div>
				</div>

				<!-- Button Grid (Primary Input) -->
				<div class="mb-4 grid grid-cols-6 gap-2 sm:grid-cols-11" role="radiogroup" aria-label="Effort score selection">
					{#each Array(11) as _, i}
						{@const isSelected = effortScore === i}
						{@const buttonColors = getButtonSelectedColors(i, 'effort')}
						{@const hoverColors = getButtonHoverColors(i, 'effort')}
						{@const focusRing = getFocusRing(i, 'effort')}
						<button
							type="button"
							onclick={() => (effortScore = i)}
							disabled={!data.isAvailable || data.isLocked}
							aria-pressed={isSelected}
							aria-label="Score {i} out of 10"
							class="flex h-10 w-full items-center justify-center rounded-lg border-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 {isSelected
								? buttonColors + ' shadow-md'
								: 'border-border-default bg-surface-raised text-text-secondary ' + hoverColors} focus:outline-none focus:ring-2 {focusRing} focus:ring-offset-2"
						>
							{i}
						</button>
					{/each}
				</div>

				<div class="mb-2 flex items-center justify-between">
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
				<p class="text-xs text-text-muted italic">
					Consider attention, preparation, and prioritization toward the objective.
				</p>
			</div>

			<!-- Progress Score with Enhanced UI -->
			<div class="group rounded-2xl border border-border-default bg-surface-raised p-6 transition-all hover:border-border-strong">
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<TrendingUp class="h-6 w-6 text-accent" />
						<div>
							<label for="progress-score" class="text-lg font-bold text-text-primary">
								Performance
							</label>
							<p class="text-xs text-text-tertiary">
								How effective was your performance related to your objective: "{data.objective.title}" this week?
							</p>
						</div>
					</div>
					<div
						class="flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all {getScoreBgColor(
							performanceScore, 'performance'
						)}"
						aria-valuetext="Performance score: {performanceScore} out of 10"
					>
						<span class="text-2xl font-bold {getScoreColor(performanceScore, 'performance')}">{performanceScore}</span>
					</div>
				</div>

				<!-- Button Grid (Primary Input) -->
				<div class="mb-4 grid grid-cols-6 gap-2 sm:grid-cols-11" role="radiogroup" aria-label="Performance score selection">
					{#each Array(11) as _, i}
						{@const isSelected = performanceScore === i}
						{@const buttonColors = getButtonSelectedColors(i, 'performance')}
						{@const hoverColors = getButtonHoverColors(i, 'performance')}
						{@const focusRing = getFocusRing(i, 'performance')}
						<button
							type="button"
							onclick={() => (performanceScore = i)}
							disabled={!data.isAvailable || data.isLocked}
							aria-pressed={isSelected}
							aria-label="Score {i} out of 10"
							class="flex h-10 w-full items-center justify-center rounded-lg border-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 {isSelected
								? buttonColors + ' shadow-md'
								: 'border-border-default bg-surface-raised text-text-secondary ' + hoverColors} focus:outline-none focus:ring-2 {focusRing} focus:ring-offset-2"
						>
							{i}
						</button>
					{/each}
				</div>

				<div class="mb-2 flex items-center justify-between">
					<span class="text-xs font-medium text-text-tertiary">Not yet visible</span>
					<div
						class="rounded-full px-3 py-1 text-xs font-semibold {getScoreBgColor(
							performanceScore, 'performance'
						)} {getScoreColor(performanceScore, 'performance')}"
					>
						{getScoreLabel(performanceScore, 'performance')}
					</div>
					<span class="text-xs font-medium text-text-tertiary">Transformative impact</span>
				</div>
				<p class="text-xs text-text-muted italic">
					Consider outcomes, behavior change, and visible impact related to the objective.
				</p>
			</div>

			<!-- Notes with Better UX -->
			<div class="rounded-2xl border border-border-default bg-surface-raised p-6 transition-all hover:border-accent/30">
				<div class="mb-3 flex items-center gap-2">
					<PenLine class="h-5 w-5 text-accent" />
					<label for="notes" class="text-base font-semibold text-text-primary">
						Reflect on your week
					</label>
				</div>
				<textarea
					name="notes"
					id="notes"
					rows="4"
					maxlength="500"
					bind:value={notes}
					disabled={!data.isAvailable || data.isLocked}
					class="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
					placeholder="What went well? What's challenging? What stood out this week?"
				></textarea>
				<div class="mt-2 flex items-center justify-between">
					<p class="text-xs text-text-tertiary">
						Your reflections help you and your coach see the full picture of your growth.
					</p>
					<p class="text-xs text-text-muted text-right">{notes.length}/500</p>
				</div>
			</div>

			<!-- Submit Button with Enhanced Design -->
			<div class="flex flex-col gap-4 rounded-2xl border border-border-default bg-accent-muted p-6 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex-1">
					{#if data.isLocked || data.previousEntry}
						<p class="font-semibold text-text-primary">Viewing completed check-in</p>
						<p class="mt-1 text-xs text-text-secondary">
							This check-in has been completed and can no longer be edited.
						</p>
					{:else}
						<p class="font-semibold text-text-primary">Ready to save your check-in?</p>
						<p class="mt-1 text-xs text-text-secondary">
							Your reflection helps track progress and keeps you accountable.
						</p>
					{/if}
				</div>
				<div class="flex items-center gap-3">
					<a
						href="/individual"
						class="rounded-xl border border-border-default bg-surface-raised px-6 py-3.5 text-sm font-semibold text-text-secondary transition-all hover:border-border-strong hover:bg-surface-subtle"
					>
						Cancel
					</a>
					<button
						type="submit"
						disabled={!data.isAvailable || data.isLocked || isSubmitting}
						title={data.isLocked ? 'Check-in already submitted' : !data.isAvailable ? 'This check-in is not yet available' : isSubmitting ? 'Submitting...' : undefined}
						class="group relative overflow-hidden rounded-xl bg-accent px-8 py-3.5 font-semibold text-white shadow-lg transition-all hover:bg-accent-hover hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
					>
						<span class="relative z-10 flex items-center gap-2">
							{#if isSubmitting}
								<span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
								Saving...
							{:else}
								<Send class="h-4 w-4" />
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
