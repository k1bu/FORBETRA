<script lang="ts">
	import { onMount } from 'svelte';

	let showFallback = $state(false);

	onMount(() => {
		const timer = setTimeout(() => {
			showFallback = true;
		}, 3000);
		return () => clearTimeout(timer);
	});
</script>

<svelte:head>
	<title>Settings | Forbetra</title>
</svelte:head>

<section class="flex min-h-[50vh] items-center justify-center">
	<div class="space-y-4 text-center">
		<div class="flex items-center justify-center gap-3">
			<span class="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent"
			></span>
			<p class="text-sm text-text-muted">Redirecting to settings...</p>
		</div>
		{#if showFallback}
			<p class="text-xs text-text-muted">
				Not redirecting?
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<a href="/individual/settings" class="text-accent underline">Go to settings</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</p>
		{/if}
	</div>
</section>
