<script lang="ts">
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	let expandedOrg = $state<string | null>(null);

	const toggleOrg = (id: string) => {
		expandedOrg = expandedOrg === id ? null : id;
	};

	const roleBadge = (role: string) => {
		if (role === 'ORG_ADMIN') return 'bg-purple-100 text-purple-700';
		return 'bg-neutral-100 text-neutral-600';
	};
</script>

<section class="mx-auto flex max-w-5xl flex-col gap-6 p-6">
	<header class="space-y-2">
		<h1 class="text-2xl font-semibold">Organizations ({data.organizations.length})</h1>
		<p class="text-neutral-600">Create organizations, manage members, and configure domain-based auto-assignment.</p>
	</header>

	{#if form?.error}
		<div class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
	{:else if form?.success}
		<div class="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
			{form.message ?? 'Action completed successfully.'}
		</div>
	{/if}

	<!-- Create Organization -->
	<div class="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
		<h2 class="mb-3 text-sm font-semibold text-neutral-700 uppercase tracking-wide">New Organization</h2>
		<form method="post" action="?/createOrg" class="flex flex-wrap items-end gap-3">
			<div class="flex-1 min-w-[200px]">
				<label for="org-name" class="mb-1 block text-xs font-medium text-neutral-500">Name</label>
				<input
					id="org-name"
					type="text"
					name="name"
					required
					placeholder="Acme Corp"
					class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
				/>
			</div>
			<div class="flex-1 min-w-[200px]">
				<label for="org-domain" class="mb-1 block text-xs font-medium text-neutral-500">Email Domain (optional)</label>
				<input
					id="org-domain"
					type="text"
					name="domain"
					placeholder="acme.com"
					class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
				/>
			</div>
			<button
				type="submit"
				class="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
			>
				Create
			</button>
		</form>
		<p class="mt-2 text-xs text-neutral-400">
			If a domain is set, new users signing up with that email domain will automatically join this organization.
		</p>
	</div>

	<!-- Organizations List -->
	{#if data.organizations.length === 0}
		<div class="rounded-lg border-2 border-dashed border-neutral-200 p-8 text-center">
			<p class="text-sm text-neutral-500">No organizations yet. Create one above.</p>
		</div>
	{:else}
		<div class="flex flex-col gap-4">
			{#each data.organizations as org (org.id)}
				<div class="rounded-lg border border-neutral-200 bg-white shadow-sm overflow-hidden">
					<!-- Org Header -->
					<button
						type="button"
						onclick={() => toggleOrg(org.id)}
						class="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
					>
						<div>
							<h3 class="text-base font-semibold text-neutral-900">{org.name}</h3>
							<div class="mt-0.5 flex items-center gap-3 text-xs text-neutral-500">
								{#if org.domain}
									<span class="rounded bg-blue-50 px-2 py-0.5 font-medium text-blue-600">@{org.domain}</span>
								{/if}
								<span>{org.members.length} member{org.members.length !== 1 ? 's' : ''}</span>
								<span>Created {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(org.createdAt))}</span>
							</div>
						</div>
						<svg
							class="h-5 w-5 text-neutral-400 transition-transform {expandedOrg === org.id ? 'rotate-180' : ''}"
							fill="none" stroke="currentColor" viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{#if expandedOrg === org.id}
						<div class="border-t border-neutral-100 px-5 py-4">
							<!-- Add Member Form -->
							<form method="post" action="?/addMember" class="mb-4 flex flex-wrap items-end gap-3">
								<input type="hidden" name="orgId" value={org.id} />
								<div class="flex-1 min-w-[200px]">
									<label for="member-email-{org.id}" class="mb-1 block text-xs font-medium text-neutral-500">Add member by email</label>
									<input
										id="member-email-{org.id}"
										type="email"
										name="email"
										required
										placeholder="user@example.com"
										class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
									/>
								</div>
								<div>
									<label for="member-role-{org.id}" class="mb-1 block text-xs font-medium text-neutral-500">Role</label>
									<select
										id="member-role-{org.id}"
										name="role"
										class="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
									>
										<option value="MEMBER">Member</option>
										<option value="ORG_ADMIN">Org Admin</option>
									</select>
								</div>
								<button
									type="submit"
									class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
								>
									Add
								</button>
							</form>

							<!-- Members Table -->
							{#if org.members.length === 0}
								<p class="py-3 text-center text-xs text-neutral-400">No members yet.</p>
							{:else}
								<div class="overflow-hidden rounded-lg border border-neutral-200">
									<table class="min-w-full divide-y divide-neutral-200 text-sm">
										<thead class="bg-neutral-50 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase">
											<tr>
												<th class="px-4 py-2">Name</th>
												<th class="px-4 py-2">Email</th>
												<th class="px-4 py-2">App Role</th>
												<th class="px-4 py-2">Org Role</th>
												<th class="px-4 py-2">Actions</th>
											</tr>
										</thead>
										<tbody class="divide-y divide-neutral-100">
											{#each org.members as member (member.id)}
												<tr>
													<td class="px-4 py-2 font-medium text-neutral-900">{member.user.name ?? 'Unnamed'}</td>
													<td class="px-4 py-2 text-neutral-600">{member.user.email}</td>
													<td class="px-4 py-2">
														<span class="rounded bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600 uppercase">{member.user.role}</span>
													</td>
													<td class="px-4 py-2">
														<span class="rounded px-2 py-0.5 text-xs font-semibold uppercase {roleBadge(member.role)}">{member.role}</span>
													</td>
													<td class="px-4 py-2">
														<form method="post" action="?/removeMember">
															<input type="hidden" name="memberId" value={member.id} />
															<button
																type="submit"
																class="rounded border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
																onclick={(e) => {
																	if (!confirm(`Remove ${member.user.name || member.user.email} from ${org.name}?`)) {
																		e.preventDefault();
																	}
																}}
															>
																Remove
															</button>
														</form>
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</section>
