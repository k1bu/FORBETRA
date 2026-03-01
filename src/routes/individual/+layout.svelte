<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { SvelteSet } from 'svelte/reactivity';
	import { page } from '$app/stores';
	import {
		CalendarDays,
		LayoutDashboard,
		BarChart3,
		Users,
		History,
		MessageSquare,
		Settings,
		Lightbulb,
		MoreHorizontal,
		X,
		PenLine
	} from 'lucide-svelte';

	const { data, children }: { data: LayoutData; children: Snippet } = $props();

	const stageOrder: Record<string, number> = { new: 0, growing: 1, established: 2 };
	const currentStageLevel = $derived(stageOrder[data.maturityStage] ?? 0);

	// Track NEW badge dismissals via localStorage
	const dismissedBadges = new SvelteSet<string>();
	$effect(() => {
		try {
			const stored = localStorage.getItem('forbetra_nav_seen');
			if (stored) {
				for (const item of JSON.parse(stored)) dismissedBadges.add(item);
			}
		} catch {
			/* ignore */
		}
	});
	function dismissBadge(href: string) {
		dismissedBadges.add(href);
		try {
			localStorage.setItem('forbetra_nav_seen', JSON.stringify([...dismissedBadges]));
		} catch {
			/* ignore */
		}
	}

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

	const allNavItems = [
		{
			href: '/individual',
			label: 'Today',
			desc: 'Next action & status',
			icon: CalendarDays,
			mobileVisible: true,
			minStage: 0
		},
		{
			href: '/reflections/checkin',
			label: 'Check-in',
			desc: 'Record your week',
			icon: PenLine,
			mobileVisible: true,
			minStage: 0
		},
		{
			href: '/individual/dashboard',
			label: 'Dashboard',
			desc: 'Charts & trends',
			icon: LayoutDashboard,
			mobileVisible: true,
			minStage: 1
		},
		{
			href: '/individual/scorecard',
			label: 'Scorecard',
			desc: 'Perception gaps',
			icon: BarChart3,
			mobileVisible: true,
			minStage: 1
		},
		{
			href: '/individual/stakeholders',
			label: 'Raters',
			desc: 'Your feedback team',
			icon: Users,
			mobileVisible: true,
			minStage: 0
		},
		{
			href: '/individual/insights',
			label: 'Insights',
			desc: 'AI analysis',
			icon: Lightbulb,
			mobileVisible: true,
			minStage: 1
		},
		{
			href: '/individual/history',
			label: 'History',
			desc: 'Past check-ins',
			icon: History,
			mobileVisible: false,
			minStage: 2
		},
		{
			href: '/individual/ask',
			label: 'Ask',
			desc: 'AI coaching chat',
			icon: MessageSquare,
			mobileVisible: false,
			minStage: 2
		},
		{
			href: '/individual/settings',
			label: 'Settings',
			desc: 'Profile & journey',
			icon: Settings,
			mobileVisible: false,
			minStage: 0
		}
	];

	const navItems = $derived(allNavItems.filter((item) => currentStageLevel >= item.minStage));
	const mobileItems = $derived(navItems.filter((item) => item.mobileVisible));
	const overflowItems = $derived(navItems.filter((item) => !item.mobileVisible));

	// Show NEW badge on items that just became visible (minStage matches current stage, not lower)
	const isNewItem = (item: (typeof allNavItems)[0]) =>
		item.minStage === currentStageLevel && item.minStage > 0 && !dismissedBadges.has(item.href);

	const isActive = (href: string) => {
		const pathname = $page.url.pathname;
		if (href === '/individual') return pathname === '/individual';
		return pathname === href || pathname.startsWith(href + '/');
	};
</script>

<div class="flex min-h-screen bg-surface-base">
	<!-- Desktop Sidebar -->
	<aside class="hidden w-52 shrink-0 border-r border-border-default bg-surface-raised lg:block">
		<div class="sticky top-0 flex flex-col gap-1 p-4">
			<div class="mb-4 px-3">
				<p class="text-xs font-bold tracking-widest text-text-tertiary uppercase">Individual</p>
			</div>
			<nav class="flex flex-col gap-0.5" aria-label="Individual navigation">
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				{#each navItems as item (item.href)}
					<a
						href={item.href}
						onclick={() => dismissBadge(item.href)}
						class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors
							{isActive(item.href)
							? 'bg-accent-muted text-accent'
							: 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'}"
						aria-current={isActive(item.href) ? 'page' : undefined}
					>
						<item.icon class="h-4 w-4 shrink-0" />
						<div class="min-w-0 flex-1">
							<span class="block">{item.label}</span>
							<span class="block text-[10px] font-normal text-text-muted">{item.desc}</span>
						</div>
						{#if isNewItem(item)}
							<span
								class="rounded-full bg-accent px-1.5 py-0.5 text-[9px] leading-none font-bold text-white"
								>NEW</span
							>
						{/if}
					</a>
				{/each}
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
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
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			{#each mobileItems as item (item.href)}
				<a
					href={item.href}
					onclick={() => dismissBadge(item.href)}
					class="relative flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-colors
						{isActive(item.href) ? 'text-accent' : 'text-text-muted'}"
					aria-current={isActive(item.href) ? 'page' : undefined}
				>
					<item.icon class="h-5 w-5" />
					<span>{item.label}</span>
					{#if isNewItem(item)}
						<span
							class="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent"
							aria-label="New"
						></span>
					{/if}
				</a>
			{/each}
			<!-- eslint-enable svelte/no-navigation-without-resolve -->

			<!-- More button -->
			<button
				type="button"
				onclick={() => (showMoreMenu = !showMoreMenu)}
				aria-expanded={showMoreMenu}
				aria-controls="more-menu"
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
					id="more-menu"
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
						<!-- eslint-disable svelte/no-navigation-without-resolve -->
						{#each overflowItems as item (item.href)}
							<a
								href={item.href}
								onclick={() => {
									dismissBadge(item.href);
									closeMoreMenu();
								}}
								role="menuitem"
								class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
									{isActive(item.href)
									? 'bg-accent-muted text-accent'
									: 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'}"
							>
								<item.icon class="h-4 w-4 shrink-0" />
								<div class="min-w-0 flex-1">
									<span class="block">{item.label}</span>
									<span class="block text-[10px] font-normal text-text-muted">{item.desc}</span>
								</div>
								{#if isNewItem(item)}
									<span
										class="rounded-full bg-accent px-1.5 py-0.5 text-[9px] leading-none font-bold text-white"
										>NEW</span
									>
								{/if}
							</a>
						{/each}
						<!-- eslint-enable svelte/no-navigation-without-resolve -->
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
