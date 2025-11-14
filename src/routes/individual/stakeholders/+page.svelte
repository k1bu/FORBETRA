<script lang="ts">
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	const stakeholderFormValues =
		form?.action === 'stakeholder' && form?.values
			? {
					name: form.values.name ?? '',
					email: form.values.email ?? '',
					relationship: form.values.relationship ?? ''
				}
			: { name: '', email: '', relationship: '' };

	const stakeholderError =
		form?.action === 'stakeholder' && form?.error ? form.error : null;
	const stakeholderSuccess = form?.action === 'stakeholder' && form?.success ? true : false;

	const formatDateTime = (value: string | null) => {
		if (!value) return '—';
		return new Intl.DateTimeFormat('en-US', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	};
</script>

<section class="mx-auto flex max-w-6xl flex-col gap-8 p-4 pb-12">
	<!-- Header -->
	<header class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-neutral-900">Stakeholders</h1>
			<p class="mt-1 text-neutral-600">Manage the people who provide feedback on your progress</p>
		</div>
		<a
			href="/individual"
			class="rounded-lg border-2 border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
		>
			← Back to Hub
		</a>
	</header>

	{#if form?.action === 'feedback'}
		{#if form.error}
			<div class="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-sm text-red-700">
				{form.error}
			</div>
		{:else if form.feedbackLink}
			<div class="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 text-sm text-emerald-700">
				<p class="mb-2 font-semibold">✅ Feedback link generated!</p>
				<p class="mb-2 font-mono break-all text-xs">{form.feedbackLink}</p>
				{#if form.expiresAt}
					<p class="text-xs text-emerald-600">Expires {formatDateTime(form.expiresAt)}.</p>
				{/if}
			</div>
		{/if}
	{/if}

	<div class="grid gap-6 lg:grid-cols-3">
		<!-- Stakeholders List -->
		<div class="lg:col-span-2 space-y-4">
			<h2 class="text-lg font-bold text-neutral-900">Your Stakeholders</h2>
			{#if data.stakeholders.length}
				<div class="space-y-4">
					{#each data.stakeholders as stakeholder (stakeholder.id)}
						<div class="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm">
							<div class="mb-4">
								<p class="text-lg font-semibold text-neutral-900">{stakeholder.name}</p>
								<p class="text-sm text-neutral-600">{stakeholder.email}</p>
								{#if stakeholder.relationship}
									<p class="mt-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
										{stakeholder.relationship}
									</p>
								{/if}
							</div>
							{#if stakeholder.lastFeedback}
								<div class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs">
									<p class="font-semibold text-emerald-900">Last feedback</p>
									<p class="text-emerald-700">
										{formatDateTime(stakeholder.lastFeedback.submittedAt)}
									</p>
									{#if stakeholder.lastFeedback.isCurrentWeek}
										<p class="mt-1 font-semibold text-emerald-700">✅ Responded this week</p>
									{/if}
								</div>
							{/if}
							<form method="post" action="?/generateFeedback" class="mt-3">
								<input type="hidden" name="stakeholderId" value={stakeholder.id} />
								<button
									type="submit"
									class="w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
								>
									Generate Feedback Link
								</button>
							</form>
						</div>
					{/each}
				</div>
			{:else}
				<div class="rounded-2xl border-2 border-neutral-200 bg-neutral-50 p-8 text-center">
					<p class="text-neutral-600">No stakeholders yet. Add one below to get started!</p>
				</div>
			{/if}
		</div>

		<!-- Add Stakeholder Form -->
		<div class="space-y-4">
			<h2 class="text-lg font-bold text-neutral-900">Add a Stakeholder</h2>
			<div class="rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow-sm">
				<p class="mb-4 text-sm text-neutral-600">
					Invite 3–5 people who regularly observe your leadership.
				</p>
				{#if stakeholderError}
					<div class="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
						{stakeholderError}
					</div>
				{:else if stakeholderSuccess}
					<div class="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
						✅ Stakeholder added successfully!
					</div>
				{/if}
				<form method="post" action="?/addStakeholder" class="space-y-3">
					<input
						name="name"
						type="text"
						class="w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
						placeholder="Name"
						value={stakeholderFormValues.name}
						required
					/>
					<input
						name="email"
						type="email"
						class="w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
						placeholder="Email"
						value={stakeholderFormValues.email}
						required
					/>
					<input
						name="relationship"
						type="text"
						class="w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
						placeholder="Relationship (optional)"
						value={stakeholderFormValues.relationship}
					/>
					<button
						type="submit"
						class="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-lg"
					>
						Add Stakeholder
					</button>
				</form>
			</div>
		</div>
	</div>
</section>

