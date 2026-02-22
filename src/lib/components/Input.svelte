<script lang="ts">
	let {
		label = '',
		error = '',
		id = '',
		disabled = false,
		class: className = '',
		...rest
	}: {
		label?: string;
		error?: string;
		id?: string;
		disabled?: boolean;
		class?: string;
		[key: string]: any;
	} = $props();

	const inputId = id || label?.toLowerCase().replace(/\s+/g, '-') || undefined;

	const baseClasses =
		'block w-full bg-surface-raised border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-1';

	const stateClasses = $derived(
		error
			? 'border-error focus:border-error focus:ring-error/30'
			: 'border-border-default focus:border-accent focus:ring-accent/30'
	);

	const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
</script>

<div class="flex flex-col gap-1.5">
	{#if label}
		<label for={inputId} class="text-sm font-medium text-text-secondary">{label}</label>
	{/if}
	<input
		id={inputId}
		{disabled}
		class="{baseClasses} {stateClasses} {disabledClasses} {className}"
		{...rest}
	/>
	{#if error}
		<p class="text-xs text-error">{error}</p>
	{/if}
</div>
