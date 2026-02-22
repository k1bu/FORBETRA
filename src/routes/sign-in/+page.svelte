<script lang="ts">
	import { SignIn } from 'svelte-clerk';
</script>

<svelte:head>
	<title>Sign In | Forbetra</title>
</svelte:head>

<div class="flex justify-center p-8">
	<SignIn afterSignInUrl="/" signUpUrl="/sign-up" />
</div>
