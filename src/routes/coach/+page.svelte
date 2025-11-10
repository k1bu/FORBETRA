<script lang="ts">
	type ReflectionSummary = {
		id: string;
		weekNumber: number;
		reflectionType: string;
		submittedAt: string | null;
		effortScore: number | null;
		progressScore: number | null;
		notes: string;
	};

	type StakeholderSummary = {
		id: string;
		name: string;
		email: string;
		lastFeedback: {
			submittedAt: string | null;
			effortScore: number | null;
			progressScore: number | null;
			weekNumber: number | null;
		} | null;
	};

	type ClientSummary = {
		id: string;
		name: string;
		email: string;
	archived: boolean;
	joinedAt: string;
	archivedAt: string | null;
		objective: {
			id: string;
			title: string;
			description: string;
			cycle: {
				id: string;
				label: string;
				startDate: string | null;
				endDate: string | null;
				status: string;
				completion: number;
				weeksElapsed: number;
				currentWeek: number | null;
				recentReflections: ReflectionSummary[];
			} | null;
			subgoalCount: number;
			stakeholderCount: number;
			respondedStakeholders: number;
			insights: {
				avgEffort: number | null;
				avgProgress: number | null;
				consistencyScore: number | null;
				alignmentRatio: number | null;
			} | null;
		} | null;
		stakeholders: StakeholderSummary[];
	};

type InvitationSummary = {
	id: string;
	email: string;
	name: string | null;
	message: string | null;
	expiresAt: string;
	acceptedAt: string | null;
	cancelledAt: string | null;
	individual: { id: string; name: string; email: string } | null;
	createdAt: string;
};

export let data: {
	coach: { name: string };
	clients: ClientSummary[];
	invitations: InvitationSummary[];
	rosterSummary: {
		total: number;
		active: number;
		archived: number;
		pendingInvites: number;
	};
};

export let form:
	| {
			error?: string;
			success?: boolean;
			inviteUrl?: string;
			inviteId?: string;
			values?: {
				email?: string;
				name?: string;
				message?: string;
			};
	  }
	| null;
};

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

const formatTimeFromNow = (value: string | null | undefined) => {
	if (!value) return '—';
	const diff = new Date(value).getTime() - Date.now();
	const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
	if (days <= 0) return 'Expired';
	if (days === 1) return '1 day left';
	return `${days} days left`;
};

let searchTerm = '';
let showArchived = false;
let filteredClients: ClientSummary[] = data.clients;

$: filteredClients = data.clients.filter((client) => {
	if (!showArchived && client.archived) return false;
	if (!searchTerm) return true;
	const query = searchTerm.toLowerCase();
	return (
		(client.name ?? '').toLowerCase().includes(query) ||
		client.email.toLowerCase().includes(query)
	);
});
</script>

