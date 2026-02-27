<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import { Home, Users, Mail, BarChart3, Settings, MoreHorizontal, X } from 'lucide-svelte';

	const { children }: { children: Snippet } = $props();

	let showMoreMenu = $state(false);
	let moreMenuEl = $state<HTMLElement | undefined>(undefined);
	let previouslyFocusedEl: HTMLElement | null = null;

	function closeMoreMenu() {
		showMoreMenu = false;
	}

	function handleOverlayKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') closeMoreMenu();
	}

	// Focus management: move focus to menu on open, restore on close
	$effect(() => {
		if (showMoreMenu) {
			previouslyFocusedEl = document.activeElement as HTMLElement | null;
			setTimeout(() => {
				if (moreMenuEl) {
					const closeBtn = moreMenuEl.querySelector<HTMLElement>('button[aria-label="Close menu"]');
					if (closeBtn) {
						closeBtn.focus();
					} else {
						moreMenuEl.focus();
					}
				}
			}, 0);
		} else {
			if (previouslyFocusedEl && typeof previouslyFocusedEl.focus === 'function') {
				previouslyFocusedEl.focus();
				previouslyFocusedEl = null;
			}
		}
	});

	const navItems = [
		{ href: '/coach', label: 'Dashboard', icon: Home, mobileVisible: true },
		{ href: '/coach/roster', label: 'Roster', icon: Users, mobileVisible: true },
		{ href: '/coach/invitations', label: 'Invitations', icon: Mail, mobileVisible: true },
		{ href: '/coach/analytics', label: 'Analytics', icon: BarChart3, mobileVisible: false },
		{ href: '/coach/settings', label: 'Settings', icon: Settings, mobileVisible: false }
	];

	const mobileItems = navItems.filter((item) => item.mobileVisible);
	const overflowItems = navItems.filter((item) => !item.mobileVisible);

	const isActive = (href: string) => {
		const pathname = $page.url.pathname;
		if (href === '/coach') return pathname === '/coach';
		return pathname === href || pathname.startsWith(href + '/');
	};
</script>

<div class="flex min-h-screen bg-surface-base">
	<!-- Desktop Sidebar -->
	<aside class="hidden w-52 shrink-0 border-r border-border-default bg-surface-raised lg:block">
		<div class="sticky top-0 flex flex-col gap-1 p-4">
			<div class="mb-4 px-3">
				<p class="text-xs font-bold tracking-widest text-text-tertiary uppercase">Coach</p>
			</div>
			<nav class="flex flex-col gap-0.5" aria-label="Coach navigation">
				{#each navItems as item (item.href)}
					<a
						href={resolve(item.href)}
						class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors
							{isActive(item.href)
							? 'bg-accent-muted text-accent'
							: 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'}"
						aria-current={isActive(item.href) ? 'page' : undefined}
					>
						<item.icon class="h-4 w-4 shrink-0" />
						{item.label}
					</a>
				{/each}
			</nav>
		</div>
	</aside>

	<!-- Main Content -->
	<div class="flex flex-1 flex-col overflow-x-hidden">
		<main class="flex-1 pb-20 lg:pb-0">
			{@render children()}
		</main>

		<!-- Mobile Bottom Tab Bar -->
		<nav
			class="fixed right-0 bottom-0 left-0 z-40 flex items-center justify-around border-t border-border-default bg-surface-raised px-1 pt-1.5 lg:hidden"
			style="padding-bottom: max(0.375rem, env(safe-area-inset-bottom));"
			aria-label="Mobile navigation"
		>
			{#each mobileItems as item (item.href)}
				<a
					href={resolve(item.href)}
					class="flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-colors
						{isActive(item.href) ? 'text-accent' : 'text-text-muted'}"
					aria-current={isActive(item.href) ? 'page' : undefined}
				>
					<item.icon class="h-5 w-5" />
					<span>{item.label}</span>
				</a>
			{/each}

			<!-- More button -->
			<button
				type="button"
				onclick={() => (showMoreMenu = !showMoreMenu)}
				aria-expanded={showMoreMenu}
				aria-controls="coach-more-menu"
				class="flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium text-text-muted transition-colors"
			>
				<MoreHorizontal class="h-5 w-5" />
				<span>More</span>
			</button>
		</nav>

		<!-- More menu overlay (mobile) -->
		{#if showMoreMenu}
			<div
				class="fixed inset-0 z-50 bg-black/40 lg:hidden"
				role="dialog"
				aria-modal="true"
				aria-label="More navigation"
				tabindex="-1"
				onkeydown={handleOverlayKeydown}
				bind:this={moreMenuEl}
			>
				<button
					type="button"
					class="absolute inset-0 h-full w-full cursor-default"
					onclick={closeMoreMenu}
					aria-label="Close menu"
					tabindex="-1"
				></button>
				<div
					id="coach-more-menu"
					class="absolute right-0 bottom-0 left-0 rounded-t-2xl border-t border-border-default bg-surface-raised p-4"
					style="padding-bottom: max(2rem, env(safe-area-inset-bottom));"
				>
					<div class="mb-3 flex items-center justify-between">
						<p class="text-sm font-semibold text-text-primary">More</p>
						<button
							type="button"
							onclick={closeMoreMenu}
							class="rounded-lg p-1 text-text-muted hover:bg-surface-subtle"
							aria-label="Close menu"
						>
							<X class="h-5 w-5" />
						</button>
					</div>
					<div class="flex flex-col gap-1" role="menu">
						{#each overflowItems as item (item.href)}
							<a
								href={resolve(item.href)}
								onclick={closeMoreMenu}
								role="menuitem"
								class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
									{isActive(item.href)
									? 'bg-accent-muted text-accent'
									: 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'}"
							>
								<item.icon class="h-4 w-4 shrink-0" />
								{item.label}
							</a>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
