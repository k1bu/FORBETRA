<script lang="ts">
	export let data: { userId: string; role: string };
</script>

<section class="space-y-3">
	<h2 class="text-xl font-semibold">Protected area</h2>
	<p>You are signed in as <span class="font-mono">{data.userId}</span>.</p>
	<p>Your role: <span class="uppercase">{data.role}</span></p>
</section>
