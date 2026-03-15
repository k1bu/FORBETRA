<script lang="ts">
	let { text }: { text: string } = $props();
	let open = $state(false);

	function toggle(e: Event) {
		e.stopPropagation();
		open = !open;
	}

	function close() {
		open = false;
	}
</script>

<svelte:document onclick={close} />

<button
	type="button"
	class="info-tip"
	aria-label={text}
	onclick={toggle}
	onmouseenter={() => (open = true)}
	onmouseleave={() => (open = false)}
	onfocusout={close}
>
	<svg
		class="h-3.5 w-3.5 text-text-muted transition-colors hover:text-text-secondary"
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<circle cx="12" cy="12" r="10" stroke-width="2" />
		<path stroke-linecap="round" stroke-width="2" d="M12 16v-4m0-4h.01" />
	</svg>
	{#if open}
		<span class="info-tip-text" role="tooltip">{text}</span>
	{/if}
</button>

<style>
	.info-tip {
		position: relative;
		display: inline-flex;
		align-items: center;
		cursor: help;
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		font: inherit;
		color: inherit;
	}

	.info-tip-text {
		position: absolute;
		bottom: calc(100% + 6px);
		left: 50%;
		transform: translateX(-50%);
		white-space: normal;
		width: max-content;
		max-width: 260px;
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
</style>
