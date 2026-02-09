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
		{ href: '/admin/seed', label: 'Seed Data', icon: 'database' }
	];
</script>

<div class="flex min-h-screen bg-neutral-50">
	<!-- Sidebar -->
	<aside class="hidden w-56 shrink-0 border-r border-neutral-200 bg-white lg:block">
		<div class="sticky top-0 flex flex-col gap-1 p-4">
			<div class="mb-4 px-3">
				<p class="text-xs font-bold uppercase tracking-widest text-neutral-400">Admin</p>
				<p class="text-lg font-bold text-neutral-900">Forbetra CMS</p>
			</div>
			<nav class="flex flex-col gap-0.5">
				{#each navItems as item (item.href)}
					<a
						href={item.href}
						class="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
					>
						{item.label}
					</a>
				{/each}
			</nav>
			<div class="mt-6 border-t border-neutral-200 pt-4">
				<a
					href="/"
					target="_blank"
					rel="noopener"
					class="rounded-lg px-3 py-2 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
				>
					Open App &nearr;
				</a>
			</div>
		</div>
	</aside>

	<!-- Mobile nav -->
	<div class="flex flex-wrap gap-2 border-b border-neutral-200 bg-white p-3 lg:hidden">
		{#each navItems as item (item.href)}
			<a
				href={item.href}
				class="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
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
