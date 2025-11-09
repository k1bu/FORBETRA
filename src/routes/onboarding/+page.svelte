<script lang="ts">
	import type { ActionData } from './$types';
	import type { PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();
	const errors = form?.errors ?? {};
	const values = {
		objectiveTitle: form?.values?.objectiveTitle ?? '',
		objectiveDescription: form?.values?.objectiveDescription ?? '',
		subgoalLabel: form?.values?.subgoalLabel ?? '',
		subgoalDescription: form?.values?.subgoalDescription ?? '',
		stakeholderName: form?.values?.stakeholderName ?? '',
		stakeholderEmail: form?.values?.stakeholderEmail ?? '',
		stakeholderRelationship: form?.values?.stakeholderRelationship ?? '',
		cycleLabel: form?.values?.cycleLabel ?? '',
		cycleStartDate: form?.values?.cycleStartDate ?? data.defaults.startDate,
		cycleDurationWeeks: form?.values?.cycleDurationWeeks ?? String(data.defaults.durationWeeks)
	};
	const cycleDurationNumber = Number(values.cycleDurationWeeks) || data.defaults.durationWeeks;
</script>

<section class="mx-auto max-w-2xl space-y-6">
	<header class="space-y-2">
		<h1 class="text-2xl font-semibold">Let's set up your first cycle</h1>
		<p class="text-neutral-600">
			Welcome{data.user.name ? `, ${data.user.name}` : ''}! Define the outcome you want to focus on
			and the first subgoal you'll track.
		</p>
	</header>

	<form method="post" class="space-y-8 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
		<section class="space-y-3">
			<h2 class="text-lg font-semibold">Objective</h2>
			<div class="space-y-1">
				<label class="block text-sm font-medium" for="objectiveTitle">Objective title</label>
				<input
					id="objectiveTitle"
					name="objectiveTitle"
					type="text"
					required
					class="w-full rounded border border-neutral-300 px-3 py-2"
					value={values.objectiveTitle}
				/>
				{#if errors.objectiveTitle}
					<p class="text-sm text-red-600">{errors.objectiveTitle[0]}</p>
				{/if}
			</div>
			<div class="space-y-1">
				<label class="block text-sm font-medium" for="objectiveDescription">Description</label>
				<textarea
					id="objectiveDescription"
					name="objectiveDescription"
					rows="3"
					class="w-full rounded border border-neutral-300 px-3 py-2"
					>{values.objectiveDescription}</textarea
				>
				{#if errors.objectiveDescription}
					<p class="text-sm text-red-600">{errors.objectiveDescription[0]}</p>
				{/if}
			</div>
		</section>

		<section class="space-y-3">
			<h2 class="text-lg font-semibold">First subgoal</h2>
			<div class="space-y-1">
				<label class="block text-sm font-medium" for="subgoalLabel">Subgoal label</label>
				<input
					id="subgoalLabel"
					name="subgoalLabel"
					type="text"
					required
					class="w-full rounded border border-neutral-300 px-3 py-2"
					value={values.subgoalLabel}
				/>
				{#if errors.subgoalLabel}
					<p class="text-sm text-red-600">{errors.subgoalLabel[0]}</p>
				{/if}
			</div>
			<div class="space-y-1">
				<label class="block text-sm font-medium" for="subgoalDescription">Details</label>
				<textarea
					id="subgoalDescription"
					name="subgoalDescription"
					rows="2"
					class="w-full rounded border border-neutral-300 px-3 py-2"
					>{values.subgoalDescription}</textarea
				>
				{#if errors.subgoalDescription}
					<p class="text-sm text-red-600">{errors.subgoalDescription[0]}</p>
				{/if}
			</div>
		</section>

		<section class="space-y-3">
			<h2 class="text-lg font-semibold">Cycle planning</h2>
			<p class="text-sm text-neutral-500">
				We’ll schedule check-ins across your first growth cycle.
			</p>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-1">
					<label class="block text-sm font-medium" for="cycleLabel">Cycle label</label>
					<input
						id="cycleLabel"
						name="cycleLabel"
						type="text"
						placeholder="e.g. Q1 2026 Cycle"
						class="w-full rounded border border-neutral-300 px-3 py-2"
						value={values.cycleLabel}
					/>
					{#if errors.cycleLabel}
						<p class="text-sm text-red-600">{errors.cycleLabel[0]}</p>
					{/if}
				</div>
				<div class="space-y-1">
					<label class="block text-sm font-medium" for="cycleStartDate">Start date</label>
					<input
						id="cycleStartDate"
						name="cycleStartDate"
						type="date"
						required
						class="w-full rounded border border-neutral-300 px-3 py-2"
						value={values.cycleStartDate}
					/>
					{#if errors.cycleStartDate}
						<p class="text-sm text-red-600">{errors.cycleStartDate[0]}</p>
					{/if}
				</div>
				<div class="space-y-1">
					<label class="block text-sm font-medium" for="cycleDurationWeeks">Duration (weeks)</label>
					<select
						id="cycleDurationWeeks"
						name="cycleDurationWeeks"
						class="w-full rounded border border-neutral-300 px-3 py-2"
					>
						{#each [6, 8, 10, 12, 14, 16] as option (option)}
							<option value={option} selected={Number(values.cycleDurationWeeks) === option}>
								{option} weeks
							</option>
						{/each}
					</select>
					{#if errors.cycleDurationWeeks}
						<p class="text-sm text-red-600">{errors.cycleDurationWeeks[0]}</p>
					{/if}
				</div>
			</div>
			<p class="text-xs text-neutral-400">
				We’ll set the end date to {cycleDurationNumber * 7} days after your selected start.
			</p>
		</section>
		<section class="space-y-3">
			<h2 class="text-lg font-semibold">Stakeholder (optional)</h2>
			<p class="text-sm text-neutral-500">Add someone who will receive weekly feedback prompts.</p>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-1">
					<label class="block text-sm font-medium" for="stakeholderName">Name</label>
					<input
						id="stakeholderName"
						name="stakeholderName"
						type="text"
						class="w-full rounded border border-neutral-300 px-3 py-2"
						value={values.stakeholderName}
					/>
				</div>
				<div class="space-y-1">
					<label class="block text-sm font-medium" for="stakeholderEmail">Email</label>
					<input
						id="stakeholderEmail"
						name="stakeholderEmail"
						type="email"
						class="w-full rounded border border-neutral-300 px-3 py-2"
						value={values.stakeholderEmail}
					/>
					{#if errors.stakeholderEmail}
						<p class="text-sm text-red-600">{errors.stakeholderEmail[0]}</p>
					{/if}
				</div>
				<div class="space-y-1 sm:col-span-2">
					<label class="block text-sm font-medium" for="stakeholderRelationship">Relationship</label
					>
					<input
						id="stakeholderRelationship"
						name="stakeholderRelationship"
						type="text"
						class="w-full rounded border border-neutral-300 px-3 py-2"
						value={values.stakeholderRelationship}
					/>
				</div>
			</div>
			{#if errors.stakeholderName}
				<p class="text-sm text-red-600">{errors.stakeholderName[0]}</p>
			{/if}
		</section>

		<div class="flex justify-end">
			<button type="submit" class="rounded bg-black px-4 py-2 font-medium text-white"
				>Save and continue</button
			>
		</div>
	</form>
</section>
