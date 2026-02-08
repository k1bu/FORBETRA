<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import type { Snippet } from 'svelte';
	import { ClerkProvider, SignedIn, UserButton } from 'svelte-clerk';
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import type { LayoutData } from './$types';

	const { children, data }: { children: Snippet; data: LayoutData } = $props();

	const displayRole = data.dbUser?.role ?? null;
	const isImpersonating = $derived(data.realUser != null);

	const isActive = (href: string) => {
		const pathname = $page.url.pathname;
		return pathname === href || pathname.startsWith(href + '/');
	};

	const stopImpersonating = async () => {
		await fetch('/api/admin/impersonate', { method: 'DELETE' });
		await goto('/admin/users', { invalidateAll: true });
	};
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ClerkProvider>
	<SignedIn>
		{#if isImpersonating}
			<div class="sticky top-0 z-50 flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-md">
				<span>Viewing as {data.dbUser?.name ?? data.dbUser?.email} ({data.dbUser?.role})</span>
				<button
					onclick={stopImpersonating}
					class="rounded bg-white px-3 py-0.5 text-xs font-bold text-amber-700 hover:bg-amber-50"
				>
					Stop
				</button>
			</div>
		{/if}
		<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg">Skip to main content</a>
		<header class="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 border-b border-slate-200/60 p-4" aria-label="Site header">
			<h1 class="text-lg font-semibold tracking-[0.12em]">FORBETRA</h1>
			<nav class="flex items-center gap-3" aria-label="Main navigation">
				{#if data.dbUser}
					<div class="flex items-center gap-3">
						{#if data.dbUser.role === 'INDIVIDUAL'}
							<a
								href="/individual"
								class="text-sm transition-colors hover:text-black {isActive('/individual') ? 'font-semibold text-black' : 'text-neutral-600'}"
								aria-current={isActive('/individual') ? 'page' : undefined}
							>
								Individual Hub
							</a>
						{/if}
						{#if data.dbUser.role === 'ADMIN'}
							<a
								href="/admin/users"
								class="text-sm transition-colors hover:text-black {isActive('/admin') ? 'font-semibold text-black' : 'text-neutral-600'}"
								aria-current={isActive('/admin') ? 'page' : undefined}
							>
								Admin Console
							</a>
						{/if}
						{#if displayRole}
							<span class="text-sm text-neutral-500">Role: {displayRole}</span>
						{/if}
					</div>
				{/if}
				<UserButton />
			</nav>
		</header>
	</SignedIn>

	<main id="main-content" class={`min-h-screen ${data.dbUser ? 'p-4' : ''}`}>
		{@render children()}
	</main>
</ClerkProvider>
