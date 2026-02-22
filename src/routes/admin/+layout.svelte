<script lang="ts">
	import type { Snippet } from 'svelte';

	const { children }: { children: Snippet } = $props();

	const navItems = [
		{ href: '/admin', label: 'Dashboard', icon: 'grid' },
		{ href: '/admin/preview', label: 'Preview Flows', icon: 'eye' },
		{ href: '/admin/users', label: 'Users', icon: 'users' },
		{ href: '/admin/objectives', label: 'Objectives & Cycles', icon: 'target' },
		{ href: '/admin/stakeholders', label: 'Stakeholders', icon: 'people' },
		{ href: '/admin/coaches', label: 'Coach Assignments', icon: 'link' },
		{ href: '/admin/insights', label: 'Insights', icon: 'sparkle' },
		{ href: '/admin/organizations', label: 'Organizations', icon: 'building' },
		{ href: '/admin/seed', label: 'Seed Data', icon: 'database' }
	];
</script>

<div class="flex min-h-screen bg-surface-base">
	<!-- Sidebar -->
	<aside class="hidden w-56 shrink-0 border-r border-border-default bg-surface-raised lg:block">
		<div class="sticky top-0 flex flex-col gap-1 p-4">
			<div class="mb-4 px-3">
				<p class="text-xs font-bold uppercase tracking-widest text-text-tertiary">Admin</p>
				<p class="text-lg font-bold text-text-primary">Forbetra CMS</p>
			</div>
			<nav class="flex flex-col gap-0.5">
				{#each navItems as item (item.href)}
					<a
						href={item.href}
						class="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary"
					>
						{item.label}
					</a>
				{/each}
			</nav>
			<div class="mt-6 border-t border-border-default pt-4">
				<a
					href="/"
					target="_blank"
					rel="noopener"
					class="rounded-lg px-3 py-2 text-xs font-medium text-text-tertiary transition-colors hover:bg-surface-subtle hover:text-text-secondary"
				>
					Open App &nearr;
				</a>
			</div>
		</div>
	</aside>

	<!-- Mobile nav -->
	<div class="flex flex-wrap gap-2 border-b border-border-default bg-surface-raised p-3 lg:hidden">
		{#each navItems as item (item.href)}
			<a
				href={item.href}
				class="rounded-lg border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-subtle"
			>
				{item.label}
			</a>
		{/each}
	</div>

	<!-- Content -->
	<main class="flex-1 overflow-x-hidden">
		{@render children()}
	</main>
</div>
