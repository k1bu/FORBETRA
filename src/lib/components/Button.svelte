<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost';
	type Size = 'sm' | 'md' | 'lg';

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		type = 'button',
		children,
		class: className = '',
		...rest
	}: {
		variant?: Variant;
		size?: Size;
		disabled?: boolean;
		type?: 'button' | 'submit';
		children: Snippet;
		class?: string;
		[key: string]: any;
	} = $props();

	const baseClasses =
		'inline-flex items-center justify-center rounded-lg font-medium tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base disabled:opacity-50 disabled:cursor-not-allowed';

	const variantClasses: Record<Variant, string> = {
		primary:
			'bg-accent text-white hover:bg-accent-hover focus-visible:ring-accent',
		secondary:
			'glass border-border-strong text-text-primary hover:bg-surface-subtle focus-visible:ring-border-accent',
		destructive:
			'bg-error-muted text-error border border-error/20 hover:bg-error/20 focus-visible:ring-error',
		ghost:
			'text-text-secondary hover:text-text-primary hover:bg-surface-subtle focus-visible:ring-border-accent'
	};

	const sizeClasses: Record<Size, string> = {
		sm: 'px-3 py-1.5 text-xs',
		md: 'px-4 py-2 text-sm',
		lg: 'px-5 py-2.5 text-base'
	};
</script>

<button
	{type}
	{disabled}
	class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} {className}"
	{...rest}
>
	{@render children()}
</button>
