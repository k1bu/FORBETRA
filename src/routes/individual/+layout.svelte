<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { Home, PenLine, TrendingUp, Users, Settings } from 'lucide-svelte';

	const { children }: { children: Snippet } = $props();

	const navItems = [
		{ href: '/individual', label: 'Home', icon: Home },
		{ href: '/individual/checkin', label: 'Check-in', icon: PenLine },
		{ href: '/individual/progress', label: 'Progress', icon: TrendingUp },
		{ href: '/individual/feedback', label: 'Feedback', icon: Users }
	];

	const isActive = (href: string) => {
		const pathname = $page.url.pathname;
		if (href === '/individual') return pathname === '/individual';
		return pathname === href || pathname.startsWith(href + '/');
	};
</script>

<a
	href="#main-content"
	class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
	>Skip to content</a
>
<div class="flex min-h-screen bg-surface-base">
	<!-- Desktop Sidebar -->
	<aside class="hidden w-48 shrink-0 border-r border-border-default bg-surface-raised lg:block">
		<div class="sticky top-0 flex flex-col gap-1 p-4">
			<div class="mb-4 flex items-center justify-between px-3">
				<p class="text-xs font-bold tracking-widest text-text-tertiary uppercase">Forbetra</p>
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a
					href="/individual/settings"
					class="rounded-lg p-1 text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary"
					aria-label="Settings"
				>
					<Settings class="h-4 w-4" />
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</div>
			<nav class="flex flex-col gap-0.5" aria-label="Navigation">
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				{#each navItems as item (item.href)}
					<a
						href={item.href}
						class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
							{isActive(item.href)
							? 'bg-accent-muted text-accent'
							: 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'}"
						aria-current={isActive(item.href) ? 'page' : undefined}
					>
						<item.icon class="h-4 w-4 shrink-0" />
						{item.label}
					</a>
				{/each}
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</nav>
		</div>
	</aside>

	<!-- Main Content -->
	<div class="flex flex-1 flex-col overflow-x-hidden">
		<div id="main-content" class="flex-1 pb-20 lg:pb-0">
			{@render children()}
		</div>

		<!-- Mobile Bottom Tab Bar -->
		<nav
			class="fixed right-0 bottom-0 left-0 z-40 flex items-center justify-around border-t border-border-default bg-surface-raised px-2 pt-1.5 lg:hidden"
			style="padding-bottom: max(0.375rem, env(safe-area-inset-bottom));"
			aria-label="Navigation"
		>
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			{#each navItems as item (item.href)}
				<a
					href={item.href}
					class="text-2xs flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 font-medium transition-colors
						{isActive(item.href) ? 'text-accent' : 'text-text-muted'}"
					aria-current={isActive(item.href) ? 'page' : undefined}
				>
					<item.icon class="h-5 w-5" />
					<span>{item.label}</span>
				</a>
			{/each}
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</nav>
	</div>
</div>
