<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { fly } from 'svelte/transition';
	import {
		Home,
		PenLine,
		Users,
		Lightbulb,
		BarChart3,
		MessageCircle,
		Settings,
		ClipboardList,
		History,
		MoreHorizontal
	} from 'lucide-svelte';

	const { children }: { children: Snippet } = $props();

	const navItems = [
		{ href: '/individual', label: 'Home', desc: 'Overview & status', icon: Home },
		{ href: '/individual/checkin', label: 'Check-in', desc: 'Record your week', icon: PenLine },
		{ href: '/individual/feedback', label: 'Feedback', desc: 'Reviewers & gaps', icon: Users },
		{ href: '/individual/insights', label: 'Insights', desc: 'AI analysis', icon: Lightbulb },
		{
			href: '/individual/scorecard',
			label: 'Scorecard',
			desc: 'Weekly scores',
			icon: ClipboardList
		},
		{ href: '/individual/dashboard', label: 'Dashboard', desc: 'Charts & trends', icon: BarChart3 },
		{ href: '/individual/history', label: 'History', desc: 'Past check-ins', icon: History },
		{ href: '/individual/ask', label: 'Ask', desc: 'Chat with your data', icon: MessageCircle },
		{ href: '/individual/settings', label: 'Settings', desc: 'Profile & prefs', icon: Settings }
	];

	// Mobile: show 5 primary tabs + More menu
	const mobileTabItems = navItems.slice(0, 5);
	const mobileOverflowItems = navItems.slice(5);
	let mobileMoreOpen = $state(false);
	let menuFocusIndex = $state(-1);

	function handleMenuKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			mobileMoreOpen = false;
			return;
		}
		const items = mobileOverflowItems;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			menuFocusIndex = (menuFocusIndex + 1) % items.length;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			menuFocusIndex = (menuFocusIndex - 1 + items.length) % items.length;
		} else if (e.key === 'Home') {
			e.preventDefault();
			menuFocusIndex = 0;
		} else if (e.key === 'End') {
			e.preventDefault();
			menuFocusIndex = items.length - 1;
		}
	}

	$effect(() => {
		if (mobileMoreOpen) {
			menuFocusIndex = 0;
		}
	});

	$effect(() => {
		if (!mobileMoreOpen || menuFocusIndex < 0) return;
		const menu = document.querySelector('[role="menu"]');
		if (!menu) return;
		const items = menu.querySelectorAll<HTMLElement>('[role="menuitem"]');
		items[menuFocusIndex]?.focus();
	});

	const isActive = (href: string) => {
		const pathname = $page.url.pathname;
		if (href === '/individual') return pathname === '/individual';
		return pathname === href || pathname.startsWith(href + '/');
	};

	const isOverflowActive = $derived(mobileOverflowItems.some((item) => isActive(item.href)));
</script>

<a
	href="#main-content"
	class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
	>Skip to content</a
>
<div class="flex min-h-screen bg-surface-base">
	<!-- Desktop Sidebar -->
	<aside class="hidden w-52 shrink-0 border-r border-border-default bg-surface-raised lg:block">
		<div class="sticky top-0 flex flex-col gap-1 p-4">
			<div class="mb-4 flex items-center justify-between px-3">
				<p class="text-xs font-bold tracking-widest text-text-tertiary uppercase">Individual</p>
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
			<nav class="flex flex-col gap-0.5" aria-label="Individual navigation">
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				{#each navItems as item (item.href)}
					<a
						href={item.href}
						class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors
							{isActive(item.href)
							? 'bg-accent-muted text-accent'
							: 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'}"
						aria-current={isActive(item.href) ? 'page' : undefined}
					>
						<item.icon class="h-4 w-4 shrink-0" />
						<div class="min-w-0 flex-1">
							<span class="block">{item.label}</span>
							<span class="text-2xs block font-normal text-text-muted">{item.desc}</span>
						</div>
					</a>
				{/each}
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</nav>
		</div>
	</aside>

	<!-- Main Content -->
	<div class="flex flex-1 flex-col overflow-x-hidden">
		<div class="flex-1 pb-20 lg:pb-0">
			{@render children()}
		</div>

		<!-- Mobile Bottom Tab Bar -->
		<nav
			class="fixed right-0 bottom-0 left-0 z-40 flex items-center justify-around border-t border-border-default bg-surface-raised px-1 pt-1.5 lg:hidden"
			style="padding-bottom: max(0.375rem, env(safe-area-inset-bottom));"
			aria-label="Mobile navigation"
		>
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			{#each mobileTabItems as item (item.href)}
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
			<!-- More menu -->
			<div class="relative flex flex-1 flex-col items-center">
				<button
					type="button"
					onclick={() => (mobileMoreOpen = !mobileMoreOpen)}
					class="text-2xs flex flex-col items-center gap-0.5 rounded-lg py-1.5 font-medium transition-colors
						{isOverflowActive ? 'text-accent' : 'text-text-muted'}"
					aria-expanded={mobileMoreOpen}
					aria-haspopup="true"
				>
					<MoreHorizontal class="h-5 w-5" />
					<span>More</span>
				</button>
				{#if mobileMoreOpen}
					<!-- Backdrop -->
					<button
						type="button"
						class="fixed inset-0 z-40 cursor-default bg-black/10"
						onclick={() => (mobileMoreOpen = false)}
						aria-label="Close menu"
						tabindex="-1"
					></button>
					<!-- Popup menu -->
					<div
						class="absolute right-0 bottom-full z-50 mb-2 w-48 rounded-xl border border-border-default bg-surface-raised py-1 shadow-lg"
						role="menu"
						aria-label="More navigation options"
						onkeydown={handleMenuKeydown}
						transition:fly={{ y: 8, duration: 150 }}
					>
						{#each mobileOverflowItems as item (item.href)}
							<a
								href={item.href}
								onclick={() => (mobileMoreOpen = false)}
								class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors
									{isActive(item.href)
									? 'bg-accent-muted text-accent'
									: 'text-text-secondary hover:bg-surface-subtle'}"
								aria-current={isActive(item.href) ? 'page' : undefined}
								role="menuitem"
							>
								<item.icon class="h-4 w-4 shrink-0" />
								<div class="min-w-0">
									<span class="block">{item.label}</span>
									<span class="text-2xs block font-normal text-text-muted">{item.desc}</span>
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</div>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</nav>
	</div>
</div>
