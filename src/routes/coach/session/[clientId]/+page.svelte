<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';
	import PerformanceEffortChart from '$lib/components/PerformanceEffortChart.svelte';
	import { addToast } from '$lib/stores/toasts.svelte';
	import { Target, Sparkles, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-svelte';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	let generatingPrep = $state(false);
	let prepError = $state<string | null>(null);
	let freshPrep = $state<{ id: string; content: string | null; createdAt: string } | null>(null);
	let noteContent = $state('');
	let noteWeek = $state(data.client.objective?.cycle?.currentWeek?.toString() ?? '');
	let submittingNote = $state(false);

	const prepData = $derived(freshPrep ?? data.coachPrep);

	// Tab navigation
	type SessionTab = 'prep' | 'timeline' | 'notes' | 'chart';
	let activeTab = $state<SessionTab>('prep');
	const tabs: { id: SessionTab; label: string; desc: string }[] = [
		{ id: 'prep', label: 'Prep', desc: 'AI insights & alerts' },
		{ id: 'timeline', label: 'Timeline', desc: 'Weekly reflections' },
		{ id: 'notes', label: 'Notes', desc: 'Your observations' },
		{ id: 'chart', label: 'Chart', desc: 'Trends over time' }
	];

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
				addToast('Session prep ready — coaching opportunities surfaced', 'success');
			} else {
				prepError = result.error || 'Could not generate insights. Try again in a moment.';
			}
		} catch {
			prepError = 'Connection issue — check your network and try again.';
		} finally {
			generatingPrep = false;
		}
	}

	// Group reflections by week
	const reflectionsByWeek = $derived(
		(() => {
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const map = new Map<number, typeof data.allReflections>();
			for (const r of data.allReflections) {
				const week = r.weekNumber;
				if (!map.has(week)) map.set(week, []);
				map.get(week)!.push(r);
			}
			return Array.from(map.entries()).sort(([a], [b]) => b - a);
		})()
	);

	// Week summaries with deltas for timeline
	const weekSummaries = $derived(
		(() => {
			const weeks = reflectionsByWeek;
			const avg = (nums: number[]) =>
				nums.length > 0
					? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
					: null;
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const result = new Map<
				number,
				{
					avgEffort: number | null;
					avgPerf: number | null;
					effortDelta: number | null;
					perfDelta: number | null;
				}
			>();
			for (let i = 0; i < weeks.length; i++) {
				const [weekNum, refs] = weeks[i];
				const avgEffort = avg(
					refs.map((r) => r.effortScore).filter((s): s is number => s !== null)
				);
				const avgPerf = avg(
					refs.map((r) => r.performanceScore).filter((s): s is number => s !== null)
				);
				let effortDelta: number | null = null;
				let perfDelta: number | null = null;
				if (i + 1 < weeks.length) {
					const [, prevRefs] = weeks[i + 1];
					const prevEffort = avg(
						prevRefs.map((r) => r.effortScore).filter((s): s is number => s !== null)
					);
					const prevPerf = avg(
						prevRefs.map((r) => r.performanceScore).filter((s): s is number => s !== null)
					);
					if (avgEffort !== null && prevEffort !== null)
						effortDelta = Math.round((avgEffort - prevEffort) * 10) / 10;
					if (avgPerf !== null && prevPerf !== null)
						perfDelta = Math.round((avgPerf - prevPerf) * 10) / 10;
				}
				result.set(weekNum, { avgEffort, avgPerf, effortDelta, perfDelta });
			}
			return result;
		})()
	);

	$effect(() => {
		if (form) {
			submittingNote = false;
		}
		if (form?.noteSuccess) {
			const count = data.allCoachNotes.length + 1;
			const firstName = data.client.name.split(' ')[0];
			const milestoneMsg =
				count === 10
					? `Your 10th note for ${firstName} — you're deeply invested`
					: count === 25
						? `25 notes for ${firstName} — rich coaching record`
						: count === 5
							? `5 notes for ${firstName} — patterns are forming`
							: `Note saved — shapes ${firstName}'s next prompt`;
			addToast(milestoneMsg, 'success');
			noteContent = '';
		}
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
		const idx = parseInt(e.key) - 1;
		if (idx >= 0 && idx < tabs.length) activeTab = tabs[idx].id;
	}}
/>

<svelte:head>
	<title>Client Session | Forbetra</title>
</svelte:head>

