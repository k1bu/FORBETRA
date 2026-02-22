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
			<h1 class="text-3xl font-bold text-text-primary">Stakeholders</h1>
			<p class="mt-1 text-text-secondary">Manage the people who provide feedback on your progress</p>
		</div>
		<a
			href="/individual"
			class="rounded-lg border border-border-strong bg-surface-raised px-4 py-2 text-sm font-semibold text-text-secondary transition-all hover:border-accent/30 hover:bg-accent-muted hover:text-accent"
		>
			← Back to Hub
		</a>
	</header>

	{#if form?.action === 'feedback'}
		{#if form.error}
			<div class="rounded-xl border border-error/20 bg-error-muted p-4 text-sm text-error">
				{form.error}
			</div>
		{:else if form.feedbackLink}
			<div class="rounded-xl border border-success/20 bg-success-muted p-4 text-sm text-success">
				<p class="mb-2 font-semibold">✅ Feedback link generated!</p>
				<p class="mb-2 font-mono break-all text-xs">{form.feedbackLink}</p>
				{#if form.expiresAt}
					<p class="text-xs text-success">Expires {formatDateTime(form.expiresAt)}.</p>
				{/if}
			</div>
		{/if}
	{/if}

	<div class="grid gap-6 lg:grid-cols-3">
		<!-- Stakeholders List -->
		<div class="lg:col-span-2 space-y-4">
			<h2 class="text-lg font-bold text-text-primary">Your Stakeholders</h2>
			{#if data.stakeholders.length}
				<div class="space-y-4">
					{#each data.stakeholders as stakeholder (stakeholder.id)}
						<div class="rounded-2xl border border-border-default bg-surface-raised p-6">
							<div class="mb-4">
								<p class="text-lg font-semibold text-text-primary">{stakeholder.name}</p>
								<p class="text-sm text-text-secondary">{stakeholder.email}</p>
								{#if stakeholder.relationship}
									<p class="mt-1 text-xs font-medium uppercase tracking-wide text-text-tertiary">
										{stakeholder.relationship}
									</p>
								{/if}
							</div>
							{#if stakeholder.lastFeedback}
								<div class="mb-4 rounded-lg border border-success/20 bg-success-muted p-3 text-xs">
									<p class="font-semibold text-success">Last feedback</p>
									<p class="text-success">
										{formatDateTime(stakeholder.lastFeedback.submittedAt)}
									</p>
									{#if stakeholder.lastFeedback.isCurrentWeek}
										<p class="mt-1 font-semibold text-success">✅ Responded this week</p>
									{/if}
								</div>
							{/if}
							<form method="post" action="?/generateFeedback" class="mt-3">
								<input type="hidden" name="stakeholderId" value={stakeholder.id} />
								<button
									type="submit"
									class="w-full rounded-lg border border-border-strong bg-surface-raised px-3 py-2 text-xs font-semibold text-text-secondary transition-all hover:border-accent/30 hover:bg-accent-muted hover:text-accent"
								>
									Generate Feedback Link
								</button>
							</form>
						</div>
					{/each}
				</div>
			{:else}
				<div class="rounded-2xl border border-border-default bg-surface-raised p-8 text-center">
					<p class="text-text-secondary">No stakeholders yet. Add one below to get started!</p>
				</div>
			{/if}
		</div>

		<!-- Add Stakeholder Form -->
		<div class="space-y-4">
			<h2 class="text-lg font-bold text-text-primary">Add a Stakeholder</h2>
			<div class="rounded-2xl border border-border-default bg-surface-raised p-6">
				<p class="mb-4 text-sm text-text-secondary">
					Invite 3–5 people who regularly observe your leadership.
				</p>
				{#if stakeholderError}
					<div class="mb-3 rounded-lg border border-error/20 bg-error-muted px-3 py-2 text-xs text-error">
						{stakeholderError}
					</div>
				{:else if stakeholderSuccess}
					<div class="mb-3 rounded-lg border border-success/20 bg-success-muted px-3 py-2 text-xs text-success">
						✅ Stakeholder added successfully!
					</div>
				{/if}
				<form method="post" action="?/addStakeholder" class="space-y-3">
					<input
						name="name"
						type="text"
						class="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
						placeholder="Name"
						value={stakeholderFormValues.name}
						required
					/>
					<input
						name="email"
						type="email"
						class="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
						placeholder="Email"
						value={stakeholderFormValues.email}
						required
					/>
					<input
						name="relationship"
						type="text"
						class="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
						placeholder="Relationship (optional)"
						value={stakeholderFormValues.relationship}
					/>
					<button
						type="submit"
						class="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-hover"
					>
						Add Stakeholder
					</button>
				</form>
			</div>
		</div>
	</div>
</section>
