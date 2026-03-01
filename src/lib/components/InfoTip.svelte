<script lang="ts">
	let { text }: { text: string } = $props();
</script>

<span class="info-tip" role="img" aria-label={text}>
	<svg
		class="h-3.5 w-3.5 text-text-muted transition-colors hover:text-text-secondary"
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<circle cx="12" cy="12" r="10" stroke-width="2" />
		<path stroke-linecap="round" stroke-width="2" d="M12 16v-4m0-4h.01" />
	</svg>
	<span class="info-tip-text">{text}</span>
</span>

<style>
	.info-tip {
		position: relative;
		display: inline-flex;
		align-items: center;
		cursor: help;
	}

	.info-tip-text {
		display: none;
		position: absolute;
		bottom: calc(100% + 6px);
		left: 50%;
		transform: translateX(-50%);
		white-space: normal;
		width: max-content;
		max-width: 200px;
		padding: 6px 10px;
		border-radius: 8px;
		font-size: 11px;
		line-height: 1.4;
		color: var(--color-text-primary, #fff);
		background: var(--color-surface-subtle, #333);
		border: 1px solid var(--color-border-default, #444);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		z-index: 50;
		pointer-events: none;
	}

	.info-tip:hover .info-tip-text,
	.info-tip:focus-within .info-tip-text {
		display: block;
	}
</style>
