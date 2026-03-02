<script lang="ts">
	import type { Snippet } from 'svelte';
	import { AlertTriangle, RefreshCw } from 'lucide-svelte';

	let {
		children,
		fallback,
		onRetry
	}: {
		children: Snippet;
		fallback?: Snippet;
		onRetry?: () => void;
	} = $props();

	let hasError = $state(false);

	function handleError() {
		hasError = true;
	}

	function retry() {
		hasError = false;
		onRetry?.();
	}
</script>

<svelte:boundary onerror={handleError}>
	{#if hasError}
		{#if fallback}
			{@render fallback()}
		{:else}
			<div
				class="flex flex-col items-center justify-center rounded-lg border border-border-default bg-surface-raised p-6 text-center"
			>
				<AlertTriangle class="mb-2 h-8 w-8 text-text-muted" />
				<p class="text-sm font-medium text-text-primary">Something went wrong</p>
				<p class="mt-1 text-xs text-text-secondary">This section couldn't load properly.</p>
				<button
					onclick={retry}
					class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
				>
					<RefreshCw class="h-3 w-3" />
					Try again
				</button>
			</div>
		{/if}
	{:else}
		{@render children()}
	{/if}
</svelte:boundary>
