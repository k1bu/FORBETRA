<script lang="ts">
	let { class: className = '', variant = 'text' }: { class?: string; variant?: 'text' | 'circle' | 'rect' } =
		$props();
</script>

<div
	class="skeleton-shimmer relative overflow-hidden rounded bg-surface-subtle {variant === 'circle' ? 'rounded-full' : ''} {className}"
	role="status"
	aria-label="Loading"
></div>

<style>
	.skeleton-shimmer::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.06) 40%,
			rgba(255, 255, 255, 0.1) 50%,
			rgba(255, 255, 255, 0.06) 60%,
			transparent 100%
		);
		animation: shimmer 1.8s ease-in-out infinite;
		transform: translateX(-100%);
	}

	@keyframes shimmer {
		100% {
			transform: translateX(100%);
		}
	}
</style>
