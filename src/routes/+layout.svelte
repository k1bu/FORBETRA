<script lang="ts">
	import '../app.css';
	import '@fontsource/geist-sans/latin.css';
	import '@fontsource/geist-mono/latin.css';
	import favicon from '$lib/assets/favicon.svg';
	import type { Snippet } from 'svelte';
	import { ClerkProvider, SignedIn, UserButton } from 'svelte-clerk';
	import { page } from '$app/stores';
	import { afterNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { LayoutData } from './$types';
	import ToastContainer from '$lib/components/ToastContainer.svelte';

	const { children, data }: { children: Snippet; data: LayoutData } = $props();

	const isImpersonating = $derived(data.realUser != null);
	const isRoleSelection = $derived(
		($page.data as Record<string, unknown>).showRoleSelection === true
	);
	const displayRole = $derived(isRoleSelection ? null : (data.dbUser?.role ?? null));

	const isActive = (href: string) => {
		const pathname = $page.url.pathname;
		return pathname === href || pathname.startsWith(href + '/');
	};

	const navClass = (active: boolean) =>
		`rounded text-sm transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base ${active ? 'font-semibold text-text-primary' : 'text-text-secondary hover:text-text-primary'}`;

	const stopImpersonating = async () => {
		await fetch('/api/admin/impersonate', { method: 'DELETE' });
		await goto(resolve('/admin/users'), { invalidateAll: true });
	};

	afterNavigate(() => {
		// Focus main content area for accessibility after page transitions
		const h1 = document.querySelector('main h1');
		if (h1 instanceof HTMLElement) {
			h1.setAttribute('tabindex', '-1');
			h1.focus({ preventScroll: true });
		} else {
			const main = document.getElementById('main-content');
			if (main) {
				main.focus({ preventScroll: true });
			}
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ClerkProvider>
	<SignedIn>
		{#if isImpersonating}
			<div
				class="sticky top-0 z-50 flex items-center justify-center gap-3 bg-warning px-4 py-2 text-sm font-medium text-surface-base shadow-md"
			>
				<span>Viewing as {data.dbUser?.name ?? data.dbUser?.email} ({data.dbUser?.role})</span>
				<button
					onclick={stopImpersonating}
					class="rounded bg-surface-base px-3 py-0.5 text-xs font-bold text-warning hover:bg-surface-raised"
				>
					Stop
				</button>
			</div>
		{/if}
		<a
			href="#main-content"
			class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-md focus:bg-surface-raised focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-text-primary focus:shadow-lg"
			>Skip to main content</a
		>
		<header
			class="flex flex-wrap items-center justify-between gap-3 border-b border-border-default bg-surface-base p-4"
			aria-label="Site header"
		>
			<h1 class="text-lg font-semibold tracking-[0.12em] text-text-primary">Forbetra</h1>
			<nav class="flex items-center gap-3" aria-label="Main navigation">
				{#if data.dbUser}
					<div class="flex items-center gap-3">
						{#if data.dbUser.role === 'INDIVIDUAL' && !isRoleSelection}
							<!-- Individual Hub link hidden — sidebar in /individual layout handles navigation -->
						{/if}
						{#if data.dbUser.role === 'COACH' && !isRoleSelection}
							<!-- Coach nav links hidden — sidebar in /coach layout handles navigation -->
						{/if}
						{#if data.dbUser.role === 'ADMIN'}
							<a
								href={resolve('/admin/users')}
								class={navClass(isActive('/admin'))}
								aria-current={isActive('/admin') ? 'page' : undefined}
							>
								Admin Console
							</a>
						{/if}
						{#if !isRoleSelection}
							<a
								href={resolve('/settings')}
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

	<main
		id="main-content"
		tabindex="-1"
		class={`min-h-screen bg-surface-base ${data.dbUser && !$page.url.pathname.startsWith('/individual') && !$page.url.pathname.startsWith('/coach') ? 'p-4' : ''}`}
	>
		{#key $page.url.pathname}
			<div class="animate-fade-in">
				{@render children()}
			</div>
		{/key}
	</main>
	{#if data.dbUser && !$page.url.pathname.startsWith('/stakeholder')}
		<footer
			class="border-t border-border-default bg-surface-base px-4 py-3 text-center text-xs text-text-muted"
		>
			<a href={resolve('/privacy')} class="hover:text-text-secondary hover:underline">Privacy</a>
			<span class="mx-2">·</span>
			<a href={resolve('/terms')} class="hover:text-text-secondary hover:underline">Terms</a>
			<span class="mx-2">·</span>
			<span>Your data is encrypted and stored securely.</span>
		</footer>
	{/if}
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

	@media (prefers-reduced-motion: reduce) {
		:global(.animate-fade-in) {
			animation: none !important;
		}
	}
</style>
