<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'default' | 'success' | 'warning' | 'error' | 'accent' | 'effort' | 'performance';

	let {
		variant = 'default',
		children,
		class: className = '',
		...rest
	}: {
		variant?: Variant;
		children: Snippet;
		class?: string;
		[key: string]: any;
	} = $props();

	const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';

	const variantClasses: Record<Variant, string> = {
		default: 'bg-surface-subtle text-text-secondary border border-border-default',
		success: 'bg-success-muted text-success',
		warning: 'bg-warning-muted text-warning',
		error: 'bg-error-muted text-error',
		accent: 'bg-accent-muted text-accent',
		effort: 'bg-data-effort-muted text-data-effort',
		performance: 'bg-data-performance-muted text-data-performance'
	};
</script>

<span class="{baseClasses} {variantClasses[variant]} {className}" {...rest}>
	{@render children()}
</span>
