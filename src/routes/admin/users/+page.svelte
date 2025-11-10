<script lang="ts">
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();
</script>

<section class="mx-auto flex max-w-5xl flex-col gap-6 p-4">
	<header class="space-y-2">
		<h1 class="text-2xl font-semibold">Role management</h1>
		<p class="text-neutral-600">Update application roles and keep Clerk public metadata in sync.</p>
	</header>

	{#if form?.error}
		<div class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
	{:else if form?.success}
		<div class="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
			{form.message ?? 'Action completed successfully.'}
		</div>
	{/if}

	<div class="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
		<table class="min-w-full divide-y divide-neutral-200 text-sm">
			<thead
				class="bg-neutral-50 text-left text-xs font-semibold tracking-wide text-neutral-500 uppercase"
			>
				<tr>
					<th class="px-4 py-3">Name</th>
					<th class="px-4 py-3">Email</th>
					<th class="px-4 py-3">Current role</th>
					<th class="px-4 py-3">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-neutral-200">
				{#each data.users as user (user.id)}
					<tr class="align-top">
						<td class="px-4 py-3">
							<p class="font-medium text-neutral-900">{user.name ?? 'Unnamed user'}</p>
							<p class="text-xs text-neutral-500">
								Created {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
									new Date(user.createdAt)
								)}
							</p>
						</td>
						<td class="px-4 py-3 text-neutral-700">{user.email}</td>
						<td class="px-4 py-3">
							<span
								class="rounded bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-600 uppercase"
							>
								{user.role}
							</span>
						</td>
						<td class="px-4 py-3">
							<form method="post" class="flex flex-wrap items-center gap-2">
								<input type="hidden" name="intent" value="update" />
								<input type="hidden" name="userId" value={user.id} />
								<label
									class="text-xs font-semibold text-neutral-500 uppercase"
									for={`role-${user.id}`}
								>
									Role
								</label>
								<select
									id={`role-${user.id}`}
									name="role"
									class="rounded border border-neutral-300 px-2 py-1 text-sm"
								>
									{#each data.roles as role (role)}
										<option value={role} selected={user.role === role}>{role}</option>
									{/each}
								</select>
								<button
									type="submit"
									class="rounded bg-black px-3 py-1 text-xs font-medium text-white uppercase"
								>
									Update
								</button>
							</form>
							<form method="post" class="mt-2">
								<input type="hidden" name="intent" value="delete" />
								<input type="hidden" name="userId" value={user.id} />
								<button
									type="submit"
									class="rounded border border-red-200 px-3 py-1 text-xs font-medium uppercase text-red-600 hover:bg-red-50"
									onclick={(event) => {
										if (
											!confirm(
												`Delete ${user.email}? This will remove their account and related access.`
											)
										) {
											event.preventDefault();
										}
									}}
								>
									Delete user
								</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
