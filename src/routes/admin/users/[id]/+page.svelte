<script lang="ts">
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();
	const user = data.user;

	const formatDate = (value: string | Date | null) => {
		if (!value) return '--';
		return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
	};

	const formatDateTime = (value: string | Date | null) => {
		if (!value) return '--';
		return new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
	};

	const impersonateAndOpen = async (path = '/') => {
		await fetch('/api/admin/impersonate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId: user.id })
		});
		window.open(path, '_blank');
	};
</script>

<section class="mx-auto flex max-w-5xl flex-col gap-6 p-6">
	<header class="flex items-center justify-between">
		<div>
			<a href="/admin/users" class="text-sm font-medium text-text-tertiary hover:text-text-secondary">
				&larr; Back to Users
			</a>
			<h1 class="mt-1 text-2xl font-bold text-text-primary">{user.name ?? 'Unnamed User'}</h1>
			<p class="text-sm text-text-secondary">{user.email}</p>
		</div>
		<div class="flex items-center gap-3">
			<button
				onclick={() => impersonateAndOpen('/')}
				class="rounded border border-border-default bg-warning-muted px-3 py-1 text-sm font-medium text-warning hover:bg-surface-subtle"
			>
				View as User
			</button>
			<span class="rounded-lg bg-surface-subtle px-3 py-1 text-sm font-bold uppercase text-text-secondary">{user.role}</span>
		</div>
	</header>

	<!-- Quick Preview Actions -->
	<div class="rounded-xl border border-border-default bg-accent-muted p-4">
		<h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-accent">Preview User Flows</h2>
		<p class="mb-3 text-xs text-text-secondary">Opens in a new window as this user. Admin panel stays open.</p>
		<div class="flex flex-wrap gap-2">
			<button
				onclick={() => impersonateAndOpen('/onboarding?preview=true')}
				class="rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-muted"
			>
				Onboarding Flow
			</button>
			<button
				onclick={() => impersonateAndOpen('/onboarding/initial-ratings?preview=true')}
				class="rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-muted"
			>
				Initial Ratings
			</button>
			<button
				onclick={() => impersonateAndOpen('/reflections/checkin?preview=true')}
				class="rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-muted"
			>
				Check-in / Ratings
			</button>
			<button
				onclick={() => impersonateAndOpen('/prompts/monday?preview=true')}
				class="rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-muted"
			>
				Monday Intention
			</button>
			<button
				onclick={() => impersonateAndOpen('/individual')}
				class="rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-muted"
			>
				Individual Hub
			</button>
		</div>
	</div>

	{#if form?.error}
		<div class="rounded border border-border-default bg-error-muted p-3 text-sm text-error">{form.error}</div>
	{:else if form?.success}
		<div class="rounded border border-border-default bg-success-muted p-3 text-sm text-success">{form.message}</div>
	{/if}

	<!-- Edit User -->
	<div class="rounded-xl border border-border-default bg-surface-raised p-4">
		<h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-text-tertiary">Edit User</h2>
		<form method="post" action="?/updateUser" class="flex flex-wrap items-end gap-3">
			<label class="flex flex-col gap-1 text-sm">
				<span class="font-medium text-text-secondary">Name</span>
				<input type="text" name="name" value={user.name ?? ''} class="rounded border border-border-default bg-surface-raised px-3 py-1.5 text-sm text-text-primary" />
			</label>
			<label class="flex flex-col gap-1 text-sm">
				<span class="font-medium text-text-secondary">Email</span>
				<input type="email" name="email" value={user.email} required class="rounded border border-border-default bg-surface-raised px-3 py-1.5 text-sm text-text-primary" />
			</label>
			<label class="flex flex-col gap-1 text-sm">
				<span class="font-medium text-text-secondary">Role</span>
				<select name="role" class="rounded border border-border-default bg-surface-raised px-3 py-1.5 text-sm text-text-primary">
					{#each data.roles as role (role)}
						<option value={role} selected={user.role === role}>{role}</option>
					{/each}
				</select>
			</label>
			<button type="submit" class="rounded bg-accent px-4 py-1.5 text-sm font-medium text-white">Save</button>
		</form>
		<p class="mt-2 text-xs text-text-tertiary">
			Clerk ID: {user.clerkUserId ?? 'Not linked'} &middot; Created {formatDate(user.createdAt)}
		</p>
	</div>

	<!-- Coach Relationships -->
	{#if user.coachClientsManaged.length > 0}
		<div class="rounded-xl border border-border-default bg-surface-raised p-4">
			<h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-text-tertiary">Manages (as Coach)</h2>
			<ul class="space-y-1 text-sm">
				{#each user.coachClientsManaged as rel (rel.id)}
					<li class="flex items-center justify-between rounded bg-surface-raised px-3 py-2">
						<a href="/admin/users/{rel.individual.email ? '' : ''}" class="font-medium">{rel.individual.name ?? rel.individual.email}</a>
						<span class="text-xs text-text-tertiary">{rel.archivedAt ? 'Archived' : 'Active'}</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if user.coachClientsOwned.length > 0}
		<div class="rounded-xl border border-border-default bg-surface-raised p-4">
			<h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-text-tertiary">Coached By</h2>
			<ul class="space-y-1 text-sm">
				{#each user.coachClientsOwned as rel (rel.id)}
					<li class="rounded bg-surface-raised px-3 py-2 font-medium">{rel.coach.name ?? rel.coach.email}</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Objectives -->
	{#each user.objectives as objective (objective.id)}
		<div class="rounded-xl border border-border-default bg-surface-raised p-4">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-bold uppercase tracking-wide text-text-tertiary">Objective</h2>
				<a href="/admin/objectives/{objective.id}" class="text-xs font-medium text-accent hover:underline">View Details</a>
			</div>
			<p class="mt-2 font-semibold text-text-primary">{objective.title}</p>
			{#if objective.description}
				<p class="mt-1 text-sm text-text-secondary">{objective.description}</p>
			{/if}
			<div class="mt-2 flex gap-4 text-xs text-text-tertiary">
				<span>{objective.subgoals.length} subgoals</span>
				<span>{objective.cycles.length} cycles</span>
				<span>{objective.stakeholders.length} stakeholders</span>
				<span class="font-semibold {objective.active ? 'text-success' : 'text-text-tertiary'}">{objective.active ? 'Active' : 'Inactive'}</span>
			</div>

			<!-- Cycles under this objective -->
			{#each objective.cycles as cycle (cycle.id)}
				<div class="mt-3 rounded-lg border border-border-default bg-surface-subtle p-3">
					<div class="flex items-center justify-between text-sm">
						<span class="font-medium">{cycle.label ?? 'Cycle'}</span>
						<span class="rounded bg-surface-subtle px-2 py-0.5 text-xs font-semibold uppercase">{cycle.status}</span>
					</div>
					<p class="text-xs text-text-tertiary">
						{formatDate(cycle.startDate)} &mdash; {formatDate(cycle.endDate)} &middot;
						{cycle._count.reflections} reflections
					</p>

					<!-- Recent Reflections -->
					{#if cycle.reflections.length > 0}
						<div class="mt-2 overflow-x-auto">
							<table class="min-w-full text-xs">
								<thead>
									<tr class="border-b border-border-default text-left text-text-tertiary">
										<th class="px-2 py-1">Week</th>
										<th class="px-2 py-1">Type</th>
										<th class="px-2 py-1">Effort</th>
										<th class="px-2 py-1">Performance</th>
										<th class="px-2 py-1">Date</th>
									</tr>
								</thead>
								<tbody>
									{#each cycle.reflections.slice(0, 10) as refl (refl.id)}
										<tr class="border-b border-border-default">
											<td class="px-2 py-1 font-medium">{refl.weekNumber}</td>
											<td class="px-2 py-1">{refl.reflectionType}</td>
											<td class="px-2 py-1">{refl.effortScore ?? '--'}</td>
											<td class="px-2 py-1">{refl.performanceScore ?? '--'}</td>
											<td class="px-2 py-1 text-text-tertiary">{formatDateTime(refl.submittedAt)}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}

					<!-- Coach Notes -->
					{#if cycle.coachNotes.length > 0}
						<div class="mt-2">
							<p class="text-xs font-semibold text-text-tertiary">Coach Notes:</p>
							<ul class="mt-1 space-y-1">
								{#each cycle.coachNotes as note (note.id)}
									<li class="rounded bg-surface-raised p-2 text-xs">
										<p class="text-text-secondary">{note.content}</p>
										<p class="mt-1 text-text-tertiary">
											Week {note.weekNumber ?? '--'} &middot; {note.coach?.name ?? 'Unknown'} &middot; {formatDate(note.createdAt)}
										</p>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			{/each}

			<!-- Stakeholders -->
			{#if objective.stakeholders.length > 0}
				<div class="mt-3">
					<p class="text-xs font-semibold text-text-tertiary">Stakeholders:</p>
					<div class="mt-1 flex flex-wrap gap-2">
						{#each objective.stakeholders as sh (sh.id)}
							<span class="rounded-lg border border-border-default bg-surface-raised px-3 py-1 text-xs">
								{sh.name} ({sh.relationship ?? 'No role'}) &middot; {sh._count.feedbacks} feedback{sh._count.feedbacks === 1 ? '' : 's'}
							</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/each}

	{#if user.objectives.length === 0}
		<div class="rounded-xl border border-dashed border-border-strong bg-surface-raised p-6 text-center text-sm text-text-tertiary">
			No objectives for this user.
		</div>
	{/if}
</section>
