<script lang="ts">
	import { Shield } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Invalid Link | Forbetra</title>
</svelte:head>

<section
	class="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-6 text-center"
	role="alert"
>
	<!-- Forbetra brand header -->
	<div class="pb-2 text-center">
		<p
			class="flex items-center justify-center gap-1.5 text-lg font-bold tracking-[0.02em] text-text-primary italic"
		>
			<Shield class="h-5 w-5 text-accent" />
			forbetra
		</p>
		<p class="text-xs text-text-tertiary">You. And Improved.</p>
	</div>

	<h1 class="text-2xl font-semibold text-text-primary">This feedback link is no longer valid</h1>
	<p class="text-text-secondary">
		This feedback link may have expired. If you'd like to provide feedback, reach out to the person
		who invited you and ask them to send a fresh link.
	</p>
	<p class="mt-2 text-sm text-text-muted">You can safely close this tab.</p>
</section>
