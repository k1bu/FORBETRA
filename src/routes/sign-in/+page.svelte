<script lang="ts">
	import { SignIn } from 'svelte-clerk';
</script>

<div class="flex justify-center p-8">
	<SignIn afterSignInUrl="/" signUpUrl="/sign-up" />
</div>
