<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/stores';
	import { Home, PenLine, Users, Lightbulb, Settings } from 'lucide-svelte';

	const { children }: { children: Snippet } = $props();

	const navItems = [
		{ href: '/individual', label: 'Home', desc: 'Overview & status', icon: Home },
		{ href: '/reflections/checkin', label: 'Check-in', desc: 'Record your week', icon: PenLine },
		{ href: '/individual/feedback', label: 'Feedback', desc: 'Reviewers & gaps', icon: Users },
		{ href: '/individual/insights', label: 'Insights', desc: 'AI analysis', icon: Lightbulb },
		{ href: '/individual/settings', label: 'Settings', desc: 'Profile & prefs', icon: Settings }
	];

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
							<span class="block text-[10px] font-normal text-text-muted">{item.desc}</span>
						</div>
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
			{#each navItems as item (item.href)}
				<a
					href={item.href}
					class="flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition-colors
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
