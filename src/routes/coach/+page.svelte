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
		} | null;
		stakeholders: StakeholderSummary[];
	};

	export let data: {
		coach: { name: string };
		clients: ClientSummary[];
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
</script>

<section class="mx-auto flex max-w-6xl flex-col gap-6 p-4">
	<header class="space-y-2">
		<h1 class="text-2xl font-semibold">Coach dashboard</h1>
		<p class="text-neutral-600">
			Welcome back, {data.coach.name}. Monitor client progress and feedback at a glance.
		</p>
	</header>

	{#if data.clients.length === 0}
		<p class="text-neutral-600">No individuals available yet.</p>
	{:else}
		<div class="grid gap-4 md:grid-cols-2">
			{#each data.clients as client (client.id)}
				<article class="space-y-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
					<header class="space-y-1">
						<h2 class="text-lg font-semibold">{client.name}</h2>
						<p class="text-sm text-neutral-500">{client.email}</p>
					</header>

					{#if client.objective}
						<section class="space-y-2">
							<p class="text-sm font-medium text-neutral-700">Objective</p>
							<p class="text-sm text-neutral-600">{client.objective.title}</p>
							{#if client.objective.description}
								<p class="text-xs text-neutral-500">{client.objective.description}</p>
							{/if}
						</section>

						{#if client.objective.cycle}
							<section
								class="space-y-2 rounded border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600"
							>
								<div class="flex items-center justify-between">
									<span class="tracking-wide text-neutral-500 uppercase">Cycle status</span>
									<span>{client.objective.cycle.status}</span>
								</div>
								<div class="flex items-center justify-between text-neutral-500">
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

						<section class="space-y-2 text-xs text-neutral-600">
							<p>
								Subgoals: {client.objective.subgoalCount} · Stakeholders responding this week:
								{client.objective.respondedStakeholders}/{client.objective.stakeholderCount}
							</p>
						</section>

						<section class="space-y-2">
							<h3 class="text-sm font-semibold text-neutral-700">Recent reflections</h3>
							{#if client.objective.cycle?.recentReflections.length}
								<ul class="space-y-1 text-xs text-neutral-600">
									{#each client.objective.cycle.recentReflections as reflection (reflection.id)}
										<li class="rounded border border-neutral-200 bg-white/70 px-2 py-1">
											Week {reflection.weekNumber} · {reflection.reflectionType} ·
											{formatDateTime(reflection.submittedAt)}
											<p>
												Effort: {reflection.effortScore ?? '—'} · Progress:
												{reflection.progressScore ?? '—'}
											</p>
											{#if reflection.notes}
												<p class="text-[11px] text-neutral-500">{reflection.notes}</p>
											{/if}
										</li>
									{/each}
								</ul>
							{:else}
								<p class="text-xs text-neutral-500">No reflections recorded yet.</p>
							{/if}
						</section>
					{/if}

					<section class="space-y-2">
						<h3 class="text-sm font-semibold text-neutral-700">Stakeholders</h3>
						{#if client.stakeholders.length}
							<ul class="space-y-1 text-xs text-neutral-600">
								{#each client.stakeholders as stakeholder (stakeholder.id)}
									<li class="rounded border border-neutral-200 bg-white/70 px-2 py-1">
										<p class="font-medium text-neutral-700">{stakeholder.name}</p>
										<p>{stakeholder.email}</p>
										{#if stakeholder.lastFeedback}
											<p>
												Last feedback {formatDateTime(stakeholder.lastFeedback.submittedAt)} · Effort
												{stakeholder.lastFeedback.effortScore ?? '—'} · Progress
												{stakeholder.lastFeedback.progressScore ?? '—'}
											</p>
											{#if stakeholder.lastFeedback.weekNumber}
												<p class="text-[11px] text-neutral-500">
													Week {stakeholder.lastFeedback.weekNumber}
												</p>
											{/if}
										{:else}
											<p class="text-neutral-500">No feedback yet.</p>
										{/if}
									</li>
								{/each}
							</ul>
						{:else}
							<p class="text-xs text-neutral-500">No stakeholders recorded.</p>
						{/if}
					</section>
				</article>
			{/each}
		</div>
	{/if}
</section>
