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
		<div class="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
			{form.message}
		</div>
	{/if}

	{#if form?.error}
		<div class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
			{form.error}
		</div>
	{/if}

	<form method="POST" use:enhance class="space-y-6">
		<div>
			<label for="name" class="mb-1 block text-sm font-medium text-neutral-700">Display Name</label>
			<input
				id="name"
				name="name"
				type="text"
				value={data.user.name}
				required
				class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
			/>
		</div>

		<div>
			<label for="email" class="mb-1 block text-sm font-medium text-neutral-700">Email</label>
			<input
				id="email"
				type="email"
				value={data.user.email}
				disabled
				class="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500"
			/>
			<p class="mt-1 text-xs text-neutral-500">Email is managed through your login provider.</p>
		</div>

		<div>
			<label for="phone" class="mb-1 block text-sm font-medium text-neutral-700">Phone <span class="text-neutral-400">(optional)</span></label>
			<input
				id="phone"
				name="phone"
				type="tel"
				value={data.user.phone}
				class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
			/>
		</div>

		<div>
			<label for="timezone" class="mb-1 block text-sm font-medium text-neutral-700">Timezone</label>
			<select
				id="timezone"
				name="timezone"
				class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
			>
				<option value="">Auto-detect</option>
				{#each timezones as tz}
					<option value={tz} selected={data.user.timezone === tz}>{tz.replace(/_/g, ' ')}</option>
				{/each}
			</select>
		</div>

		<fieldset>
			<legend class="mb-2 text-sm font-medium text-neutral-700">Reminder Schedule</legend>
			<div class="space-y-2">
				<label class="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2.5 text-sm hover:bg-neutral-50">
					<input
						type="radio"
						name="reminderDays"
						value="wednesday_friday"
						checked={data.user.reminderDays !== 'tuesday_thursday'}
						class="text-blue-600 focus:ring-blue-500"
					/>
					<div>
						<span class="font-medium">Wednesday & Friday</span>
						<span class="ml-1 text-neutral-500">(default)</span>
					</div>
				</label>
				<label class="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2.5 text-sm hover:bg-neutral-50">
					<input
						type="radio"
						name="reminderDays"
						value="tuesday_thursday"
						checked={data.user.reminderDays === 'tuesday_thursday'}
						class="text-blue-600 focus:ring-blue-500"
					/>
					<span class="font-medium">Tuesday & Thursday</span>
				</label>
			</div>
		</fieldset>

		<div class="pt-2">
			<button
				type="submit"
				class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
			>
				Save Changes
			</button>
		</div>
	</form>
</div>
