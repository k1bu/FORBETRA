<script lang="ts">
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	const formatDate = (value: string | Date | null) => {
		if (!value) return '--';
		return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
			new Date(value)
		);
	};

	const statCards = [
		{ label: 'Total Users', value: data.stats.totalUsers, color: 'bg-blue-50 border-blue-200 text-blue-700' },
		{ label: 'Individuals', value: data.stats.roleCounts['INDIVIDUAL'] ?? 0, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
		{ label: 'Coaches', value: data.stats.roleCounts['COACH'] ?? 0, color: 'bg-purple-50 border-purple-200 text-purple-700' },
		{ label: 'Admins', value: data.stats.roleCounts['ADMIN'] ?? 0, color: 'bg-amber-50 border-amber-200 text-amber-700' },
		{ label: 'Objectives', value: data.stats.objectiveCount, color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
		{ label: 'Active Cycles', value: data.stats.activeCycleCount, color: 'bg-pink-50 border-pink-200 text-pink-700' },
		{ label: 'Reflections', value: data.stats.reflectionCount, color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
		{ label: 'Feedback', value: data.stats.feedbackCount, color: 'bg-orange-50 border-orange-200 text-orange-700' },
		{ label: 'Stakeholders', value: data.stats.stakeholderCount, color: 'bg-teal-50 border-teal-200 text-teal-700' }
	];
</script>

<section class="mx-auto flex max-w-6xl flex-col gap-6 p-6">
	<header>
		<h1 class="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
		<p class="text-sm text-neutral-600">Overview of all Forbetra platform data</p>
	</header>

	<!-- Stat Cards -->
	<div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
		{#each statCards as card (card.label)}
			<div class="rounded-xl border-2 {card.color} p-4">
				<p class="text-xs font-semibold uppercase tracking-wide opacity-70">{card.label}</p>
				<p class="mt-1 text-2xl font-bold">{card.value}</p>
			</div>
		{/each}
	</div>

	<!-- Preview User Flows -->
	<div class="rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
		<h2 class="mb-2 text-sm font-bold uppercase tracking-wide text-blue-600">Preview User Flows</h2>
		<p class="mb-3 text-xs text-neutral-600">Open user-facing pages in a new window. Use the Users page to preview as a specific user.</p>
		<div class="flex flex-wrap gap-2">
			<a href="/onboarding?preview=true" target="_blank" rel="noopener"
				class="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50">
				Onboarding Flow
			</a>
			<a href="/onboarding/initial-ratings?preview=true" target="_blank" rel="noopener"
				class="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50">
				Initial Ratings
			</a>
			<a href="/reflections/checkin?preview=true" target="_blank" rel="noopener"
				class="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50">
				Check-in / Ratings
			</a>
			<a href="/prompts/monday?preview=true" target="_blank" rel="noopener"
				class="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50">
				Monday Intention
			</a>
			<a href="/individual" target="_blank" rel="noopener"
				class="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50">
				Individual Hub
			</a>
		</div>
	</div>

	<!-- Recent Activity -->
	<div class="grid gap-6 lg:grid-cols-3">
		<!-- Recent Users -->
		<div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
			<h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">Recent Users</h2>
			<ul class="space-y-2 text-sm">
				{#each data.recentActivity.users as user (user.id)}
					<li class="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
						<div>
							<a href="/admin/users/{user.id}" class="font-medium text-neutral-900 hover:text-blue-700">
								{user.name ?? 'Unnamed'}
							</a>
							<p class="text-xs text-neutral-500">{user.email}</p>
						</div>
						<span class="rounded bg-neutral-200 px-2 py-0.5 text-xs font-semibold uppercase">{user.role}</span>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Recent Reflections -->
		<div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
			<h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">Recent Reflections</h2>
			<ul class="space-y-2 text-sm">
				{#each data.recentActivity.reflections as refl (refl.id)}
					<li class="rounded-lg bg-neutral-50 px-3 py-2">
						<div class="flex items-center justify-between">
							<span class="font-medium text-neutral-900">{refl.user?.name ?? 'Unknown'}</span>
							<span class="rounded bg-neutral-200 px-2 py-0.5 text-xs font-semibold">{refl.reflectionType}</span>
						</div>
						<p class="text-xs text-neutral-500">Week {refl.weekNumber} &middot; {formatDate(refl.submittedAt)}</p>
					</li>
				{/each}
			</ul>
		</div>

		<!-- Recent Feedback -->
		<div class="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
			<h2 class="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">Recent Feedback</h2>
			<ul class="space-y-2 text-sm">
				{#each data.recentActivity.feedback as fb (fb.id)}
					<li class="rounded-lg bg-neutral-50 px-3 py-2">
						<p class="font-medium text-neutral-900">
							{fb.stakeholder?.name ?? 'Unknown'} &rarr; {fb.reflection?.user?.name ?? 'Unknown'}
						</p>
						<p class="text-xs text-neutral-500">{formatDate(fb.submittedAt)}</p>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</section>
