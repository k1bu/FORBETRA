<script lang="ts">
	import { SignIn } from 'svelte-clerk';
</script>

<div class="flex justify-center p-8">
	<SignIn after-sign-in-url="/" sign-up-url="/sign-up" />
</div>
