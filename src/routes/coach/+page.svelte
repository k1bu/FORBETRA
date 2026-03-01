<script lang="ts">
	import type { PageData } from './$types';
	import {
		Users,
		AlertTriangle,
		BarChart3,
		Target,
		ChevronRight,
		ClipboardList,
		Mail,
		TrendingUp,
		TrendingDown,
		Minus
	} from 'lucide-svelte';

	const { data }: { data: PageData } = $props();

	const greeting = $derived(() => {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 17) return 'Good afternoon';
		return 'Good evening';
	});

	const portfolioLine = $derived(() => {
		const { improving, declining, stable, total } = data.portfolioInsight;
		if (total === 0) return null;
		const parts: string[] = [];
		if (improving > 0) parts.push(`${improving} trending up`);
		if (stable > 0) parts.push(`${stable} stable`);
		if (declining > 0) parts.push(`${declining} needs attention`);
		return parts.join(', ');
	});
</script>

<svelte:head>
	<title>Coach Dashboard | Forbetra</title>
</svelte:head>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<section class="mx-auto flex max-w-7xl flex-col gap-6 p-4 pb-12">
	<!-- Greeting -->
	<header>
		<h1 class="text-3xl font-bold text-text-primary">
			{greeting()}, {data.coach.name.split(' ')[0]}
		</h1>
		{#if portfolioLine()}
			<p class="mt-1 text-text-secondary">
				{data.portfolioInsight.total} active client{data.portfolioInsight.total !== 1 ? 's' : ''} &mdash;
				{portfolioLine()}
			</p>
		{:else}
			<p class="mt-1 text-text-secondary">
				Monitor client progress, track insights, and guide your practice.
			</p>
		{/if}
	</header>

	<!-- Stat Cards -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-xl border border-border-default bg-surface-raised p-4">
			<div class="mb-1 flex items-center gap-1.5">
				<Users class="h-4 w-4 text-text-muted" />
				<p class="text-xs font-medium text-text-tertiary">Active Clients</p>
			</div>
			<p class="text-3xl font-bold text-text-primary tabular-nums">{data.rosterSummary.active}</p>
			{#if data.rosterSummary.pendingInvites > 0}
				<p class="mt-1 text-xs text-accent">
					{data.rosterSummary.pendingInvites} invite{data.rosterSummary.pendingInvites !== 1
						? 's'
						: ''} pending
				</p>
			{:else if data.rosterSummary.archived > 0}
				<p class="mt-1 text-xs text-text-muted">
					{data.rosterSummary.archived} archived
				</p>
			{/if}
		</div>
		<div class="rounded-xl border border-border-default bg-surface-raised p-4">
			<div class="mb-1 flex items-center gap-1.5">
				<AlertTriangle class="h-4 w-4 text-text-muted" />
				<p class="text-xs font-medium text-text-tertiary">Alerts</p>
			</div>
			<p class="text-3xl font-bold text-text-primary tabular-nums">{data.analytics.totalAlerts}</p>
			{#if data.analytics.highPriorityAlerts > 0}
				<p class="mt-1 text-xs font-semibold text-error">
					{data.analytics.highPriorityAlerts} high priority
				</p>
			{:else if data.analytics.totalAlerts === 0}
				<p class="mt-1 text-xs text-success">All clear</p>
			{/if}
		</div>
		<div class="rounded-xl border border-border-default bg-surface-raised p-4">
			<div class="mb-1 flex items-center gap-1.5">
				<BarChart3 class="h-4 w-4 text-text-muted" />
				<p class="text-xs font-medium text-text-tertiary">Avg. Stability</p>
			</div>
			<p class="text-3xl font-bold text-text-primary tabular-nums">
				{data.analytics.avgStability !== null ? `${data.analytics.avgStability}/100` : '\u2014'}
			</p>
		</div>
		<div class="rounded-xl border border-border-default bg-surface-raised p-4">
			<div class="mb-1 flex items-center gap-1.5">
				<Target class="h-4 w-4 text-text-muted" />
				<p class="text-xs font-medium text-text-tertiary">Avg. Alignment</p>
			</div>
			<p class="text-3xl font-bold text-text-primary tabular-nums">
				{data.analytics.avgAlignment !== null ? `${data.analytics.avgAlignment}%` : '\u2014'}
			</p>
		</div>
	</div>

	<!-- Clients Needing Attention -->
	{#if data.atRiskClients.length > 0}
		<section class="rounded-xl border border-border-default bg-surface-raised p-4">
			<div class="mb-3 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<AlertTriangle class="h-4 w-4 text-error" />
					<h2 class="text-sm font-semibold text-text-primary">Clients Needing Attention</h2>
				</div>
				<a
					href="/coach/roster"
					class="text-xs font-medium text-text-secondary hover:text-text-primary"
				>
					View roster
				</a>
			</div>
			<div class="divide-y divide-border-default">
				{#each data.atRiskClients as client (client.id)}
					<a
						href="/coach/session/{client.id}"
						class="group -mx-4 flex items-center gap-3 px-4 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-surface-subtle"
					>
						<span
							class="mt-0.5 h-2 w-2 shrink-0 rounded-full {client.topAlert.severity === 'high'
								? 'bg-error'
								: client.topAlert.severity === 'medium'
									? 'bg-warning'
									: 'bg-accent'}"
						></span>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<p class="text-sm font-medium text-text-primary group-hover:text-accent">
									{client.name}
								</p>
								{#if client.trajectory !== null}
									<span
										class="inline-flex items-center gap-0.5 text-xs {client.trajectory > 5
											? 'text-success'
											: client.trajectory < -5
												? 'text-error'
												: 'text-text-muted'}"
									>
										{#if client.trajectory > 5}
											<TrendingUp class="h-3 w-3" />
										{:else if client.trajectory < -5}
											<TrendingDown class="h-3 w-3" />
										{:else}
											<Minus class="h-3 w-3" />
										{/if}
									</span>
								{/if}
								{#if client.completionPct !== null}
									<span class="text-xs text-text-muted tabular-nums">{client.completionPct}%</span>
								{/if}
							</div>
							<p class="text-xs text-text-secondary">{client.topAlert.message}</p>
							{#if client.objective}
								<p class="mt-0.5 text-xs text-text-muted">{client.objective}</p>
							{/if}
						</div>
						<ChevronRight
							class="h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
						/>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Recent Alerts (without at-risk section overlap) -->
	{#if data.recentAlerts.length > 0 && data.atRiskClients.length === 0}
		<section class="rounded-xl border border-border-default bg-surface-raised p-4">
			<div class="mb-3 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<AlertTriangle class="h-4 w-4 text-text-muted" />
					<h2 class="text-sm font-semibold text-text-primary">Recent Alerts</h2>
				</div>
				<a
					href="/coach/analytics"
					class="text-xs font-medium text-text-secondary hover:text-text-primary"
				>
					View all
				</a>
			</div>
			<div class="divide-y divide-border-default">
				{#each data.recentAlerts as { clientName, clientId, alert } (clientId + alert.type)}
					<a
						href="/coach/session/{clientId}"
						class="group -mx-4 flex items-start gap-3 px-4 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-surface-subtle"
					>
						<span
							class="mt-1 h-2 w-2 shrink-0 rounded-full {alert.severity === 'high'
								? 'bg-error'
								: alert.severity === 'medium'
									? 'bg-warning'
									: 'bg-accent'}"
						></span>
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium text-text-primary group-hover:text-accent">
								{clientName}
							</p>
							<p class="text-xs text-text-secondary">{alert.message}</p>
						</div>
						<ChevronRight
							class="h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
						/>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Portfolio Snapshot -->
	{#if data.portfolioInsight.total > 0}
		<div class="grid gap-3 sm:grid-cols-3">
			<div
				class="flex items-center gap-3 rounded-xl border border-border-default bg-surface-raised px-4 py-3"
			>
				<TrendingUp class="h-4 w-4 shrink-0 text-success" />
				<div>
					<p class="text-lg font-bold text-text-primary tabular-nums">
						{data.portfolioInsight.improving}
					</p>
					<p class="text-xs text-text-tertiary">Improving</p>
				</div>
			</div>
			<div
				class="flex items-center gap-3 rounded-xl border border-border-default bg-surface-raised px-4 py-3"
			>
				<Minus class="h-4 w-4 shrink-0 text-text-muted" />
				<div>
					<p class="text-lg font-bold text-text-primary tabular-nums">
						{data.portfolioInsight.stable}
					</p>
					<p class="text-xs text-text-tertiary">Stable</p>
				</div>
			</div>
			<div
				class="flex items-center gap-3 rounded-xl border border-border-default bg-surface-raised px-4 py-3"
			>
				<TrendingDown class="h-4 w-4 shrink-0 text-error" />
				<div>
					<p class="text-lg font-bold text-text-primary tabular-nums">
						{data.portfolioInsight.declining}
					</p>
					<p class="text-xs text-text-tertiary">Declining</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Navigation Links -->
	<div class="flex flex-col gap-2">
		<a
			href="/coach/analytics"
			class="group flex items-center gap-3 rounded-xl border border-border-default bg-surface-raised px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-subtle"
		>
			<BarChart3 class="h-4 w-4 shrink-0 text-text-muted" />
			<div class="min-w-0 flex-1">
				<p class="text-sm font-medium text-text-primary">Analytics</p>
				<p class="truncate text-xs text-text-tertiary">
					Metrics, trends, and performance insights across all clients
				</p>
			</div>
			<ChevronRight
				class="h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
			/>
		</a>

		<a
			href="/coach/invitations"
			class="group flex items-center gap-3 rounded-xl border border-border-default bg-surface-raised px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-subtle"
		>
			<Mail class="h-4 w-4 shrink-0 text-text-muted" />
			<div class="min-w-0 flex-1">
				<p class="text-sm font-medium text-text-primary">
					Invitations{#if data.rosterSummary.pendingInvites > 0}
						<span class="text-accent">{data.rosterSummary.pendingInvites} pending</span>{/if}
				</p>
				<p class="truncate text-xs text-text-tertiary">
					Send invitations and manage active invites
				</p>
			</div>
			<ChevronRight
				class="h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
			/>
		</a>

		<a
			href="/coach/roster"
			class="group flex items-center gap-3 rounded-xl border border-border-default bg-surface-raised px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-subtle"
		>
			<ClipboardList class="h-4 w-4 shrink-0 text-text-muted" />
			<div class="min-w-0 flex-1">
				<p class="text-sm font-medium text-text-primary">Client Roster</p>
				<p class="truncate text-xs text-text-tertiary">
					Review active and archived clients, track progress
				</p>
			</div>
			<ChevronRight
				class="h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
			/>
		</a>
	</div>
</section>