<section class="mx-auto flex max-w-5xl flex-col gap-6 p-4 pb-12">
	<!-- Header -->
	<header class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<nav aria-label="Breadcrumb" class="mb-2">
				<ol class="flex items-center gap-1.5 text-sm text-text-tertiary">
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<li>
						<a
							href="/coach"
							class="rounded transition-colors hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
							>Coach Hub</a
						>
					</li>
					<li aria-hidden="true" class="text-text-muted">
						<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7"
							/></svg
						>
					</li>
					<li>
						<a
							href="/coach/roster"
							class="rounded transition-colors hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
							>Roster</a
						>
					</li>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
					<li aria-hidden="true" class="text-text-muted">
						<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7"
							/></svg
						>
					</li>
					<li><span class="font-medium text-text-primary">{data.client.name}</span></li>
				</ol>
			</nav>
			<h1 class="text-3xl font-bold text-text-primary">{data.client.name}</h1>
			<p class="text-sm text-text-secondary">{data.client.email}</p>
			{#if data.client.objective}
				<div class="mt-2 flex items-center gap-2">
					<Target class="h-4 w-4 text-accent" />
					<span class="text-sm font-medium text-text-secondary">{data.client.objective.title}</span>
				</div>
				{#if data.subgoals.length > 0}
					<div class="mt-1.5 flex flex-wrap gap-1.5 pl-6">
						{#each data.subgoals as subgoal (subgoal.id)}
							<span
								class="rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs text-text-muted"
								title={subgoal.description ?? subgoal.label}
							>
								{subgoal.label}
							</span>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
		{#if data.client.objective?.cycle}
			<span class="rounded-full bg-accent-muted px-3 py-1 text-xs font-semibold text-accent">
				Week {data.client.objective.cycle.currentWeek ?? '—'}
			</span>
		{/if}
	</header>

	<!-- Quick Summary -->
	{#if data.client.objective?.insights}
		{@const ins = data.client.objective.insights}
		{@const cycle = data.client.objective.cycle}
		<div
			class="grid grid-cols-2 gap-3 sm:grid-cols-4"
			role="group"
			aria-label="Client summary metrics"
		>
			<div class="rounded-lg border border-border-default bg-surface-raised px-3 py-2">
				<p class="text-[10px] font-medium tracking-wider text-text-muted uppercase">Effort</p>
				<p class="text-lg font-bold text-cyan-400 tabular-nums">{ins.avgEffort ?? '—'}</p>
				<p class="text-[9px] text-text-muted">Self-reported avg</p>
			</div>
			<div class="rounded-lg border border-border-default bg-surface-raised px-3 py-2">
				<p class="text-[10px] font-medium tracking-wider text-text-muted uppercase">Performance</p>
				<p class="text-lg font-bold text-amber-400 tabular-nums">{ins.avgProgress ?? '—'}</p>
				<p class="text-[9px] text-text-muted">Self-reported avg</p>
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
				<p class="text-[9px] text-text-muted">Week-over-week trend</p>
			</div>
			<div class="rounded-lg border border-border-default bg-surface-raised px-3 py-2">
				<p class="text-[10px] font-medium tracking-wider text-text-muted uppercase">Completion</p>
				<p class="text-lg font-bold text-accent tabular-nums">
					{cycle ? `${Math.round(cycle.completion * 100)}%` : '—'}
				</p>
				<p class="text-[9px] text-text-muted">Cycle progress</p>
			</div>
		</div>
	{/if}

	<!-- Tab Navigation -->
	<div
		class="flex gap-1 rounded-xl border border-border-default bg-surface-subtle p-1"
		role="tablist"
	>
		{#each tabs as tab, tabIdx (tab.id)}
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === tab.id}
				title="{tab.desc} (press {tabIdx + 1})"
				onclick={() => (activeTab = tab.id)}
				class="flex flex-1 flex-col items-center gap-0.5 rounded-lg px-4 py-2 transition-all {activeTab ===
				tab.id
					? 'bg-accent text-white shadow-sm'
					: 'text-text-tertiary hover:bg-surface-raised hover:text-text-secondary'}"
			>
				<span class="text-sm font-semibold">
					{tab.label}
					<span class="ml-0.5 hidden text-[9px] font-normal opacity-50 sm:inline">{tabIdx + 1}</span
					>
					{#if tab.id === 'prep' && data.alerts.length + data.client.alerts.length > 0}
						<span class="ml-1 rounded-full bg-warning px-1.5 text-[10px] font-bold text-white"
							>{data.alerts.length + data.client.alerts.length}</span
						>
					{/if}
					{#if tab.id === 'notes' && data.allCoachNotes.length > 0}
						<span
							class="ml-1 text-[10px] font-normal {activeTab === tab.id
								? 'text-white/70'
								: 'text-text-muted'}">{data.allCoachNotes.length}</span
						>
					{/if}
				</span>
				<span
					class="hidden text-[9px] font-normal sm:block {activeTab === tab.id
						? 'text-white/70'
						: 'text-text-muted'}"
				>
					{tab.desc}
				</span>
			</button>
		{/each}
	</div>

	<!-- ═══ TAB: Prep ═══ -->
	{#if activeTab === 'prep'}
		<!-- AI Coaching Insights -->
		<div
			class="rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/5 to-accent-muted p-6"
		>
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Sparkles class="h-5 w-5 text-accent" />
					<div>
						<h2 class="text-lg font-bold text-text-primary">AI Coaching Insights</h2>
						<p class="text-xs text-text-tertiary">
							Synthesizes check-ins, notes, and stakeholder feedback to surface coaching
							opportunities
						</p>
					</div>
					{#if prepData}
						<span class="text-xs text-text-tertiary">{formatRelativeDays(prepData.createdAt)}</span>
						{#if data.prepFreshness?.isStale}
							<span
								class="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold text-warning"
							>
								{data.prepFreshness.newDataSince} new data point{data.prepFreshness.newDataSince ===
								1
									? ''
									: 's'}
							</span>
						{:else if data.prepFreshness}
							<span
								class="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success"
							>
								Up to date
							</span>
						{/if}
					{/if}
				</div>
				<button
					type="button"
					disabled={generatingPrep}
					onclick={generatePrep}
					class="rounded-lg border border-accent/30 bg-surface-raised px-4 py-2 text-xs font-semibold text-accent transition-all hover:border-accent hover:bg-accent-muted disabled:cursor-not-allowed disabled:opacity-50"
				>
					{generatingPrep ? 'Generating...' : prepData ? 'Refresh Insights' : 'Generate Insights'}
				</button>
			</div>
			{#if prepError}
				<div class="flex items-start gap-2 rounded-lg border border-error/20 bg-error/5 px-3 py-2">
					<p class="flex-1 text-xs text-error">{prepError}</p>
					<button
						type="button"
						onclick={generatePrep}
						class="shrink-0 text-xs font-semibold text-accent hover:underline"
					>
						Retry
					</button>
				</div>
			{/if}
			{#if prepData?.content}
				<div class="prose prose-sm max-w-none whitespace-pre-line text-text-secondary">
					{prepData.content}
				</div>
				<!-- Data provenance — trust cues -->
				{@const submittedReflections = data.allReflections.filter((r) => r.submittedAt)}
				{@const stakeholdersWithData = data.stakeholderTrends.filter(
					(s) => s.latestEffort !== null || s.latestPerformance !== null
				)}
				<div
					class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-border-default bg-surface-subtle px-3 py-2 text-[10px] text-text-muted"
				>
					<span class="font-semibold tracking-wide uppercase">Sources analyzed</span>
					<span
						>{submittedReflections.length} check-in{submittedReflections.length !== 1
							? 's'
							: ''}</span
					>
					<span>{data.allCoachNotes.length} note{data.allCoachNotes.length !== 1 ? 's' : ''}</span>
					<span
						>{stakeholdersWithData.length} stakeholder{stakeholdersWithData.length !== 1
							? 's'
							: ''}</span
					>
					{#if prepData}
						<span class="ml-auto">Generated {formatRelativeDays(prepData.createdAt)}</span>
					{/if}
				</div>
			{:else}
				<p class="text-sm text-text-tertiary">No prep generated yet. Click above to generate.</p>
			{/if}
		</div>

		<!-- Alerts -->
		{#if data.alerts.length > 0}
			<div class="rounded-2xl border border-error/50 bg-error-muted p-6">
				<div class="mb-3 flex items-center gap-2">
					<AlertTriangle class="h-5 w-5 text-warning" />
					<h2 class="text-lg font-bold text-error">AI Alerts</h2>
				</div>
				<ul class="space-y-2">
					{#each data.alerts as alert, i (i)}
						<li class="glass rounded-lg px-3 py-2 text-sm text-error">
							{alert.content}
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if data.client.alerts.length > 0}
			<div class="rounded-2xl border border-border-strong bg-warning-muted p-6">
				<div class="mb-3 flex items-center gap-2">
					<AlertTriangle class="h-5 w-5 text-warning" />
					<h2 class="text-lg font-bold text-warning">Status Alerts</h2>
				</div>
				<ul class="space-y-2">
					{#each data.client.alerts as alert, i (i)}
						<li
							class="glass flex items-start gap-2 rounded-lg px-3 py-2 text-sm {alert.severity ===
							'high'
								? 'border border-error/50 font-semibold text-error'
								: 'text-warning'}"
						>
							<span
								class="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full {alert.severity === 'high'
									? 'bg-error'
									: alert.severity === 'medium'
										? 'bg-warning'
										: 'bg-accent'}"
							></span>
							{alert.message}
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	{/if}

	<!-- ═══ TAB: Timeline ═══ -->
	{#if activeTab === 'timeline'}
		<!-- Reflections Timeline -->
		{#if reflectionsByWeek.length > 0}
			<div class="rounded-2xl border border-border-default bg-surface-raised p-6">
				<h2 class="mb-4 text-lg font-bold text-text-primary">Reflections Timeline</h2>
				<div class="space-y-4">
					{#each reflectionsByWeek as [weekNumber, reflections] (weekNumber)}
						{@const ws = weekSummaries.get(weekNumber)}
						<div class="rounded-xl border border-border-default bg-surface-subtle p-4">
							<div class="mb-2 flex items-baseline gap-3">
								<p class="text-sm font-bold text-text-secondary">Week {weekNumber}</p>
								{#if ws}
									<div class="flex gap-3 text-xs">
										{#if ws.avgEffort !== null}
											<span class="text-warning">
												Effort {ws.avgEffort}{#if ws.effortDelta !== null && ws.effortDelta !== 0}
													{#if ws.effortDelta > 0}
														<span class="text-success"> ↑{ws.effortDelta}</span>
													{:else}
														<span class="text-error"> ↓{Math.abs(ws.effortDelta)}</span>
													{/if}
												{/if}
											</span>
										{/if}
										{#if ws.avgPerf !== null}
											<span class="text-accent">
												Perf {ws.avgPerf}{#if ws.perfDelta !== null && ws.perfDelta !== 0}
													{#if ws.perfDelta > 0}
														<span class="text-success"> ↑{ws.perfDelta}</span>
													{:else}
														<span class="text-error"> ↓{Math.abs(ws.perfDelta)}</span>
													{/if}
												{/if}
											</span>
										{/if}
									</div>
								{/if}
							</div>
							<div class="space-y-2">
								{#each reflections as r, i (i)}
									<div
										class="flex items-start gap-3 rounded-lg bg-surface-raised px-3 py-2 text-sm"
									>
										<span
											class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold {r.reflectionType ===
											'STAKEHOLDER'
												? 'bg-success/10 text-success'
												: 'bg-accent-muted text-accent'}"
										>
											{r.reflectionType === 'RATING_A' || r.reflectionType === 'RATING_B'
												? 'Self-Report'
												: r.reflectionType === 'STAKEHOLDER'
													? '360 Feedback'
													: r.reflectionType}
										</span>
										<div class="min-w-0 flex-1">
											{#if r.effortScore !== null || r.performanceScore !== null}
												<div class="flex gap-3 text-xs">
													{#if r.effortScore !== null}
														<span class="text-warning"
															>Effort: <strong>{r.effortScore}</strong></span
														>
													{/if}
													{#if r.performanceScore !== null}
														<span class="text-accent"
															>Perf: <strong>{r.performanceScore}</strong></span
														>
													{/if}
												</div>
											{/if}
											{#if r.notes}
												<p class="mt-1 text-xs text-text-secondary">{r.notes}</p>
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
		{:else}
			<div class="rounded-2xl border border-border-default bg-surface-raised p-6 text-center">
				<p class="text-sm text-text-tertiary">No reflections yet.</p>
			</div>
		{/if}

		<!-- Stakeholder Feedback Summary -->
		{#if data.client.stakeholders.length > 0}
			<div class="rounded-2xl border border-border-strong bg-success-muted p-6">
				<h2 class="mb-4 text-lg font-bold text-text-primary">Stakeholder Feedback</h2>
				<div class="grid gap-3 sm:grid-cols-2">
					{#each data.client.stakeholders as stakeholder (stakeholder.email)}
						{@const trend = data.stakeholderTrends.find((t) => t.name === stakeholder.name)}
						{@const effortDiff =
							trend?.latestEffort != null && trend?.previousEffort != null
								? trend.latestEffort - trend.previousEffort
								: null}
						{@const perfDiff =
							trend?.latestPerformance != null && trend?.previousPerformance != null
								? trend.latestPerformance - trend.previousPerformance
								: null}
						<div class="glass rounded-xl border border-border-default p-3">
							<div class="flex items-center justify-between">
								<div>
									<p class="text-sm font-semibold text-text-primary">{stakeholder.name}</p>
									<p class="text-xs text-text-tertiary">{stakeholder.email}</p>
								</div>
								{#if effortDiff !== null || perfDiff !== null}
									{@const avgDiff =
										((effortDiff ?? 0) + (perfDiff ?? 0)) /
										((effortDiff !== null ? 1 : 0) + (perfDiff !== null ? 1 : 0) || 1)}
									<span
										class="flex items-center gap-0.5 text-xs {avgDiff > 0.5
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
							{#if stakeholder.lastFeedback}
								<div class="mt-2 flex gap-3 text-xs">
									{#if stakeholder.lastFeedback.effortScore !== null}
										<span class="text-success"
											>Effort: <strong>{stakeholder.lastFeedback.effortScore}</strong></span
										>
									{/if}
									{#if stakeholder.lastFeedback.performanceScore !== null}
										<span class="text-success"
											>Perf: <strong>{stakeholder.lastFeedback.performanceScore}</strong></span
										>
									{/if}
								</div>
								<p class="mt-1 text-[10px] text-text-muted">
									{stakeholder.lastFeedback.weekNumber
										? `Week ${stakeholder.lastFeedback.weekNumber}`
										: ''}
									{stakeholder.lastFeedback.submittedAt
										? ` · ${formatRelativeDays(stakeholder.lastFeedback.submittedAt)}`
										: ''}
								</p>
							{:else}
								<p class="mt-2 text-xs text-text-muted">No feedback yet</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}

	<!-- ═══ TAB: Notes ═══ -->
	{#if activeTab === 'notes'}
		<div class="rounded-2xl border border-border-default bg-surface-raised p-6">
			<h2 class="mb-4 text-lg font-bold text-text-primary">Coach Notes</h2>

			<!-- Inline add note form -->
			<form
				method="post"
				action="?/createNote"
				class="mb-4 rounded-xl border border-border-default bg-surface-subtle p-4"
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
							class="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:bg-surface-raised focus:ring-1 focus:ring-accent/30 focus:outline-none"
							placeholder="Add a note for this client..."
						></textarea>
					</div>
					<div class="flex shrink-0 flex-col gap-2">
						<input
							type="number"
							name="weekNumber"
							min="1"
							max="12"
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
							<div class="mt-2 flex items-center gap-2 text-xs text-text-tertiary">
								{#if note.weekNumber}
									<span class="rounded-full bg-accent-muted px-2 py-0.5 font-semibold text-accent">
										Week {note.weekNumber}
									</span>
								{/if}
								<span>{formatRelativeDays(note.createdAt)}</span>
							</div>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="text-center text-sm text-text-tertiary">
					No notes yet. Add your first note above.
				</p>
			{/if}
		</div>
	{/if}

	<!-- ═══ TAB: Chart ═══ -->
	{#if activeTab === 'chart'}
		{#if data.client.visualizationData && data.client.visualizationData.individual.length > 0}
			<div class="rounded-2xl border border-border-default bg-surface-raised p-6">
				<h2 class="mb-4 text-lg font-bold text-text-primary">Performance & Effort Over Time</h2>
				<PerformanceEffortChart
					individualData={data.client.visualizationData.individual}
					stakeholderData={data.client.visualizationData.stakeholders}
					stakeholders={data.client.visualizationData.stakeholderList}
				/>
			</div>
		{:else}
			<div class="rounded-2xl border border-border-default bg-surface-raised p-6 text-center">
				<p class="text-sm text-text-tertiary">
					No data available yet. Charts will appear after check-ins begin.
				</p>
			</div>
		{/if}
	{/if}
</section>
