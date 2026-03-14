<script lang="ts">
	import type { PageData } from './$types';
	import { AlertTriangle, ChevronRight, Mail } from 'lucide-svelte';
	import { coachAlertCount } from '$lib/stores/coachAlerts.svelte';

	const { data }: { data: PageData } = $props();

	coachAlertCount.value = data.analytics.totalAlerts;

	const greeting = $derived.by(() => {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 17) return 'Good afternoon';
		return 'Good evening';
	});
</script>

<svelte:head>
	<title>Coach Dashboard | Forbetra</title>
</svelte:head>

<section class="mx-auto flex max-w-3xl flex-col gap-5 p-4 pb-12">
	<!-- Header -->
	<div>
		<p class="text-sm text-text-tertiary">{greeting}</p>
		<h1 class="text-xl font-bold text-text-primary">{data.coach.name}</h1>
		<p class="text-sm text-text-muted">
			{data.rosterSummary.active} active client{data.rosterSummary.active !== 1 ? 's' : ''}
			{#if data.rosterSummary.pendingInvites > 0}
				· {data.rosterSummary.pendingInvites} pending invite{data.rosterSummary.pendingInvites !== 1
					? 's'
					: ''}
			{/if}
		</p>
	</div>

	<!-- Alert Banner -->
	{#if data.atRiskClients.length > 0}
		{@const topClient = data.atRiskClients[0]}
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			href="/coach/session/{topClient.id}"
			class="group flex items-center gap-3 rounded-xl border border-warning/30 bg-gradient-to-r from-warning/10 to-transparent p-4 transition-all hover:border-warning/50"
		>
			<AlertTriangle class="h-5 w-5 shrink-0 text-warning" />
			<div class="min-w-0 flex-1">
				<p class="text-sm font-semibold text-text-primary">{topClient.name} needs attention</p>
				{#if topClient.topAlert}
					<p class="text-xs text-text-secondary">{topClient.topAlert.message}</p>
				{/if}
			</div>
			<ChevronRight
				class="h-4 w-4 shrink-0 text-warning transition-transform group-hover:translate-x-0.5"
			/>
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{/if}

	<!-- Client List -->
	<div class="space-y-3">
		<h2 class="text-sm font-semibold text-text-secondary">Your Clients</h2>
		{#if data.atRiskClients.length === 0 && data.rosterSummary.active === 0}
			<div class="rounded-xl border border-border-default bg-surface-raised p-8 text-center">
				<p class="text-text-secondary">No clients yet. Invite your first client to get started.</p>
			</div>
		{:else}
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			{#each data.atRiskClients as client (client.id)}
				<a
					href="/coach/session/{client.id}"
					class="group flex items-center justify-between rounded-xl border border-border-default bg-surface-raised p-4 transition-all hover:border-accent/30"
				>
					<div class="min-w-0 flex-1">
						<p class="font-medium text-text-primary">{client.name}</p>
						{#if client.objective}
							<p class="text-sm text-text-muted">{client.objective}</p>
						{/if}
					</div>
					<div class="flex items-center gap-3">
						{#if client.trajectory !== null}
							<span
								class="text-xs tabular-nums {client.trajectory > 0
									? 'text-success'
									: client.trajectory < 0
										? 'text-error'
										: 'text-text-muted'}"
							>
								{client.trajectory > 0 ? '↑' : client.trajectory < 0 ? '↓' : '→'}
							</span>
						{/if}
						{#if client.completionPct !== null}
							<span class="text-xs text-text-muted tabular-nums">{client.completionPct}%</span>
						{/if}
						<ChevronRight
							class="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5"
						/>
					</div>
				</a>
			{/each}
			<!-- eslint-enable svelte/no-navigation-without-resolve -->

			{#if data.rosterSummary.active > data.atRiskClients.length}
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					href="/coach/roster"
					class="flex items-center justify-center gap-1 rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-sm font-medium text-accent transition-all hover:border-accent/30 hover:bg-accent-muted"
				>
					View all {data.rosterSummary.active} clients
					<ChevronRight class="h-4 w-4" />
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{/if}
		{/if}
	</div>

	<!-- Invite CTA -->
	{#if data.rosterSummary.active < 3}
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			href="/coach/invitations"
			class="group flex items-center gap-3 rounded-xl border border-accent/30 bg-accent-muted p-5 transition-all hover:border-accent/50"
		>
			<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15">
				<Mail class="h-5 w-5 text-accent" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="font-semibold text-text-primary">Invite a client</p>
				<p class="text-sm text-text-secondary">Send a coaching invitation to get started.</p>
			</div>
			<ChevronRight class="h-4 w-4 text-accent transition-transform group-hover:translate-x-0.5" />
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{/if}
</section>
