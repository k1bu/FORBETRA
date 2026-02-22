<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		icon,
		heading,
		description = '',
		actionLabel = '',
		actionHref = ''
	}: {
		icon?: Snippet;
		heading: string;
		description?: string;
		actionLabel?: string;
		actionHref?: string;
	} = $props();
</script>

<div class="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-default bg-surface-raised p-8 text-center">
	{#if icon}
		<div class="mb-3 text-text-muted">{@render icon()}</div>
	{/if}
	<h3 class="text-lg font-semibold text-text-primary">{heading}</h3>
	{#if description}
		<p class="mt-1 max-w-sm text-sm text-text-secondary">{description}</p>
	{/if}
	{#if actionLabel && actionHref}
		<a
			href={actionHref}
			class="mt-4 inline-flex items-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
		>
			{actionLabel}
		</a>
	{/if}
</div>
