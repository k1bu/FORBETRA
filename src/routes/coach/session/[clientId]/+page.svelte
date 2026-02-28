<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';
	import PerformanceEffortChart from '$lib/components/PerformanceEffortChart.svelte';
	import { addToast } from '$lib/stores/toasts.svelte';
	import { Target, Sparkles, AlertTriangle } from 'lucide-svelte';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	let generatingPrep = $state(false);
	let freshPrep = $state<{ id: string; content: string | null; createdAt: string } | null>(null);
	let noteContent = $state('');
	let noteWeek = $state(data.client.objective?.cycle?.currentWeek?.toString() ?? '');
	let submittingNote = $state(false);

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
	const reflectionsByWeek = $derived((() => {
		const map = new Map<number, typeof data.allReflections>();
		for (const r of data.allReflections) {
			const week = r.weekNumber;
			if (!map.has(week)) map.set(week, []);
			map.get(week)!.push(r);
		}
		return Array.from(map.entries())
			.sort(([a], [b]) => b - a);
	})());

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

<section class="mx-auto flex max-w-5xl flex-col gap-6 p-4 pb-12">
	<!-- Header -->
	<header class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<nav aria-label="Breadcrumb" class="mb-2">
				<ol class="flex items-center gap-1.5 text-sm text-text-tertiary">
					<li><a href="/coach" class="rounded transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Coach Hub</a></li>
					<li aria-hidden="true" class="text-text-muted"><svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg></li>
					<li><a href="/coach/roster" class="rounded transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Roster</a></li>
					<li aria-hidden="true" class="text-text-muted"><svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg></li>
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
			{/if}
		</div>
		{#if data.client.objective?.cycle}
			<span class="rounded-full bg-accent-muted px-3 py-1 text-xs font-semibold text-accent">
				Week {data.client.objective.cycle.currentWeek ?? '—'}
			</span>
		{/if}
	</header>

	<!-- AI Coaching Insights -->
	<div class="rounded-2xl border border-accent/30 bg-accent-muted p-6">
		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<Sparkles class="h-5 w-5 text-accent" />
				<div>
					<h2 class="text-lg font-bold text-text-primary">AI Coaching Insights</h2>
					<p class="text-xs text-text-tertiary">AI-generated analysis based on your client's reflection and feedback data</p>
				</div>
				{#if prepData}
					<span class="text-xs text-text-tertiary">{formatRelativeDays(prepData.createdAt)}</span>
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
			<div class="prose prose-sm max-w-none text-text-secondary whitespace-pre-line">
				{prepData.content}
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
				{#each data.alerts as alert}
					<li class="rounded-lg glass px-3 py-2 text-sm text-error">
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
				{#each data.client.alerts as alert}
					<li class="flex items-start gap-2 rounded-lg glass px-3 py-2 text-sm {alert.severity === 'high' ? 'font-semibold text-error border border-error/50' : 'text-warning'}">
						<span class="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full {alert.severity === 'high' ? 'bg-error' : alert.severity === 'medium' ? 'bg-warning' : 'bg-accent'}"></span>
						{alert.message}
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Reflections Timeline -->
	{#if reflectionsByWeek.length > 0}
		<div class="rounded-2xl border border-border-default bg-surface-raised p-6">
			<h2 class="mb-4 text-lg font-bold text-text-primary">Reflections Timeline</h2>
			<div class="space-y-4">
				{#each reflectionsByWeek as [weekNumber, reflections]}
					<div class="rounded-xl border border-border-default bg-surface-subtle p-4">
						<p class="mb-2 text-sm font-bold text-text-secondary">Week {weekNumber}</p>
						<div class="space-y-2">
							{#each reflections as r}
								<div class="flex items-start gap-3 rounded-lg bg-surface-raised px-3 py-2 text-sm">
									<span class="shrink-0 rounded bg-accent-muted px-1.5 py-0.5 text-[10px] font-semibold text-accent">
										{r.reflectionType === 'RATING_A' ? 'Check-in' : r.reflectionType === 'RATING_B' ? 'Check-in' : r.reflectionType}
									</span>
									<div class="min-w-0 flex-1">
										{#if r.effortScore !== null || r.performanceScore !== null}
											<div class="flex gap-3 text-xs">
												{#if r.effortScore !== null}
													<span class="text-warning">Effort: <strong>{r.effortScore}</strong></span>
												{/if}
												{#if r.performanceScore !== null}
													<span class="text-accent">Perf: <strong>{r.performanceScore}</strong></span>
												{/if}
											</div>
										{/if}
										{#if r.notes}
											<p class="mt-1 text-xs text-text-secondary">{r.notes}</p>
										{/if}
									</div>
									{#if r.submittedAt}
										<span class="shrink-0 text-[10px] text-text-muted">{formatDate(r.submittedAt)}</span>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Stakeholder Feedback Summary -->
	{#if data.client.stakeholders.length > 0}
		<div class="rounded-2xl border border-border-strong bg-success-muted p-6">
			<h2 class="mb-4 text-lg font-bold text-text-primary">Stakeholder Feedback</h2>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each data.client.stakeholders as stakeholder}
					<div class="rounded-xl border border-border-default glass p-3">
						<p class="text-sm font-semibold text-text-primary">{stakeholder.name}</p>
						<p class="text-xs text-text-tertiary">{stakeholder.email}</p>
						{#if stakeholder.lastFeedback}
							<div class="mt-2 flex gap-3 text-xs">
								{#if stakeholder.lastFeedback.effortScore !== null}
									<span class="text-success">Effort: <strong>{stakeholder.lastFeedback.effortScore}</strong></span>
								{/if}
								{#if stakeholder.lastFeedback.performanceScore !== null}
									<span class="text-success">Perf: <strong>{stakeholder.lastFeedback.performanceScore}</strong></span>
								{/if}
							</div>
							<p class="mt-1 text-[10px] text-text-muted">
								{stakeholder.lastFeedback.weekNumber ? `Week ${stakeholder.lastFeedback.weekNumber}` : ''}
								{stakeholder.lastFeedback.submittedAt ? ` · ${formatRelativeDays(stakeholder.lastFeedback.submittedAt)}` : ''}
							</p>
						{:else}
							<p class="mt-2 text-xs text-text-muted">No feedback yet</p>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Performance Chart -->
	{#if data.client.visualizationData && data.client.visualizationData.individual.length > 0}
		<div class="rounded-2xl border border-accent/30 bg-accent-muted p-6">
			<h2 class="mb-4 text-lg font-bold text-text-primary">Performance & Effort Over Time</h2>
			<PerformanceEffortChart
				individualData={data.client.visualizationData.individual}
				stakeholderData={data.client.visualizationData.stakeholders}
				stakeholders={data.client.visualizationData.stakeholderList}
			/>
		</div>
	{/if}

	<!-- Coach Notes -->
	<div class="rounded-2xl border border-accent/30 bg-accent-muted p-6">
		<h2 class="mb-4 text-lg font-bold text-text-primary">Coach Notes</h2>

		<!-- Inline add note form -->
		<form method="post" action="?/createNote" class="mb-4 rounded-xl border border-border-default bg-surface-raised p-4" use:enhance={() => {
		submittingNote = true;
		return async ({ update }) => {
			submittingNote = false;
			await update();
		};
	}}>
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
						class="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:bg-surface-raised focus:outline-none focus:ring-1 focus:ring-accent/30"
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
						class="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
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
					<li class="rounded-lg border border-border-default bg-surface-raised p-3">
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
			<p class="text-center text-sm text-text-tertiary">No notes yet.</p>
		{/if}
	</div>
</section>
