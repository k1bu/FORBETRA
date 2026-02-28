<script lang="ts">
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	const formatDate = (value: string | Date | null) => {
		if (!value) return '--';
		return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
			new Date(value)
		);
	};

	const reflectionTypeLabels: Record<string, string> = {
		RATING_A: 'Effort check-in',
		RATING_B: 'Performance check-in'
	};

	const statCards = [
		{ label: 'Total Users', value: data.stats.totalUsers, color: 'bg-accent-muted border-border-default text-accent' },
		{ label: 'Individuals', value: data.stats.roleCounts['INDIVIDUAL'] ?? 0, color: 'bg-success-muted border-border-default text-success' },
		{ label: 'Coaches', value: data.stats.roleCounts['COACH'] ?? 0, color: 'bg-accent-muted border-border-default text-accent' },
		{ label: 'Admins', value: data.stats.roleCounts['ADMIN'] ?? 0, color: 'bg-warning-muted border-border-default text-warning' },
		{ label: 'Objectives', value: data.stats.objectiveCount, color: 'bg-accent-muted border-border-default text-accent' },
		{ label: 'Active Cycles', value: data.stats.activeCycleCount, color: 'bg-accent-muted border-border-default text-accent' },
		{ label: 'Reflections', value: data.stats.reflectionCount, color: 'bg-accent-muted border-border-default text-accent' },
		{ label: 'Feedback', value: data.stats.feedbackCount, color: 'bg-warning-muted border-border-default text-warning' },
		{ label: 'Stakeholders', value: data.stats.stakeholderCount, color: 'bg-accent-muted border-border-default text-accent' }
	];
</script>

<svelte:head>
	<title>Dashboard | Forbetra Admin</title>
</svelte:head>

<section class="mx-auto flex max-w-6xl flex-col gap-6 p-6">
	<header>
		<h1 class="text-2xl font-bold text-text-primary">Admin Dashboard</h1>
		<p class="text-sm text-text-secondary">Overview of all Forbetra platform data</p>
	</header>

	<!-- Stat Cards -->
	<div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
		{#each statCards as card (card.label)}
			<div class="rounded-xl border {card.color} p-4">
				<p class="text-xs font-semibold uppercase tracking-wide opacity-70">{card.label}</p>
				<p class="mt-1 text-2xl font-bold">{card.value}</p>
			</div>
		{/each}
	</div>

	<!-- Preview Link -->
	<a href="/admin/preview" class="flex items-center justify-between rounded-xl border border-border-default bg-accent-muted p-4 transition-all hover:border-accent/30">
		<div>
			<h2 class="text-sm font-bold text-accent">Preview Panel</h2>
			<p class="mt-0.5 text-xs text-text-secondary">Test every user flow through the lens of each role — Individual, Stakeholder, Coach</p>
		</div>
		<span class="text-text-tertiary">&rarr;</span>
	</a>

	<!-- Recent Activity -->
	<div class="grid gap-6 lg:grid-cols-3">
		<!-- Recent Users -->
		<div class="rounded-xl border border-border-default bg-surface-raised p-4">
			<h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-text-tertiary">Recent Users</h2>
			<ul class="space-y-2 text-sm">
				{#each data.recentActivity.users as user (user.id)}
					<li class="flex items-center gap-2 rounded-lg bg-surface-raised px-3 py-2">
						<div class="min-w-0 flex-1">
							<a href="/admin/users/{user.id}" class="block truncate font-medium text-text-primary hover:text-accent">
								{user.name ?? 'Unnamed'}
							</a>
							<p class="truncate text-xs text-text-tertiary">{user.email}</p>
						</div>
						<span class="shrink-0 rounded bg-surface-subtle px-2 py-0.5 text-xs font-semibold uppercase">{user.role}</span>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Recent Reflections -->
		<div class="rounded-xl border border-border-default bg-surface-raised p-4">
			<h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-text-tertiary">Recent Reflections</h2>
			<ul class="space-y-2 text-sm">
				{#each data.recentActivity.reflections as refl (refl.id)}
					<li class="rounded-lg bg-surface-raised px-3 py-2">
						<div class="flex items-center gap-2">
							<span class="min-w-0 flex-1 truncate font-medium text-text-primary">{refl.user?.name ?? 'Unknown'}</span>
							<span class="shrink-0 rounded bg-surface-subtle px-2 py-0.5 text-xs font-semibold">{reflectionTypeLabels[refl.reflectionType] ?? refl.reflectionType}</span>
						</div>
						<p class="text-xs text-text-tertiary">Week {refl.weekNumber} &middot; {formatDate(refl.submittedAt)}</p>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Recent Feedback -->
		<div class="rounded-xl border border-border-default bg-surface-raised p-4">
			<h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-text-tertiary">Recent Feedback</h2>
			<ul class="space-y-2 text-sm">
				{#each data.recentActivity.feedback as fb (fb.id)}
					<li class="rounded-lg bg-surface-raised px-3 py-2">
						<p class="font-medium text-text-primary">
							{fb.stakeholder?.name ?? 'Unknown'} &rarr; {fb.reflection?.user?.name ?? 'Unknown'}
						</p>
						<p class="text-xs text-text-tertiary">{formatDate(fb.submittedAt)}</p>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</section>
