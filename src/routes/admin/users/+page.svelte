<script lang="ts">
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	let searchTerm = $state('');
	let roleFilter = $state('ALL');

	const viewAsUser = async (userId: string, path = '/') => {
		await fetch('/api/admin/impersonate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId })
		});
		window.open(path, '_blank');
	};

	const filteredUsers = $derived(
		data.users.filter((user) => {
			if (roleFilter !== 'ALL' && user.role !== roleFilter) return false;
			if (!searchTerm) return true;
			const q = searchTerm.toLowerCase();
			return (
				(user.name ?? '').toLowerCase().includes(q) ||
				user.email.toLowerCase().includes(q)
			);
		})
	);
</script>

<section class="mx-auto flex max-w-5xl flex-col gap-6 p-6">
	<header class="space-y-2">
		<h1 class="text-2xl font-semibold">Users ({data.users.length})</h1>
		<p class="text-text-secondary">Manage roles, view details, and administer user accounts.</p>
	</header>

	{#if form?.error}
		<div class="rounded border border-border-default bg-error-muted p-3 text-sm text-error">{form.error}</div>
	{:else if form?.success}
		<div class="rounded border border-border-default bg-success-muted p-3 text-sm text-success">
			{form.message ?? 'Action completed successfully.'}
		</div>
	{/if}

	<!-- Search & Filter -->
	<div class="flex flex-wrap items-center gap-3">
		<input
			type="search"
			placeholder="Search by name or email..."
			class="rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
			bind:value={searchTerm}
		/>
		<select
			class="rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary"
			bind:value={roleFilter}
		>
			<option value="ALL">All Roles</option>
			{#each data.roles as role (role)}
				<option value={role}>{role}</option>
			{/each}
		</select>
		<span class="text-xs text-text-tertiary">{filteredUsers.length} shown</span>
	</div>

	<!-- Mobile: Card layout (below sm) -->
	<div class="space-y-3 sm:hidden">
		{#each filteredUsers as user (user.id)}
			<div class="rounded-lg border border-border-default bg-surface-raised p-4">
				<div class="mb-2 flex items-start justify-between gap-2">
					<div class="min-w-0">
						<a href="/admin/users/{user.id}" class="font-medium text-text-primary hover:text-accent hover:underline">
							{user.name ?? 'Unnamed user'}
						</a>
						<p class="truncate text-xs text-text-tertiary">{user.email}</p>
					</div>
					<span class="shrink-0 rounded bg-surface-subtle px-2 py-1 text-xs font-semibold text-text-secondary uppercase">
						{user.role}
					</span>
				</div>
				<p class="mb-3 text-xs text-text-tertiary">
					Created {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(user.createdAt))}
				</p>
				<div class="flex flex-wrap items-center gap-2">
					<a href="/admin/users/{user.id}" class="rounded border border-border-default px-3 py-1 text-xs font-medium text-accent hover:bg-accent-muted">Details</a>
					<button onclick={() => viewAsUser(user.id)} class="rounded border border-border-default px-3 py-1 text-xs font-medium text-warning hover:bg-warning-muted">View as</button>
					<form method="post" class="inline">
						<input type="hidden" name="intent" value="update" />
						<input type="hidden" name="userId" value={user.id} />
						<select name="role" class="rounded border border-border-default bg-surface-raised px-2 py-1 text-xs text-text-primary">
							{#each data.roles as role (role)}
								<option value={role} selected={user.role === role}>{role}</option>
							{/each}
						</select>
						<button type="submit" class="rounded bg-accent px-2 py-1 text-xs font-medium text-white">Update</button>
					</form>
					<form method="post" class="inline">
						<input type="hidden" name="intent" value="delete" />
						<input type="hidden" name="userId" value={user.id} />
						<button
							type="submit"
							class="rounded border border-border-default px-3 py-1 text-xs font-medium text-error hover:bg-error-muted"
							onclick={(event) => { if (!confirm(`Delete ${user.email}? This will remove their account and related data.`)) event.preventDefault(); }}
						>Delete</button>
					</form>
				</div>
			</div>
		{/each}
	</div>

	<!-- Desktop: Table layout (sm and above) -->
	<div class="hidden overflow-hidden rounded-lg border border-border-default bg-surface-raised sm:block">
		<table class="min-w-full divide-y divide-border-default text-sm">
			<thead
				class="bg-surface-subtle text-left text-xs font-semibold tracking-wide text-text-tertiary uppercase"
			>
				<tr>
					<th scope="col" class="px-4 py-3">Name</th>
					<th scope="col" class="px-4 py-3">Email</th>
					<th scope="col" class="px-4 py-3">Current role</th>
					<th scope="col" class="px-4 py-3">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border-default">
				{#each filteredUsers as user (user.id)}
					<tr class="align-top">
						<td class="px-4 py-3">
							<a href="/admin/users/{user.id}" class="font-medium text-text-primary hover:text-accent hover:underline">
								{user.name ?? 'Unnamed user'}
							</a>
							<p class="text-xs text-text-tertiary">
								Created {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
									new Date(user.createdAt)
								)}
							</p>
						</td>
						<td class="px-4 py-3 text-text-secondary">{user.email}</td>
						<td class="px-4 py-3">
							<span
								class="rounded bg-surface-subtle px-2 py-1 text-xs font-semibold text-text-secondary uppercase"
							>
								{user.role}
							</span>
						</td>
						<td class="px-4 py-3">
							<form method="post" class="flex flex-wrap items-center gap-2">
								<input type="hidden" name="intent" value="update" />
								<input type="hidden" name="userId" value={user.id} />
								<select
									name="role"
									class="rounded border border-border-default bg-surface-raised px-2 py-1 text-sm text-text-primary"
								>
									{#each data.roles as role (role)}
										<option value={role} selected={user.role === role}>{role}</option>
									{/each}
								</select>
								<button
									type="submit"
									class="rounded bg-accent px-3 py-1 text-xs font-medium text-white uppercase"
								>
									Update
								</button>
							</form>
							<div class="mt-2 flex gap-2">
								<a href="/admin/users/{user.id}" class="rounded border border-border-default px-3 py-1 text-xs font-medium text-accent hover:bg-accent-muted">
									Details
								</a>
								<button
									onclick={() => viewAsUser(user.id)}
									class="rounded border border-border-default px-3 py-1 text-xs font-medium text-warning hover:bg-warning-muted"
								>
									View as
								</button>
								<form method="post">
									<input type="hidden" name="intent" value="delete" />
									<input type="hidden" name="userId" value={user.id} />
									<button
										type="submit"
										class="rounded border border-border-default px-3 py-1 text-xs font-medium uppercase text-error hover:bg-error-muted"
										onclick={(event) => {
											if (
												!confirm(
													`Delete ${user.email}? This will remove their account and related data.`
												)
											) {
												event.preventDefault();
											}
										}}
									>
										Delete
									</button>
								</form>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
