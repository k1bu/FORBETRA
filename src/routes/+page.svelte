<script lang="ts">
	import { SignedIn, SignedOut } from 'svelte-clerk';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<section class="space-y-4">
	<header class="space-y-2">
		<h1 class="text-2xl font-semibold">Welcome to FORBETRA</h1>
		<p class="text-neutral-600">Build goals, track cycles, and keep stakeholders aligned.</p>
	</header>

	<SignedOut>
		<p>Please sign in to start setting objectives and subgoals.</p>
	</SignedOut>

	<SignedIn>
		{#if data.dbUser}
			<p>
				Signed in as <span class="font-medium">{data.dbUser.email}</span> with role
				<span class="uppercase">{data.dbUser.role}</span>.
			</p>
			<p>
				{#if data.dbUser.role === 'INDIVIDUAL'}
					Head over to the onboarding flow to define your primary objective.
				{:else if data.dbUser.role === 'COACH'}
					Visit the coach dashboard (coming soon) to monitor your clients.
				{:else if data.dbUser.role === 'STAKEHOLDER'}
					You will receive prompts to provide feedback on active cycles.
				{:else}
					Admin tooling is on the roadmap.
				{/if}
			</p>
			{#if data.dbUser.role === 'INDIVIDUAL'}
				<div class="flex flex-wrap items-center gap-3">
					<form method="get" action="/onboarding">
						<button type="submit" class="rounded bg-black px-4 py-2 text-sm font-medium text-white">
							Start onboarding
						</button>
					</form>
					<form method="get" action="/dashboard">
						<button
							type="submit"
							class="rounded border border-neutral-300 px-4 py-2 text-sm font-medium"
						>
							Go to dashboard
						</button>
					</form>
				</div>
			{/if}
		{:else}
			<p>We’re setting up your account&mdash;refresh if this takes more than a few seconds.</p>
		{/if}
	</SignedIn>
</section>
