<script lang="ts">
	type Tab = {
		key: string;
		label: string;
		count?: number;
	};

	let {
		tabs,
		active = $bindable(),
		class: className = '',
		...rest
	}: {
		tabs: Tab[];
		active: string;
		class?: string;
		[key: string]: any;
	} = $props();
</script>

<div
	class="inline-flex rounded-lg bg-surface-raised border border-border-default p-1 {className}"
	role="tablist"
	{...rest}
>
	{#each tabs as tab (tab.key)}
		<button
			role="tab"
			aria-selected={active === tab.key}
			class="rounded-md px-3 py-1.5 text-xs font-medium transition-all
				{active === tab.key
				? 'bg-surface-subtle text-text-primary shadow-sm'
				: 'text-text-tertiary hover:text-text-secondary'}"
			onclick={() => (active = tab.key)}
		>
			{tab.label}
			{#if tab.count != null}
				<span class="ml-1.5 text-text-muted">{tab.count}</span>
			{/if}
		</button>
	{/each}
</div>
