<script lang="ts">
	import type { ErrorData } from './$types';

	const { error, status, message }: ErrorData = $props();
</script>

<div class="mx-auto flex max-w-2xl flex-col items-center justify-center gap-6 p-8 text-center">
	<h1 class="text-4xl font-bold text-neutral-900">{status ?? 500}</h1>
	<h2 class="text-2xl font-semibold text-neutral-700">
		{message ?? 'Something went wrong'}
	</h2>
	{#if error}
		<details class="w-full rounded-lg border-2 border-red-200 bg-red-50 p-4 text-left">
			<summary class="cursor-pointer font-semibold text-red-900">Error Details</summary>
			<pre class="mt-2 overflow-auto text-xs text-red-800">{error.message}</pre>
			{#if error.stack}
				<pre class="mt-2 overflow-auto text-xs text-red-700">{error.stack}</pre>
			{/if}
		</details>
	{/if}
	<a
		href="/individual"
		class="mt-4 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-700"
	>
		Return to Individual Hub
	</a>
</div>
