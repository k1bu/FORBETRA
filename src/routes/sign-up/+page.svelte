<script lang="ts">
	import { SignUp } from 'svelte-clerk';
</script>

<svelte:head>
	<title>Sign Up | Forbetra</title>
</svelte:head>

<div class="flex justify-center p-8">
	<SignUp afterSignUpUrl="/" signInUrl="/sign-in" />
</div>
