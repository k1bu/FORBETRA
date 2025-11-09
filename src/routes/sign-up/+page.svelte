<script lang="ts">
	import { SignUp } from 'svelte-clerk';
</script>

<div class="flex justify-center p-8">
	<SignUp after-sign-up-url="/" sign-in-url="/sign-in" />
</div>
