<script lang="ts">
	let { class: className = '', variant = 'text' }: { class?: string; variant?: 'text' | 'circle' | 'rect' } =
		$props();
</script>

<div
	class="animate-pulse rounded bg-neutral-200 {variant === 'circle' ? 'rounded-full' : ''} {className}"
	role="status"
	aria-label="Loading"
></div>
