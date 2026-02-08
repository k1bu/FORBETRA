<script lang="ts">
	import { goto } from '$app/navigation';
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

	const viewAsUser = async () => {
		await fetch('/api/admin/impersonate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId: user.id })
		});
		await goto('/', { invalidateAll: true });
	};
</script>

<section class="mx-auto flex max-w-5xl flex-col gap-6 p-6">
	<header class="flex items-center justify-between">
		<div>
			<a href="/admin/users" class="text-sm font-medium text-neutral-500 hover:text-neutral-700">
				&larr; Back to Users
			</a>
			<h1 class="mt-1 text-2xl font-bold text-neutral-900">{user.name ?? 'Unnamed User'}</h1>
			<p class="text-sm text-neutral-600">{user.email}</p>
		</div>
		<div class="flex items-center gap-3">
			<button
				onclick={viewAsUser}
				class="rounded border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 hover:bg-amber-100"
			>
				View as User
			</button>
			<span class="rounded-lg bg-neutral-100 px-3 py-1 text-sm font-bold uppercase text-neutral-600">{user.role}</span>
		</div>
	</header>

	{#if form?.error}
		<div class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
	{:else if form?.success}
		<div class="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{form.message}</div>
	{/if}

	<!-- Edit User -->
	<div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">Edit User</h2>
		<form method="post" action="?/updateUser" class="flex flex-wrap items-end gap-3">
			<label class="flex flex-col gap-1 text-sm">
				<span class="font-medium text-neutral-700">Name</span>
				<input type="text" name="name" value={user.name ?? ''} class="rounded border border-neutral-300 px-3 py-1.5 text-sm" />
			</label>
			<label class="flex flex-col gap-1 text-sm">
				<span class="font-medium text-neutral-700">Email</span>
				<input type="email" name="email" value={user.email} required class="rounded border border-neutral-300 px-3 py-1.5 text-sm" />
			</label>
			<label class="flex flex-col gap-1 text-sm">
				<span class="font-medium text-neutral-700">Role</span>
				<select name="role" class="rounded border border-neutral-300 px-3 py-1.5 text-sm">
					{#each data.roles as role (role)}
						<option value={role} selected={user.role === role}>{role}</option>
					{/each}
				</select>
			</label>
			<button type="submit" class="rounded bg-black px-4 py-1.5 text-sm font-medium text-white">Save</button>
		</form>
		<p class="mt-2 text-xs text-neutral-500">
			Clerk ID: {user.clerkUserId ?? 'Not linked'} &middot; Created {formatDate(user.createdAt)}
		</p>
	</div>

	<!-- Coach Relationships -->
	{#if user.coachClientsManaged.length > 0}
		<div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
			<h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">Manages (as Coach)</h2>
			<ul class="space-y-1 text-sm">
				{#each user.coachClientsManaged as rel (rel.id)}
					<li class="flex items-center justify-between rounded bg-neutral-50 px-3 py-2">
						<a href="/admin/users/{rel.individual.email ? '' : ''}" class="font-medium">{rel.individual.name ?? rel.individual.email}</a>
						<span class="text-xs text-neutral-500">{rel.archivedAt ? 'Archived' : 'Active'}</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if user.coachClientsOwned.length > 0}
		<div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
			<h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">Coached By</h2>
			<ul class="space-y-1 text-sm">
				{#each user.coachClientsOwned as rel (rel.id)}
					<li class="rounded bg-neutral-50 px-3 py-2 font-medium">{rel.coach.name ?? rel.coach.email}</li>
				{/each}
			</ul>
		</div>
	{/if}

	<!-- Objectives -->
	{#each user.objectives as objective (objective.id)}
		<div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-bold uppercase tracking-wide text-neutral-500">Objective</h2>
				<a href="/admin/objectives/{objective.id}" class="text-xs font-medium text-blue-600 hover:underline">View Details</a>
			</div>
			<p class="mt-2 font-semibold text-neutral-900">{objective.title}</p>
			{#if objective.description}
				<p class="mt-1 text-sm text-neutral-600">{objective.description}</p>
			{/if}
			<div class="mt-2 flex gap-4 text-xs text-neutral-500">
				<span>{objective.subgoals.length} subgoals</span>
				<span>{objective.cycles.length} cycles</span>
				<span>{objective.stakeholders.length} stakeholders</span>
				<span class="font-semibold {objective.active ? 'text-emerald-600' : 'text-neutral-400'}">{objective.active ? 'Active' : 'Inactive'}</span>
			</div>

			<!-- Cycles under this objective -->
			{#each objective.cycles as cycle (cycle.id)}
				<div class="mt-3 rounded-lg border border-neutral-100 bg-neutral-50 p-3">
					<div class="flex items-center justify-between text-sm">
						<span class="font-medium">{cycle.label ?? 'Cycle'}</span>
						<span class="rounded bg-neutral-200 px-2 py-0.5 text-xs font-semibold uppercase">{cycle.status}</span>
					</div>
					<p class="text-xs text-neutral-500">
						{formatDate(cycle.startDate)} &mdash; {formatDate(cycle.endDate)} &middot;
						{cycle._count.reflections} reflections
					</p>

					<!-- Recent Reflections -->
					{#if cycle.reflections.length > 0}
						<div class="mt-2 overflow-x-auto">
							<table class="min-w-full text-xs">
								<thead>
									<tr class="border-b border-neutral-200 text-left text-neutral-500">
										<th class="px-2 py-1">Week</th>
										<th class="px-2 py-1">Type</th>
										<th class="px-2 py-1">Effort</th>
										<th class="px-2 py-1">Performance</th>
										<th class="px-2 py-1">Date</th>
									</tr>
								</thead>
								<tbody>
									{#each cycle.reflections.slice(0, 10) as refl (refl.id)}
										<tr class="border-b border-neutral-100">
											<td class="px-2 py-1 font-medium">{refl.weekNumber}</td>
											<td class="px-2 py-1">{refl.reflectionType}</td>
											<td class="px-2 py-1">{refl.effortScore ?? '--'}</td>
											<td class="px-2 py-1">{refl.performanceScore ?? '--'}</td>
											<td class="px-2 py-1 text-neutral-500">{formatDateTime(refl.submittedAt)}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}

					<!-- Coach Notes -->
					{#if cycle.coachNotes.length > 0}
						<div class="mt-2">
							<p class="text-xs font-semibold text-neutral-500">Coach Notes:</p>
							<ul class="mt-1 space-y-1">
								{#each cycle.coachNotes as note (note.id)}
									<li class="rounded bg-white p-2 text-xs">
										<p class="text-neutral-700">{note.content}</p>
										<p class="mt-1 text-neutral-400">
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
					<p class="text-xs font-semibold text-neutral-500">Stakeholders:</p>
					<div class="mt-1 flex flex-wrap gap-2">
						{#each objective.stakeholders as sh (sh.id)}
							<span class="rounded-lg border border-neutral-200 bg-white px-3 py-1 text-xs">
								{sh.name} ({sh.relationship ?? 'No role'}) &middot; {sh._count.feedbacks} feedback{sh._count.feedbacks === 1 ? '' : 's'}
							</span>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/each}

	{#if user.objectives.length === 0}
		<div class="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
			No objectives for this user.
		</div>
	{/if}
</section>
