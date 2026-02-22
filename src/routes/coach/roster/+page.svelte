<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import type { ClientSummary } from '$lib/server/buildClientSummary';
	import PerformanceEffortChart from '$lib/components/PerformanceEffortChart.svelte';
	import { addToast } from '$lib/stores/toasts.svelte';
	import { Search, AlertTriangle, Target, Sparkles, Inbox, MessageSquare, Save } from 'lucide-svelte';

	const { data, form }: { data: PageData; form: ActionData } = $props();

	const formatDate = (value: string | null | undefined) => {
		if (!value) return '—';
		return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
	};

	const formatDateTime = (value: string | null | undefined) => {
		if (!value) return '—';
		return new Intl.DateTimeFormat('en-US', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	};

	const formatAverage = (value: number | null | undefined) => {
		if (value === null || value === undefined) return '—';
		return value.toFixed(1);
	};

	const formatPercent = (value: number | null | undefined) => {
		if (value === null || value === undefined) return '—';
		return `${Math.round(value * 100)}%`;
	};

	const formatScore = (value: number | null | undefined) => {
		if (value === null || value === undefined) return '—';
		return `${value}/100`;
	};

	const formatRelativeDays = (value: string | null | undefined) => {
		if (!value) return '—';
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

	let searchTerm = $state('');
	let showArchived = $state(false);
	let noteClientId = $state<string | null>(null);
	let noteFormOpen = $state(false);
	let noteTextareaEl = $state<HTMLTextAreaElement | undefined>(undefined);

	let generatingPrepFor = $state<string | null>(null);

	async function generatePrep(clientId: string) {
		generatingPrepFor = clientId;
		try {
			const res = await fetch('/api/insights/coach-prep', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ individualId: clientId })
			});
			const result = await res.json();
			if (res.ok && result.content) {
				data.coachPrepMap[clientId] = {
					id: result.id,
					content: result.content,
					createdAt: new Date(result.createdAt)
				};
				addToast('Coaching insights generated', 'success');
			} else {
				addToast('Failed to generate insights', 'error');
			}
		} catch (err) {
			console.error('Failed to generate coaching insights', err);
			addToast('Failed to generate insights', 'error');
		} finally {
			generatingPrepFor = null;
		}
	}

	function trapFocus(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;
		const modal = (e.currentTarget as HTMLElement);
		const focusable = modal.querySelectorAll<HTMLElement>(
			'textarea, input:not([type="hidden"]), button, select, [tabindex]:not([tabindex="-1"])'
		);
		if (focusable.length === 0) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (e.shiftKey) {
			if (document.activeElement === first) {
				e.preventDefault();
				last.focus();
			}
		} else {
			if (document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}
	}

	$effect(() => {
		if (noteFormOpen) {
			setTimeout(() => {
				noteTextareaEl?.focus();
			}, 0);
		}
	});

	let selectedClientId = $state<string | null>(null);
	let detailPanelEl = $state<HTMLElement | undefined>(undefined);

	function selectClient(id: string) {
		selectedClientId = id;
	}

	// Scroll to detail panel on mobile when a client is selected
	$effect(() => {
		if (selectedClientId && detailPanelEl && typeof window !== 'undefined' && window.innerWidth < 768) {
			// Small delay to let the DOM update before scrolling
			setTimeout(() => {
				detailPanelEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}, 100);
		}
	});

	const filteredClients = $derived(data.clients.filter((client) => {
		if (!showArchived && client.archived) return false;
		if (!searchTerm) return true;
		const query = searchTerm.toLowerCase();
		return (
			(client.name ?? '').toLowerCase().includes(query) ||
			client.email.toLowerCase().includes(query)
		);
	}));

	// Auto-select first non-archived client
	$effect(() => {
		const nonArchived = filteredClients.filter((c) => !c.archived);
		if (selectedClientId === null && nonArchived.length > 0) {
			selectedClientId = nonArchived[0].id;
		}
	});

	const selectedClient = $derived(filteredClients.find((c) => c.id === selectedClientId) ?? null);
</script>

<svelte:head>
	<title>Roster | Forbetra</title>
</svelte:head>

<section class="mx-auto flex max-w-7xl flex-col gap-6 p-4 pb-12">
	<!-- Header -->
	<header class="flex items-center justify-between">
		<div>
			<nav aria-label="Breadcrumb" class="mb-2">
				<ol class="flex items-center gap-1.5 text-sm text-text-tertiary">
					<li><a href="/coach" class="rounded transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Coach Hub</a></li>
					<li aria-hidden="true" class="text-text-muted"><svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg></li>
					<li><span class="font-medium text-text-primary">Roster</span></li>
				</ol>
			</nav>
			<h1 class="text-3xl font-bold text-text-primary">Client Roster</h1>
			<p class="mt-2 text-text-secondary">Review active and archived individuals linked to your practice</p>
		</div>
	</header>

	<!-- Search and Filter -->
	<section class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div class="flex flex-wrap items-center gap-3">
			<div class="relative">
				<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
				<input
					type="search"
					placeholder="Search by name or email"
					class="w-full rounded-lg border border-border-default bg-surface-raised pl-10 pr-4 py-2.5 text-sm text-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 md:w-64"
					bind:value={searchTerm}
				/>
			</div>
			<label class="flex items-center gap-2 rounded-lg border border-border-default bg-surface-raised px-4 py-2.5 text-xs font-semibold text-text-secondary transition-all hover:border-accent/30">
				<input type="checkbox" bind:checked={showArchived} class="rounded border-border-default" />
				Show archived
			</label>
		</div>
	</section>

	<!-- Split Pane Layout -->
	{#if data.clients.length === 0}
		<div class="rounded-lg border border-dashed border-border-strong bg-surface-raised p-8 text-center">
			<p class="text-sm text-text-tertiary">
				No linked individuals yet. Send an invitation to start your roster.
			</p>
		</div>
	{:else if filteredClients.length === 0}
		<div class="rounded-lg border border-dashed border-border-strong bg-surface-raised p-8 text-center">
			<p class="text-sm text-text-tertiary">No clients match this search.</p>
		</div>
	{:else}
		<div class="flex flex-col gap-4 md:flex-row md:gap-6" style="min-height: 600px;">
			<!-- Left Column: Client List -->
			<div class="w-full shrink-0 md:w-80 lg:w-96">
				<div class="sticky top-4 max-h-[calc(100vh-200px)] space-y-1.5 overflow-y-auto rounded-lg border border-border-default bg-surface-raised p-2">
					{#each filteredClients as client (client.id)}
						<button
							class="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-all {selectedClientId === client.id ? 'bg-accent-muted border border-accent/50' : 'border border-transparent hover:bg-surface-subtle hover:border-border-default'}"
							onclick={() => selectClient(client.id)}
						>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<span class="truncate text-sm font-bold text-text-primary">{client.name}</span>
									{#if client.archived}
										<span class="shrink-0 rounded-full bg-surface-subtle px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">Archived</span>
									{:else}
										<span class="shrink-0 rounded-full bg-success-muted px-1.5 py-0.5 text-[10px] font-medium text-success">Active</span>
									{/if}
								</div>
								{#if client.objective?.cycle}
									<span class="text-xs text-text-tertiary">
										Week {client.objective.cycle.currentWeek ?? '—'}
									</span>
								{/if}
							</div>
							{#if client.alerts && client.alerts.length > 0}
								<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-error-muted text-xs font-bold text-error">{client.alerts.length}</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<!-- Right Column: Detail Panel -->
			<div class="flex-1 min-w-0" bind:this={detailPanelEl}>
				{#if selectedClient}
					{@const client = selectedClient}
					<div class="rounded-lg border border-border-default bg-surface-raised p-6 space-y-6">
						<!-- Client header info -->
						<header class="flex flex-wrap items-start justify-between gap-3">
							<div class="flex-1">
								<div class="flex items-center gap-3">
									<h2 class="text-xl font-bold text-text-primary">{client.name}</h2>
									<a href="/coach/session/{client.id}" class="text-xs font-semibold text-accent hover:text-accent-hover">
										Open Session →
									</a>
								</div>
								<p class="text-sm text-text-secondary">{client.email}</p>
								<p class="mt-1 text-xs text-text-tertiary">
									Joined {formatRelativeDays(client.joinedAt)}
									{#if client.archived}
										· Archived {formatDate(client.archivedAt)}
									{/if}
								</p>
							</div>
							{#if client.alerts.length > 0}
								<div class="flex items-center gap-1.5">
									<span class="h-2 w-2 rounded-full {client.alerts.some((a) => a.severity === 'high') ? 'bg-error' : client.alerts.some((a) => a.severity === 'medium') ? 'bg-warning' : 'bg-accent'}"></span>
									<span class="text-xs font-semibold {client.alerts.some((a) => a.severity === 'high') ? 'text-error' : client.alerts.some((a) => a.severity === 'medium') ? 'text-warning' : 'text-accent'}">
										{client.alerts.length} alert{client.alerts.length === 1 ? '' : 's'}
									</span>
								</div>
							{/if}
						</header>

						{#if client.alerts.length > 0}
							<section class="rounded-lg border border-border-default bg-surface-raised p-4">
								<div class="mb-3 flex items-center gap-2">
									<AlertTriangle class="h-4 w-4 text-text-muted" />
									<h3 class="text-sm font-semibold text-text-primary">Alerts</h3>
								</div>
								<ul class="space-y-2 text-xs text-text-secondary">
									{#each client.alerts as alert (alert.type)}
										<li
											class="flex items-start gap-2 rounded-lg bg-surface-subtle px-3 py-2 {alert.severity === 'high'
												? 'font-bold border border-error/50'
												: ''}"
										>
											<span
												class="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full {alert.severity === 'high'
													? 'bg-error'
													: alert.severity === 'medium'
													? 'bg-warning'
													: 'bg-accent'}"
											></span>
											<span>{alert.message}</span>
										</li>
									{/each}
								</ul>
							</section>
						{/if}

						{#if client.objective}
							<section class="rounded-lg border border-border-default bg-surface-raised p-4">
								<div class="mb-2 flex items-center gap-2">
									<Target class="h-4 w-4 text-text-muted" />
									<h3 class="text-sm font-semibold text-text-primary">Objective</h3>
								</div>
								<p class="mb-1 font-semibold text-text-primary">{client.objective.title}</p>
								{#if client.objective.description}
									<p class="text-xs text-text-secondary">{client.objective.description}</p>
								{/if}
							</section>

							{#if client.objective.insights}
								<section class="rounded-lg border border-border-default bg-surface-raised p-4">
									<div class="mb-3 flex items-center gap-2">
										<Sparkles class="h-4 w-4 text-text-muted" />
										<h3 class="text-sm font-semibold text-text-primary">Performance Insights</h3>
									</div>
									<div class="grid grid-cols-2 gap-3 text-xs">
										<div class="rounded-lg border border-border-default bg-surface-raised p-2">
											<p class="text-text-tertiary">Effort (4-wk)</p>
											<p class="text-lg font-bold text-warning">{formatAverage(client.objective.insights.avgEffort)}</p>
										</div>
										<div class="rounded-lg border border-border-default bg-surface-raised p-2">
											<p class="text-text-tertiary">Progress (4-wk)</p>
											<p class="text-lg font-bold text-accent">{formatAverage(client.objective.insights.avgProgress)}</p>
										</div>
										<div class="rounded-lg border border-border-default bg-surface-raised p-2">
											<p class="text-text-tertiary">Stability</p>
											<p class="text-lg font-bold text-accent">{formatScore(client.objective.insights.stabilityScore)}</p>
										</div>
										<div class="rounded-lg border border-border-default bg-surface-raised p-2">
											<p class="text-text-tertiary">Alignment</p>
											<p class="text-lg font-bold text-success">{formatPercent(client.objective.insights.alignmentRatio)}</p>
										</div>
									</div>
									<div class="mt-3 rounded-lg border border-border-default bg-surface-raised p-2 text-xs">
										<p class="text-text-secondary">
											Stakeholders: <span class="font-semibold">{client.objective.respondedStakeholders}/{client.objective.stakeholderCount}</span> responded this week
										</p>
									</div>
								</section>
							{/if}

							{#if client.objective?.cycle && client.stakeholders.length > 0}
								<section class="rounded-lg border border-border-default bg-surface-raised p-4">
									<div class="mb-3 flex items-center gap-2">
										<Inbox class="h-4 w-4 text-text-muted" />
										<h3 class="text-sm font-semibold text-text-primary">Stakeholder Feedback Cadence</h3>
									</div>
									<p class="mb-3 text-xs text-text-secondary">
										How often should stakeholders be asked to rate {client.name.split(' ')[0]}?
									</p>
									<form method="post" action="?/updateCadence" class="space-y-3">
										<input type="hidden" name="individualId" value={client.id} />
										<input type="hidden" name="cycleId" value={client.objective.cycle.id} />
										<div class="flex gap-2">
											{#each [
												{ value: 'every_checkin', label: 'Every check-in', desc: '~8/mo' },
												{ value: 'weekly', label: 'Weekly', desc: '~4/mo' },
												{ value: 'monthly', label: 'Monthly', desc: '~1/mo' }
											] as option (option.value)}
												<label
													class="flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-xl border px-3 py-2.5 text-center transition-all
														{client.objective.cycle.stakeholderCadence === option.value
														? 'border-warning bg-warning-muted'
														: 'border-border-default bg-surface-raised hover:border-border-strong hover:bg-surface-subtle'}"
												>
													<input
														type="radio"
														name="stakeholderCadence"
														value={option.value}
														checked={client.objective.cycle.stakeholderCadence === option.value}
														class="sr-only"
														onchange={(e) => e.currentTarget.closest('form')?.requestSubmit()}
													/>
													<span class="text-xs font-semibold text-text-primary">{option.label}</span>
													<span class="text-xs text-text-tertiary">{option.desc}</span>
												</label>
											{/each}
										</div>
										<label class="flex items-center gap-2 text-xs text-text-secondary">
											<input
												type="checkbox"
												name="autoThrottle"
												checked={client.objective.cycle.autoThrottle}
												class="rounded border-border-default"
												onchange={(e) => e.currentTarget.closest('form')?.requestSubmit()}
											/>
											<span>Auto-reduce for stakeholders rating 3+ people</span>
										</label>
									</form>
									<p class="mt-2 text-xs text-text-muted">
										{client.stakeholders.length} stakeholder{client.stakeholders.length === 1 ? '' : 's'} linked
									</p>
								</section>
							{/if}
						{/if}

						<!-- AI Coaching Insights -->
						{#if !client.archived && data.coachPrepMap[client.id]}
							{@const prep = data.coachPrepMap[client.id]}
							<section class="rounded-lg border border-border-default bg-surface-raised p-4">
								<div class="mb-3 flex items-center justify-between">
									<div class="flex items-center gap-2">
										<Sparkles class="h-4 w-4 text-text-muted" />
										<h3 class="text-sm font-semibold text-text-primary">AI Coaching Insights</h3>
										<span class="text-xs text-text-tertiary">{formatRelativeDays(prep.createdAt?.toString())}</span>
									</div>
									<button
										type="button"
										disabled={generatingPrepFor === client.id}
										onclick={() => generatePrep(client.id)}
										class="rounded-lg border border-accent/30 bg-surface-raised px-3 py-1.5 text-xs font-semibold text-accent transition-all hover:border-accent hover:bg-accent-muted disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{generatingPrepFor === client.id ? 'Generating...' : 'Refresh Insights'}
									</button>
								</div>
								{#if data.alertMap[client.id]?.length}
									<div class="mb-3 rounded-lg border border-border-default bg-surface-raised p-2">
										<p class="text-xs font-bold text-error">AI Alerts:</p>
										{#each data.alertMap[client.id] as alert}
											<p class="mt-1 text-xs text-error">{alert}</p>
										{/each}
									</div>
								{/if}
								{#if generatingPrepFor === client.id}
									<div class="space-y-3 animate-pulse">
										<div class="h-4 w-3/4 rounded bg-surface-subtle"></div>
										<div class="h-4 w-full rounded bg-surface-subtle"></div>
										<div class="h-4 w-5/6 rounded bg-surface-subtle"></div>
										<div class="h-4 w-2/3 rounded bg-surface-subtle"></div>
									</div>
								{:else}
									<div class="prose prose-sm max-w-none text-text-secondary">
										{prep.content ?? 'No insights available.'}
									</div>
								{/if}
							</section>
						{:else if !client.archived && client.objective?.cycle}
							<section class="rounded-lg border border-dashed border-border-default bg-surface-raised p-4">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<Sparkles class="h-4 w-4 text-text-muted" />
										<h3 class="text-sm font-semibold text-text-primary">AI Coaching Insights</h3>
										<span class="text-xs text-text-tertiary">Not yet generated</span>
									</div>
									<button
										type="button"
										disabled={generatingPrepFor === client.id}
										onclick={() => generatePrep(client.id)}
										class="rounded-lg border border-accent/30 bg-surface-raised px-3 py-1.5 text-xs font-semibold text-accent transition-all hover:border-accent hover:bg-accent-muted disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{generatingPrepFor === client.id ? 'Generating...' : 'Generate Insights'}
									</button>
								</div>
								{#if generatingPrepFor === client.id}
									<div class="mt-4 space-y-3 animate-pulse">
										<div class="h-4 w-3/4 rounded bg-surface-subtle"></div>
										<div class="h-4 w-full rounded bg-surface-subtle"></div>
										<div class="h-4 w-5/6 rounded bg-surface-subtle"></div>
										<div class="h-4 w-2/3 rounded bg-surface-subtle"></div>
									</div>
								{/if}
							</section>
						{/if}

						<!-- Performance/Effort Visualization -->
						{#if !client.archived && client.objective?.cycle && client.visualizationData}
							<section class="rounded-lg border border-border-default bg-surface-raised p-6">
								<div class="mb-4">
									<h3 class="text-lg font-bold text-text-primary">Effort and Performance Over Time</h3>
									<p class="text-sm text-text-secondary">Client self-assessments vs. stakeholder observations</p>
								</div>
								<PerformanceEffortChart
									individualData={client.visualizationData.individual}
									stakeholderData={client.visualizationData.stakeholders}
									stakeholders={client.visualizationData.stakeholderList}
								/>
							</section>
						{/if}

						{#if !client.archived && client.objective?.cycle}
							<section class="rounded-lg border border-border-default bg-surface-raised p-4">
								<div class="mb-3 flex items-center justify-between">
									<div class="flex items-center gap-2">
										<MessageSquare class="h-4 w-4 text-text-muted" />
										<h3 class="text-sm font-semibold text-text-primary">Coach Notes</h3>
									</div>
									<button
										type="button"
										onclick={() => {
											noteClientId = client.id;
											noteFormOpen = true;
										}}
										class="rounded-lg border border-accent/30 bg-surface-raised px-3 py-1.5 text-xs font-semibold text-accent transition-all hover:border-accent hover:bg-accent-muted"
									>
										+ Add Note
									</button>
								</div>
								{#if client.coachNotes.length > 0}
									<ul class="space-y-2 text-xs">
										{#each client.coachNotes as note (note.id)}
											<li class="rounded-lg border border-border-default bg-surface-raised p-3">
												<p class="mb-2 text-text-secondary">{note.content}</p>
												<div class="flex items-center gap-2 text-xs text-text-tertiary">
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
									<div class="rounded-lg border border-dashed border-accent/30 bg-surface-raised/50 p-4 text-center">
										<p class="text-xs text-text-tertiary">
											No notes yet. Add one to appear in their Monday prompt.
										</p>
									</div>
								{/if}
							</section>
						{/if}

						<div class="flex gap-2">
							<form method="post" action="?/archiveClient" class="flex-1">
								<input type="hidden" name="individualId" value={client.id} />
								<input type="hidden" name="archive" value={client.archived ? 'false' : 'true'} />
								<button
									type="submit"
									class="w-full rounded-lg border border-border-default bg-surface-raised px-4 py-2 text-xs font-semibold text-text-secondary transition-all hover:border-border-strong hover:bg-surface-subtle"
								>
									{client.archived ? 'Unarchive' : 'Archive'}
								</button>
							</form>
						</div>
					</div>
				{:else}
					<div class="flex h-full items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface-raised p-12">
						<p class="text-sm text-text-tertiary">Select a client to view details</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</section>

<!-- Note Modal -->
{#if noteFormOpen && noteClientId}
	{@const client = data.clients.find((c) => c.id === noteClientId)}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
		onclick={(e) => {
			if (e.target === e.currentTarget) {
				noteFormOpen = false;
				noteClientId = null;
			}
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				noteFormOpen = false;
				noteClientId = null;
			}
			trapFocus(e);
		}}
		role="dialog"
		aria-modal="true"
		aria-labelledby="note-modal-title"
		tabindex="-1"
	>
		<div class="w-full max-w-lg rounded-lg border border-border-default bg-surface-raised p-6">
			<div class="mb-4 flex items-center gap-2">
				<MessageSquare class="h-5 w-5 text-text-muted" />
				<h2 id="note-modal-title" class="text-xl font-bold text-text-primary">Add Note for {client?.name}</h2>
			</div>
			{#if form?.noteError}
				<div class="mb-4 rounded-lg border border-error/50 bg-error-muted px-4 py-3 text-sm text-error">
					<p class="font-semibold"><AlertTriangle class="h-4 w-4 inline text-error" /> {form.noteError}</p>
				</div>
			{:else if form?.noteSuccess}
				<div class="mb-4 rounded-lg border border-success/50 bg-success-muted px-4 py-3 text-sm text-success">
					<div class="flex items-center gap-2">
						<Sparkles class="h-4 w-4 text-success" />
						<p class="font-semibold">Note saved successfully! It will appear in their next Monday prompt.</p>
					</div>
				</div>
			{/if}
			<form method="post" action="?/createNote" class="space-y-4" onsubmit={() => {
				setTimeout(() => {
					if (form?.noteSuccess) {
						noteFormOpen = false;
						noteClientId = null;
					}
				}, 1000);
			}}>
				<input type="hidden" name="individualId" value={noteClientId} />
				{#if client?.objective?.cycle}
					<input type="hidden" name="cycleId" value={client.objective.cycle.id} />
					<label class="block space-y-1 text-sm">
						<span class="font-semibold text-text-secondary">Week number (optional)</span>
						<input
							type="number"
							name="weekNumber"
							min="1"
							max="12"
							value={client.objective.cycle.currentWeek ?? ''}
							class="w-full rounded-lg border border-border-default bg-surface-raised px-4 py-2.5 text-sm text-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
							placeholder="Leave blank for general note"
						/>
						<p class="text-xs text-text-tertiary">
							Current week: {client.objective.cycle.currentWeek ?? '—'}. Leave blank to show in all Monday prompts.
						</p>
					</label>
				{/if}
				<label class="block space-y-1 text-sm">
					<span class="font-semibold text-text-secondary">Note content</span>
					<textarea
						bind:this={noteTextareaEl}
						name="content"
						rows="4"
						required
						minlength="10"
						class="w-full rounded-lg border border-border-default bg-surface-raised px-4 py-2.5 text-sm text-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
						placeholder="This note will appear in the client's Monday prompt..."
					>{form?.values?.content ?? ''}</textarea>
					<p class="text-xs text-text-tertiary">Minimum 10 characters.</p>
				</label>
				<div class="flex justify-end gap-3">
					<button
						type="button"
						onclick={() => {
							noteFormOpen = false;
							noteClientId = null;
						}}
						class="rounded-lg border border-border-default bg-surface-raised px-5 py-2.5 text-sm font-semibold text-text-secondary transition-all hover:border-border-strong hover:bg-surface-subtle"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-hover"
					>
						<Save class="h-4 w-4" />
						Save Note
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
