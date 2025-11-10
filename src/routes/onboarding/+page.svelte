<svelte:options runes={false} />

<script lang="ts">
	import type { ActionData } from './$types';
	import type { PageData } from './$types';
	import type {
		ObjectiveTemplate,
		SubgoalTemplate,
		OnboardingContext
	} from '$lib/content/onboardingTemplates';

	export let data: PageData;
	export let form: ActionData | null;

	type SubgoalFormValue = { label: string; description: string };
	type StakeholderFormValue = { name: string; email: string; relationship: string };

	const contexts = data.contexts;
	const errors = (form?.errors as Record<string, string[]>) ?? {};

	const values = {
		objectiveTitle: form?.values?.objectiveTitle ?? '',
		objectiveDescription: form?.values?.objectiveDescription ?? '',
		subgoals: (form?.values?.subgoals as SubgoalFormValue[] | undefined) ?? [],
		stakeholders: (form?.values?.stakeholders as StakeholderFormValue[] | undefined) ?? [],
		cycleLabel: form?.values?.cycleLabel ?? '',
		cycleStartDate: form?.values?.cycleStartDate ?? data.defaults.startDate,
		cycleDurationWeeks: String(form?.values?.cycleDurationWeeks ?? data.defaults.durationWeeks)
	};

	const cycleOptions = [6, 8, 10, 12, 14, 16];
	const minSubgoalFields = 3;
	const minStakeholderFields = 3;
	const maxStakeholderFields = 5;

	const initialSubgoalCount = Math.max(values.subgoals.length, minSubgoalFields);
	const initialStakeholderCount = Math.max(values.stakeholders.length, minStakeholderFields);

	let objectiveTitle = values.objectiveTitle;
	let objectiveDescription = values.objectiveDescription;
	let cycleLabel = values.cycleLabel;
	let cycleStartDate = values.cycleStartDate;
	let cycleDurationWeeks = values.cycleDurationWeeks;

	let subgoalForms: SubgoalFormValue[] = Array.from({ length: initialSubgoalCount }, (_, index) => ({
		label: values.subgoals[index]?.label ?? '',
		description: values.subgoals[index]?.description ?? ''
	}));

	let stakeholderForms: StakeholderFormValue[] = Array.from(
		{ length: initialStakeholderCount },
		(_, index) => ({
			name: values.stakeholders[index]?.name ?? '',
			email: values.stakeholders[index]?.email ?? '',
			relationship: values.stakeholders[index]?.relationship ?? ''
		})
	);

let selectedContextId: string | null = null;
let selectedContext: OnboardingContext | null = null;
	let expandedObjectiveId: string | null = null;
	let appliedObjectiveId: string | null = null;

	function selectContext(contextId: string) {
		selectedContextId = contextId;
		selectedContext = contexts.find((context) => context.id === contextId) ?? null;
		expandedObjectiveId = null;
	}

	function updateSubgoalField(index: number, key: 'label' | 'description', value: string) {
		subgoalForms = subgoalForms.map((subgoal, subIndex) =>
			subIndex === index ? { ...subgoal, [key]: value } : subgoal
		);
	}

	function updateStakeholderField(
		index: number,
		key: 'name' | 'email' | 'relationship',
		value: string
	) {
		stakeholderForms = stakeholderForms.map((stakeholder, stakeIndex) =>
			stakeIndex === index ? { ...stakeholder, [key]: value } : stakeholder
		);
	}

	function addStakeholderField() {
		if (stakeholderForms.length >= maxStakeholderFields) return;
		stakeholderForms = [...stakeholderForms, { name: '', email: '', relationship: '' }];
	}

	function resetSubgoals() {
		subgoalForms = Array.from({ length: minSubgoalFields }, () => ({
			label: '',
			description: ''
		}));
	}

	function resetStakeholders() {
		stakeholderForms = Array.from({ length: minStakeholderFields }, () => ({
			name: '',
			email: '',
			relationship: ''
		}));
	}

	function startCustomBuild() {
		appliedObjectiveId = null;
		selectedContextId = null;
		selectedContext = null;
		expandedObjectiveId = null;
		objectiveTitle = '';
		objectiveDescription = '';
		cycleLabel = '';
		cycleStartDate = data.defaults.startDate;
		cycleDurationWeeks = String(data.defaults.durationWeeks);
		resetSubgoals();
		resetStakeholders();
	}

	function toggleObjective(contextId: string, objectiveId: string) {
		if (selectedContextId !== contextId) {
			selectContext(contextId);
		}
		expandedObjectiveId = expandedObjectiveId === objectiveId ? null : objectiveId;
	}

	function applyObjective(contextId: string, template: ObjectiveTemplate) {
		selectContext(contextId);
		appliedObjectiveId = template.id;
		expandedObjectiveId = template.id;
		const composedDescription = `${template.description}\n\n${template.contextSummary}`.trim();
		objectiveTitle = template.title;
		objectiveDescription = composedDescription;
		const prefilled = template.subgoals.slice(0, minSubgoalFields);
		subgoalForms = Array.from({ length: minSubgoalFields }, (_, index) => ({
			label: prefilled[index]?.label ?? '',
			description: prefilled[index]?.description ?? ''
		}));
	}

	function addSubgoalToForm(subgoal: SubgoalTemplate) {
		const emptyIndex = subgoalForms.findIndex((entry) => entry.label.trim().length === 0);
		if (emptyIndex !== -1) {
			updateSubgoalField(emptyIndex, 'label', subgoal.label);
			updateSubgoalField(emptyIndex, 'description', subgoal.description ?? '');
			return;
		}
		updateSubgoalField(subgoalForms.length - 1, 'label', subgoal.label);
		updateSubgoalField(subgoalForms.length - 1, 'description', subgoal.description ?? '');
	}

	const getError = (path: string) => errors[path]?.[0];

	$: selectedContext =
		selectedContextId !== null
			? contexts.find((context) => context.id === selectedContextId) ?? null
			: null;
	$: cycleDurationNumber = Number(cycleDurationWeeks) || data.defaults.durationWeeks;
