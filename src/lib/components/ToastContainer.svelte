<script lang="ts">
	import { fly } from 'svelte/transition';
	import { toasts, removeToast } from '$lib/stores/toasts.svelte';
	import { CircleCheck, CircleX, Info } from 'lucide-svelte';
</script>

{#if toasts.length > 0}
	<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
		{#each toasts as toast (toast.id)}
			<div
				transition:fly={{ x: 80, duration: 300 }}
				class="glass-raised flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg
					{toast.type === 'success'
					? 'border-success/20 bg-success-muted text-success'
					: toast.type === 'error'
						? 'border-error/20 bg-error-muted text-error'
						: 'border-accent/20 bg-accent-muted text-accent'}"
				role="status"
				aria-live="polite"
			>
				<span aria-hidden="true">
					{#if toast.type === 'success'}<CircleCheck class="h-5 w-5" />{:else if toast.type === 'error'}<CircleX class="h-5 w-5" />{:else}<Info class="h-5 w-5" />{/if}
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
