<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>Error | Forbetra</title>
</svelte:head>

<section class="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-6 p-4 text-center">
	<div class="rounded-2xl border border-border-default bg-surface-raised p-8" role="alert">
		<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-muted">
			<svg class="h-8 w-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
			</svg>
		</div>
		<h1 class="text-2xl font-bold text-text-primary">Something went wrong</h1>
		<p class="mt-2 text-sm text-text-secondary">
			{$page.error?.message || 'An unexpected error occurred.'}
		</p>
		<div class="mt-6 flex items-center justify-center gap-3">
			<a
				href="/"
				class="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-hover"
			>
				Go Home
			</a>
			<button
				onclick={() => window.location.reload()}
				class="rounded-xl border border-border-default bg-surface-raised px-6 py-2.5 text-sm font-semibold text-text-secondary transition-all hover:bg-surface-subtle"
			>
				Try Again
			</button>
		</div>
	</div>
</section>
