<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';
	import { addToast } from '$lib/stores/toasts.svelte';
	import { Settings2, User, Globe } from 'lucide-svelte';

	const { data, form }: { data: PageData; form: ActionData } = $props();

	let isSaving = $state(false);

	let name = $state(data.user.name ?? '');
	let phone = $state(data.user.phone ?? '');
	let timezone = $state(data.user.timezone ?? '');

	$effect(() => {
		name = data.user.name ?? '';
		phone = data.user.phone ?? '';
		timezone = data.user.timezone ?? '';
	});

	const timezones = [
		'America/New_York',
		'America/Chicago',
		'America/Denver',
		'America/Los_Angeles',
		'America/Anchorage',
		'Pacific/Honolulu',
		'Europe/London',
		'Europe/Paris',
		'Europe/Berlin',
		'Asia/Tokyo',
		'Asia/Shanghai',
		'Asia/Kolkata',
		'Australia/Sydney',
		'Pacific/Auckland'
	];
</script>

<svelte:head>
	<title>Settings | Forbetra</title>
</svelte:head>

<section class="mx-auto flex max-w-2xl flex-col gap-6 p-4 pb-12">
	<header>
		<div class="flex items-center gap-2">
			<Settings2 class="h-5 w-5 text-accent" />
			<h1 class="text-2xl font-bold text-text-primary">Settings</h1>
		</div>
		<p class="mt-1 text-sm text-text-secondary">Manage your profile and preferences.</p>
	</header>

	{#if form?.success}
		<div
			class="rounded-xl border border-success/20 bg-success-muted px-4 py-3 text-sm font-medium text-success"
		>
			{form.message}
		</div>
	{/if}

	{#if form?.error}
		<div
			class="rounded-xl border border-error/20 bg-error-muted px-4 py-3 text-sm font-medium text-error"
		>
			{form.error}
		</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			isSaving = true;
			return async ({ result, update }) => {
				isSaving = false;
				if (result.type === 'redirect') {
					addToast('Session expired — please sign in again.', 'error');
					return;
				}
				if (result.type === 'error') {
					addToast('Something went wrong. Please try again.', 'error');
					return;
				}
				await update();
			};
		}}
		class="flex flex-col gap-6"
	>
		<div class="rounded-2xl border border-border-default bg-surface-raised p-6">
			<div class="mb-4 flex items-center gap-2">
				<User class="h-4 w-4 text-accent" />
				<h2 class="text-sm font-semibold tracking-wide text-text-tertiary uppercase">Profile</h2>
			</div>
			<div class="space-y-4">
				<div>
					<label for="name" class="mb-1.5 block text-sm font-medium text-text-secondary"
						>Display Name</label
					>
					<input
						id="name"
						name="name"
						type="text"
						bind:value={name}
						required
						class="w-full rounded-xl border border-border-default bg-surface-subtle px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
					/>
				</div>

				<div>
					<label for="email" class="mb-1.5 block text-sm font-medium text-text-secondary"
						>Email</label
					>
					<input
						id="email"
						type="email"
						value={data.user.email}
						disabled
						class="w-full rounded-xl border border-border-default bg-surface-subtle px-4 py-2.5 text-sm text-text-muted"
					/>
					<p class="mt-1 text-xs text-text-muted">Email is managed through your login provider.</p>
				</div>

				<div>
					<label for="phone" class="mb-1.5 block text-sm font-medium text-text-secondary"
						>Phone <span class="text-text-muted">(optional)</span></label
					>
					<input
						id="phone"
						name="phone"
						type="tel"
						bind:value={phone}
						class="w-full rounded-xl border border-border-default bg-surface-subtle px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
					/>
				</div>
			</div>
		</div>

		<div class="rounded-2xl border border-border-default bg-surface-raised p-6">
			<div class="mb-4 flex items-center gap-2">
				<Globe class="h-4 w-4 text-accent" />
				<h2 class="text-sm font-semibold tracking-wide text-text-tertiary uppercase">
					Preferences
				</h2>
			</div>
			<div>
				<label for="timezone" class="mb-1.5 block text-sm font-medium text-text-secondary"
					>Timezone</label
				>
				<select
					id="timezone"
					name="timezone"
					bind:value={timezone}
					class="w-full rounded-xl border border-border-default bg-surface-subtle px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
				>
					<option value="">Auto-detect</option>
					{#each timezones as tz (tz)}
						<option value={tz}>{tz.replace(/_/g, ' ')}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="flex justify-end gap-3">
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href="/coach"
				class="rounded-xl border border-border-default bg-surface-raised px-6 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:border-border-strong hover:bg-surface-subtle"
			>
				Cancel
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
			<button
				type="submit"
				disabled={isSaving}
				class="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
			>
				{#if isSaving}
					<span class="inline-flex items-center gap-2">
						<span
							class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
						></span>
						Saving...
					</span>
				{:else}
					Save Changes
				{/if}
			</button>
		</div>
	</form>
</section>
