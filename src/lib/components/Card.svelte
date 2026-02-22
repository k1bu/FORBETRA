<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'default' | 'glass' | 'interactive';
	type Padding = 'sm' | 'md' | 'lg' | 'none';

	let {
		variant = 'default',
		padding = 'md',
		children,
		class: className = '',
		...rest
	}: {
		variant?: Variant;
		padding?: Padding;
		children: Snippet;
		class?: string;
		[key: string]: any;
	} = $props();

	const variantClasses: Record<Variant, string> = {
		default: 'bg-surface-raised rounded-xl border border-border-default',
		glass: 'glass rounded-xl',
		interactive:
			'bg-surface-raised rounded-xl border border-border-default hover:border-border-strong hover:bg-surface-subtle transition-all cursor-pointer'
	};

	const paddingClasses: Record<Padding, string> = {
		none: '',
		sm: 'p-3',
		md: 'p-5',
		lg: 'p-7'
	};
</script>

<div class="{variantClasses[variant]} {paddingClasses[padding]} {className}" {...rest}>
	{@render children()}
</div>
