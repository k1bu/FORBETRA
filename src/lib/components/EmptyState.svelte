<script lang="ts">
	let {
		icon = '',
		heading,
		description = '',
		actionLabel = '',
		actionHref = ''
	}: {
		icon?: string;
		heading: string;
		description?: string;
		actionLabel?: string;
		actionHref?: string;
	} = $props();
</script>

<div class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
	{#if icon}
		<span class="mb-3 text-4xl">{icon}</span>
	{/if}
	<h3 class="text-lg font-semibold text-neutral-900">{heading}</h3>
	{#if description}
		<p class="mt-1 max-w-sm text-sm text-neutral-600">{description}</p>
	{/if}
	{#if actionLabel && actionHref}
		<a
			href={actionHref}
			class="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
		>
			{actionLabel}
		</a>
	{/if}
</div>
