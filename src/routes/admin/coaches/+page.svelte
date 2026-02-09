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
		<h1 class="text-2xl font-bold text-neutral-900">Coach Assignments</h1>
		<p class="text-sm text-neutral-600">All coach-client relationships and pending invitations</p>
	</header>

	<!-- Active Relationships -->
	<div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">
			Coach-Client Relationships ({data.coachClients.length})
		</h2>
		{#if data.coachClients.length > 0}
			<div class="overflow-x-auto">
				<table class="min-w-full text-sm">
					<thead class="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
						<tr class="border-b border-neutral-200">
							<th class="px-3 py-2">Coach</th>
							<th class="px-3 py-2">Individual</th>
							<th class="px-3 py-2">Since</th>
							<th class="px-3 py-2">Status</th>
						</tr>
					</thead>
					<tbody>
						{#each data.coachClients as rel (rel.id)}
							<tr class="border-b border-neutral-100 hover:bg-neutral-50">
								<td class="px-3 py-2">
									<a href="/admin/users/{rel.coach.id}" class="font-medium text-blue-600 hover:underline">
										{rel.coach.name ?? rel.coach.email}
									</a>
								</td>
								<td class="px-3 py-2">
									<a href="/admin/users/{rel.individual.id}" class="font-medium text-blue-600 hover:underline">
										{rel.individual.name ?? rel.individual.email}
									</a>
								</td>
								<td class="px-3 py-2 text-neutral-500">{formatDate(rel.createdAt)}</td>
								<td class="px-3 py-2">
									{#if rel.archivedAt}
										<span class="rounded bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-500">Archived {formatDate(rel.archivedAt)}</span>
									{:else}
										<span class="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Active</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="text-sm text-neutral-500">No coach-client relationships exist.</p>
		{/if}
	</div>

	<!-- Pending Invites -->
	<div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
		<h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">
			Coach Invitations ({data.coachInvites.length})
		</h2>
		{#if data.coachInvites.length > 0}
			<div class="overflow-x-auto">
				<table class="min-w-full text-sm">
					<thead class="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
						<tr class="border-b border-neutral-200">
							<th class="px-3 py-2">Coach</th>
							<th class="px-3 py-2">Invitee Email</th>
							<th class="px-3 py-2">Name</th>
							<th class="px-3 py-2">Sent</th>
							<th class="px-3 py-2">Status</th>
						</tr>
					</thead>
					<tbody>
						{#each data.coachInvites as invite (invite.id)}
							<tr class="border-b border-neutral-100 hover:bg-neutral-50">
								<td class="px-3 py-2">{invite.coach.name ?? invite.coach.email}</td>
								<td class="px-3 py-2 text-neutral-600">{invite.email}</td>
								<td class="px-3 py-2">{invite.name ?? '--'}</td>
								<td class="px-3 py-2 text-neutral-500">{formatDate(invite.createdAt)}</td>
								<td class="px-3 py-2">
									{#if invite.acceptedAt}
										<span class="rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Accepted</span>
									{:else if invite.cancelledAt}
										<span class="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">Cancelled</span>
									{:else if new Date(invite.expiresAt) < new Date()}
										<span class="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Expired</span>
									{:else}
										<span class="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">Pending</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<p class="text-sm text-neutral-500">No invitations.</p>
		{/if}
	</div>
</section>
