<script lang="ts">
	import type { ClientSummary } from '$lib/server/buildClientSummary';
	import PerformanceEffortChart from '$lib/components/PerformanceEffortChart.svelte';

	export let data: {
		coach: { name: string };
		clients: ClientSummary[];
		coachPrepMap: Record<string, { id: string; content: string | null; createdAt: Date }>;
		alertMap: Record<string, string[]>;
	};

	export let form:
		| {
				error?: string;
				success?: boolean;
				noteError?: string;
				noteSuccess?: boolean;
				cadenceSuccess?: boolean;
				values?: {
					content?: string;
					weekNumber?: string;
				};
		  }
		| null;

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

	let searchTerm = '';
	let showArchived = false;
	let filteredClients: ClientSummary[] = data.clients;
	let noteClientId: string | null = null;
	let noteFormOpen = false;
	let noteTextareaEl: HTMLTextAreaElement | undefined;

	let generatingPrepFor: string | null = null;

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
				data = data;
			}
		} catch (err) {
			console.error('Failed to generate coach prep', err);
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

	$: if (noteFormOpen) {
		setTimeout(() => {
			noteTextareaEl?.focus();
		}, 0);
	}

	// Auto-select first non-archived client on load
	let selectedClientId: string | null = null;
	$: {
		const nonArchived = filteredClients.filter((c) => !c.archived);
		if (selectedClientId === null && nonArchived.length > 0) {
			selectedClientId = nonArchived[0].id;
		}
	}

	function selectClient(id: string) {
		selectedClientId = id;
	}

	$: filteredClients = data.clients.filter((client) => {
		if (!showArchived && client.archived) return false;
		if (!searchTerm) return true;
		const query = searchTerm.toLowerCase();
		return (
			(client.name ?? '').toLowerCase().includes(query) ||
			client.email.toLowerCase().includes(query)
		);
	});

	$: selectedClient = filteredClients.find((c) => c.id === selectedClientId) ?? null;
</script>

<section class="mx-auto flex max-w-7xl flex-col gap-6 p-4 pb-12">
	<!-- Header -->
	<header class="flex items-center justify-between">
		<div>
			<a
				href="/coach"
				class="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900"
			>
				← Back to Hub
			</a>
			<h1 class="text-3xl font-bold text-neutral-900">Client Roster</h1>
			<p class="mt-2 text-neutral-600">Review active and archived individuals linked to your practice</p>
		</div>
	</header>

	<!-- Search and Filter -->
	<section class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div class="flex flex-wrap items-center gap-3">
			<input
				type="search"
				placeholder="🔍 Search by name or email"
				class="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 md:w-64"
				bind:value={searchTerm}
			/>
			<label class="flex items-center gap-2 rounded-lg border-2 border-neutral-300 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 transition-all hover:border-blue-400">
				<input type="checkbox" bind:checked={showArchived} class="rounded border-neutral-300" />
				Show archived
			</label>
		</div>
	</section>

	<!-- Split Pane Layout -->
	{#if data.clients.length === 0}
		<div class="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
			<p class="text-sm text-neutral-500">
				No linked individuals yet. Send an invitation to start your roster.
			</p>
		</div>
	{:else if filteredClients.length === 0}
		<div class="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
			<p class="text-sm text-neutral-500">No clients match this search.</p>
		</div>
	{:else}
		<div class="flex flex-col gap-4 md:flex-row md:gap-6" style="min-height: 600px;">
			<!-- Left Column: Client List -->
			<div class="w-full shrink-0 md:w-80 lg:w-96">
				<div class="sticky top-4 max-h-[calc(100vh-200px)] space-y-1.5 overflow-y-auto rounded-xl border-2 border-neutral-200 bg-white p-2">
					{#each filteredClients as client (client.id)}
						<button
							class="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-all {selectedClientId === client.id ? 'bg-blue-50 border-2 border-blue-300 shadow-sm' : 'border-2 border-transparent hover:bg-neutral-50 hover:border-neutral-200'}"
							onclick={() => selectClient(client.id)}
						>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<span class="truncate text-sm font-bold text-neutral-900">{client.name}</span>
									{#if client.archived}
										<span class="shrink-0 rounded-full bg-neutral-200 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">Archived</span>
									{:else}
										<span class="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">Active</span>
									{/if}
								</div>
								{#if client.objective?.cycle}
									<span class="text-xs text-neutral-500">
										Week {client.objective.cycle.currentWeek ?? '—'}
									</span>
								{/if}
							</div>
							{#if client.alerts && client.alerts.length > 0}
								<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">{client.alerts.length}</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<!-- Right Column: Detail Panel -->
			<div class="flex-1 min-w-0">
				{#if selectedClient}
					{@const client = selectedClient}
					<div class="rounded-xl border-2 border-neutral-200 bg-white p-6 space-y-6">
						<!-- Client header info -->
						<header class="flex flex-wrap items-start justify-between gap-3">
							<div class="flex-1">
								<h2 class="text-xl font-bold text-neutral-900">{client.name}</h2>
								<p class="text-sm text-neutral-600">{client.email}</p>
								<p class="mt-1 text-xs text-neutral-500">
									Joined {formatRelativeDays(client.joinedAt)}
									{#if client.archived}
										· Archived {formatDate(client.archivedAt)}
									{/if}
								</p>
							</div>
							{#if client.alerts.length > 0}
								<span
									class="rounded-full px-4 py-1.5 text-xs font-bold uppercase shadow-sm {client.alerts.some(
										(a) => a.severity === 'high'
									)
										? 'bg-red-100 text-red-700'
										: client.alerts.some((a) => a.severity === 'medium')
										? 'bg-amber-100 text-amber-700'
										: 'bg-blue-100 text-blue-700'}"
								>
									{client.alerts.length} alert{client.alerts.length === 1 ? '' : 's'}
								</span>
							{/if}
						</header>

						{#if client.alerts.length > 0}
							<section class="rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-orange-50 p-4 shadow-sm">
								<div class="mb-3 flex items-center gap-2">
									<span class="text-lg" role="img" aria-label="warning">⚠️</span>
									<h3 class="text-sm font-bold text-red-900">Alerts</h3>
								</div>
								<ul class="space-y-2 text-xs text-red-800">
									{#each client.alerts as alert (alert.type)}
										<li
											class="flex items-start gap-2 rounded-lg bg-white/80 px-3 py-2 {alert.severity === 'high'
												? 'font-bold border-2 border-red-300'
												: ''}"
										>
											<span
												class="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full {alert.severity === 'high'
													? 'bg-red-600'
													: alert.severity === 'medium'
													? 'bg-amber-500'
													: 'bg-blue-500'}"
											></span>
											<span>{alert.message}</span>
										</li>
									{/each}
								</ul>
							</section>
						{/if}

						{#if client.objective}
							<section class="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
								<div class="mb-2 flex items-center gap-2">
									<span class="text-lg" role="img" aria-label="target">🎯</span>
									<p class="text-sm font-bold text-neutral-900">Objective</p>
								</div>
								<p class="mb-1 font-semibold text-neutral-900">{client.objective.title}</p>
								{#if client.objective.description}
									<p class="text-xs text-neutral-600">{client.objective.description}</p>
								{/if}
							</section>

							{#if client.objective.insights}
								<section class="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4">
									<div class="mb-3 flex items-center gap-2">
										<span class="text-lg" role="img" aria-label="sparkles">✨</span>
										<p class="text-sm font-bold text-neutral-900">Performance Insights</p>
									</div>
									<div class="grid grid-cols-2 gap-3 text-xs">
										<div class="rounded-lg border border-purple-200 bg-white/80 p-2">
											<p class="text-neutral-500">Effort (4-wk)</p>
											<p class="text-lg font-bold text-amber-600">{formatAverage(client.objective.insights.avgEffort)}</p>
										</div>
										<div class="rounded-lg border border-purple-200 bg-white/80 p-2">
											<p class="text-neutral-500">Progress (4-wk)</p>
											<p class="text-lg font-bold text-indigo-600">{formatAverage(client.objective.insights.avgProgress)}</p>
										</div>
										<div class="rounded-lg border border-purple-200 bg-white/80 p-2">
											<p class="text-neutral-500">Stability</p>
											<p class="text-lg font-bold text-purple-600">{formatScore(client.objective.insights.stabilityScore)}</p>
										</div>
										<div class="rounded-lg border border-purple-200 bg-white/80 p-2">
											<p class="text-neutral-500">Alignment</p>
											<p class="text-lg font-bold text-emerald-600">{formatPercent(client.objective.insights.alignmentRatio)}</p>
										</div>
									</div>
									<div class="mt-3 rounded-lg border border-purple-200 bg-white/80 p-2 text-xs">
										<p class="text-neutral-600">
											Stakeholders: <span class="font-semibold">{client.objective.respondedStakeholders}/{client.objective.stakeholderCount}</span> responded this week
										</p>
									</div>
								</section>
							{/if}

							{#if client.objective?.cycle && client.stakeholders.length > 0}
								<section class="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
									<div class="mb-3 flex items-center gap-2">
										<span class="text-lg" role="img" aria-label="incoming mail">📬</span>
										<h3 class="text-sm font-bold text-neutral-900">Stakeholder Feedback Cadence</h3>
									</div>
									<p class="mb-3 text-xs text-neutral-600">
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
													class="flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-xl border-2 px-3 py-2.5 text-center transition-all
														{client.objective.cycle.stakeholderCadence === option.value
														? 'border-amber-500 bg-amber-100 shadow-sm'
														: 'border-neutral-200 bg-white hover:border-amber-300 hover:bg-amber-50'}"
												>
													<input
														type="radio"
														name="stakeholderCadence"
														value={option.value}
														checked={client.objective.cycle.stakeholderCadence === option.value}
														class="sr-only"
														onchange={(e) => e.currentTarget.closest('form')?.requestSubmit()}
													/>
													<span class="text-xs font-semibold text-neutral-900">{option.label}</span>
													<span class="text-xs text-neutral-500">{option.desc}</span>
												</label>
											{/each}
										</div>
										<label class="flex items-center gap-2 text-xs text-neutral-700">
											<input
												type="checkbox"
												name="autoThrottle"
												checked={client.objective.cycle.autoThrottle}
												class="rounded border-neutral-300"
												onchange={(e) => e.currentTarget.closest('form')?.requestSubmit()}
											/>
											<span>Auto-reduce for stakeholders rating 3+ people</span>
										</label>
									</form>
									<p class="mt-2 text-xs text-neutral-400">
										{client.stakeholders.length} stakeholder{client.stakeholders.length === 1 ? '' : 's'} linked
									</p>
								</section>
							{/if}
						{/if}

						<!-- AI Coach Prep -->
						{#if !client.archived && data.coachPrepMap[client.id]}
							{@const prep = data.coachPrepMap[client.id]}
							<section class="rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
								<div class="mb-3 flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span class="text-lg" role="img" aria-label="sparkles">&#10024;</span>
										<h3 class="text-sm font-bold text-neutral-900">AI Coach Prep</h3>
										<span class="text-xs text-neutral-500">{formatRelativeDays(prep.createdAt?.toString())}</span>
									</div>
									<button
										type="button"
										disabled={generatingPrepFor === client.id}
										onclick={() => generatePrep(client.id)}
										class="rounded-lg border-2 border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-all hover:border-indigo-400 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{generatingPrepFor === client.id ? 'Generating...' : 'Refresh Prep'}
									</button>
								</div>
								{#if data.alertMap[client.id]?.length}
									<div class="mb-3 rounded-lg border border-red-200 bg-red-50 p-2">
										<p class="text-xs font-bold text-red-700">AI Alerts:</p>
										{#each data.alertMap[client.id] as alert}
											<p class="mt-1 text-xs text-red-600">{alert}</p>
										{/each}
									</div>
								{/if}
								<div class="prose prose-sm max-w-none text-neutral-700">
									{prep.content ?? 'No prep available.'}
								</div>
							</section>
						{:else if !client.archived && client.objective?.cycle}
							<section class="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-4">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span class="text-lg" role="img" aria-label="sparkles">&#10024;</span>
										<h3 class="text-sm font-bold text-neutral-900">AI Coach Prep</h3>
										<span class="text-xs text-neutral-500">Not yet generated</span>
									</div>
									<button
										type="button"
										disabled={generatingPrepFor === client.id}
										onclick={() => generatePrep(client.id)}
										class="rounded-lg border-2 border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-all hover:border-indigo-400 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{generatingPrepFor === client.id ? 'Generating...' : 'Generate Prep'}
									</button>
								</div>
							</section>
						{/if}

						<!-- Performance/Effort Visualization -->
						{#if !client.archived && client.objective?.cycle && client.visualizationData}
							<section class="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-lg">
								<div class="mb-4">
									<h3 class="text-lg font-bold text-neutral-900">Effort and Performance Over Time</h3>
									<p class="text-sm text-neutral-600">Client self-assessments vs. stakeholder observations</p>
								</div>
								<PerformanceEffortChart
									individualData={client.visualizationData.individual}
									stakeholderData={client.visualizationData.stakeholders}
									stakeholders={client.visualizationData.stakeholderList}
								/>
							</section>
						{/if}

						{#if !client.archived && client.objective?.cycle}
							<section class="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
								<div class="mb-3 flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span class="text-lg" role="img" aria-label="speech bubble">💬</span>
										<h3 class="text-sm font-bold text-neutral-900">Coach Notes</h3>
									</div>
									<button
										type="button"
										onclick={() => {
											noteClientId = client.id;
											noteFormOpen = true;
										}}
										class="rounded-lg border-2 border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-all hover:border-blue-400 hover:bg-blue-100"
									>
										+ Add Note
									</button>
								</div>
								{#if client.coachNotes.length > 0}
									<ul class="space-y-2 text-xs">
										{#each client.coachNotes as note (note.id)}
											<li class="rounded-lg border-2 border-blue-200 bg-white p-3 shadow-sm">
												<p class="mb-2 text-neutral-700">{note.content}</p>
												<div class="flex items-center gap-2 text-xs text-neutral-500">
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
									<div class="rounded-lg border-2 border-dashed border-blue-300 bg-white/50 p-4 text-center">
										<p class="text-xs text-neutral-500">
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
									class="w-full rounded-lg border-2 border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 transition-all hover:border-neutral-400 hover:bg-neutral-50"
								>
									{client.archived ? 'Unarchive' : 'Archive'}
								</button>
							</form>
						</div>
					</div>
				{:else}
					<div class="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-12">
						<p class="text-sm text-neutral-500">Select a client to view details</p>
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
		<div class="w-full max-w-lg rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-2xl">
			<div class="mb-4 flex items-center gap-2">
				<span class="text-2xl" role="img" aria-label="speech bubble">💬</span>
				<h2 id="note-modal-title" class="text-xl font-bold text-neutral-900">Add Note for {client?.name}</h2>
			</div>
			{#if form?.noteError}
				<div class="mb-4 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					<p class="font-semibold">⚠️ {form.noteError}</p>
				</div>
			{:else if form?.noteSuccess}
				<div class="mb-4 rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 px-4 py-3 text-sm text-emerald-700">
					<div class="flex items-center gap-2">
						<span class="text-lg" role="img" aria-label="check mark">✅</span>
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
						<span class="font-semibold text-neutral-700">Week number (optional)</span>
						<input
							type="number"
							name="weekNumber"
							min="1"
							max="12"
							value={client.objective.cycle.currentWeek ?? ''}
							class="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
							placeholder="Leave blank for general note"
						/>
						<p class="text-xs text-neutral-500">
							Current week: {client.objective.cycle.currentWeek ?? '—'}. Leave blank to show in all Monday prompts.
						</p>
					</label>
				{/if}
				<label class="block space-y-1 text-sm">
					<span class="font-semibold text-neutral-700">Note content</span>
					<textarea
						bind:this={noteTextareaEl}
						name="content"
						rows="4"
						required
						minlength="10"
						class="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
						placeholder="This note will appear in the client's Monday prompt..."
					>{form?.values?.content ?? ''}</textarea>
					<p class="text-xs text-neutral-500">Minimum 10 characters.</p>
				</label>
				<div class="flex justify-end gap-3">
					<button
						type="button"
						onclick={() => {
							noteFormOpen = false;
							noteClientId = null;
						}}
						class="rounded-xl border-2 border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 transition-all hover:border-neutral-400 hover:bg-neutral-50"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-lg hover:scale-105"
					>
						<span role="img" aria-label="save">💾</span>
						Save Note
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
