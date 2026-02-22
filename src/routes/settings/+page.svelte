<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';

	const { data, form }: { data: PageData; form: ActionData } = $props();

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
	<title>Settings | FORBETRA</title>
</svelte:head>

<div class="mx-auto max-w-xl py-8">
	<h1 class="mb-6 text-2xl font-semibold tracking-tight">Settings</h1>

	{#if form?.success}
		<div class="mb-6 rounded-lg border border-success-muted bg-success-muted px-4 py-3 text-sm text-success">
			{form.message}
		</div>
	{/if}

	{#if form?.error}
		<div class="mb-6 rounded-lg border border-error-muted bg-error-muted px-4 py-3 text-sm text-error">
			{form.error}
		</div>
	{/if}

	<form method="POST" use:enhance class="space-y-6">
		<div>
			<label for="name" class="mb-1 block text-sm font-medium text-text-secondary">Display Name</label>
			<input
				id="name"
				name="name"
				type="text"
				value={data.user.name}
				required
				class="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
			/>
		</div>

		<div>
			<label for="email" class="mb-1 block text-sm font-medium text-text-secondary">Email</label>
			<input
				id="email"
				type="email"
				value={data.user.email}
				disabled
				class="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-tertiary"
			/>
			<p class="mt-1 text-xs text-text-tertiary">Email is managed through your login provider.</p>
		</div>

		<div>
			<label for="phone" class="mb-1 block text-sm font-medium text-text-secondary">Phone <span class="text-text-muted">(optional)</span></label>
			<input
				id="phone"
				name="phone"
				type="tel"
				value={data.user.phone}
				class="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
			/>
		</div>

		<div>
			<label for="timezone" class="mb-1 block text-sm font-medium text-text-secondary">Timezone</label>
			<select
				id="timezone"
				name="timezone"
				class="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
			>
				<option value="">Auto-detect</option>
				{#each timezones as tz}
					<option value={tz} selected={data.user.timezone === tz}>{tz.replace(/_/g, ' ')}</option>
				{/each}
			</select>
		</div>

		<fieldset>
			<legend class="mb-2 text-sm font-medium text-text-secondary">Reminder Schedule</legend>
			<div class="space-y-2">
				<label class="flex items-center gap-2 rounded-lg border border-border-default px-3 py-2.5 text-sm hover:bg-surface-subtle">
					<input
						type="radio"
						name="reminderDays"
						value="wednesday_friday"
						checked={data.user.reminderDays !== 'tuesday_thursday'}
						class="text-accent focus:ring-accent"
					/>
					<div>
						<span class="font-medium">Wednesday & Friday</span>
						<span class="ml-1 text-text-tertiary">(default)</span>
					</div>
				</label>
				<label class="flex items-center gap-2 rounded-lg border border-border-default px-3 py-2.5 text-sm hover:bg-surface-subtle">
					<input
						type="radio"
						name="reminderDays"
						value="tuesday_thursday"
						checked={data.user.reminderDays === 'tuesday_thursday'}
						class="text-accent focus:ring-accent"
					/>
					<span class="font-medium">Tuesday & Thursday</span>
				</label>
			</div>
		</fieldset>

		<div class="pt-2">
			<button
				type="submit"
				class="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
			>
				Save Changes
			</button>
		</div>
	</form>
</div>
