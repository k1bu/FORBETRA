<script lang="ts">
	export let data: {
		coach: { name: string };
		rosterSummary: {
			total: number;
			active: number;
			archived: number;
			pendingInvites: number;
		};
		analytics: {
			totalAlerts: number;
			highPriorityAlerts: number;
			avgStability: number | null;
			avgAlignment: number | null;
		};
		recentAlerts: Array<{
			clientName: string;
			clientId: string;
			alert: { type: string; message: string; severity: 'low' | 'medium' | 'high' };
		}>;
	};
</script>

<section class="mx-auto flex max-w-7xl flex-col gap-8 p-4 pb-12">
	<!-- Hero Header -->
	<header class="relative overflow-hidden rounded-3xl border-2 border-neutral-200 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8 shadow-lg">
		<div class="absolute right-0 top-0 h-64 w-64 rounded-full bg-gradient-to-br from-blue-200/30 to-purple-200/30 blur-3xl"></div>
		<div class="relative">
			<div class="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-xs font-semibold text-blue-700 backdrop-blur-sm">
				<span class="h-2 w-2 animate-pulse rounded-full bg-blue-500"></span>
				Coach Hub
			</div>
			<h1 class="mb-2 text-4xl font-bold text-neutral-900">Welcome back, {data.coach.name}!</h1>
			<p class="text-lg text-neutral-700">
				Monitor client progress, track insights, and guide your practice at a glance.
			</p>
		</div>
	</header>

	<!-- Analytics Cards - Summary Metrics -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<a
			href="/coach/roster"
			class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
		>
			<div class="mb-3 flex items-center gap-2">
				<span class="text-2xl" role="img" aria-label="people">👥</span>
				<p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Active Clients</p>
			</div>
			<p class="text-4xl font-bold text-neutral-900">{data.rosterSummary.active}</p>
			{#if data.rosterSummary.total > data.rosterSummary.active}
				<p class="mt-2 text-xs text-neutral-600">
					{data.rosterSummary.archived} archived
				</p>
			{/if}
			<div class="mt-3 text-xs font-semibold text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100">
				View roster →
			</div>
		</a>
		<a
			href="/coach/analytics"
			class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-amber-50 to-amber-50/50 p-6 shadow-sm transition-all hover:border-amber-300 hover:shadow-md"
		>
			<div class="mb-3 flex items-center gap-2">
				<span class="text-2xl" role="img" aria-label="warning">⚠️</span>
				<p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Total Alerts</p>
			</div>
			<p class="text-4xl font-bold text-neutral-900">{data.analytics.totalAlerts}</p>
			{#if data.analytics.highPriorityAlerts > 0}
				<p class="mt-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
					{data.analytics.highPriorityAlerts} high priority
				</p>
			{:else if data.analytics.totalAlerts === 0}
				<p class="mt-2 text-xs text-emerald-600">All clear!</p>
			{/if}
			<div class="mt-3 text-xs font-semibold text-amber-700 opacity-0 transition-opacity group-hover:opacity-100">
				View analytics →
			</div>
		</a>
		<a
			href="/coach/analytics"
			class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
		>
			<div class="mb-3 flex items-center gap-2">
				<span class="text-2xl" role="img" aria-label="bar chart">📊</span>
				<p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Avg. Stability</p>
			</div>
			<p class="text-4xl font-bold text-neutral-900">
				{data.analytics.avgStability !== null ? `${data.analytics.avgStability}/100` : '—'}
			</p>
			{#if data.analytics.avgStability !== null && data.analytics.avgStability >= 75}
				<p class="mt-2 text-xs text-emerald-600">Excellent! ✨</p>
			{/if}
			<div class="mt-3 text-xs font-semibold text-blue-700 opacity-0 transition-opacity group-hover:opacity-100">
				View analytics →
			</div>
		</a>
		<a
			href="/coach/analytics"
			class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-blue-50 to-blue-50/50 p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
		>
			<div class="mb-3 flex items-center gap-2">
				<span class="text-2xl" role="img" aria-label="target">🎯</span>
				<p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Avg. Alignment</p>
			</div>
			<p class="text-4xl font-bold text-neutral-900">
				{data.analytics.avgAlignment !== null ? `${data.analytics.avgAlignment}%` : '—'}
			</p>
			{#if data.analytics.avgAlignment !== null && data.analytics.avgAlignment >= 80}
				<p class="mt-2 text-xs text-emerald-600">Strong alignment!</p>
			{/if}
			<div class="mt-3 text-xs font-semibold text-blue-700 opacity-0 transition-opacity group-hover:opacity-100">
				View analytics →
			</div>
		</a>
	</div>

	<!-- Recent Alerts Preview -->
	{#if data.recentAlerts.length > 0}
		<section class="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-50/30 p-6 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="text-2xl" role="img" aria-label="warning">⚠️</span>
					<h2 class="text-xl font-bold text-neutral-900">Recent Alerts</h2>
				</div>
				<a
					href="/coach/analytics"
					class="text-sm font-semibold text-red-700 hover:text-red-800 underline"
				>
					View all →
				</a>
			</div>
			<ul class="space-y-2">
				{#each data.recentAlerts as { clientName, clientId, alert } (clientId + alert.type)}
					<li
						class="flex items-start gap-3 rounded-lg bg-white/80 px-4 py-3 {alert.severity === 'high'
							? 'border-2 border-red-300'
							: alert.severity === 'medium'
							? 'border-2 border-amber-300'
							: 'border-2 border-blue-300'}"
					>
						<span
							class="mt-0.5 h-3 w-3 shrink-0 rounded-full {alert.severity === 'high'
								? 'bg-red-600'
								: alert.severity === 'medium'
								? 'bg-amber-500'
								: 'bg-blue-500'}"
						></span>
						<div class="flex-1">
							<p class="text-sm font-semibold text-neutral-900">{clientName}</p>
							<p class="text-xs text-neutral-700">{alert.message}</p>
						</div>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<!-- Navigation Cards -->
	<div class="grid gap-6 md:grid-cols-3">
		<a
			href="/coach/analytics"
			class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-white to-blue-50/30 p-8 shadow-sm transition-all hover:border-blue-300 hover:shadow-lg"
		>
			<div class="mb-4 flex items-center gap-3">
				<div class="rounded-xl bg-blue-100 p-3">
					<span class="text-2xl" role="img" aria-label="bar chart">📊</span>
				</div>
				<h2 class="text-xl font-bold text-neutral-900">Analytics</h2>
			</div>
			<p class="mb-4 text-sm text-neutral-600">
				View detailed metrics, trends, and performance insights across all your clients.
			</p>
			<div class="flex items-center gap-2 text-sm font-semibold text-blue-700 transition-transform group-hover:translate-x-1">
				View Analytics
				<span>→</span>
			</div>
		</a>

		<a
			href="/coach/invitations"
			class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-white to-slate-50/30 p-8 shadow-sm transition-all hover:border-slate-300 hover:shadow-lg"
		>
			<div class="mb-4 flex items-center gap-3">
				<div class="rounded-xl bg-slate-100 p-3">
					<span class="text-2xl" role="img" aria-label="envelope">✉️</span>
				</div>
				<h2 class="text-xl font-bold text-neutral-900">Invitations</h2>
			</div>
			<p class="mb-4 text-sm text-neutral-600">
				Send invitations to new clients and manage active invites. {#if data.rosterSummary.pendingInvites > 0}
					<span class="font-semibold text-blue-700"
						>{data.rosterSummary.pendingInvites} pending</span
					>.
				{/if}
			</p>
			<div class="flex items-center gap-2 text-sm font-semibold text-slate-700 transition-transform group-hover:translate-x-1">
				Manage Invitations
				<span>→</span>
			</div>
		</a>

		<a
			href="/coach/roster"
			class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-white to-emerald-50/30 p-8 shadow-sm transition-all hover:border-emerald-300 hover:shadow-lg"
		>
			<div class="mb-4 flex items-center gap-3">
				<div class="rounded-xl bg-emerald-100 p-3">
					<span class="text-2xl" role="img" aria-label="clipboard">📋</span>
				</div>
				<h2 class="text-xl font-bold text-neutral-900">Client Roster</h2>
			</div>
			<p class="mb-4 text-sm text-neutral-600">
				Review active and archived clients, track progress, and manage your practice roster.
			</p>
			<div class="flex items-center gap-2 text-sm font-semibold text-emerald-700 transition-transform group-hover:translate-x-1">
				View Roster
				<span>→</span>
			</div>
		</a>
	</div>
</section>