</script>

<section class="mx-auto max-w-6xl space-y-8 pb-12">
	<header class="space-y-2">
		<h1 class="text-2xl font-semibold">Let's set up your first cycle</h1>
		<p class="text-neutral-600">
			Welcome{data.user.name ? `, ${data.user.name}` : ''}! Choose a development focus, define measurable subgoals,
			and line up stakeholders who can observe your growth.
		</p>
	</header>

	<div class="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
		<div class="space-y-6">
			<section class="space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
				<h2 class="text-lg font-semibold">How the onboarding flow works</h2>
				<p class="text-sm text-neutral-600">
					Objectives articulate the bigger leadership capability you want to grow. Subgoals translate that
					ambition into observable behaviors or metrics so you and your stakeholders can rate progress, reflect
					on concrete moments, and give actionable feedback. Stakeholders amplify growth with accountability,
					perspective, and real-world stories.
				</p>
				<ul class="list-disc space-y-2 pl-5 text-sm text-neutral-600">
					<li>
						<strong>Objectives</strong> clarify the outcome you want and why it matters right now.
					</li>
					<li>
						<strong>Subgoals (3)</strong> should be measurable or observable—frequency, timing, or quality cues
						someone else can confirm.
					</li>
					<li>
						<strong>Stakeholders (3–5)</strong> offer perspective, spot blind spots, and celebrate wins. Choose
						people who regularly see the behaviors you’re focusing on.
					</li>
				</ul>
			</section>

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
							value={objectiveTitle}
							oninput={(event) => (objectiveTitle = event.currentTarget.value)}
						/>
						{#if getError('objectiveTitle')}
							<p class="text-sm text-red-600">{getError('objectiveTitle')}</p>
						{/if}
					</div>
					<div class="space-y-1">
						<label class="block text-sm font-medium" for="objectiveDescription">Description</label>
						<textarea
							id="objectiveDescription"
							name="objectiveDescription"
							rows="4"
							class="w-full rounded border border-neutral-300 px-3 py-2"
							oninput={(event) => (objectiveDescription = event.currentTarget.value)}
						>{objectiveDescription}</textarea>
						{#if getError('objectiveDescription')}
							<p class="text-sm text-red-600">{getError('objectiveDescription')}</p>
						{/if}
					</div>
				</section>

				<section class="space-y-3">
					<h2 class="text-lg font-semibold">Subgoals</h2>
					<p class="text-sm text-neutral-500">
						Define three behaviorally observable subgoals. Capture what success looks like so you can rate
						progress or invite feedback.
					</p>
					{#if getError('subgoals')}
						<p class="text-sm font-medium text-red-600">{getError('subgoals')}</p>
					{/if}
					<div class="space-y-4">
						{#each subgoalForms as subgoal, index}
							<div class="space-y-3 rounded-lg border border-neutral-200 p-4">
								<div class="flex items-baseline justify-between gap-2">
									<p class="text-sm font-semibold text-neutral-900">Subgoal {index + 1}</p>
								</div>
								<div class="space-y-1">
									<label class="block text-sm font-medium" for={`subgoalLabel${index + 1}`}
										>Label</label
									>
									<input
										id={`subgoalLabel${index + 1}`}
										name={`subgoalLabel${index + 1}`}
										type="text"
										required={index === 0}
										class="w-full rounded border border-neutral-300 px-3 py-2"
										value={subgoal.label}
										oninput={(event) =>
											updateSubgoalField(index, 'label', event.currentTarget.value)}
									/>
									{#if getError(`subgoals.${index}.label`)}
										<p class="text-sm text-red-600">{getError(`subgoals.${index}.label`)}</p>
									{/if}
								</div>
								<div class="space-y-1">
									<label class="block text-sm font-medium" for={`subgoalDescription${index + 1}`}
										>Description</label
									>
									<textarea
										id={`subgoalDescription${index + 1}`}
										name={`subgoalDescription${index + 1}`}
										rows="3"
										class="w-full rounded border border-neutral-300 px-3 py-2"
										oninput={(event) =>
											updateSubgoalField(index, 'description', event.currentTarget.value)}
									>{subgoal.description}</textarea>
									{#if getError(`subgoals.${index}.description`)}
										<p class="text-sm text-red-600">
											{getError(`subgoals.${index}.description`)}
										</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</section>

				<section class="space-y-3">
					<h2 class="text-lg font-semibold">Cycle planning</h2>
					<p class="text-sm text-neutral-500">We’ll schedule check-ins across your first growth cycle.</p>
					<div class="grid gap-4 sm:grid-cols-2">
						<div class="space-y-1">
							<label class="block text-sm font-medium" for="cycleLabel">Cycle label</label>
							<input
								id="cycleLabel"
								name="cycleLabel"
								type="text"
								placeholder="e.g. Q1 2026 Cycle"
								class="w-full rounded border border-neutral-300 px-3 py-2"
								value={cycleLabel}
								oninput={(event) => (cycleLabel = event.currentTarget.value)}
							/>
							{#if getError('cycleLabel')}
								<p class="text-sm text-red-600">{getError('cycleLabel')}</p>
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
								value={cycleStartDate}
								oninput={(event) => (cycleStartDate = event.currentTarget.value)}
							/>
							{#if getError('cycleStartDate')}
								<p class="text-sm text-red-600">{getError('cycleStartDate')}</p>
							{/if}
						</div>
						<div class="space-y-1">
							<label class="block text-sm font-medium" for="cycleDurationWeeks">Duration (weeks)</label>
							<select
								id="cycleDurationWeeks"
								name="cycleDurationWeeks"
								class="w-full rounded border border-neutral-300 px-3 py-2"
								value={cycleDurationWeeks}
								onchange={(event) => (cycleDurationWeeks = event.currentTarget.value)}
							>
								{#each cycleOptions as option (option)}
									<option value={option}>{option} weeks</option>
								{/each}
							</select>
							{#if getError('cycleDurationWeeks')}
								<p class="text-sm text-red-600">{getError('cycleDurationWeeks')}</p>
							{/if}
						</div>
					</div>
					<p class="text-xs text-neutral-400">
						We’ll set the end date to {cycleDurationNumber * 7} days after your selected start.
					</p>
				</section>

				<section class="space-y-3">
					<h2 class="text-lg font-semibold">Stakeholders (optional)</h2>
					<p class="text-sm text-neutral-500">
						Invite 3–5 people who observe you regularly. We’ll nudge them for feedback once your cycle starts.
					</p>
					{#if getError('stakeholders')}
						<p class="text-sm font-medium text-red-600">{getError('stakeholders')}</p>
					{/if}
					<div class="space-y-4">
						{#each stakeholderForms as stakeholder, index}
							<div class="grid gap-4 rounded-lg border border-neutral-200 p-4 sm:grid-cols-2">
								<div class="space-y-1">
									<label class="block text-sm font-medium" for={`stakeholderName${index + 1}`}
										>Name</label
									>
									<input
										id={`stakeholderName${index + 1}`}
										name={`stakeholderName${index + 1}`}
										type="text"
										class="w-full rounded border border-neutral-300 px-3 py-2"
										value={stakeholder.name}
										oninput={(event) =>
											updateStakeholderField(index, 'name', event.currentTarget.value)}
									/>
									{#if getError(`stakeholders.${index}.name`)}
										<p class="text-sm text-red-600">{getError(`stakeholders.${index}.name`)}</p>
									{/if}
								</div>
								<div class="space-y-1">
									<label class="block text-sm font-medium" for={`stakeholderEmail${index + 1}`}
										>Email</label
									>
									<input
										id={`stakeholderEmail${index + 1}`}
										name={`stakeholderEmail${index + 1}`}
										type="email"
										class="w-full rounded border border-neutral-300 px-3 py-2"
										value={stakeholder.email}
										oninput={(event) =>
											updateStakeholderField(index, 'email', event.currentTarget.value)}
									/>
									{#if getError(`stakeholders.${index}.email`)}
										<p class="text-sm text-red-600">{getError(`stakeholders.${index}.email`)}</p>
									{/if}
								</div>
								<div class="space-y-1 sm:col-span-2">
									<label class="block text-sm font-medium" for={`stakeholderRelationship${index + 1}`}
										>Relationship</label
									>
									<input
										id={`stakeholderRelationship${index + 1}`}
										name={`stakeholderRelationship${index + 1}`}
										type="text"
										placeholder="e.g. direct manager, peer, direct report"
										class="w-full rounded border border-neutral-300 px-3 py-2"
										value={stakeholder.relationship}
										oninput={(event) =>
											updateStakeholderField(index, 'relationship', event.currentTarget.value)}
									/>
									{#if getError(`stakeholders.${index}.relationship`)}
										<p class="text-sm text-red-600">
											{getError(`stakeholders.${index}.relationship`)}
										</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
					<button
						type="button"
						class="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:cursor-not-allowed disabled:text-neutral-400"
						disabled={stakeholderForms.length >= maxStakeholderFields}
						onclick={addStakeholderField}
					>
						Add another stakeholder
					</button>
				</section>

				<div class="flex justify-end">
					<button type="submit" class="rounded bg-black px-4 py-2 font-medium text-white">
						Save and continue
					</button>
				</div>
			</form>
		</div>

		<aside class="space-y-4 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold">Jumpstart with a preloaded objective</h2>
				<button
					type="button"
					class="text-sm font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-800"
					onclick={startCustomBuild}
				>
					Start from scratch
				</button>
			</div>
			<p class="text-sm text-neutral-500">
				Choose a context to browse curated objectives. Apply one to prefill the form, then tailor the language to
				match your real-world goals.
			</p>

			<div class="flex flex-wrap gap-2">
				{#each contexts as context}
					<button
						type="button"
						class={`rounded-full border px-3 py-1 text-sm font-medium transition ${
							selectedContextId === context.id
								? 'border-black bg-black text-white'
								: 'border-neutral-300 text-neutral-700 hover:border-neutral-500'
						}`}
						onclick={() => selectContext(context.id)}
					>
						{context.title}
					</button>
				{/each}
			</div>

			{#if selectedContext}
				<div class="space-y-4">
					{#each selectedContext.objectives as objective}
						<article
							class={`space-y-3 rounded-lg border p-4 shadow-sm transition ${
								appliedObjectiveId === objective.id ? 'border-black bg-neutral-50' : 'border-neutral-200'
							}`}
						>
							<div class="space-y-2">
								<div class="space-y-1">
									<h3 class="text-sm font-semibold text-neutral-900">{objective.title}</h3>
									<p class="text-sm text-neutral-600">{objective.description}</p>
								</div>
								<div class="flex flex-wrap gap-2">
									<button
										type="button"
										class="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white"
										onclick={() => applyObjective(selectedContext.id, objective)}
									>
										Use this objective
									</button>
									<button
										type="button"
										class="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700 hover:border-neutral-500"
										onclick={() => toggleObjective(selectedContext.id, objective.id)}
									>
										{expandedObjectiveId === objective.id ? 'Hide details' : 'View details'}
									</button>
								</div>
							</div>

							{#if expandedObjectiveId === objective.id}
								<div class="space-y-3 rounded border border-dashed border-neutral-200 bg-neutral-50 p-3">
									<p class="text-xs font-medium uppercase tracking-wide text-neutral-500">
										Behavioral subgoals
									</p>
									<p class="text-xs text-neutral-500">
										Each option is observable and measurable. Click to drop it into the subgoal fields,
										then personalize the language.
									</p>
									<div class="space-y-2">
										{#each objective.subgoals as subgoal}
											<div class="space-y-2 rounded border border-neutral-200 bg-white p-3">
												<div class="space-y-1">
													<p class="text-sm font-semibold text-neutral-900">{subgoal.label}</p>
													<p class="text-xs text-neutral-600">{subgoal.description}</p>
												</div>
												<button
													type="button"
													class="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
													onclick={() => addSubgoalToForm(subgoal)}
												>
													Add to form
												</button>
											</div>
										{/each}
									</div>
								</div>
								<div class="space-y-2 text-xs text-neutral-600">
									<p class="font-semibold uppercase tracking-wide text-neutral-500">
										Stakeholder guidance
									</p>
									<p>{objective.stakeholderGuidance.whyItMatters}</p>
									<p>{objective.stakeholderGuidance.recommendedApproach}</p>
									<div class="space-y-1">
										<p class="font-medium text-neutral-500">Recommended roles</p>
										<ul class="list-disc space-y-1 pl-4">
											{#each objective.stakeholderGuidance.recommendedRoles as role}
												<li>{role}</li>
											{/each}
										</ul>
									</div>
									<div class="space-y-1">
										<p class="font-medium text-neutral-500">Example stakeholders</p>
										<div class="flex flex-wrap gap-1">
											{#each objective.stakeholderGuidance.exampleStakeholders as example}
												<span class="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
													{example}
												</span>
											{/each}
										</div>
									</div>
								</div>
							{/if}
						</article>
					{/each}
				</div>
			{/if}
		</aside>
	</div>
</section>
