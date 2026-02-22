<script lang="ts">
	import '../app.css';
	import '@fontsource/geist-sans/latin.css';
	import '@fontsource/geist-mono/latin.css';
	import favicon from '$lib/assets/favicon.svg';
	import type { Snippet } from 'svelte';
	import { ClerkProvider, SignedIn, UserButton } from 'svelte-clerk';
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import type { LayoutData } from './$types';
	import ToastContainer from '$lib/components/ToastContainer.svelte';

	const { children, data }: { children: Snippet; data: LayoutData } = $props();

	const isImpersonating = $derived(data.realUser != null);
	const isRoleSelection = $derived(($page.data as any).showRoleSelection === true);
	const displayRole = $derived(isRoleSelection ? null : (data.dbUser?.role ?? null));

	const isActive = (href: string) => {
		const pathname = $page.url.pathname;
		return pathname === href || pathname.startsWith(href + '/');
	};

	const navClass = (active: boolean) =>
		`rounded text-sm transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base ${active ? 'font-semibold text-text-primary' : 'text-text-secondary hover:text-text-primary'}`;

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
			<div class="sticky top-0 z-50 flex items-center justify-center gap-3 bg-warning px-4 py-2 text-sm font-medium text-surface-base shadow-md">
				<span>Viewing as {data.dbUser?.name ?? data.dbUser?.email} ({data.dbUser?.role})</span>
				<button
					onclick={stopImpersonating}
					class="rounded bg-surface-base px-3 py-0.5 text-xs font-bold text-warning hover:bg-surface-raised"
				>
					Stop
				</button>
			</div>
		{/if}
		<a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-md focus:bg-surface-raised focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-text-primary focus:shadow-lg">Skip to main content</a>
		<header class="flex flex-wrap items-center justify-between gap-3 bg-surface-base border-b border-border-default p-4" aria-label="Site header">
			<h1 class="text-lg font-semibold tracking-[0.12em] text-text-primary">FORBETRA</h1>
			<nav class="flex items-center gap-3" aria-label="Main navigation">
				{#if data.dbUser}
					<div class="flex items-center gap-3">
						{#if data.dbUser.role === 'INDIVIDUAL' && !isRoleSelection}
							<a
								href="/individual"
								class={navClass(isActive('/individual'))}
								aria-current={isActive('/individual') ? 'page' : undefined}
							>
								Individual Hub
							</a>
						{/if}
						{#if data.dbUser.role === 'COACH' && !isRoleSelection}
							<a
								href="/coach"
								class={navClass(isActive('/coach') && !isActive('/coach/roster') && !isActive('/coach/invitations') && !isActive('/coach/analytics'))}
								aria-current={isActive('/coach') && !isActive('/coach/roster') && !isActive('/coach/invitations') && !isActive('/coach/analytics') ? 'page' : undefined}
							>
								Coach Hub
							</a>
							<a
								href="/coach/roster"
								class={navClass(isActive('/coach/roster'))}
								aria-current={isActive('/coach/roster') ? 'page' : undefined}
							>
								Roster
							</a>
							<a
								href="/coach/invitations"
								class={navClass(isActive('/coach/invitations'))}
								aria-current={isActive('/coach/invitations') ? 'page' : undefined}
							>
								Invitations
							</a>
							<a
								href="/coach/analytics"
								class={navClass(isActive('/coach/analytics'))}
								aria-current={isActive('/coach/analytics') ? 'page' : undefined}
							>
								Analytics
							</a>
						{/if}
						{#if data.dbUser.role === 'ADMIN'}
							<a
								href="/admin/users"
								class={navClass(isActive('/admin'))}
								aria-current={isActive('/admin') ? 'page' : undefined}
							>
								Admin Console
							</a>
						{/if}
						{#if !isRoleSelection}
							<a
								href="/settings"
								class={navClass(isActive('/settings'))}
								aria-current={isActive('/settings') ? 'page' : undefined}
							>
								Settings
							</a>
						{/if}
						{#if displayRole}
							<span class="text-sm text-text-muted">Role: {displayRole}</span>
						{/if}
					</div>
				{/if}
				<UserButton />
			</nav>
		</header>
	</SignedIn>

	<main id="main-content" class={`min-h-screen bg-surface-base ${data.dbUser ? 'p-4' : ''}`}>
		{#key $page.url.pathname}
			<div class="animate-fade-in">
				{@render children()}
			</div>
		{/key}
	</main>
	<ToastContainer />
</ClerkProvider>

<style>
	.animate-fade-in {
		animation: fadeIn 0.15s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
