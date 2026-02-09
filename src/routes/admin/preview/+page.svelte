<script lang="ts">
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	type Lens = 'individual' | 'stakeholder' | 'coach';
	let activeLens = $state<Lens>('individual');

	let selectedIndividualId = $state(data.individuals[0]?.id ?? '');
	let selectedCoachId = $state(data.coaches[0]?.id ?? '');
	let selectedStakeholderId = $state(data.stakeholders[0]?.id ?? '');

	const selectedIndividual = $derived(data.individuals.find((u) => u.id === selectedIndividualId));
	const selectedCoach = $derived(data.coaches.find((u) => u.id === selectedCoachId));
	const selectedStakeholder = $derived(data.stakeholders.find((s) => s.id === selectedStakeholderId));

	const impersonateAndOpen = async (userId: string, path: string) => {
		await fetch('/api/admin/impersonate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId })
		});
		window.open(path, '_blank');
	};

	const lenses: { id: Lens; label: string; description: string }[] = [
		{
			id: 'individual',
			label: 'Individual',
			description: 'The person working on their development objective'
		},
		{
			id: 'stakeholder',
			label: 'Stakeholder',
			description: 'Someone rating an individual\'s effort and performance'
		},
		{
			id: 'coach',
			label: 'Coach',
			description: 'Managing clients, reviewing data, and guiding development'
		}
	];

	type FlowCard = {
		label: string;
		description: string;
		action: () => void;
		disabled?: boolean;
		disabledReason?: string;
	};

	const individualFlows = $derived<FlowCard[]>([
		{
			label: 'Onboarding',
			description: 'Objective setup, subgoals, cycle config, stakeholder invites',
			action: () => impersonateAndOpen(selectedIndividualId, '/onboarding?preview=true')
		},
		{
			label: 'Initial Ratings',
			description: 'Baseline effort and performance scores',
			action: () => impersonateAndOpen(selectedIndividualId, '/onboarding/initial-ratings?preview=true')
		},
		{
			label: 'Monday Intention',
			description: 'Weekly intention-setting prompt',
			action: () => impersonateAndOpen(selectedIndividualId, '/prompts/monday?preview=true')
		},
		{
			label: 'Check-in (Effort)',
			description: 'Mid-week effort rating',
			action: () => impersonateAndOpen(selectedIndividualId, '/reflections/checkin?type=RATING_A&preview=true')
		},
		{
			label: 'Check-in (Performance)',
			description: 'End-of-week performance rating',
			action: () => impersonateAndOpen(selectedIndividualId, '/reflections/checkin?type=RATING_B&preview=true')
		},
		{
			label: 'Individual Hub',
			description: 'Main dashboard with scores, charts, and insights',
			action: () => impersonateAndOpen(selectedIndividualId, '/individual')
		},
		{
			label: 'Insights',
			description: 'AI-generated analysis and cycle reports',
			action: () => impersonateAndOpen(selectedIndividualId, '/individual/insights')
		}
	]);

	const stakeholderFlows = $derived<FlowCard[]>([
		{
			label: 'Feedback Form',
			description: 'Rate effort and performance for an individual',
			action: () => {
				const token = selectedStakeholder?.tokenHash;
				if (token) {
					window.open(`/stakeholder/feedback/${token}`, '_blank');
				}
			},
			disabled: !selectedStakeholder?.tokenHash,
			disabledReason: 'No active feedback token — generate one from the individual\'s cycle first'
		},
		{
			label: 'Feedback Form (Demo)',
			description: 'Preview the feedback form with sample data',
			action: () => window.open('/stakeholder/feedback/preview?preview=true', '_blank')
		}
	]);

	const coachFlows = $derived<FlowCard[]>([
		{
			label: 'Coach Hub',
			description: 'Overview with client alerts and quick actions',
			action: () => impersonateAndOpen(selectedCoachId, '/coach')
		},
		{
			label: 'Client Roster',
			description: 'Full client list with status and drill-down',
			action: () => impersonateAndOpen(selectedCoachId, '/coach/roster')
		},
		{
			label: 'Analytics',
			description: 'Cross-client performance analytics',
			action: () => impersonateAndOpen(selectedCoachId, '/coach/analytics')
		},
		{
			label: 'Invitations',
			description: 'Manage and send client invitations',
			action: () => impersonateAndOpen(selectedCoachId, '/coach/invitations')
		}
	]);
</script>

