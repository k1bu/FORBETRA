<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
	<div class="rounded-xl border border-border-default bg-surface-raised p-8 shadow-lg max-w-md">
		<h1 class="text-2xl font-bold text-text-primary mb-2">Something went wrong</h1>
		<p class="text-text-secondary mb-1">Error {$page.status}</p>
		<p class="text-sm text-text-tertiary mb-6">{$page.error?.message ?? 'This feedback link may be invalid or expired.'}</p>
	</div>
</div>
