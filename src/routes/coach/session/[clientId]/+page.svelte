<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';
	import PerformanceEffortChart from '$lib/components/PerformanceEffortChart.svelte';
	import { addToast } from '$lib/stores/toasts.svelte';
	import { Target, Sparkles, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-svelte';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	let generatingPrep = $state(false);
	let freshPrep = $state<{ id: string; content: string | null; createdAt: string } | null>(null);
	let noteContent = $state('');
	let noteWeek = $state(data.client.objective?.cycle?.currentWeek?.toString() ?? '');
	let submittingNote = $state(false);

	const prepData = $derived(freshPrep ?? data.coachPrep);

	const prepContext = $derived(() => {
		if (!prepData) return null;
		const prepTime = new Date(prepData.createdAt).getTime();
		const notesBefore = data.allCoachNotes.filter(
			(n) => new Date(n.createdAt).getTime() <= prepTime
		).length;
		const reflectionCount = data.allReflections?.length ?? 0;
		const parts: string[] = [];
		if (notesBefore > 0) parts.push(`${notesBefore} note${notesBefore !== 1 ? 's' : ''}`);
		if (reflectionCount > 0)
			parts.push(`${reflectionCount} check-in${reflectionCount !== 1 ? 's' : ''}`);
		return parts.length > 0 ? `Based on your ${parts.join(' and ')}` : null;
	});

	// Tab navigation
	type SessionTab = 'prep' | 'timeline' | 'notes' | 'chart';
	let activeTab = $state<SessionTab>('prep');
	const tabs: { id: SessionTab; label: string }[] = [
		{ id: 'prep', label: 'Prep' },
		{ id: 'timeline', label: 'Timeline' },
		{ id: 'notes', label: 'Notes' },
		{ id: 'chart', label: 'Chart' }
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
				addToast('Coaching insights generated', 'success');
			} else {
				addToast('Failed to generate insights', 'error');
			}
		} catch {
			addToast('Failed to generate insights', 'error');
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

	$effect(() => {
		if (form) {
			submittingNote = false;
		}
		if (form?.noteSuccess) {
			addToast(`Note saved — shapes ${data.client.name.split(' ')[0]}'s Monday prompt`, 'success');
			noteContent = '';
		}
	});
</script>

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

	<!-- Tab Navigation -->
	<div
		class="flex gap-1 rounded-xl border border-border-default bg-surface-subtle p-1"
		role="tablist"
	>
		{#each tabs as tab (tab.id)}
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === tab.id}
				onclick={() => (activeTab = tab.id)}
				class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all {activeTab ===
				tab.id
					? 'bg-accent text-white shadow-sm'
					: 'text-text-tertiary hover:bg-surface-raised hover:text-text-secondary'}"
			>
				{tab.label}
				{#if tab.id === 'prep' && (data.alerts.length > 0 || data.client.alerts.length > 0)}
					<span class="ml-1 inline-flex h-2 w-2 rounded-full bg-warning"></span>
				{/if}
			</button>
		{/each}
	</div>

	<!-- ═══ TAB: Prep ═══ -->
	{#if activeTab === 'prep'}
		<!-- AI Coaching Insights -->
		<div class="rounded-2xl border border-accent/30 bg-accent-muted p-6">
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
			{#if prepData?.content}
				<div class="prose prose-sm max-w-none whitespace-pre-line text-text-secondary">
					{prepData.content}
				</div>
				{#if prepContext()}
					<p class="mt-3 text-[10px] text-text-muted">{prepContext()}</p>
				{/if}
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
						<div class="rounded-xl border border-border-default bg-surface-subtle p-4">
							<p class="mb-2 text-sm font-bold text-text-secondary">Week {weekNumber}</p>
							<div class="space-y-2">
								{#each reflections as r, i (i)}
									<div
										class="flex items-start gap-3 rounded-lg bg-surface-raised px-3 py-2 text-sm"
									>
										<span
											class="shrink-0 rounded bg-accent-muted px-1.5 py-0.5 text-[10px] font-semibold text-accent"
										>
											{r.reflectionType === 'RATING_A'
												? 'Check-in'
												: r.reflectionType === 'RATING_B'
													? 'Check-in'
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