<section class="mx-auto flex max-w-6xl flex-col gap-8 p-4">
	<header class="space-y-2">
		<h1 class="text-2xl font-semibold">Coach dashboard</h1>
		<p class="text-neutral-600">
			Welcome back, {data.coach.name}. Monitor client progress and feedback at a glance.
		</p>
	</header>

	<section class="grid gap-4 text-sm text-slate-600 md:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
			<p class="text-xs uppercase tracking-[0.3em] text-slate-400">Active clients</p>
			<p class="mt-2 text-2xl font-semibold text-slate-900">{data.rosterSummary.active}</p>
		</div>
		<div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
			<p class="text-xs uppercase tracking-[0.3em] text-slate-400">Archived</p>
			<p class="mt-2 text-2xl font-semibold text-slate-900">{data.rosterSummary.archived}</p>
		</div>
		<div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
			<p class="text-xs uppercase tracking-[0.3em] text-slate-400">Pending invites</p>
			<p class="mt-2 text-2xl font-semibold text-slate-900">
				{data.rosterSummary.pendingInvites}
			</p>
		</div>
		<div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
			<p class="text-xs uppercase tracking-[0.3em] text-slate-400">Total linked</p>
			<p class="mt-2 text-2xl font-semibold text-slate-900">{data.rosterSummary.total}</p>
		</div>
	</section>

	<section class="grid gap-6 rounded-xl border border-slate-200 bg-white/90 p-6 shadow-sm lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
		<div class="space-y-4">
			<header class="space-y-1">
				<h2 class="text-xl font-semibold text-slate-900">Invite an individual</h2>
				<p class="text-sm text-slate-500">
					Send a secure invite so they join FORBETRA automatically linked to you.
				</p>
			</header>

			{#if form?.error}
				<div class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
					{form.error}
				</div>
			{:else if form?.success}
				<div class="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
					<p>Invitation created successfully.</p>
					{#if form.inviteUrl}
						<div class="rounded border border-emerald-300 bg-white px-3 py-2 text-xs text-emerald-700">
							<p class="font-semibold uppercase tracking-wide text-emerald-800">Invite link</p>
							<p class="break-all font-medium">{form.inviteUrl}</p>
							<p class="text-[11px] text-emerald-500">
								Copy and share this link with your individual. It expires in 14 days.
							</p>
						</div>
					{/if}
				</div>
			{/if}

			<form method="post" action="?/createInvite" class="space-y-4">
				<div class="grid gap-3 md:grid-cols-2">
					<label class="space-y-1 text-sm">
						<span class="font-medium text-slate-700">Individual email</span>
						<input
							type="email"
							name="email"
							class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
							placeholder="alex@example.com"
							required
							value={form?.values?.email}
						/>
					</label>
					<label class="space-y-1 text-sm">
						<span class="font-medium text-slate-700">Name (optional)</span>
						<input
							type="text"
							name="name"
							class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
							placeholder="Alex Jensen"
							value={form?.values?.name}
						/>
					</label>
				</div>
				<label class="space-y-1 text-sm">
					<span class="font-medium text-slate-700">Message (optional)</span>
					<textarea
						name="message"
						rows="3"
						class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
						placeholder="Add context for why you’re inviting them."
					>{form?.values?.message}</textarea>
				</label>
				<button
					type="submit"
					class="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
				>
					Send invitation
				</button>
			</form>
		</div>

		<div class="space-y-4">
			<header class="flex items-center justify-between">
				<div>
					<h3 class="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
						Active invites
					</h3>
					<p class="text-xs text-slate-400">Track invitations waiting for acceptance.</p>
				</div>

				<span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
					{data.invitations.filter((invite) => !invite.acceptedAt && !invite.cancelledAt).length}
				</span>
			</header>

			{#if data.invitations.length === 0}
				<p class="text-sm text-slate-500">
					No invitations yet. Send one using the form to the left.
				</p>
			{:else}
				<ul class="space-y-3 text-sm">
					{#each data.invitations as invite (invite.id)}
						<li
							class="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:border-slate-300"
						>
							<div class="flex flex-wrap items-baseline justify-between gap-3">
								<div>
									<p class="text-sm font-semibold text-slate-900">
										{invite.name ?? invite.email}
									</p>
									<p class="text-xs text-slate-500">{invite.email}</p>
								</div>
								<span class="text-xs font-semibold uppercase tracking-wide text-slate-400">
									{invite.acceptedAt
										? 'Accepted'
										: invite.cancelledAt
										? 'Canceled'
										: formatTimeFromNow(invite.expiresAt)}
								</span>
							</div>
							{#if invite.message}
								<p class="mt-2 text-xs text-slate-500">
									Message: <span class="font-medium text-slate-600">{invite.message}</span>
								</p>
							{/if}
							<div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
								<span>Created {formatDateTime(invite.createdAt)}</span>
								{#if invite.acceptedAt}
									<span class="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
										Joined as {invite.individual?.name ?? invite.individual?.email}
									</span>
								{:else if invite.cancelledAt}
									<span class="rounded-full bg-slate-100 px-2 py-1 text-slate-500">
										Canceled {formatDateTime(invite.cancelledAt)}
									</span>
								{:else}
									<form method="post" action="?/cancelInvite" class="inline">
										<input type="hidden" name="inviteId" value={invite.id} />
										<button
											type="submit"
											class="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
										>
											Cancel invite
										</button>
									</form>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</section>

	<section class="space-y-4 rounded-xl border border-slate-200 bg-white/80 p-6 shadow-sm">
		<header class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<h2 class="text-lg font-semibold text-slate-900">Client roster</h2>
				<p class="text-sm text-slate-500">
					Review active and archived individuals linked to your practice.
				</p>
			</div>
			<div class="flex flex-wrap items-center gap-3">
				<input
					type="search"
					placeholder="Search by name or email"
					class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 md:w-64"
					bind:value={searchTerm}
				/>
				<label class="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
					<input type="checkbox" bind:checked={showArchived} class="rounded border-slate-300" />
					Show archived
				</label>
			</div>
		</header>

		{#if data.clients.length === 0}
			<p class="text-sm text-slate-500">
				No linked individuals yet. Send an invitation to start your roster.
			</p>
		{:else if filteredClients.length === 0}
			<p class="text-sm text-slate-500">No clients match this search.</p>
		{:else}
			<div class="grid gap-4 lg:grid-cols-2">
				{#each filteredClients as client (client.id)}
					<article
						class="space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition hover:border-slate-300"
					>
						<header class="flex flex-wrap items-start justify-between gap-2">
							<div>
								<h2 class="text-lg font-semibold text-slate-900">{client.name}</h2>
								<p class="text-sm text-slate-500">{client.email}</p>
								<p class="text-xs text-slate-400">
									Joined {formatRelativeDays(client.joinedAt)}
									{#if client.archived}
										· Archived {formatDate(client.archivedAt)}
									{/if}
								</p>
							</div>
							{#if client.archived}
								<span class="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase text-slate-600">
									Archived
								</span>
							{:else}
								<span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase text-emerald-700">
									Active
								</span>
							{/if}
						</header>

						{#if client.objective}
							<section class="space-y-2">
								<p class="text-sm font-medium text-slate-700">Objective</p>
								<p class="text-sm text-slate-600">{client.objective.title}</p>
								{#if client.objective.description}
									<p class="text-xs text-slate-500">{client.objective.description}</p>
								{/if}
							</section>

							{#if client.objective.cycle}
								<section class="space-y-2 rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
									<div class="flex items-center justify-between">
										<span class="tracking-wide text-slate-500 uppercase">Cycle status</span>
										<span>{client.objective.cycle.status}</span>
									</div>
									<div class="flex items-center justify-between text-slate-500">
										<span>Progress</span>
										<span>{client.objective.cycle.completion}%</span>
									</div>
									<p>Weeks elapsed: {client.objective.cycle.weeksElapsed}</p>
									<p>Current week: {client.objective.cycle.currentWeek ?? '—'}</p>
									<p>
										Start {formatDate(client.objective.cycle.startDate)} · End {formatDate(
											client.objective.cycle.endDate
										)}
									</p>
								</section>
							{/if}

							<section class="space-y-2 text-xs text-slate-600">
								<p>
									Subgoals: {client.objective.subgoalCount} · Stakeholders responding this week:
									{client.objective.respondedStakeholders}/{client.objective.stakeholderCount}
								</p>
							</section>

							{#if client.objective.insights}
								<section class="space-y-1 rounded border border-slate-200 bg-white/70 p-3 text-xs text-slate-600">
									<p class="font-semibold text-slate-700">Insights</p>
									<p>Avg. effort (4-week): {formatAverage(client.objective.insights.avgEffort)}</p>
									<p>
										Avg. progress (4-week): {formatAverage(client.objective.insights.avgProgress)}
									</p>
									<p>Consistency: {formatScore(client.objective.insights.consistencyScore)}</p>
									<p>
										Stakeholder alignment: {formatPercent(
											client.objective.insights.alignmentRatio
										)}
									</p>
								</section>
							{/if}

							<section class="space-y-2">
								<h3 class="text-sm font-semibold text-slate-700">Recent reflections</h3>
								{#if client.objective.cycle?.recentReflections.length}
									<ul class="space-y-1 text-xs text-slate-600">
										{#each client.objective.cycle.recentReflections as reflection (reflection.id)}
											<li class="rounded border border-slate-200 bg-white/70 px-2 py-1">
												Week {reflection.weekNumber} · {reflection.reflectionType} ·
												{formatDateTime(reflection.submittedAt)}
												<p>
													Effort: {reflection.effortScore ?? '—'} · Progress:
													{reflection.progressScore ?? '—'}
												</p>
												{#if reflection.notes}
													<p class="text-[11px] text-slate-500">{reflection.notes}</p>
												{/if}
											</li>
										{/each}
									</ul>
								{:else}
									<p class="text-xs text-slate-500">No reflections recorded yet.</p>
								{/if}
							</section>
						{/if}

						<section class="space-y-2">
							<h3 class="text-sm font-semibold text-slate-700">Stakeholders</h3>
							{#if client.stakeholders.length}
								<ul class="space-y-1 text-xs text-slate-600">
									{#each client.stakeholders as stakeholder (stakeholder.id)}
										<li class="rounded border border-slate-200 bg-white/70 px-2 py-1">
											<p class="font-medium text-slate-700">{stakeholder.name}</p>
											<p>{stakeholder.email}</p>
											{#if stakeholder.lastFeedback}
												<p>
													Last feedback {formatDateTime(stakeholder.lastFeedback.submittedAt)} ·
													Effort {stakeholder.lastFeedback.effortScore ?? '—'} · Progress
													{stakeholder.lastFeedback.progressScore ?? '—'}
												</p>
												{#if stakeholder.lastFeedback.weekNumber}
													<p class="text-[11px] text-slate-500">
														Week {stakeholder.lastFeedback.weekNumber}
													</p>
												{/if}
											{:else}
												<p class="text-slate-500">No feedback yet.</p>
											{/if}
										</li>
									{/each}
								</ul>
							{:else}
								<p class="text-xs text-slate-500">No stakeholders recorded.</p>
							{/if}
						</section>
					</article>
				{/each}
			</div>
		{/if}
	</section>

	{#if data.invitations.length === 0 && data.clients.length === 0}
		<p class="text-center text-sm text-slate-400">
			Invite individuals and they’ll appear in your roster with analytics once they onboard.
		</p>
	{:else}
	{/if}
</section>
