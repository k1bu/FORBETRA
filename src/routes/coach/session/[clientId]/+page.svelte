<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import PerformanceEffortChart from '$lib/components/PerformanceEffortChart.svelte';
	import { addToast } from '$lib/stores/toasts.svelte';

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
				addToast('Coach prep generated', 'success');
			} else {
				addToast('Failed to generate prep', 'error');
			}
		} catch {
			addToast('Failed to generate prep', 'error');
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
		if (form?.noteSuccess) {
			addToast('Note saved', 'success');
			noteContent = '';
		}
	});
</script>

<section class="mx-auto flex max-w-5xl flex-col gap-6 p-4 pb-12">
	<!-- Header -->
	<header class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<a
				href="/coach/roster"
				class="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900"
			>
				&#8592; Back to Roster
			</a>
			<h1 class="text-3xl font-bold text-neutral-900">{data.client.name}</h1>
			<p class="text-sm text-neutral-600">{data.client.email}</p>
			{#if data.client.objective}
				<div class="mt-2 flex items-center gap-2">
					<span class="text-base" role="img" aria-label="target">&#127919;</span>
					<span class="text-sm font-medium text-neutral-700">{data.client.objective.title}</span>
				</div>
			{/if}
		</div>
		{#if data.client.objective?.cycle}
			<span class="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
				Week {data.client.objective.cycle.currentWeek ?? '—'}
			</span>
		{/if}
	</header>

	<!-- AI Coach Prep -->
	<div class="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 shadow-sm">
		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="text-xl" role="img" aria-label="sparkles">&#10024;</span>
				<h2 class="text-lg font-bold text-neutral-900">AI Coach Prep</h2>
				{#if prepData}
					<span class="text-xs text-neutral-500">{formatRelativeDays(prepData.createdAt)}</span>
				{/if}
			</div>
			<button
				type="button"
				disabled={generatingPrep}
				onclick={generatePrep}
				class="rounded-lg border-2 border-indigo-300 bg-white px-4 py-2 text-xs font-semibold text-indigo-700 transition-all hover:border-indigo-400 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{generatingPrep ? 'Generating...' : prepData ? 'Refresh Prep' : 'Generate Prep'}
			</button>
		</div>
		{#if prepData?.content}
			<div class="prose prose-sm max-w-none text-neutral-700 whitespace-pre-line">
				{prepData.content}
			</div>
		{:else}
			<p class="text-sm text-neutral-500">No prep generated yet. Click above to generate.</p>
		{/if}
	</div>

	<!-- Alerts -->
	{#if data.alerts.length > 0}
		<div class="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-6 shadow-sm">
			<div class="mb-3 flex items-center gap-2">
				<span class="text-lg" role="img" aria-label="warning">&#9888;&#65039;</span>
				<h2 class="text-lg font-bold text-red-900">AI Alerts</h2>
			</div>
			<ul class="space-y-2">
				{#each data.alerts as alert}
					<li class="rounded-lg bg-white/80 px-3 py-2 text-sm text-red-800">
						{alert.content}
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if data.client.alerts.length > 0}
		<div class="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 shadow-sm">
			<div class="mb-3 flex items-center gap-2">
				<span class="text-lg" role="img" aria-label="warning">&#9888;&#65039;</span>
				<h2 class="text-lg font-bold text-amber-900">Status Alerts</h2>
			</div>
			<ul class="space-y-2">
				{#each data.client.alerts as alert}
					<li class="flex items-start gap-2 rounded-lg bg-white/80 px-3 py-2 text-sm {alert.severity === 'high' ? 'font-semibold text-red-700 border border-red-200' : 'text-amber-800'}">
						<span class="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full {alert.severity === 'high' ? 'bg-red-500' : alert.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}"></span>
						{alert.message}
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Reflections Timeline -->
	{#if reflectionsByWeek.length > 0}
		<div class="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-lg font-bold text-neutral-900">Reflections Timeline</h2>
			<div class="space-y-4">
				{#each reflectionsByWeek as [weekNumber, reflections]}
					<div class="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
						<p class="mb-2 text-sm font-bold text-neutral-700">Week {weekNumber}</p>
						<div class="space-y-2">
							{#each reflections as r}
								<div class="flex items-start gap-3 rounded-lg bg-white px-3 py-2 text-sm">
									<span class="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
										{r.reflectionType === 'INTENTION' ? 'Intention' : r.reflectionType === 'RATING_A' ? 'Mid-week' : r.reflectionType === 'RATING_B' ? 'End-week' : r.reflectionType}
									</span>
									<div class="min-w-0 flex-1">
										{#if r.effortScore !== null || r.performanceScore !== null}
											<div class="flex gap-3 text-xs">
												{#if r.effortScore !== null}
													<span class="text-amber-600">Effort: <strong>{r.effortScore}</strong></span>
												{/if}
												{#if r.performanceScore !== null}
													<span class="text-indigo-600">Perf: <strong>{r.performanceScore}</strong></span>
												{/if}
											</div>
										{/if}
										{#if r.notes}
											<p class="mt-1 text-xs text-neutral-600">{r.notes}</p>
										{/if}
									</div>
									{#if r.submittedAt}
										<span class="shrink-0 text-[10px] text-neutral-400">{formatDate(r.submittedAt)}</span>
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
		<div class="rounded-2xl border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 p-6 shadow-sm">
			<h2 class="mb-4 text-lg font-bold text-neutral-900">Stakeholder Feedback</h2>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each data.client.stakeholders as stakeholder}
					<div class="rounded-xl border border-teal-200 bg-white/80 p-3">
						<p class="text-sm font-semibold text-neutral-800">{stakeholder.name}</p>
						<p class="text-xs text-neutral-500">{stakeholder.email}</p>
						{#if stakeholder.lastFeedback}
							<div class="mt-2 flex gap-3 text-xs">
								{#if stakeholder.lastFeedback.effortScore !== null}
									<span class="text-teal-700">Effort: <strong>{stakeholder.lastFeedback.effortScore}</strong></span>
								{/if}
								{#if stakeholder.lastFeedback.performanceScore !== null}
									<span class="text-emerald-700">Perf: <strong>{stakeholder.lastFeedback.performanceScore}</strong></span>
								{/if}
							</div>
							<p class="mt-1 text-[10px] text-neutral-400">
								{stakeholder.lastFeedback.weekNumber ? `Week ${stakeholder.lastFeedback.weekNumber}` : ''}
								{stakeholder.lastFeedback.submittedAt ? ` · ${formatRelativeDays(stakeholder.lastFeedback.submittedAt)}` : ''}
							</p>
						{:else}
							<p class="mt-2 text-xs text-neutral-400">No feedback yet</p>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Performance Chart -->
	{#if data.client.visualizationData && data.client.visualizationData.individual.length > 0}
		<div class="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-sm">
			<h2 class="mb-4 text-lg font-bold text-neutral-900">Performance & Effort Over Time</h2>
			<PerformanceEffortChart
				individualData={data.client.visualizationData.individual}
				stakeholderData={data.client.visualizationData.stakeholders}
				stakeholders={data.client.visualizationData.stakeholderList}
			/>
		</div>
	{/if}

	<!-- Coach Notes -->
	<div class="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm">
		<h2 class="mb-4 text-lg font-bold text-neutral-900">Coach Notes</h2>

		<!-- Inline add note form -->
		<form method="post" action="?/createNote" class="mb-4 rounded-xl border border-blue-200 bg-white p-4">
			{#if data.cycleId}
				<input type="hidden" name="cycleId" value={data.cycleId} />
			{/if}
			{#if form?.noteError}
				<p class="mb-2 text-xs text-red-600">{form.noteError}</p>
			{/if}
			<div class="flex gap-3">
				<div class="min-w-0 flex-1">
					<textarea
						name="content"
						rows="2"
						required
						minlength="10"
						bind:value={noteContent}
						class="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-200"
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
						class="w-16 rounded-lg border border-neutral-200 px-2 py-1 text-center text-xs focus:border-blue-400 focus:outline-none"
						placeholder="Wk"
					/>
					<button
						type="submit"
						class="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-blue-700"
					>
						Save
					</button>
				</div>
			</div>
		</form>

		<!-- Notes list -->
		{#if data.allCoachNotes.length > 0}
			<ul class="space-y-2">
				{#each data.allCoachNotes as note (note.id)}
					<li class="rounded-lg border border-blue-200 bg-white p-3">
						<p class="text-sm text-neutral-700">{note.content}</p>
						<div class="mt-2 flex items-center gap-2 text-xs text-neutral-500">
							{#if note.weekNumber}
								<span class="rounded-full bg-blue-100 px-2 py-0.5 font-semibold text-blue-700">
									Week {note.weekNumber}
								</span>
							{/if}
							<span>{formatRelativeDays(note.createdAt)}</span>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-center text-sm text-neutral-500">No notes yet.</p>
		{/if}
	</div>
</section>
