<script lang="ts">
	import type { PageData } from './$types';
	import { Users, AlertTriangle, BarChart3, Target, ChevronRight, ClipboardList, Mail } from 'lucide-svelte';

	const { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Coach Hub | Forbetra</title>
</svelte:head>

<section class="mx-auto flex max-w-7xl flex-col gap-6 p-4 pb-12">
	<!-- Page Header -->
	<header>
		<h1 class="text-3xl font-bold text-text-primary">Coach Hub</h1>
		<p class="mt-1 text-text-secondary">
			Monitor client progress, track insights, and guide your practice.
		</p>
	</header>

	<!-- Stat Cards -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-lg border border-border-default bg-surface-raised p-4">
			<div class="mb-1 flex items-center gap-1.5">
				<Users class="h-4 w-4 text-text-muted" />
				<p class="text-xs font-medium text-text-tertiary">Active Clients</p>
			</div>
			<p class="text-3xl font-bold tabular-nums text-text-primary">{data.rosterSummary.active}</p>
			{#if data.rosterSummary.total > data.rosterSummary.active}
				<p class="mt-1 text-xs text-text-muted">
					{data.rosterSummary.archived} archived
				</p>
			{/if}
		</div>
		<div class="rounded-lg border border-border-default bg-surface-raised p-4">
			<div class="mb-1 flex items-center gap-1.5">
				<AlertTriangle class="h-4 w-4 text-text-muted" />
				<p class="text-xs font-medium text-text-tertiary">Total Alerts</p>
			</div>
			<p class="text-3xl font-bold tabular-nums text-text-primary">{data.analytics.totalAlerts}</p>
			{#if data.analytics.highPriorityAlerts > 0}
				<p class="mt-1 text-xs font-semibold text-error">
					{data.analytics.highPriorityAlerts} high priority
				</p>
			{:else if data.analytics.totalAlerts === 0}
				<p class="mt-1 text-xs text-success">All clear</p>
			{/if}
		</div>
		<div class="rounded-lg border border-border-default bg-surface-raised p-4">
			<div class="mb-1 flex items-center gap-1.5">
				<BarChart3 class="h-4 w-4 text-text-muted" />
				<p class="text-xs font-medium text-text-tertiary">Avg. Stability</p>
			</div>
			<p class="text-3xl font-bold tabular-nums text-text-primary">
				{data.analytics.avgStability !== null ? `${data.analytics.avgStability}/100` : '—'}
			</p>
		</div>
		<div class="rounded-lg border border-border-default bg-surface-raised p-4">
			<div class="mb-1 flex items-center gap-1.5">
				<Target class="h-4 w-4 text-text-muted" />
				<p class="text-xs font-medium text-text-tertiary">Avg. Alignment</p>
			</div>
			<p class="text-3xl font-bold tabular-nums text-text-primary">
				{data.analytics.avgAlignment !== null ? `${data.analytics.avgAlignment}%` : '—'}
			</p>
		</div>
	</div>

	<!-- Recent Alerts -->
	{#if data.recentAlerts.length > 0}
		<section class="rounded-lg border border-border-default bg-surface-raised p-4">
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
					<div class="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
						<span
							class="mt-1 h-2 w-2 shrink-0 rounded-full {alert.severity === 'high'
								? 'bg-error'
								: alert.severity === 'medium'
								? 'bg-warning'
								: 'bg-accent'}"
						></span>
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium text-text-primary">{clientName}</p>
							<p class="text-xs text-text-secondary">{alert.message}</p>
						</div>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Navigation Links -->
	<div class="flex flex-col gap-2">
		<a href="/coach/analytics" class="group flex items-center gap-3 rounded-lg border border-border-default bg-surface-raised px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-subtle">
			<BarChart3 class="h-4 w-4 shrink-0 text-text-muted" />
			<div class="min-w-0 flex-1">
				<p class="text-sm font-medium text-text-primary">Analytics</p>
				<p class="truncate text-xs text-text-tertiary">Metrics, trends, and performance insights across all clients</p>
			</div>
			<ChevronRight class="h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
		</a>

		<a href="/coach/invitations" class="group flex items-center gap-3 rounded-lg border border-border-default bg-surface-raised px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-subtle">
			<Mail class="h-4 w-4 shrink-0 text-text-muted" />
			<div class="min-w-0 flex-1">
				<p class="text-sm font-medium text-text-primary">Invitations{#if data.rosterSummary.pendingInvites > 0} <span class="text-accent">{data.rosterSummary.pendingInvites} pending</span>{/if}</p>
				<p class="truncate text-xs text-text-tertiary">Send invitations and manage active invites</p>
			</div>
			<ChevronRight class="h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
		</a>

		<a href="/coach/roster" class="group flex items-center gap-3 rounded-lg border border-border-default bg-surface-raised px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-subtle">
			<ClipboardList class="h-4 w-4 shrink-0 text-text-muted" />
			<div class="min-w-0 flex-1">
				<p class="text-sm font-medium text-text-primary">Client Roster</p>
				<p class="truncate text-xs text-text-tertiary">Review active and archived clients, track progress</p>
			</div>
			<ChevronRight class="h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
		</a>
	</div>
</section>
