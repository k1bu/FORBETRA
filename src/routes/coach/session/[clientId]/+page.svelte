<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';
	import PerformanceEffortChart from '$lib/components/PerformanceEffortChart.svelte';
	import { addToast } from '$lib/stores/toasts.svelte';
	import {
		Target,
		Sparkles,
		AlertTriangle,
		TrendingUp,
		TrendingDown,
		Minus,
		Lock,
		ChevronDown
	} from 'lucide-svelte';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	let generatingPrep = $state(false);
	let prepError = $state<string | null>(null);
	let freshPrep = $state<{ id: string; content: string | null; createdAt: string } | null>(null);
	let noteContent = $state('');
	let noteWeek = $state(data.client.objective?.cycle?.currentWeek?.toString() ?? '');
	let submittingNote = $state(false);
	let showChart = $state(false);

	const prepData = $derived(freshPrep ?? data.coachPrep);

	const formatDate = (value: string | null | undefined) => {
		if (!value) return '';
		return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
	};

	const formatRelativeDays = (value: string | null | undefined) => {
		if (!value) return '';
		const created = new Date(value);
		const diff = Date.now() - created.getTime();
		const days = Math.floor(diff / (24 * 60 * 60 * 1000));
		if (days <= 0) return 'Today';
		if (days === 1) return '1 day ago';
		if (days < 14) return `${days} days ago`;
		const weeks = Math.floor(days / 7);
		if (weeks < 8) return `${weeks} wk${weeks === 1 ? '' : 's'} ago`;
		return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(created);
	};

	async function generatePrep() {
		generatingPrep = true;
		prepError = null;
		try {
			const res = await fetch('/api/insights/coach-prep', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ individualId: data.client.id })
			});
			const result = await res.json();
			if (res.ok && result.content) {
				freshPrep = {
					id: result.id,
					content: result.content,
					createdAt: result.createdAt
				};
				addToast('Session prep ready', 'success');
			} else {
				prepError = result.error || 'Could not generate insights. Try again in a moment.';
			}
		} catch {
			prepError = 'Connection issue — check your network and try again.';
		} finally {
			generatingPrep = false;
		}
	}

	// Recent weeks: last 3-4 weeks of reflections
	const recentWeeks = $derived(
		(() => {
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const map = new Map<number, typeof data.allReflections>();
			for (const r of data.allReflections) {
				const week = r.weekNumber;
				if (!map.has(week)) map.set(week, []);
				map.get(week)!.push(r);
			}
			return Array.from(map.entries())
				.sort(([a], [b]) => b - a)
				.slice(0, 4);
		})()
	);

	$effect(() => {
		if (form) {
			submittingNote = false;
		}
		if (form?.noteSuccess) {
			addToast('Note saved', 'success');
			noteContent = '';
		}
	});
</script>

<svelte:head>
	<title>Client Session | Forbetra</title>
</svelte:head>

