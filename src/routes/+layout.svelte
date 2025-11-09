<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import type { Snippet } from 'svelte';
	import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from 'svelte-clerk';
	import type { LayoutData } from './$types';

	const { children, data }: { children: Snippet; data: LayoutData } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ClerkProvider>
	<header class="flex flex-wrap items-center justify-between gap-3 p-4">
		<h1 class="text-lg font-semibold">FORBETRA</h1>
		<nav class="flex items-center gap-3">
			<SignedIn>
				{#if data.dbUser}
					<div class="flex items-center gap-3">
						{#if data.dbUser.role === 'INDIVIDUAL'}
							<form method="get" action="/dashboard">
								<button type="submit" class="text-sm text-neutral-600 hover:text-black">
									Individual Dashboard
								</button>
							</form>
						{/if}
						{#if data.dbUser.role === 'ADMIN'}
							<form method="get" action="/admin/users">
								<button type="submit" class="text-sm text-neutral-600 hover:text-black">
									Admin Console
								</button>
							</form>
						{/if}
						<span class="text-sm text-neutral-500">Role: {data.dbUser.role}</span>
					</div>
				{:else}
					<span class="text-sm text-neutral-500">Loading role…</span>
				{/if}
			</SignedIn>
			<SignedOut>
				<SignInButton class="rounded bg-black px-3 py-1 text-white">Sign in</SignInButton>
			</SignedOut>
			<SignedIn>
				<UserButton />
			</SignedIn>
		</nav>
	</header>

	<main class="p-4">
		{@render children()}
	</main>
</ClerkProvider>
