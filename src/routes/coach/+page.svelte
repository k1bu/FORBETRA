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
		Minus,
		Star,
		Lightbulb,
		PenLine
	} from 'lucide-svelte';
	import { coachAlertCount } from '$lib/stores/coachAlerts.svelte';

	const { data }: { data: PageData } = $props();

	// Populate the layout-wide alert badge
	coachAlertCount.value = data.analytics.totalAlerts;

	let showPortfolioBreakdown = $state(false);

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

	const momentumLine = $derived(() => {
		const m = data.portfolioMomentum;
		if (!m) return null;
		const parts: string[] = [];
		if (m.effortDelta !== null) {
			const sign = m.effortDelta > 0 ? '+' : '';
			parts.push(`effort ${sign}${m.effortDelta}`);
		}
		if (m.perfDelta !== null) {
			const sign = m.perfDelta > 0 ? '+' : '';
			parts.push(`performance ${sign}${m.perfDelta}`);
		}
		return parts.length > 0 ? `Week-over-week: ${parts.join(', ')}` : null;
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
			{#if momentumLine()}
				{@const m = data.portfolioMomentum}
				{@const isPositive = m && ((m.effortDelta ?? 0) > 0 || (m.perfDelta ?? 0) > 0)}
				<p class="mt-0.5 text-xs {isPositive ? 'text-success' : 'text-text-tertiary'}">
					{momentumLine()} (week-over-week avg){#if isPositive}
						— portfolio gaining momentum{/if}
				</p>
			{/if}
		{:else}
			<p class="mt-1 text-text-secondary">
				Monitor client progress, track insights, and guide your practice.
			</p>
		{/if}
	</header>

	<!-- Portfolio Health Bar -->
	{#if data.portfolioInsight.total > 0}
		{@const pct = data.portfolioInsight.improving / data.portfolioInsight.total}
		<div
			class="flex items-center gap-3 rounded-lg border border-border-default bg-surface-subtle px-3 py-2"
		>
			<div class="flex h-2 flex-1 gap-0.5 overflow-hidden rounded-full">
				{#if data.portfolioInsight.improving > 0}
					<div
						class="h-full rounded-l-full bg-success"
						style="width: {(data.portfolioInsight.improving / data.portfolioInsight.total) * 100}%"
					></div>
				{/if}
				{#if data.portfolioInsight.stable > 0}
					<div
						class="h-full bg-accent"
						style="width: {(data.portfolioInsight.stable / data.portfolioInsight.total) * 100}%"
					></div>
				{/if}
				{#if data.portfolioInsight.declining > 0}
					<div
						class="h-full rounded-r-full bg-error"
						style="width: {(data.portfolioInsight.declining / data.portfolioInsight.total) * 100}%"
					></div>
				{/if}
			</div>
			<button
				type="button"
				onclick={() => (showPortfolioBreakdown = !showPortfolioBreakdown)}
				class="shrink-0 text-[10px] text-text-muted transition-colors hover:text-text-secondary"
			>
				{Math.round(pct * 100)}% improving {showPortfolioBreakdown ? '▲' : '▼'}
			</button>
		</div>
		{#if showPortfolioBreakdown}
			<div class="mt-2 grid gap-2 sm:grid-cols-3">
				<div class="flex items-center gap-2 rounded-lg bg-surface-raised px-3 py-2">
					<TrendingUp class="h-3.5 w-3.5 shrink-0 text-success" />
					<span class="text-sm font-semibold text-text-primary tabular-nums"
						>{data.portfolioInsight.improving}</span
					>
					<span class="text-xs text-text-tertiary">Improving</span>
				</div>
				<div class="flex items-center gap-2 rounded-lg bg-surface-raised px-3 py-2">
					<Minus class="h-3.5 w-3.5 shrink-0 text-text-muted" />
					<span class="text-sm font-semibold text-text-primary tabular-nums"
						>{data.portfolioInsight.stable}</span
					>
					<span class="text-xs text-text-tertiary">Stable</span>
				</div>
				<div class="flex items-center gap-2 rounded-lg bg-surface-raised px-3 py-2">
					<TrendingDown class="h-3.5 w-3.5 shrink-0 text-error" />
					<span class="text-sm font-semibold text-text-primary tabular-nums"
						>{data.portfolioInsight.declining}</span
					>
					<span class="text-xs text-text-tertiary">Declining</span>
				</div>
			</div>
		{/if}
	{/if}

	<!-- Stat Cards -->
	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		<a
			href="/coach/roster"
			class="rounded-xl border border-border-default bg-surface-raised p-4 transition-colors hover:border-accent/30"
		>
			<div class="mb-1 flex items-center gap-1.5">
				<Users class="h-4 w-4 text-accent" />
				<p class="text-xs font-medium text-text-tertiary">Active Clients</p>
			</div>
			<p class="text-2xl font-bold text-text-primary tabular-nums">{data.rosterSummary.active}</p>
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
		</a>
		<a
			href="/coach/analytics"
			class="rounded-xl border border-border-default bg-surface-raised p-4 transition-colors hover:border-accent/30"
		>
			<div class="mb-1 flex items-center gap-1.5">
				<AlertTriangle
					class="h-4 w-4 {data.analytics.highPriorityAlerts > 0
						? 'text-error'
						: data.analytics.totalAlerts > 0
							? 'text-warning'
							: 'text-success'}"
				/>
				<p class="text-xs font-medium text-text-tertiary">Alerts</p>
			</div>
			<p class="text-2xl font-bold text-text-primary tabular-nums">{data.analytics.totalAlerts}</p>
			{#if data.analytics.highPriorityAlerts > 0}
				<p class="mt-1 text-xs font-semibold text-error">
					{data.analytics.highPriorityAlerts} high priority
				</p>
			{:else if data.analytics.totalAlerts === 0}
				<p class="mt-1 text-xs text-success">All clear</p>
			{/if}
		</a>
		<div class="rounded-xl border border-border-default bg-surface-raised p-4">
			<div class="mb-1 flex items-center gap-1.5">
				<BarChart3 class="h-4 w-4 text-cyan-400" />
				<p class="text-xs font-medium text-text-tertiary">Avg. Stability</p>
			</div>
			<p class="text-2xl font-bold text-text-primary tabular-nums">
				{data.analytics.avgStability !== null ? `${data.analytics.avgStability}/100` : '\u2014'}
			</p>
			<p class="mt-1 text-[10px] text-text-muted">Week-to-week score consistency</p>
		</div>
		<div class="rounded-xl border border-border-default bg-surface-raised p-4">
			<div class="mb-1 flex items-center gap-1.5">
				<Target class="h-4 w-4 text-amber-400" />
				<p class="text-xs font-medium text-text-tertiary">Avg. Alignment</p>
			</div>
			<p class="text-2xl font-bold text-text-primary tabular-nums">
				{data.analytics.avgAlignment !== null ? `${data.analytics.avgAlignment}%` : '\u2014'}
			</p>
			<p class="mt-1 text-[10px] text-text-muted">Stakeholder response rate</p>
		</div>
	</div>

	<!-- Quick Actions -->
	{#if data.rosterSummary.active > 0}
		<div class="flex gap-2 overflow-x-auto">
			<a
				href="/coach/roster"
				class="flex items-center gap-1.5 rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/30 hover:text-accent"
			>
				<Users class="h-3 w-3" /> Roster
			</a>
			<a
				href="/coach/analytics"
				class="flex items-center gap-1.5 rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/30 hover:text-accent"
			>
				<BarChart3 class="h-3 w-3" /> Analytics
			</a>
			<a
				href="/coach/invitations"
				class="flex items-center gap-1.5 rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent/30 hover:text-accent"
			>
				<Mail class="h-3 w-3" /> Invite Client
			</a>
		</div>
	{/if}

	<!-- First-Visit Guidance -->
	{#if data.rosterSummary.active === 0}
		<section class="rounded-xl border border-border-default bg-surface-raised p-5">
			<h2 class="text-sm font-semibold text-text-primary">Get started</h2>
			{#if data.rosterSummary.pendingInvites > 0}
				<p class="mt-1 text-sm text-text-secondary">
					Your invite is on its way. Once your client accepts, their progress will appear here
					automatically.
				</p>
			{:else}
				<p class="mt-1 text-sm text-text-secondary">
					Invite your first client to start tracking their development journey.
				</p>
			{/if}
			<div class="mt-3 flex flex-wrap gap-2">
				<a
					href="/coach/invitations"
					class="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent/90"
				>
					{data.rosterSummary.pendingInvites > 0 ? 'Invite another client' : 'Invite a client'}
				</a>
				<a
					href="/coach/roster"
					class="rounded-lg border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-subtle"
				>
					Explore roster
				</a>
			</div>
		</section>
	{/if}

	<!-- Coach Activity -->
	{#if data.coachActivity.noteCount > 0}
		{@const n = data.coachActivity.noteCount}
		<div
			class="flex items-center gap-2 rounded-lg border border-border-default bg-surface-subtle px-3 py-2"
		>
			<PenLine class="h-3.5 w-3.5 shrink-0 text-text-muted" />
			<p class="text-xs text-text-muted">
				{#if n >= 50}
					Coach milestone: {n} notes across your portfolio. You're building a deep coaching record.
				{:else if n >= 25}
					{n} coaching notes and counting. Your observations are shaping outcomes.
				{:else if n >= 10}
					{n} coaching notes written. You're building momentum with your clients.
				{:else if n >= 5}
					{n} notes captured. Each one shapes your clients' next AI prompt.
				{:else}
					Your coaching footprint: {n} note{n !== 1 ? 's' : ''} written
				{/if}
			</p>
		</div>
	{/if}

	<!-- Coaching Moments -->
	{#if data.coachingMoments.length > 0}
		<section
			class="rounded-xl border border-accent/20 bg-gradient-to-b from-accent-muted/30 to-surface-raised p-4"
		>
			<div class="mb-3 flex items-center gap-2">
				<Lightbulb class="h-4 w-4 text-accent" />
				<h2 class="text-sm font-semibold text-text-primary">Coaching Moments</h2>
			</div>
			<div class="divide-y divide-border-default">
				{#each data.coachingMoments as moment (moment.clientId)}
					<a
						href="/coach/session/{moment.clientId}"
						class="group -mx-4 flex items-start gap-3 px-4 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-surface-subtle"
					>
						<span class="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-accent"></span>
						<div class="min-w-0 flex-1">
							<p class="text-sm text-text-primary">{moment.message}</p>
							<p class="mt-0.5 text-xs font-medium text-accent">{moment.action}</p>
						</div>
						<ChevronRight
							class="h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
						/>
					</a>
				{/each}
			</div>
		</section>
	{/if}

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

	<!-- Portfolio Wins -->
	{#if data.portfolioWins.length > 0}
		<section class="rounded-xl border border-border-default bg-surface-raised p-4">
			<div class="mb-3 flex items-center gap-2">
				<Star class="h-4 w-4 text-warning" />
				<h2 class="text-sm font-semibold text-text-primary">Portfolio Wins</h2>
			</div>
			<div class="divide-y divide-border-default">
				{#each data.portfolioWins as win (win.clientId)}
					<a
						href="/coach/session/{win.clientId}"
						class="group -mx-4 flex items-center gap-3 px-4 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-surface-subtle"
					>
						<span class="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-success"></span>
						<div class="min-w-0 flex-1">
							<p class="text-sm font-medium text-text-primary group-hover:text-accent">
								{win.clientName}
							</p>
							<p class="text-xs text-text-secondary">{win.message}</p>
						</div>
						<ChevronRight
							class="h-4 w-4 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
						/>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Navigation Links -->
	<div class="flex flex-col gap-2">
		<a
			href="/coach/analytics"
			class="group flex items-center gap-3 rounded-xl border border-border-default bg-surface-raised px-4 py-3 transition-colors hover:border-border-strong hover:bg-surface-subtle"
		>
			<BarChart3 class="h-4 w-4 shrink-0 text-cyan-400" />
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
			<Mail class="h-4 w-4 shrink-0 text-accent" />
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
			<ClipboardList class="h-4 w-4 shrink-0 text-amber-400" />
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