<section class="mx-auto flex max-w-5xl flex-col gap-6 p-6">
	<header>
		<h1 class="text-2xl font-bold text-neutral-900">Preview Panel</h1>
		<p class="text-sm text-neutral-600">
			Preview every user-facing flow through the lens of each role. All previews open in a new window.
		</p>
	</header>

	<!-- Lens Selector -->
	<div class="grid gap-3 sm:grid-cols-3">
		{#each lenses as lens (lens.id)}
			<button
				onclick={() => (activeLens = lens.id)}
				class="rounded-xl border-2 p-4 text-left transition-all {activeLens === lens.id
					? lens.id === 'individual'
						? 'border-blue-400 bg-blue-50 shadow-md'
						: lens.id === 'stakeholder'
							? 'border-emerald-400 bg-emerald-50 shadow-md'
							: 'border-purple-400 bg-purple-50 shadow-md'
					: 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'}"
			>
				<p class="text-sm font-bold {activeLens === lens.id
					? lens.id === 'individual'
						? 'text-blue-700'
						: lens.id === 'stakeholder'
							? 'text-emerald-700'
							: 'text-purple-700'
					: 'text-neutral-900'}">
					{lens.label}
				</p>
				<p class="mt-1 text-xs text-neutral-600">{lens.description}</p>
			</button>
		{/each}
	</div>

	<!-- Individual Lens -->
	{#if activeLens === 'individual'}
		<div class="rounded-xl border-2 border-blue-200 bg-white p-5 shadow-sm">
			<div class="mb-4 flex flex-wrap items-end gap-3">
				<label class="flex flex-col gap-1 text-sm">
					<span class="font-semibold text-blue-700">Preview as Individual</span>
					<select
						bind:value={selectedIndividualId}
						class="rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
					>
						{#each data.individuals as user (user.id)}
							<option value={user.id}>
								{user.name ?? 'Unnamed'} — {user.email}
							</option>
						{/each}
					</select>
				</label>
				{#if selectedIndividual}
					<div class="text-xs text-neutral-500">
						{#if selectedIndividual.objectiveTitle}
							<span class="rounded bg-blue-100 px-2 py-0.5 font-medium text-blue-700">
								{selectedIndividual.objectiveTitle}
							</span>
							{#if selectedIndividual.cycleStatus}
								<span class="ml-1 rounded bg-neutral-100 px-2 py-0.5 font-medium uppercase">
									{selectedIndividual.cycleStatus}
								</span>
							{/if}
						{:else}
							<span class="italic text-neutral-400">No objective yet</span>
						{/if}
					</div>
				{/if}
			</div>

			<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
				{#each individualFlows as flow (flow.label)}
					<button
						onclick={flow.action}
						disabled={flow.disabled}
						class="group rounded-lg border border-blue-100 bg-blue-50/30 px-4 py-3 text-left transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
					>
						<p class="text-sm font-semibold text-neutral-900 group-hover:text-blue-700">{flow.label}</p>
						<p class="mt-0.5 text-xs text-neutral-500">{flow.description}</p>
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Stakeholder Lens -->
	{#if activeLens === 'stakeholder'}
		<div class="rounded-xl border-2 border-emerald-200 bg-white p-5 shadow-sm">
			<div class="mb-4 flex flex-wrap items-end gap-3">
				<label class="flex flex-col gap-1 text-sm">
					<span class="font-semibold text-emerald-700">Preview as Stakeholder</span>
					<select
						bind:value={selectedStakeholderId}
						class="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
					>
						{#each data.stakeholders as stakeholder (stakeholder.id)}
							<option value={stakeholder.id}>
								{stakeholder.name} — rates {stakeholder.individualName}
								{stakeholder.relationship ? `(${stakeholder.relationship})` : ''}
							</option>
						{/each}
					</select>
				</label>
				{#if selectedStakeholder}
					<div class="text-xs">
						{#if selectedStakeholder.tokenHash}
							<span class="rounded bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700">
								Active token
							</span>
						{:else}
							<span class="rounded bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
								No active token
							</span>
						{/if}
					</div>
				{/if}
			</div>

			{#if data.stakeholders.length === 0}
				<div class="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
					No stakeholders in the system yet. Create one through an individual's onboarding flow.
				</div>
			{:else}
				<div class="grid gap-2 sm:grid-cols-2">
					{#each stakeholderFlows as flow (flow.label)}
						<button
							onclick={flow.action}
							disabled={flow.disabled}
							class="group rounded-lg border border-emerald-100 bg-emerald-50/30 px-4 py-3 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
						>
							<p class="text-sm font-semibold text-neutral-900 group-hover:text-emerald-700">{flow.label}</p>
							<p class="mt-0.5 text-xs text-neutral-500">
								{flow.disabled ? flow.disabledReason : flow.description}
							</p>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Coach Lens -->
	{#if activeLens === 'coach'}
		<div class="rounded-xl border-2 border-purple-200 bg-white p-5 shadow-sm">
			<div class="mb-4 flex flex-wrap items-end gap-3">
				<label class="flex flex-col gap-1 text-sm">
					<span class="font-semibold text-purple-700">Preview as Coach</span>
					<select
						bind:value={selectedCoachId}
						class="rounded-lg border border-purple-200 bg-purple-50/50 px-3 py-2 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
					>
						{#each data.coaches as coach (coach.id)}
							<option value={coach.id}>
								{coach.name ?? 'Unnamed'} — {coach.email}
								({coach.clientCount} client{coach.clientCount === 1 ? '' : 's'})
							</option>
						{/each}
					</select>
				</label>
			</div>

			{#if data.coaches.length === 0}
				<div class="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
					No coaches in the system yet. Assign the COACH role to a user from the Users page.
				</div>
			{:else}
				<div class="grid gap-2 sm:grid-cols-2">
					{#each coachFlows as flow (flow.label)}
						<button
							onclick={flow.action}
							disabled={flow.disabled}
							class="group rounded-lg border border-purple-100 bg-purple-50/30 px-4 py-3 text-left transition-all hover:border-purple-300 hover:bg-purple-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
						>
							<p class="text-sm font-semibold text-neutral-900 group-hover:text-purple-700">{flow.label}</p>
							<p class="mt-0.5 text-xs text-neutral-500">{flow.description}</p>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Helpful note -->
	<div class="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-500">
		All previews open in a new browser window. Impersonation is automatically set for individual and coach lenses.
		Stakeholder previews use token-based access (no impersonation needed). Your admin session stays active here.
	</div>
</section>
