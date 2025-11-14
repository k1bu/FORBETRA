<script lang="ts">
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	let effortScore = $state(data.previousEntry?.effortScore ?? 5);
	let progressScore = $state(data.previousEntry?.progressScore ?? 5);
	let isSubmitting = $state(false);

	// Update scores when previousEntry changes
	$effect(() => {
		if (data.previousEntry) {
			effortScore = data.previousEntry.effortScore ?? 5;
			progressScore = data.previousEntry.progressScore ?? 5;
		}
	});

	const formatDate = (value: string) =>
		new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));

	const getScoreLabel = (score: number, type: 'effort' | 'progress') => {
		if (type === 'effort') {
			if (score <= 2) return 'Getting started';
			if (score <= 4) return 'Building momentum';
			if (score <= 6) return 'Steady progress';
			if (score <= 8) return 'Strong effort';
			return 'Exceptional dedication';
		} else {
			if (score <= 2) return 'Early stages';
			if (score <= 4) return 'Noticing changes';
			if (score <= 6) return 'Clear progress';
			if (score <= 8) return 'Significant gains';
			return 'Outstanding results';
		}
	};

	const getScoreColor = (score: number) => {
		if (score <= 3) return 'text-amber-600';
		if (score <= 6) return 'text-blue-600';
		if (score <= 8) return 'text-emerald-600';
		return 'text-purple-600';
	};

	const getScoreBgColor = (score: number) => {
		if (score <= 3) return 'bg-amber-50 border-amber-200';
		if (score <= 6) return 'bg-blue-50 border-blue-200';
		if (score <= 8) return 'bg-emerald-50 border-emerald-200';
		return 'bg-purple-50 border-purple-200';
	};

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
		{#if !data.isAvailable}
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

	{#if form?.error}
		<div class="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
			<p class="font-medium">⚠️ {form.error}</p>
		</div>
	{/if}

	{#if form?.success}
		<div class="mx-auto max-w-2xl animate-in fade-in slide-in-from-top-2 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 text-center">
			<div class="mb-2 text-4xl">🎉</div>
			<p class="text-lg font-semibold text-emerald-900">Check-in saved!</p>
			<p class="mt-1 text-sm text-emerald-700">Your reflection has been recorded. Keep up the great work!</p>
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

	<div class="mx-auto w-full max-w-2xl space-y-6">
		<!-- Objective Card with Visual Appeal -->
		<div class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-8 shadow-lg transition-all hover:border-blue-300 hover:shadow-xl">
			<div class="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-gradient-to-br from-blue-100/50 to-transparent"></div>
			<div class="relative">
				<div class="mb-4 flex items-start justify-between">
					<div class="flex-1">
						<div class="mb-2 inline-flex items-center gap-2 rounded-lg bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
							<span>🎯</span>
							Your Objective
						</div>
						<h2 class="mt-3 text-2xl font-bold text-neutral-900">{data.objective.title}</h2>
						{#if data.objective.description}
							<p class="mt-2 text-base leading-relaxed text-neutral-600">{data.objective.description}</p>
						{/if}
					</div>
				</div>

				<!-- Subgoals as Visual Reference Cards -->
				<div class="mt-6 rounded-xl border border-neutral-200 bg-white/80 p-5 backdrop-blur-sm">
					<div class="mb-3 flex items-center gap-2">
						<span class="text-lg">📋</span>
						<p class="text-sm font-semibold text-neutral-700">Your behavioral indicators</p>
					</div>
					<p class="mb-4 text-xs leading-relaxed text-neutral-600">
						Use these as reference points when rating your overall effort and progress. They help define what success looks like for your objective.
					</p>
					<div class="grid gap-3 sm:grid-cols-1">
						{#each data.subgoals as subgoal, index (subgoal.id)}
							<div class="flex items-start gap-3 rounded-lg border border-neutral-100 bg-neutral-50/50 p-3 transition-all hover:border-blue-200 hover:bg-blue-50/30">
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
			</div>
		</div>

		<!-- Interactive Check-in Form -->
		<form method="post" onsubmit={handleSubmit} class="space-y-6">
			<!-- Effort Score with Enhanced UI -->
			<div class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<span class="text-2xl">💪</span>
						<div>
							<label for="effort-score" class="text-lg font-bold text-neutral-900">
								Focused Effort
							</label>
							<p class="text-xs text-neutral-500">How much energy did you invest this week?</p>
						</div>
					</div>
					<div
						class="flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all {getScoreBgColor(
							effortScore
						)}"
					>
						<span class="text-2xl font-bold {getScoreColor(effortScore)}">{effortScore}</span>
					</div>
				</div>

				<input
					type="range"
					name="effortScore"
					id="effort-score"
					min="0"
					max="10"
					step="1"
					bind:value={effortScore}
					disabled={!data.isAvailable || data.isLocked}
					class="h-3 w-full cursor-pointer appearance-none rounded-lg bg-gradient-to-r from-amber-200 via-blue-200 to-emerald-200 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-blue-400 [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-110"
				/>

				<div class="mt-3 flex items-center justify-between">
					<span class="text-xs font-medium text-neutral-500">Minimal</span>
					<div
						class="rounded-full px-3 py-1 text-xs font-semibold {getScoreBgColor(
							effortScore
						)} {getScoreColor(effortScore)}"
					>
						{getScoreLabel(effortScore, 'effort')}
					</div>
					<span class="text-xs font-medium text-neutral-500">Exceptional</span>
				</div>
			</div>

			<!-- Progress Score with Enhanced UI -->
			<div class="group rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md">
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<span class="text-2xl">📈</span>
						<div>
							<label for="progress-score" class="text-lg font-bold text-neutral-900">
								Performance
							</label>
							<p class="text-xs text-neutral-500">How satisfied are you with your progress?</p>
						</div>
					</div>
					<div
						class="flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all {getScoreBgColor(
							progressScore
						)}"
					>
						<span class="text-2xl font-bold {getScoreColor(progressScore)}">{progressScore}</span>
					</div>
				</div>

				<input
					type="range"
					name="progressScore"
					id="progress-score"
					min="0"
					max="10"
					step="1"
					bind:value={progressScore}
					disabled={!data.isAvailable || data.isLocked}
					class="h-3 w-full cursor-pointer appearance-none rounded-lg bg-gradient-to-r from-amber-200 via-blue-200 to-emerald-200 disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-emerald-400 [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:scale-110"
				/>

				<div class="mt-3 flex items-center justify-between">
					<span class="text-xs font-medium text-neutral-500">No progress</span>
					<div
						class="rounded-full px-3 py-1 text-xs font-semibold {getScoreBgColor(
							progressScore
						)} {getScoreColor(progressScore)}"
					>
						{getScoreLabel(progressScore, 'progress')}
					</div>
					<span class="text-xs font-medium text-neutral-500">Outstanding</span>
				</div>
			</div>

			<!-- Notes with Better UX -->
			<div class="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-purple-300 hover:shadow-md">
				<div class="mb-3 flex items-center gap-2">
					<span class="text-xl">✍️</span>
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
					class="w-full rounded-xl border-2 border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:opacity-50"
					placeholder="Share a win, an obstacle you overcame, or something you learned this week..."
				>{data.previousEntry?.notes ?? ''}</textarea>
				<p class="mt-2 text-xs text-neutral-500">
					💡 Tip: Capturing context helps you and your stakeholders see the full picture of your growth.
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
						Save for Later
					</a>
					<button
						type="submit"
						disabled={!data.isAvailable || data.isLocked || isSubmitting}
						class="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3.5 font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
					>
						<span class="relative z-10 flex items-center gap-2">
							{#if isSubmitting}
								<span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
								Saving...
							{:else}
								<span>✨</span>
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

