<script lang="ts">
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	const formatDate = (value: string | Date | null) => {
		if (!value) return '--';
		return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
	};
</script>

<section class="mx-auto flex max-w-5xl flex-col gap-6 p-6">
	<header>
		<h1 class="text-2xl font-bold text-text-primary">Coach Assignments</h1>
		<p class="text-sm text-text-secondary">All coach-client relationships and pending invitations</p>
	</header>

	<!-- Active Relationships -->
	<div class="rounded-xl border border-border-default bg-surface-raised p-4">
		<h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-text-tertiary">
			Coach-Client Relationships ({data.coachClients.length})
		</h2>
		{#if data.coachClients.length > 0}
			<div class="overflow-x-auto">
				<table class="min-w-full text-sm">
					<thead class="text-left text-xs font-semibold uppercase tracking-wide text-text-tertiary">
						<tr class="border-b border-border-default">
							<th class="px-3 py-2">Coach</th>
							<th class="px-3 py-2">Individual</th>
							<th class="px-3 py-2">Since</th>
							<th class="px-3 py-2">Status</th>
						</tr>
					</thead>
					<tbody>
						{#each data.coachClients as rel (rel.id)}
							<tr class="border-b border-border-default hover:bg-surface-subtle">
								<td class="px-3 py-2">
									<a href="/admin/users/{rel.coach.id}" class="font-medium text-accent hover:underline">
										{rel.coach.name ?? rel.coach.email}
									</a>
								</td>
								<td class="px-3 py-2">
									<a href="/admin/users/{rel.individual.id}" class="font-medium text-accent hover:underline">
										{rel.individual.name ?? rel.individual.email}
									</a>
								</td>
								<td class="px-3 py-2 text-text-tertiary">{formatDate(rel.createdAt)}</td>
								<td class="px-3 py-2">
									{#if rel.archivedAt}
										<span class="rounded bg-surface-subtle px-2 py-0.5 text-xs font-semibold text-text-tertiary">Archived {formatDate(rel.archivedAt)}</span>
									{:else}
										<span class="rounded bg-success-muted px-2 py-0.5 text-xs font-semibold text-success">Active</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="text-sm text-text-tertiary">No coach-client relationships exist.</p>
		{/if}
	</div>

	<!-- Pending Invites -->
	<div class="rounded-xl border border-border-default bg-surface-raised p-4">
		<h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-text-tertiary">
			Coach Invitations ({data.coachInvites.length})
		</h2>
		{#if data.coachInvites.length > 0}
			<div class="overflow-x-auto">
				<table class="min-w-full text-sm">
					<thead class="text-left text-xs font-semibold uppercase tracking-wide text-text-tertiary">
						<tr class="border-b border-border-default">
							<th class="px-3 py-2">Coach</th>
							<th class="px-3 py-2">Invitee Email</th>
							<th class="px-3 py-2">Name</th>
							<th class="px-3 py-2">Sent</th>
							<th class="px-3 py-2">Status</th>
						</tr>
					</thead>
					<tbody>
						{#each data.coachInvites as invite (invite.id)}
							<tr class="border-b border-border-default hover:bg-surface-subtle">
								<td class="px-3 py-2">{invite.coach.name ?? invite.coach.email}</td>
								<td class="px-3 py-2 text-text-secondary">{invite.email}</td>
								<td class="px-3 py-2">{invite.name ?? '--'}</td>
								<td class="px-3 py-2 text-text-tertiary">{formatDate(invite.createdAt)}</td>
								<td class="px-3 py-2">
									{#if invite.acceptedAt}
										<span class="rounded bg-success-muted px-2 py-0.5 text-xs font-semibold text-success">Accepted</span>
									{:else if invite.cancelledAt}
										<span class="rounded bg-error-muted px-2 py-0.5 text-xs font-semibold text-error">Cancelled</span>
									{:else if new Date(invite.expiresAt) < new Date()}
										<span class="rounded bg-warning-muted px-2 py-0.5 text-xs font-semibold text-warning">Expired</span>
									{:else}
										<span class="rounded bg-accent-muted px-2 py-0.5 text-xs font-semibold text-accent">Pending</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="text-sm text-text-tertiary">No invitations.</p>
		{/if}
	</div>
</section>
