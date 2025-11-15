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

	// Step wizard state
	type Step = 'welcome' | 'objective' | 'subgoals' | 'cycle' | 'stakeholders';
	let currentStep: Step = 'welcome';
	let stepHistory: Step[] = ['welcome'];

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
		goToStep('objective');
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
		goToStep('subgoals');
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

	function goToStep(step: Step) {
		if (!stepHistory.includes(step)) {
			stepHistory = [...stepHistory, step];
		}
		currentStep = step;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function canProceedFromStep(step: Step): boolean {
		switch (step) {
			case 'objective':
				return objectiveTitle.trim().length > 0 && objectiveDescription.trim().length > 0;
			case 'subgoals':
				return subgoalForms.filter((s) => s.label.trim().length > 0).length >= minSubgoalFields;
			case 'cycle':
				return cycleLabel.trim().length > 0 && cycleStartDate.length > 0;
			case 'stakeholders':
				return true; // Optional
			default:
				return false;
		}
	}

	function nextStep() {
		const steps: Step[] = ['welcome', 'objective', 'subgoals', 'cycle', 'stakeholders'];
		const currentIndex = steps.indexOf(currentStep);
		if (currentIndex < steps.length - 1 && canProceedFromStep(currentStep)) {
			goToStep(steps[currentIndex + 1]);
		}
	}

	function prevStep() {
		const steps: Step[] = ['welcome', 'objective', 'subgoals', 'cycle', 'stakeholders'];
		const currentIndex = steps.indexOf(currentStep);
		if (currentIndex > 0) {
			goToStep(steps[currentIndex - 1]);
		}
	}

	function getStepProgress(): number {
		const steps: Step[] = ['welcome', 'objective', 'subgoals', 'cycle', 'stakeholders'];
		return ((steps.indexOf(currentStep) + 1) / steps.length) * 100;
	}

	const getError = (path: string) => errors[path]?.[0];

	$: selectedContext =
		selectedContextId !== null
			? contexts.find((context) => context.id === selectedContextId) ?? null
			: null;
	$: cycleDurationNumber = Number(cycleDurationWeeks) || data.defaults.durationWeeks;
	$: canAdvance = canProceedFromStep(currentStep);
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
	<section class="mx-auto max-w-5xl space-y-8 pb-12 pt-8">
		<!-- Progress Bar -->
		{#if currentStep !== 'welcome'}
			<div class="mb-8">
				<div class="mb-3 flex items-center justify-between text-sm text-slate-600">
					<span class="font-medium">Step {['welcome', 'objective', 'subgoals', 'cycle', 'stakeholders'].indexOf(currentStep)} of 4</span>
					<span class="text-slate-400">{Math.round(getStepProgress())}% complete</span>
				</div>
				<div class="h-2 overflow-hidden rounded-full bg-slate-200">
					<div
						class="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
						style="width: {getStepProgress()}%"
					></div>
				</div>
			</div>
		{/if}

		<!-- Welcome Step -->
		{#if currentStep === 'welcome'}
			<div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
				<div class="mx-auto max-w-4xl text-center space-y-8 py-8">
					<div class="space-y-3">
						<h1 class="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
							Welcome{data.user.name ? `, ${data.user.name}` : ''}! 👋
						</h1>
						<p class="text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
							Let's set up your first growth cycle. We'll help you define clear objectives, break them into
							observable behaviors, and gather feedback from people who see you in action.
						</p>
					</div>

					<div class="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-6 md:p-8 shadow-lg">
						<h2 class="mb-4 text-base font-semibold text-slate-700 uppercase tracking-wide">Here's how it works</h2>
						<div class="grid gap-6 text-left md:grid-cols-3">
							<div class="group space-y-3">
								<div class="flex items-center gap-3">
									<div
										class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-lg font-bold text-blue-600 transition-transform group-hover:scale-110"
									>
										1
									</div>
									<h3 class="font-semibold text-slate-900 text-sm md:text-base">Define Your Objective</h3>
								</div>
								<p class="text-xs md:text-sm text-slate-600 leading-relaxed pl-[52px]">
									Choose a development focus that matters to you right now. We have curated templates to
									inspire you, or start from scratch.
								</p>
							</div>
							<div class="group space-y-3">
								<div class="flex items-center gap-3">
									<div
										class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-lg font-bold text-indigo-600 transition-transform group-hover:scale-110"
									>
										2
									</div>
									<h3 class="font-semibold text-slate-900 text-sm md:text-base">Set Observable Subgoals</h3>
								</div>
								<p class="text-xs md:text-sm text-slate-600 leading-relaxed pl-[52px]">
									Break your objective into 3 measurable behaviors that others can observe and provide
									feedback on.
								</p>
							</div>
							<div class="group space-y-3">
								<div class="flex items-center gap-3">
									<div
										class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-lg font-bold text-purple-600 transition-transform group-hover:scale-110"
									>
										3
									</div>
									<h3 class="font-semibold text-slate-900 text-sm md:text-base">Invite Stakeholders</h3>
								</div>
								<p class="text-xs md:text-sm text-slate-600 leading-relaxed pl-[52px]">
									Add 3-5 people who regularly see you in action. They'll provide valuable perspective on your
									growth journey.
								</p>
							</div>
						</div>
					</div>

					<button
						type="button"
						onclick={() => goToStep('objective')}
						class="group mx-auto inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3.5 text-base md:text-lg font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					>
						Get Started
						<svg
							class="h-5 w-5 transition-transform group-hover:translate-x-1"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 7l5 5m0 0l-5 5m5-5H6"
							></path>
						</svg>
					</button>
				</div>
			</div>
		{/if}

		<!-- Step Content Container -->
		{#if currentStep !== 'welcome'}
			<div class="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
			<form method="post" class="space-y-8">
				<!-- Objective Step -->
				{#if currentStep === 'objective'}
					<div class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
						<div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
							<div class="mb-6 space-y-2">
								<h2 class="text-3xl font-bold text-slate-900">What do you want to develop?</h2>
								<p class="text-slate-600">
									Start with a clear objective that matters to you right now. Choose from our curated
									templates or create your own.
								</p>
							</div>

							<div class="space-y-6">
								<div class="space-y-2">
									<label
										class="flex items-center gap-2 text-sm font-semibold text-slate-700"
										for="objectiveTitle"
									>
										<span>Objective Title</span>
										{#if objectiveTitle.trim().length > 0}
											<span
												class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs text-green-600"
												title="Great! You've added a title"
											>
												✓
											</span>
										{/if}
									</label>
									<input
										id="objectiveTitle"
										name="objectiveTitle"
										type="text"
										required
										placeholder="e.g., Enhance strategic thinking"
										class="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
										value={objectiveTitle}
										oninput={(event) => (objectiveTitle = event.currentTarget.value)}
									/>
									{#if getError('objectiveTitle')}
										<p class="text-sm text-red-600">{getError('objectiveTitle')}</p>
									{:else if objectiveTitle.trim().length > 0}
										<p class="text-sm text-green-600">✓ Looks great!</p>
									{/if}
								</div>

								<div class="space-y-2">
									<label
										class="flex items-center gap-2 text-sm font-semibold text-slate-700"
										for="objectiveDescription"
									>
										<span>Description</span>
										{#if objectiveDescription.trim().length > 20}
											<span
												class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs text-green-600"
												title="Excellent description"
											>
												✓
											</span>
										{/if}
									</label>
									<textarea
										id="objectiveDescription"
										name="objectiveDescription"
										rows="5"
										placeholder="Describe what this objective means to you and why it matters right now..."
										class="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
										oninput={(event) => (objectiveDescription = event.currentTarget.value)}
									>{objectiveDescription}</textarea>
									{#if getError('objectiveDescription')}
										<p class="text-sm text-red-600">{getError('objectiveDescription')}</p>
									{:else if objectiveDescription.trim().length > 20}
										<p class="text-sm text-green-600">
											✓ {objectiveDescription.trim().length} characters — well articulated!
										</p>
									{:else if objectiveDescription.trim().length > 0}
										<p class="text-sm text-slate-500">
											Add a bit more detail to help stakeholders understand your objective ({objectiveDescription.trim().length}/20+)
										</p>
									{/if}
								</div>

								<div
									class="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-sm text-slate-700"
								>
									<p class="font-medium text-blue-900">💡 Tip:</p>
									<p class="mt-1 text-blue-800">
										Be specific about the impact you want. Instead of "be a better leader," try "communicate
										decisions clearly and inspire my team to take ownership."
									</p>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Subgoals Step -->
				{#if currentStep === 'subgoals'}
					<div class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
						<div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
							<div class="mb-6 space-y-2">
								<h2 class="text-3xl font-bold text-slate-900">Break it down into behaviors</h2>
								<p class="text-slate-600">
									Define 3 observable subgoals that others can see and provide feedback on. Think: What
									would someone notice if you were succeeding?
								</p>
							</div>

							{#if getError('subgoals')}
								<div
									class="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
								>
									<p class="font-medium">{getError('subgoals')}</p>
								</div>
							{/if}

							<div class="space-y-6">
								{#each subgoalForms as subgoal, index}
									<div
										class="group relative rounded-xl border-2 p-6 transition-all {subgoal.label.trim().length > 0
											? 'border-green-200 bg-green-50/30'
											: 'border-slate-200 bg-slate-50/50'} hover:border-blue-300 hover:shadow-md"
									>
										<div class="mb-4 flex items-center justify-between">
											<div class="flex items-center gap-3">
												<div
													class="flex h-8 w-8 items-center justify-center rounded-lg {subgoal.label.trim().length > 0
														? 'bg-green-100 text-green-700'
														: 'bg-slate-200 text-slate-500'} font-bold transition-colors"
												>
													{index + 1}
												</div>
												<h3 class="font-semibold text-slate-900">
													Subgoal {index + 1}
													{#if subgoal.label.trim().length > 0}
														<span class="ml-2 text-green-600">✓</span>
													{/if}
												</h3>
											</div>
										</div>

										<div class="space-y-4">
											<div class="space-y-2">
												<label
													class="block text-sm font-medium text-slate-700"
													for={`subgoalLabel${index + 1}`}
												>
													What behavior will you demonstrate?
												</label>
												<input
													id={`subgoalLabel${index + 1}`}
													name={`subgoalLabel${index + 1}`}
													type="text"
													required={index === 0}
													placeholder="e.g., Run structured strategic reviews"
													class="w-full rounded-lg border-2 border-slate-300 px-4 py-3 text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
													value={subgoal.label}
													oninput={(event) =>
														updateSubgoalField(index, 'label', event.currentTarget.value)}
												/>
												{#if getError(`subgoals.${index}.label`)}
													<p class="text-sm text-red-600">{getError(`subgoals.${index}.label`)}</p>
												{/if}
											</div>

											<div class="space-y-2">
												<label
													class="block text-sm font-medium text-slate-700"
													for={`subgoalDescription${index + 1}`}
												>
													How will someone know you're succeeding?
												</label>
												<textarea
													id={`subgoalDescription${index + 1}`}
													name={`subgoalDescription${index + 1}`}
													rows="3"
													placeholder="Describe what success looks like — make it observable and measurable..."
													class="w-full rounded-lg border-2 border-slate-300 px-4 py-3 text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
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
									</div>
								{/each}

								<div
									class="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 text-sm text-slate-700"
								>
									<p class="font-medium text-indigo-900">💡 Make it observable:</p>
									<p class="mt-1 text-indigo-800">
										Good subgoals are things others can see or measure. Instead of "be more strategic," try
										"document strategic implications before major decisions" — stakeholders can observe and
										confirm this.
									</p>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Cycle Planning Step -->
				{#if currentStep === 'cycle'}
					<div class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
						<div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
							<div class="mb-6 space-y-2">
								<h2 class="text-3xl font-bold text-slate-900">Plan your cycle</h2>
								<p class="text-slate-600">
									Set the timeline for your growth journey. We'll schedule regular check-ins to track your
									progress.
								</p>
							</div>

							<div class="grid gap-6 md:grid-cols-2">
								<div class="space-y-2">
									<label class="block text-sm font-semibold text-slate-700" for="cycleLabel">
										Cycle Name
									</label>
									<input
										id="cycleLabel"
										name="cycleLabel"
										type="text"
										placeholder="e.g. Q1 2026 Leadership Cycle"
										class="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
										value={cycleLabel}
										oninput={(event) => (cycleLabel = event.currentTarget.value)}
									/>
									{#if getError('cycleLabel')}
										<p class="text-sm text-red-600">{getError('cycleLabel')}</p>
									{/if}
								</div>

								<div class="space-y-2">
									<label class="block text-sm font-semibold text-slate-700" for="cycleStartDate">
										Start Date
									</label>
									<input
										id="cycleStartDate"
										name="cycleStartDate"
										type="date"
										required
										class="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
										value={cycleStartDate}
										oninput={(event) => (cycleStartDate = event.currentTarget.value)}
									/>
									{#if getError('cycleStartDate')}
										<p class="text-sm text-red-600">{getError('cycleStartDate')}</p>
									{/if}
								</div>

								<div class="space-y-2 md:col-span-2">
									<label class="block text-sm font-semibold text-slate-700" for="cycleDurationWeeks">
										Duration
									</label>
									<select
										id="cycleDurationWeeks"
										name="cycleDurationWeeks"
										class="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
										value={cycleDurationWeeks}
										onchange={(event) => (cycleDurationWeeks = event.currentTarget.value)}
									>
										{#each cycleOptions as option (option)}
											<option value={option}>{option} weeks</option>
										{/each}
									</select>
									<p class="text-sm text-slate-500">
										Your cycle will end {cycleDurationNumber * 7} days after your start date. We recommend
										12 weeks for meaningful progress.
									</p>
									{#if getError('cycleDurationWeeks')}
										<p class="text-sm text-red-600">{getError('cycleDurationWeeks')}</p>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Stakeholders Step -->
				{#if currentStep === 'stakeholders'}
					<div class="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
						<div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
							<div class="mb-6 space-y-2">
								<h2 class="text-3xl font-bold text-slate-900">Invite your stakeholders</h2>
								<p class="text-slate-600">
									Add 3-5 people who regularly observe you in action. They'll provide feedback on your
									progress throughout the cycle. This step is optional — you can add them later.
								</p>
							</div>

							{#if getError('stakeholders')}
								<div
									class="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
								>
									<p class="font-medium">{getError('stakeholders')}</p>
								</div>
							{/if}

							<div class="space-y-5">
								{#each stakeholderForms as stakeholder, index}
									<div
										class="group rounded-xl border-2 border-slate-200 bg-slate-50/50 p-6 transition-all hover:border-blue-300 hover:shadow-md"
									>
										<div class="mb-4 flex items-center gap-3">
											<div
												class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold"
											>
												{index + 1}
											</div>
											<h3 class="font-semibold text-slate-900">Stakeholder {index + 1}</h3>
										</div>

										<div class="grid gap-4 md:grid-cols-2">
											<div class="space-y-2">
												<label
													class="block text-sm font-medium text-slate-700"
													for={`stakeholderName${index + 1}`}
												>
													Name
												</label>
												<input
													id={`stakeholderName${index + 1}`}
													name={`stakeholderName${index + 1}`}
													type="text"
													placeholder="John Smith"
													class="w-full rounded-lg border-2 border-slate-300 px-4 py-2 text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
													value={stakeholder.name}
													oninput={(event) =>
														updateStakeholderField(index, 'name', event.currentTarget.value)}
												/>
												{#if getError(`stakeholders.${index}.name`)}
													<p class="text-sm text-red-600">{getError(`stakeholders.${index}.name`)}</p>
												{/if}
											</div>

											<div class="space-y-2">
												<label
													class="block text-sm font-medium text-slate-700"
													for={`stakeholderEmail${index + 1}`}
												>
													Email
												</label>
												<input
													id={`stakeholderEmail${index + 1}`}
													name={`stakeholderEmail${index + 1}`}
													type="email"
													placeholder="john@example.com"
													class="w-full rounded-lg border-2 border-slate-300 px-4 py-2 text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
													value={stakeholder.email}
													oninput={(event) =>
														updateStakeholderField(index, 'email', event.currentTarget.value)}
												/>
												{#if getError(`stakeholders.${index}.email`)}
													<p class="text-sm text-red-600">{getError(`stakeholders.${index}.email`)}</p>
												{/if}
											</div>

											<div class="space-y-2 md:col-span-2">
												<label
													class="block text-sm font-medium text-slate-700"
													for={`stakeholderRelationship${index + 1}`}
												>
													Relationship
												</label>
												<input
													id={`stakeholderRelationship${index + 1}`}
													name={`stakeholderRelationship${index + 1}`}
													type="text"
													placeholder="e.g. direct manager, peer, direct report"
													class="w-full rounded-lg border-2 border-slate-300 px-4 py-2 text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
													value={stakeholder.relationship}
													oninput={(event) =>
														updateStakeholderField(
															index,
															'relationship',
															event.currentTarget.value
														)}
												/>
												{#if getError(`stakeholders.${index}.relationship`)}
													<p class="text-sm text-red-600">
														{getError(`stakeholders.${index}.relationship`)}
													</p>
												{/if}
											</div>
										</div>
									</div>
								{/each}

								{#if stakeholderForms.length < maxStakeholderFields}
									<button
										type="button"
										onclick={addStakeholderField}
										class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition-all hover:border-blue-400 hover:bg-blue-50"
									>
										<svg
											class="h-5 w-5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 4v16m8-8H4"
											></path>
										</svg>
										Add another stakeholder
									</button>
								{/if}

								<div
									class="rounded-xl border border-purple-200 bg-purple-50/50 p-4 text-sm text-slate-700"
								>
									<p class="font-medium text-purple-900">💡 Choosing stakeholders:</p>
									<p class="mt-1 text-purple-800">
										Pick people who regularly see the behaviors you're working on. This could include your
										manager, peers, direct reports, or mentors. They'll receive periodic requests for
										feedback throughout your cycle.
									</p>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Navigation Buttons -->
				<div class="flex items-center justify-between gap-4 pt-6">
						<button
							type="button"
							onclick={prevStep}
							disabled={currentStep === 'objective'}
							class="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 19l-7-7 7-7"
								></path>
							</svg>
							Back
						</button>

						{#if currentStep === 'stakeholders'}
							<button
								type="submit"
								class="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
							>
								Complete Setup
								<svg
									class="h-5 w-5 transition-transform group-hover:translate-x-1"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									></path>
								</svg>
							</button>
						{:else}
							<button
								type="button"
								onclick={nextStep}
								disabled={!canAdvance}
								class="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
							>
								Continue
								<svg
									class="h-5 w-5 transition-transform group-hover:translate-x-1"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 7l5 5m0 0l-5 5m5-5H6"
									></path>
								</svg>
							</button>
						{/if}
					</div>
			</form>

				<!-- Preloaded Objectives Sidebar -->
				{#if currentStep === 'objective'}
					<aside class="sticky top-8 h-fit space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<h2 class="text-xl font-bold text-slate-900">Browse Templates</h2>
							<button
								type="button"
								onclick={startCustomBuild}
								class="text-sm font-medium text-blue-600 underline-offset-4 hover:text-blue-700 hover:underline"
							>
								Start from scratch
							</button>
						</div>
						<p class="text-sm text-slate-600">
							Choose a context to explore curated objectives. Click "Use this objective" to automatically fill
							the form, then customize it to match your goals.
						</p>

						<div class="flex flex-wrap gap-2">
							{#each contexts as context}
								<button
									type="button"
									class={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all ${
										selectedContextId === context.id
											? 'border-blue-500 bg-blue-500 text-white shadow-md'
											: 'border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
									}`}
									onclick={() => selectContext(context.id)}
								>
									{context.title}
								</button>
							{/each}
						</div>
					</div>

					{#if selectedContext}
						<div class="space-y-4">
							{#each selectedContext.objectives as objective}
								<article
									class={`group rounded-xl border-2 p-5 shadow-sm transition-all ${
										appliedObjectiveId === objective.id
											? 'border-green-500 bg-green-50 shadow-md'
											: 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
									}`}
								>
									<div class="space-y-3">
										<div class="space-y-2">
											<h3 class="font-bold text-slate-900">{objective.title}</h3>
											<p class="text-sm text-slate-600 leading-relaxed">{objective.description}</p>
										</div>
										<div class="flex flex-wrap gap-2">
											<button
												type="button"
												class={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
													appliedObjectiveId === objective.id
														? 'bg-green-600 text-white'
														: 'bg-blue-600 text-white hover:bg-blue-700'
												}`}
												onclick={() => selectedContext && applyObjective(selectedContext.id, objective)}
											>
												{appliedObjectiveId === objective.id ? '✓ Applied' : 'Use this objective'}
											</button>
											<button
												type="button"
												class="rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-blue-400 hover:bg-blue-50"
												onclick={() => selectedContext && toggleObjective(selectedContext.id, objective.id)}
											>
												{expandedObjectiveId === objective.id ? 'Hide details' : 'View details'}
											</button>
										</div>
									</div>

									{#if expandedObjectiveId === objective.id}
										<div class="mt-4 space-y-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
											<div>
												<p class="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
													Behavioral Subgoals
												</p>
												<p class="mb-3 text-xs text-slate-600">
													Click any subgoal to add it to your form, then customize it to your needs.
												</p>
												<div class="space-y-2">
													{#each objective.subgoals as subgoal}
														<button
															type="button"
															onclick={() => addSubgoalToForm(subgoal)}
															class="group w-full rounded-lg border-2 border-slate-200 bg-white p-3 text-left transition-all hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm"
														>
															<p class="font-semibold text-slate-900 group-hover:text-blue-700">
																{subgoal.label}
															</p>
															<p class="mt-1 text-xs text-slate-600">{subgoal.description}</p>
														</button>
													{/each}
												</div>
											</div>
											<div class="rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs">
												<p class="font-semibold text-blue-900">Stakeholder Guidance</p>
												<p class="mt-2 text-blue-800">{objective.stakeholderGuidance.whyItMatters}</p>
												<p class="mt-2 text-blue-800">{objective.stakeholderGuidance.recommendedApproach}</p>
												<div class="mt-3 space-y-2">
													<p class="font-semibold text-blue-900">Recommended roles:</p>
													<ul class="list-disc space-y-1 pl-4 text-blue-800">
														{#each objective.stakeholderGuidance.recommendedRoles as role}
															<li>{role}</li>
														{/each}
													</ul>
												</div>
											</div>
										</div>
									{/if}
								</article>
							{/each}
						</div>
					{/if}
					</aside>
				{/if}
			</div>
		{/if}
	</section>
</div>
