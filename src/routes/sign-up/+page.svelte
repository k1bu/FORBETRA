<script lang="ts">
	import { SignUp } from 'svelte-clerk';
</script>

<div class="flex justify-center p-8">
	<SignUp afterSignUpUrl="/" signInUrl="/sign-in" />
</div>
