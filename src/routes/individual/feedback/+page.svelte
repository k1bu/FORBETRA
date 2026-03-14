<script lang="ts">
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData | null } = $props();

	let showAddForm = $state(false);
	let addName = $state('');
	let addEmail = $state('');

	const formResult = form as Record<string, unknown> | null;
	const isStakeholderAction = formResult?.action === 'stakeholder';
	const isFeedbackAction = formResult?.action === 'feedback';

	function getRelativeDate(isoDate: string | null): string {
		if (!isoDate) return 'Never';
		const date = new Date(isoDate);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 14) return '1 week ago';
		return `${Math.floor(diffDays / 7)} weeks ago`;
	}

	function gapColor(gap: number | null): string {
		if (gap === null) return 'text-text-muted';
		const abs = Math.abs(gap);
		if (abs <= 0.5) return 'text-success';
		if (abs <= 1.5) return 'text-warning';
		return 'text-error';
	}

	function trendLabel(trend: string | null): string {
		if (trend === 'closing') return 'Closing';
		if (trend === 'widening') return 'Widening';
		if (trend === 'stable') return 'Stable';
		return '';
	}

	function trendColor(trend: string | null): string {
		if (trend === 'closing') return 'text-success';
		if (trend === 'widening') return 'text-error';
		if (trend === 'stable') return 'text-text-muted';
		return 'text-text-muted';
	}
</script>

<svelte:head>
	<title>Feedback | Forbetra</title>
</svelte:head>

