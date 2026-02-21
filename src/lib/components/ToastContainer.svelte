<script lang="ts">
	import { fly } from 'svelte/transition';
	import { toasts, removeToast } from '$lib/stores/toasts.svelte';
</script>

{#if toasts.length > 0}
	<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
		{#each toasts as toast (toast.id)}
			<div
				transition:fly={{ x: 80, duration: 300 }}
				class="flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm
					{toast.type === 'success'
					? 'border-emerald-200 bg-emerald-50/95 text-emerald-800'
					: toast.type === 'error'
						? 'border-red-200 bg-red-50/95 text-red-800'
						: 'border-blue-200 bg-blue-50/95 text-blue-800'}"
				role="status"
				aria-live="polite"
			>
				<span class="text-lg" aria-hidden="true">
					{#if toast.type === 'success'}&#10003;{:else if toast.type === 'error'}&#10007;{:else}&#8505;{/if}
				</span>
				<span class="text-sm font-medium">{toast.message}</span>
				<button
					onclick={() => removeToast(toast.id)}
					class="ml-2 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
					aria-label="Dismiss"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		{/each}
	</div>
{/if}
