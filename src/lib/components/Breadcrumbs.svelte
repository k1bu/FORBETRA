<script lang="ts">
	let { items }: { items: Array<{ label: string; href?: string }> } = $props();
</script>

<nav aria-label="Breadcrumb" class="mb-4">
	<ol class="flex items-center gap-1.5 text-sm text-neutral-500">
		{#each items as item, index (index)}
			{#if index > 0}
				<li aria-hidden="true" class="text-neutral-400">
					<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</li>
			{/if}
			<li>
				{#if item.href && index < items.length - 1}
					<a href={item.href} class="rounded transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
						{item.label}
					</a>
				{:else}
					<span class="font-medium text-neutral-900">{item.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>