<div class="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
	<div>
		<h1 class="text-2xl font-bold text-text-primary">Feedback</h1>
		<p class="mt-1 text-sm text-text-secondary">
			Manage your reviewers and see how your self-assessment compares to their ratings.
		</p>
	</div>

	<!-- Success/Error Messages -->
	{#if isStakeholderAction && formResult?.success}
		<div class="rounded-xl border border-success/30 bg-success-muted p-4 text-sm text-success">
			Reviewer added successfully. They'll receive a welcome email.
		</div>
	{/if}
	{#if isFeedbackAction && formResult?.success}
		<div class="rounded-xl border border-success/30 bg-success-muted p-4 text-sm text-success">
			Feedback request sent!{formResult?.smsSent ? ' (Email + SMS)' : ' (Email)'}
		</div>
	{/if}
	{#if formResult?.error}
		<div class="rounded-xl border border-error/30 bg-error-muted p-4 text-sm text-error">
			{formResult.error}
		</div>
	{/if}

	<!-- Section 1: Your Reviewers -->
	<section class="space-y-4">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold text-text-primary">Your Reviewers</h2>
			<button
				type="button"
				onclick={() => (showAddForm = !showAddForm)}
				class="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
			>
				{showAddForm ? 'Cancel' : 'Add Reviewer'}
			</button>
		</div>

		<!-- Add reviewer form -->
		{#if showAddForm}
			<form
				method="post"
				action="?/addStakeholder"
				class="rounded-xl border border-border-default bg-surface-raised p-5"
			>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-1">
						<label class="block text-sm font-medium text-text-secondary" for="add-name">Name</label>
						<input
							id="add-name"
							name="name"
							type="text"
							required
							placeholder="John Smith"
							class="w-full rounded-lg border border-border-default bg-surface-raised px-4 py-2.5 text-text-primary transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
							bind:value={addName}
						/>
					</div>
					<div class="space-y-1">
						<label class="block text-sm font-medium text-text-secondary" for="add-email"
							>Email</label
						>
						<input
							id="add-email"
							name="email"
							type="email"
							required
							placeholder="john@example.com"
							class="w-full rounded-lg border border-border-default bg-surface-raised px-4 py-2.5 text-text-primary transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
							bind:value={addEmail}
						/>
					</div>
				</div>
				<div class="mt-4 flex justify-end">
					<button
						type="submit"
						class="rounded-lg bg-accent px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
					>
						Add Reviewer
					</button>
				</div>
			</form>
		{/if}

		<!-- Reviewer list -->
		{#if data.reviewers.length === 0}
			<div class="rounded-xl border border-border-default bg-surface-raised p-8 text-center">
				<p class="text-text-secondary">No reviewers yet. Add someone to start getting feedback.</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each data.reviewers as reviewer (reviewer.id)}
					<div
						class="flex items-center justify-between rounded-xl border border-border-default bg-surface-raised p-4 transition-all hover:border-accent/30"
					>
						<div class="min-w-0 flex-1">
							<p class="font-medium text-text-primary">{reviewer.name}</p>
							<p class="text-sm text-text-muted">{reviewer.email}</p>
							<p class="mt-1 text-xs text-text-tertiary">
								Last feedback: {getRelativeDate(reviewer.lastFeedbackDate)}
							</p>
						</div>
						<form method="post" action="?/generateFeedback">
							<input type="hidden" name="stakeholderId" value={reviewer.id} />
							<button
								type="submit"
								class="shrink-0 rounded-lg border border-accent bg-accent-muted px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-white"
							>
								Request Feedback
							</button>
						</form>
					</div>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Section 2: Perception Gaps -->
	<section class="space-y-4">
		<div>
			<h2 class="text-lg font-semibold text-text-primary">Perception Gaps</h2>
			<p class="mt-1 text-sm text-text-secondary">
				How your self-scores compare to your reviewers' ratings{data.currentWeek
					? ` (Week ${data.currentWeek})`
					: ''}.
			</p>
		</div>

		{#if data.perceptionGaps.length === 0}
			<div class="rounded-xl border border-border-default bg-surface-raised p-8 text-center">
				<p class="text-text-secondary">
					Add reviewers and complete check-ins to see perception gaps.
				</p>
			</div>
		{:else if data.myEffort === null && data.myPerformance === null}
			<div class="rounded-xl border border-border-default bg-surface-raised p-8 text-center">
				<p class="text-text-secondary">Complete a check-in this week to see perception gaps.</p>
			</div>
		{:else}
			<div class="overflow-hidden rounded-xl border border-border-default">
				<table class="w-full text-left text-sm">
					<thead class="bg-surface-subtle text-text-secondary">
						<tr>
							<th class="px-4 py-3 font-medium">Reviewer</th>
							<th class="px-4 py-3 font-medium">Effort Gap</th>
							<th class="px-4 py-3 font-medium">Performance Gap</th>
							<th class="hidden px-4 py-3 font-medium sm:table-cell">Trend</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border-default bg-surface-raised">
						{#each data.perceptionGaps.sort((a, b) => b.maxAbsGap - a.maxAbsGap) as gap (gap.stakeholderId)}
							<tr>
								<td class="px-4 py-3 font-medium text-text-primary">{gap.stakeholderName}</td>
								<td class="px-4 py-3">
									{#if gap.effortGap !== null}
										<span class={gapColor(gap.effortGap)}>
											{gap.effortGap > 0 ? '+' : ''}{gap.effortGap}
										</span>
									{:else}
										<span class="text-text-muted">—</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									{#if gap.performanceGap !== null}
										<span class={gapColor(gap.performanceGap)}>
											{gap.performanceGap > 0 ? '+' : ''}{gap.performanceGap}
										</span>
									{:else}
										<span class="text-text-muted">—</span>
									{/if}
								</td>
								<td class="hidden px-4 py-3 sm:table-cell">
									{#if gap.effortGapTrend || gap.performanceGapTrend}
										<span class={trendColor(gap.effortGapTrend ?? gap.performanceGapTrend)}>
											{trendLabel(gap.effortGapTrend ?? gap.performanceGapTrend)}
										</span>
									{:else}
										<span class="text-text-muted">—</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div
				class="rounded-xl border border-accent/20 bg-accent-muted/50 p-4 text-sm text-text-secondary"
			>
				<p>
					<strong class="text-accent">Reading gaps:</strong> Positive means you rate yourself higher
					than your reviewer. Negative means they rate you higher. Gaps closer to 0 show alignment.
				</p>
			</div>
		{/if}
	</section>
</div>