<section class="mx-auto flex max-w-3xl flex-col gap-6 p-4 pb-12">
	<!-- Header -->
	<header>
		<nav aria-label="Breadcrumb" class="mb-2">
			<ol class="flex items-center gap-1.5 text-sm text-text-tertiary">
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<li>
					<a
						href="/coach"
						class="rounded transition-colors hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
						>Dashboard</a
					>
				</li>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
				<li aria-hidden="true" class="text-text-muted">/</li>
				<li><span class="font-medium text-text-primary">{data.client.name}</span></li>
			</ol>
		</nav>
		<div class="flex items-start justify-between gap-3">
			<div>
				<h1 class="text-2xl font-bold text-text-primary">{data.client.name}</h1>
				<p class="text-sm text-text-muted">{data.client.email}</p>
				{#if data.client.objective}
					<div class="mt-1.5 flex items-center gap-2">
						<Target class="h-4 w-4 text-accent" />
						<span class="text-sm text-text-secondary">{data.client.objective.title}</span>
					</div>
				{/if}
			</div>
			{#if data.client.objective?.cycle}
				<span class="rounded-full bg-accent-muted px-3 py-1 text-xs font-semibold text-accent">
					Week {data.client.objective.cycle.currentWeek ?? '—'}
				</span>
			{/if}
		</div>
	</header>

	<!-- Alerts -->
	{#if data.alerts.length > 0 || data.client.alerts.length > 0}
		<div class="space-y-2">
			{#each data.alerts as alert, i (i)}
				<div
					class="flex items-start gap-2 rounded-xl border border-error/30 bg-error-muted px-4 py-3 text-sm text-error"
				>
					<AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" />
					{alert.content}
				</div>
			{/each}
			{#each data.client.alerts as alert, i (i)}
				<div
					class="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-muted px-4 py-3 text-sm {alert.severity ===
					'high'
						? 'text-error'
						: 'text-warning'}"
				>
					<AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" />
					{alert.message}
				</div>
			{/each}
		</div>
	{/if}

	<!-- 1. AI Prep Summary -->
	<div class="rounded-xl border border-accent/20 bg-surface-raised p-5">
		<div class="mb-3 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Sparkles class="h-4 w-4 text-accent" />
				<h2 class="font-semibold text-text-primary">AI Coaching Insights</h2>
				{#if prepData}
					<span class="text-xs text-text-tertiary">{formatRelativeDays(prepData.createdAt)}</span>
					{#if data.prepFreshness?.isStale}
						<span
							class="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning"
						>
							{data.prepFreshness.newDataSince} new
						</span>
					{/if}
				{/if}
			</div>
			<button
				type="button"
				disabled={generatingPrep}
				onclick={generatePrep}
				class="rounded-lg border border-accent/30 bg-surface-raised px-3 py-1.5 text-xs font-semibold text-accent transition-all hover:border-accent hover:bg-accent-muted disabled:cursor-not-allowed disabled:opacity-50"
			>
				{generatingPrep ? 'Generating...' : prepData ? 'Refresh' : 'Generate'}
			</button>
		</div>
		{#if prepError}
			<div class="flex items-start gap-2 rounded-lg border border-error/20 bg-error/5 px-3 py-2">
				<p class="flex-1 text-xs text-error">{prepError}</p>
				<button
					type="button"
					onclick={generatePrep}
					class="shrink-0 text-xs font-semibold text-accent hover:underline">Retry</button
				>
			</div>
		{/if}
		{#if prepData?.content}
			<div class="prose prose-sm max-w-none whitespace-pre-line text-text-secondary">
				{prepData.content}
			</div>
		{:else}
			<p class="text-sm text-text-tertiary">No prep generated yet. Click above to generate.</p>
		{/if}
	</div>

	<!-- 2. Recent Scores + Gap Highlights -->
	{#if data.client.objective?.insights}
		{@const ins = data.client.objective.insights}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
			<div class="rounded-lg border border-border-default bg-surface-raised px-3 py-2">
				<p class="text-[10px] font-medium tracking-wider text-text-muted uppercase">Effort</p>
				<p class="text-lg font-bold text-cyan-400 tabular-nums">{ins.avgEffort ?? '—'}</p>
			</div>
			<div class="rounded-lg border border-border-default bg-surface-raised px-3 py-2">
				<p class="text-[10px] font-medium tracking-wider text-text-muted uppercase">Performance</p>
				<p class="text-lg font-bold text-amber-400 tabular-nums">{ins.avgProgress ?? '—'}</p>
			</div>
			<div class="rounded-lg border border-border-default bg-surface-raised px-3 py-2">
				<p class="text-[10px] font-medium tracking-wider text-text-muted uppercase">Trajectory</p>
				<div class="flex items-center gap-1">
					{#if ins.trajectoryScore !== null}
						{#if ins.trajectoryScore > 5}
							<TrendingUp class="h-4 w-4 text-success" />
							<span class="text-sm font-semibold text-success">Up</span>
						{:else if ins.trajectoryScore < -5}
							<TrendingDown class="h-4 w-4 text-error" />
							<span class="text-sm font-semibold text-error">Down</span>
						{:else}
							<Minus class="h-4 w-4 text-text-muted" />
							<span class="text-sm font-semibold text-text-muted">Stable</span>
						{/if}
					{:else}
						<span class="text-lg font-bold text-text-muted">—</span>
					{/if}
				</div>
			</div>
			<div class="rounded-lg border border-border-default bg-surface-raised px-3 py-2">
				<p class="text-[10px] font-medium tracking-wider text-text-muted uppercase">Completion</p>
				<p class="text-lg font-bold text-accent tabular-nums">
					{data.client.objective.cycle
						? `${Math.round(data.client.objective.cycle.completion * 100)}%`
						: '—'}
				</p>
			</div>
		</div>
	{/if}

	<!-- Recent check-ins (last 3-4 weeks) -->
	{#if recentWeeks.length > 0}
		<div class="rounded-xl border border-border-default bg-surface-raised p-5">
			<h2 class="mb-3 font-semibold text-text-primary">Recent Check-ins</h2>
			<div class="space-y-3">
				{#each recentWeeks as [weekNumber, reflections] (weekNumber)}
					<div class="rounded-lg border border-border-default bg-surface-subtle p-3">
						<p class="mb-1.5 text-xs font-bold text-text-secondary">Week {weekNumber}</p>
						<div class="space-y-1.5">
							{#each reflections as r, i (i)}
								<div class="flex items-start gap-2 text-xs">
									<span
										class="shrink-0 rounded bg-accent-muted px-1.5 py-0.5 text-[10px] font-semibold text-accent"
									>
										{r.reflectionType === 'RATING_A' || r.reflectionType === 'RATING_B'
											? 'Self'
											: r.reflectionType === 'STAKEHOLDER'
												? '360'
												: r.reflectionType}
									</span>
									<div class="min-w-0 flex-1">
										{#if r.effortScore !== null || r.performanceScore !== null}
											<span class="text-text-secondary">
												{#if r.effortScore !== null}Effort: <strong>{r.effortScore}</strong>{/if}
												{#if r.effortScore !== null && r.performanceScore !== null}
													·
												{/if}
												{#if r.performanceScore !== null}Perf: <strong>{r.performanceScore}</strong
													>{/if}
											</span>
										{/if}
										{#if r.notes}
											<p class="mt-0.5 text-text-muted">{r.notes}</p>
										{/if}
									</div>
									{#if r.submittedAt}
										<span class="shrink-0 text-[10px] text-text-muted"
											>{formatDate(r.submittedAt)}</span
										>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Rater feedback summary -->
	{#if data.stakeholderTrends.length > 0}
		<div class="rounded-xl border border-border-default bg-surface-raised p-5">
			<h2 class="mb-3 font-semibold text-text-primary">Reviewer Feedback</h2>
			<div class="grid gap-2 sm:grid-cols-2">
				{#each data.stakeholderTrends as trend (trend.name)}
					{@const effortDiff =
						trend.latestEffort != null && trend.previousEffort != null
							? trend.latestEffort - trend.previousEffort
							: null}
					{@const perfDiff =
						trend.latestPerformance != null && trend.previousPerformance != null
							? trend.latestPerformance - trend.previousPerformance
							: null}
					<div
						class="flex items-center justify-between rounded-lg border border-border-default bg-surface-subtle px-3 py-2"
					>
						<div>
							<p class="text-sm font-medium text-text-primary">{trend.name}</p>
							<div class="flex gap-3 text-xs text-text-muted">
								{#if trend.latestEffort !== null}
									<span>Effort: {trend.latestEffort}</span>
								{/if}
								{#if trend.latestPerformance !== null}
									<span>Perf: {trend.latestPerformance}</span>
								{/if}
							</div>
						</div>
						{#if effortDiff !== null || perfDiff !== null}
							{@const avgDiff =
								((effortDiff ?? 0) + (perfDiff ?? 0)) /
								((effortDiff !== null ? 1 : 0) + (perfDiff !== null ? 1 : 0) || 1)}
							<span
								class="text-xs {avgDiff > 0.5
									? 'text-success'
									: avgDiff < -0.5
										? 'text-error'
										: 'text-text-muted'}"
							>
								{#if avgDiff > 0.5}
									<TrendingUp class="h-3.5 w-3.5" />
								{:else if avgDiff < -0.5}
									<TrendingDown class="h-3.5 w-3.5" />
								{:else}
									<Minus class="h-3.5 w-3.5" />
								{/if}
							</span>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- 3. Coach Notes -->
	<div class="rounded-xl border border-border-default bg-surface-raised p-5">
		<div class="mb-3 flex items-baseline justify-between">
			<h2 class="font-semibold text-text-primary">Coach Notes</h2>
			<p class="flex items-center gap-1 text-[10px] text-text-muted">
				<Lock class="h-3 w-3" />
				Private — shapes AI insights
			</p>
		</div>

		<!-- Add note form -->
		<form
			method="post"
			action="?/createNote"
			class="mb-4 rounded-lg border border-border-default bg-surface-subtle p-3"
			use:enhance={() => {
				submittingNote = true;
				return async ({ update }) => {
					submittingNote = false;
					await update();
				};
			}}
		>
			{#if data.cycleId}
				<input type="hidden" name="cycleId" value={data.cycleId} />
			{/if}
			{#if form?.noteError}
				<p class="mb-2 text-xs text-error">{form.noteError}</p>
			{/if}
			<div class="flex gap-3">
				<div class="min-w-0 flex-1">
					<textarea
						name="content"
						rows="2"
						required
						minlength="10"
						bind:value={noteContent}
						class="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 focus:outline-none"
						placeholder="Add a note..."
					></textarea>
				</div>
				<div class="flex shrink-0 flex-col gap-2">
					<input
						type="number"
						name="weekNumber"
						min="1"
						max="52"
						bind:value={noteWeek}
						class="w-16 rounded-lg border border-border-default bg-surface-raised px-2 py-1 text-center text-xs text-text-primary focus:border-accent focus:outline-none"
						placeholder="Wk"
					/>
					<button
						type="submit"
						disabled={submittingNote}
						class="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
					>
						{submittingNote ? 'Saving...' : 'Save'}
					</button>
				</div>
			</div>
		</form>

		<!-- Notes list -->
		{#if data.allCoachNotes.length > 0}
			<ul class="space-y-2">
				{#each data.allCoachNotes as note (note.id)}
					<li class="rounded-lg border border-border-default bg-surface-subtle p-3">
						<p class="text-sm text-text-secondary">{note.content}</p>
						<div class="mt-1.5 flex items-center gap-2 text-xs text-text-tertiary">
							{#if note.weekNumber}
								<span class="rounded-full bg-accent-muted px-2 py-0.5 font-semibold text-accent"
									>Week {note.weekNumber}</span
								>
							{/if}
							<span>{formatRelativeDays(note.createdAt)}</span>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-center text-sm text-text-tertiary">No notes yet.</p>
		{/if}
	</div>

	<!-- 4. Trend Chart (collapsed by default) -->
	{#if data.client.visualizationData && data.client.visualizationData.individual.length > 0}
		<div class="rounded-xl border border-border-default bg-surface-raised">
			<button
				type="button"
				onclick={() => (showChart = !showChart)}
				class="flex w-full items-center justify-between p-5 text-left"
			>
				<h2 class="font-semibold text-text-primary">Performance & Effort Trends</h2>
				<ChevronDown
					class="h-4 w-4 text-text-muted transition-transform {showChart ? 'rotate-180' : ''}"
				/>
			</button>
			{#if showChart}
				<div class="border-t border-border-default p-5">
					<PerformanceEffortChart
						individualData={data.client.visualizationData.individual}
						stakeholderData={data.client.visualizationData.stakeholders}
						stakeholders={data.client.visualizationData.stakeholderList}
					/>
				</div>
			{/if}
		</div>
	{/if}
</section>
