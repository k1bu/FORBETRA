<svelte:options runes={false} />

<script lang="ts">
	import { onMount } from 'svelte';
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

	const DRAFT_KEY = 'forbetra-onboarding-draft';
	const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

	const contexts = data.contexts;
	const errors = (form?.errors as Record<string, string[]>) ?? {};
	const isEditing = data.isEditing;
	const isPrePopulated = (data as any).isPrePopulated ?? false;
	const existingData = data.existingData;

	let draftRestored = false;
	let restoredDraft: any = null;

	// Restore draft on mount (only if not editing and not pre-populated)
	onMount(() => {
		if (isEditing || isPrePopulated || existingData) return;
		try {
			const raw = localStorage.getItem(DRAFT_KEY);
			if (raw) {
				const draft = JSON.parse(raw);
				if (draft.savedAt && Date.now() - draft.savedAt < DRAFT_MAX_AGE_MS) {
					if (draft.objectiveTitle) objectiveTitle = draft.objectiveTitle;
					if (draft.objectiveDescription) objectiveDescription = draft.objectiveDescription;
					if (draft.cycleLabel) cycleLabel = draft.cycleLabel;
					if (draft.cycleStartDate) cycleStartDate = draft.cycleStartDate;
					if (draft.cycleDurationWeeks) cycleDurationWeeks = draft.cycleDurationWeeks;
					if (draft.checkInFrequency) checkInFrequency = draft.checkInFrequency;
					if (draft.stakeholderCadence) stakeholderCadence = draft.stakeholderCadence;
					if (draft.reminderDays) reminderDays = draft.reminderDays;
					if (typeof draft.revealScores === 'boolean') revealScores = draft.revealScores;
					if (draft.phone) phone = draft.phone;
					if (Array.isArray(draft.subgoalForms) && draft.subgoalForms.length > 0) {
						subgoalForms = draft.subgoalForms;
					}
					if (Array.isArray(draft.stakeholderForms) && draft.stakeholderForms.length > 0) {
						stakeholderForms = draft.stakeholderForms;
					}
					if (draft.currentStep && allSteps.includes(draft.currentStep)) {
						currentStep = draft.currentStep;
						stepHistory = allSteps.slice(0, allSteps.indexOf(draft.currentStep) + 1);
					}
					cycleDurationMode = [8, 12, 16].includes(Number(cycleDurationWeeks)) ? 'preset' : 'custom';
					if (cycleDurationMode === 'custom') customDurationWeeks = cycleDurationWeeks;
					draftRestored = true;
					setTimeout(() => { draftRestored = false; }, 3000);
				} else {
					localStorage.removeItem(DRAFT_KEY);
				}
			}
		} catch {}
	});

	const values = {
		objectiveTitle: form?.values?.objectiveTitle ?? existingData?.objectiveTitle ?? '',
		objectiveDescription: form?.values?.objectiveDescription ?? existingData?.objectiveDescription ?? '',
		subgoals: (form?.values?.subgoals as SubgoalFormValue[] | undefined) ?? existingData?.subgoals ?? [],
		stakeholders: (form?.values?.stakeholders as StakeholderFormValue[] | undefined) ?? existingData?.stakeholders ?? [],
		cycleLabel: form?.values?.cycleLabel ?? existingData?.cycleLabel ?? (form?.values?.objectiveTitle ?? ''),
		cycleStartDate: form?.values?.cycleStartDate ?? existingData?.cycleStartDate ?? data.defaults.startDate,
		cycleDurationWeeks: String(form?.values?.cycleDurationWeeks ?? existingData?.cycleDurationWeeks ?? 12)
	};

	const minSubgoalFields = 3;
	const minStakeholderFields = 3;
	const maxStakeholderFields = 5;

	const initialSubgoalCount = Math.max(values.subgoals.length, minSubgoalFields);
	const initialStakeholderCount = Math.max(values.stakeholders.length, minStakeholderFields);

	let objectiveTitle = values.objectiveTitle;
	let objectiveDescription = values.objectiveDescription;
	let cycleLabel = values.cycleLabel || (values.objectiveTitle || '');
	let cycleStartDate = values.cycleStartDate;
	let cycleDurationWeeks = values.cycleDurationWeeks || '12';
	let cycleDurationMode: 'preset' | 'custom' = [8, 12, 16].includes(Number(cycleDurationWeeks)) ? 'preset' : 'custom';
	let customDurationWeeks = cycleDurationMode === 'custom' ? cycleDurationWeeks : '';
	let reminderDays: 'wednesday_friday' | 'tuesday_thursday' = 'wednesday_friday';
	let checkInFrequency: '3x' | '2x' | '1x' = (existingData?.checkInFrequency as '3x' | '2x' | '1x') ?? '3x';
	let stakeholderCadence: 'weekly' | 'biweekly' = (existingData?.stakeholderCadence as 'weekly' | 'biweekly') ?? 'weekly';
	let revealScores = true;
	let phone = '';

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

	// Step wizard state — 5 steps (science removed)
	type Step = 'welcome' | 'objective' | 'subgoals' | 'cycle' | 'stakeholders';
	const allSteps: Step[] = ['welcome', 'objective', 'subgoals', 'cycle', 'stakeholders'];
	let currentStep: Step = Object.keys(errors).length > 0 ? 'stakeholders' : isEditing ? 'objective' : isPrePopulated ? 'objective' : 'welcome';
	let stepHistory: Step[] = currentStep === 'stakeholders' ? [...allSteps] : (isEditing || isPrePopulated) ? ['objective'] : ['welcome'];

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
		cycleDurationWeeks = '12';
		cycleDurationMode = 'preset';
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
		cycleLabel = template.title;
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
		if (subgoalForms.length < 5) {
			subgoalForms = [...subgoalForms, { label: subgoal.label, description: subgoal.description ?? '' }];
		} else {
			updateSubgoalField(subgoalForms.length - 1, 'label', subgoal.label);
			updateSubgoalField(subgoalForms.length - 1, 'description', subgoal.description ?? '');
		}
	}

	function selectPresetDuration(weeks: number) {
		cycleDurationMode = 'preset';
		cycleDurationWeeks = String(weeks);
		customDurationWeeks = '';
	}

	function enableCustomDuration() {
		cycleDurationMode = 'custom';
		customDurationWeeks = cycleDurationWeeks;
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
				return objectiveTitle.trim().length >= 3 && objectiveDescription.trim().length > 0;
			case 'subgoals':
				return subgoalForms.filter((s) => s.label.trim().length >= 3).length >= minSubgoalFields;
			case 'cycle':
				return cycleLabel.trim().length > 0 && cycleStartDate.length > 0;
			case 'stakeholders':
				return true;
			default:
				return false;
		}
	}

	function nextStep() {
		const currentIndex = allSteps.indexOf(currentStep);
		if (currentIndex < allSteps.length - 1 && canProceedFromStep(currentStep)) {
			goToStep(allSteps[currentIndex + 1]);
		}
	}

	function prevStep() {
		const currentIndex = allSteps.indexOf(currentStep);
		if (currentIndex > 0) {
			goToStep(allSteps[currentIndex - 1]);
		}
	}

	function getDurationGuidance(weeks: number): string {
		if (weeks <= 7) return 'Short sprint — focused skill experiments';
		if (weeks <= 12) return 'Standard — enough time for meaningful patterns';
		if (weeks <= 16) return 'Extended — deeper behavioral shifts';
		return 'Long-arc — major transitions';
	}

	// Draft save/restore
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
	$: draftData = {
		objectiveTitle,
		objectiveDescription,
		cycleLabel,
		cycleStartDate,
		cycleDurationWeeks,
		checkInFrequency,
		stakeholderCadence,
		reminderDays,
		revealScores,
		phone,
		subgoalForms,
		stakeholderForms,
		currentStep,
		savedAt: Date.now()
	};
	$: if (typeof window !== 'undefined' && !isEditing && !isPrePopulated) {
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			try {
				localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
			} catch {}
		}, 1000);
	}

	$: stepProgress = (() => {
		const stepIndex = allSteps.indexOf(currentStep);
		if (stepIndex === 0) return 0;
		return (stepIndex / (allSteps.length - 1)) * 100;
	})();

	const getError = (path: string) => errors[path]?.[0];

	$: selectedContext =
		selectedContextId !== null
			? contexts.find((context) => context.id === selectedContextId) ?? null
			: null;
	$: cycleDurationNumber = Number(cycleDurationWeeks) || data.defaults.durationWeeks;
	$: if (cycleDurationMode === 'custom' && customDurationWeeks) {
		const parsed = Number(customDurationWeeks);
		if (parsed >= 4 && parsed <= 26) {
			cycleDurationWeeks = String(parsed);
		}
	}
	$: canAdvance =
		currentStep === 'objective'
			? objectiveTitle.trim().length >= 3 && objectiveDescription.trim().length > 0
			: currentStep === 'subgoals'
				? subgoalForms.filter((s) => s.label.trim().length >= 3).length >= minSubgoalFields
				: currentStep === 'cycle'
					? cycleLabel.trim().length > 0 && cycleStartDate.length > 0
					: currentStep === 'stakeholders'
						? true
						: false;
	$: if (objectiveTitle.trim().length > 0 && (!cycleLabel || cycleLabel.trim().length === 0)) {
		cycleLabel = objectiveTitle;
	}
	$: endDatePreview = (() => {
		if (!cycleStartDate || !cycleDurationNumber) return '';
		const start = new Date(cycleStartDate);
		if (isNaN(start.getTime())) return '';
		const end = new Date(start);
		end.setDate(end.getDate() + cycleDurationNumber * 7);
		return end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
	})();
	$: weekPreviewDays = (() => {
		const midDay = reminderDays === 'wednesday_friday' ? 'WED' : 'TUE';
		const endDay = reminderDays === 'wednesday_friday' ? 'FRI' : 'THU';
		if (checkInFrequency === '3x') {
			return [
				{ day: 'MON', label: 'Set your intention', time: '~2 min' },
				{ day: midDay, label: 'Rate your effort', time: '~30 sec' },
				{ day: endDay, label: 'Rate your performance', time: '~30 sec' }
			];
		} else if (checkInFrequency === '2x') {
			return [
				{ day: 'MON', label: 'Set your intention', time: '~2 min' },
				{ day: endDay, label: 'Rate effort + performance', time: '~1 min' }
			];
		} else {
			return [
				{ day: endDay, label: 'Weekly reflection', time: '~2 min' }
			];
		}
	})();
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
	{#if draftRestored}
		<div class="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 shadow-lg transition-opacity">
			Draft restored
		</div>
	{/if}
	{#if isPrePopulated}
		<div class="mx-auto max-w-5xl pt-4 px-4">
			<div class="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
				<p class="font-medium">Your coach has pre-filled some details. Feel free to adjust anything below.</p>
			</div>
		</div>
	{/if}
	<section class="mx-auto max-w-5xl space-y-8 pb-12 pt-8">
		<!-- Progress Bar -->
		{#if currentStep !== 'welcome'}
			<div class="mb-8">
				<div class="mb-3 flex items-center justify-between text-sm text-slate-600">
					<span class="font-medium">Step {allSteps.indexOf(currentStep) + 1} of {allSteps.length}</span>
					<span class="text-slate-400">{Math.round(stepProgress)}% complete</span>
				</div>
				<div class="h-2 overflow-hidden rounded-full bg-slate-200">
					<div
						class="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
						style="width: {stepProgress}%"
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
									<h3 class="font-semibold text-slate-900 text-sm md:text-base">Pick your focus</h3>
								</div>
								<p class="text-xs md:text-sm text-slate-600 leading-relaxed pl-[52px]">
									Choose what you want to develop — from curated templates or your own custom objective.
								</p>
							</div>
							<div class="group space-y-3">
								<div class="flex items-center gap-3">
									<div
										class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-lg font-bold text-indigo-600 transition-transform group-hover:scale-110"
									>
										2
									</div>
									<h3 class="font-semibold text-slate-900 text-sm md:text-base">Define success</h3>
								</div>
								<p class="text-xs md:text-sm text-slate-600 leading-relaxed pl-[52px]">
									Break it into 3 behaviors others can observe — the clearer, the better.
								</p>
							</div>
							<div class="group space-y-3">
								<div class="flex items-center gap-3">
									<div
										class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-lg font-bold text-purple-600 transition-transform group-hover:scale-110"
									>
										3
									</div>
									<h3 class="font-semibold text-slate-900 text-sm md:text-base">Set the rhythm</h3>
								</div>
								<p class="text-xs md:text-sm text-slate-600 leading-relaxed pl-[52px]">
									Choose your timeline and invite the people who'll give you honest feedback.
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
				<!-- General form errors -->
				{#if getError('_general')}
					<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
						<p class="font-medium">{getError('_general')}</p>
					</div>
				{/if}
				<!-- Hidden inputs -->
				{#if isEditing && existingData}
					<input type="hidden" name="objectiveId" value={existingData.objectiveId} />
				{/if}
				<input type="hidden" name="reminderDays" value={reminderDays} />
				<input type="hidden" name="checkInFrequency" value={checkInFrequency} />
				<input type="hidden" name="stakeholderCadence" value={stakeholderCadence} />
				<input type="hidden" name="revealScores" value={revealScores ? 'true' : 'false'} />

				<!-- Hidden inputs for all form data when on stakeholders step -->
				{#if currentStep === 'stakeholders'}
					<input type="hidden" name="objectiveTitle" value={objectiveTitle} />
					<input type="hidden" name="objectiveDescription" value={objectiveDescription} />
					<input type="hidden" name="cycleLabel" value={cycleLabel} />
					<input type="hidden" name="cycleStartDate" value={cycleStartDate} />
					<input type="hidden" name="cycleDurationWeeks" value={cycleDurationWeeks} />
					{#each Array.from({ length: 5 }, (_, i) => i) as _, index}
						{@const subgoal = subgoalForms[index] ?? { label: '', description: '' }}
						<input type="hidden" name={`subgoalLabel${index + 1}`} value={subgoal.label} />
						<input type="hidden" name={`subgoalDescription${index + 1}`} value={subgoal.description} />
					{/each}
				{/if}

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
										bind:value={objectiveDescription}
									></textarea>
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
								<h2 class="text-3xl font-bold text-slate-900">Set the rhythm</h2>
								<p class="text-slate-600">
									Choose your timeline and how often you want to check in. We'll build a schedule around your preferences.
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

								<!-- Duration Selector: Preset Cards + Custom -->
								<div class="space-y-3 md:col-span-2">
									<label class="block text-sm font-semibold text-slate-700">Duration</label>
									<input type="hidden" name="cycleDurationWeeks" value={cycleDurationWeeks} />
									<div class="grid grid-cols-4 gap-3">
										{#each [8, 12, 16] as weeks}
											<button
												type="button"
												onclick={() => selectPresetDuration(weeks)}
												class="relative rounded-xl border-2 px-4 py-3 text-center transition-all {cycleDurationMode === 'preset' && cycleDurationWeeks === String(weeks)
													? 'border-blue-500 bg-blue-50 shadow-md'
													: 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'}"
											>
												<div class="text-lg font-bold text-slate-900">{weeks}</div>
												<div class="text-xs text-slate-500">weeks</div>
												{#if weeks === 12}
													<div class="mt-1 text-[10px] font-semibold text-blue-600">recommended</div>
												{/if}
											</button>
										{/each}
										<button
											type="button"
											onclick={enableCustomDuration}
											class="rounded-xl border-2 px-4 py-3 text-center transition-all {cycleDurationMode === 'custom'
												? 'border-blue-500 bg-blue-50 shadow-md'
												: 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'}"
										>
											<div class="text-lg font-bold text-slate-900">?</div>
											<div class="text-xs text-slate-500">Custom</div>
										</button>
									</div>
									{#if cycleDurationMode === 'custom'}
										<div class="flex items-center gap-3">
											<input
												type="number"
												min="4"
												max="26"
												placeholder="4-26"
												class="w-24 rounded-lg border-2 border-slate-300 px-3 py-2 text-center text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
												value={customDurationWeeks}
												oninput={(event) => {
													customDurationWeeks = event.currentTarget.value;
													const parsed = Number(event.currentTarget.value);
													if (parsed >= 4 && parsed <= 26) {
														cycleDurationWeeks = String(parsed);
													}
												}}
											/>
											<span class="text-sm text-slate-600">weeks (4-26)</span>
										</div>
									{/if}
									{#if endDatePreview}
										<p class="text-sm text-slate-500">
											Your cycle will end on <strong>{endDatePreview}</strong>
										</p>
									{/if}
									<p class="text-xs text-slate-400">{getDurationGuidance(cycleDurationNumber)}</p>
									{#if getError('cycleDurationWeeks')}
										<p class="text-sm text-red-600">{getError('cycleDurationWeeks')}</p>
									{/if}
								</div>

								<!-- Check-in Frequency Selector -->
								<div class="space-y-3 md:col-span-2">
									<label class="block text-sm font-semibold text-slate-700">Check-in frequency</label>
									<div class="grid gap-3 md:grid-cols-3">
										<label
											class="group relative flex cursor-pointer rounded-xl border-2 p-4 transition-all {checkInFrequency === '3x'
												? 'border-blue-500 bg-blue-50'
												: 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'}"
										>
											<input
												type="radio"
												name="_checkInFrequencyRadio"
												value="3x"
												checked={checkInFrequency === '3x'}
												onchange={() => (checkInFrequency = '3x')}
												class="sr-only"
											/>
											<div class="flex w-full items-start gap-3">
												<div
													class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {checkInFrequency === '3x'
														? 'border-blue-500 bg-blue-500'
														: 'border-slate-300 bg-white'}"
												>
													{#if checkInFrequency === '3x'}
														<div class="h-2 w-2 rounded-full bg-white"></div>
													{/if}
												</div>
												<div class="flex-1">
													<div class="font-semibold text-slate-900">3x/week</div>
													<div class="text-xs text-slate-500">Monday intention, midweek effort, end-of-week performance</div>
													<div class="mt-1 text-[10px] font-semibold text-blue-600">recommended</div>
												</div>
											</div>
										</label>
										<label
											class="group relative flex cursor-pointer rounded-xl border-2 p-4 transition-all {checkInFrequency === '2x'
												? 'border-blue-500 bg-blue-50'
												: 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'}"
										>
											<input
												type="radio"
												name="_checkInFrequencyRadio"
												value="2x"
												checked={checkInFrequency === '2x'}
												onchange={() => (checkInFrequency = '2x')}
												class="sr-only"
											/>
											<div class="flex w-full items-start gap-3">
												<div
													class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {checkInFrequency === '2x'
														? 'border-blue-500 bg-blue-500'
														: 'border-slate-300 bg-white'}"
												>
													{#if checkInFrequency === '2x'}
														<div class="h-2 w-2 rounded-full bg-white"></div>
													{/if}
												</div>
												<div class="flex-1">
													<div class="font-semibold text-slate-900">2x/week</div>
													<div class="text-xs text-slate-500">Monday intention + end-of-week combined rating</div>
												</div>
											</div>
										</label>
										<label
											class="group relative flex cursor-pointer rounded-xl border-2 p-4 transition-all {checkInFrequency === '1x'
												? 'border-blue-500 bg-blue-50'
												: 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'}"
										>
											<input
												type="radio"
												name="_checkInFrequencyRadio"
												value="1x"
												checked={checkInFrequency === '1x'}
												onchange={() => (checkInFrequency = '1x')}
												class="sr-only"
											/>
											<div class="flex w-full items-start gap-3">
												<div
													class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {checkInFrequency === '1x'
														? 'border-blue-500 bg-blue-500'
														: 'border-slate-300 bg-white'}"
												>
													{#if checkInFrequency === '1x'}
														<div class="h-2 w-2 rounded-full bg-white"></div>
													{/if}
												</div>
												<div class="flex-1">
													<div class="font-semibold text-slate-900">1x/week</div>
													<div class="text-xs text-slate-500">Single weekly reflection covering effort and performance</div>
												</div>
											</div>
										</label>
									</div>

									<!-- Your Week Preview -->
									<div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
										<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Your Week</p>
										<div class="space-y-2">
											{#each weekPreviewDays as item}
												<div class="flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-sm">
													<span class="w-10 shrink-0 font-semibold text-blue-700">{item.day}</span>
													<span class="flex-1 text-slate-700">{item.label}</span>
													<span class="text-xs text-slate-400">{item.time}</span>
												</div>
											{/each}
										</div>
									</div>
								</div>

								<!-- Reminder Days Selector -->
								<div class="space-y-2 md:col-span-2">
									<label class="block text-sm font-semibold text-slate-700" for="reminderDays">
										Feedback Reminder Days
									</label>
									<p class="mb-3 text-sm text-slate-600">
										Choose when you'd like to receive reminders to submit your reflections and when stakeholders will be prompted for feedback.
									</p>
									<div class="grid gap-4 md:grid-cols-2">
										<label
											class="group relative flex cursor-pointer rounded-xl border-2 p-4 transition-all {reminderDays === 'wednesday_friday'
												? 'border-blue-500 bg-blue-50'
												: 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'}"
										>
											<input
												type="radio"
												name="reminderDays"
												value="wednesday_friday"
												checked={reminderDays === 'wednesday_friday'}
												onchange={() => (reminderDays = 'wednesday_friday')}
												class="sr-only"
											/>
											<div class="flex w-full items-center gap-3">
												<div
													class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {reminderDays === 'wednesday_friday'
														? 'border-blue-500 bg-blue-500'
														: 'border-slate-300 bg-white'}"
												>
													{#if reminderDays === 'wednesday_friday'}
														<div class="h-2 w-2 rounded-full bg-white"></div>
													{/if}
												</div>
												<div class="flex-1">
													<div class="font-semibold text-slate-900">Wednesday & Friday</div>
													<div class="text-xs text-slate-600">Default option</div>
												</div>
											</div>
										</label>
										<label
											class="group relative flex cursor-pointer rounded-xl border-2 p-4 transition-all {reminderDays === 'tuesday_thursday'
												? 'border-blue-500 bg-blue-50'
												: 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'}"
										>
											<input
												type="radio"
												name="reminderDays"
												value="tuesday_thursday"
												checked={reminderDays === 'tuesday_thursday'}
												onchange={() => (reminderDays = 'tuesday_thursday')}
												class="sr-only"
											/>
											<div class="flex w-full items-center gap-3">
												<div
													class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {reminderDays === 'tuesday_thursday'
														? 'border-blue-500 bg-blue-500'
														: 'border-slate-300 bg-white'}"
												>
													{#if reminderDays === 'tuesday_thursday'}
														<div class="h-2 w-2 rounded-full bg-white"></div>
													{/if}
												</div>
												<div class="flex-1">
													<div class="font-semibold text-slate-900">Tuesday & Thursday</div>
													<div class="text-xs text-slate-600">Alternative option</div>
												</div>
											</div>
										</label>
									</div>
								</div>

								<!-- Phone for SMS reminders -->
								<div class="mt-6 pt-6 border-t border-slate-200">
									<label class="block text-sm font-semibold text-slate-700" for="phone">
										Phone for SMS reminders <span class="font-normal text-slate-400">(optional)</span>
									</label>
									<p class="mt-1 text-xs text-slate-500 mb-3">
										Get a quick text reminder when it's time for your check-in. We'll never share your number.
									</p>
									<input
										type="tel"
										id="phone"
										name="phone"
										bind:value={phone}
										placeholder="+1 (555) 123-4567"
										class="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
									/>
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

							<!-- Stakeholder feedback context -->
							<div class="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-sm text-slate-700">
								<p class="font-medium text-emerald-900">Why stakeholder feedback?</p>
								<p class="mt-1 text-emerald-800">
									The people around you see things you can't. Their quick ratings (&lt; 60 sec) reveal blind spots and validate progress.
								</p>
							</div>

							<!-- Reveal Scores Toggle -->
							<div class="mb-6">
								<label class="flex items-center gap-3 cursor-pointer">
									<input
										type="checkbox"
										checked={revealScores}
										onchange={() => (revealScores = !revealScores)}
										class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
									/>
									<div>
										<span class="text-sm font-semibold text-slate-700">Allow stakeholders to see my self-scores after they submit feedback</span>
										<p class="text-xs text-slate-500">When enabled, stakeholders see how you rated yourself so they can compare perspectives.</p>
									</div>
								</label>
							</div>

							<!-- Stakeholder Cadence Selector -->
							<div class="mb-6 space-y-3">
								<label class="block text-sm font-semibold text-slate-700">How often should stakeholders rate you?</label>
								<div class="grid gap-3 md:grid-cols-2">
									<label
										class="group relative flex cursor-pointer rounded-xl border-2 p-4 transition-all {stakeholderCadence === 'weekly'
											? 'border-blue-500 bg-blue-50'
											: 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'}"
									>
										<input
											type="radio"
											name="_stakeholderCadenceRadio"
											value="weekly"
											checked={stakeholderCadence === 'weekly'}
											onchange={() => (stakeholderCadence = 'weekly')}
											class="sr-only"
										/>
										<div class="flex w-full items-start gap-3">
											<div
												class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {stakeholderCadence === 'weekly'
													? 'border-blue-500 bg-blue-500'
													: 'border-slate-300 bg-white'}"
											>
												{#if stakeholderCadence === 'weekly'}
													<div class="h-2 w-2 rounded-full bg-white"></div>
												{/if}
											</div>
											<div class="flex-1">
												<div class="font-semibold text-slate-900">Weekly</div>
												<div class="text-xs text-slate-500">Stakeholders rate you every week — most data for insights</div>
												<div class="mt-1 text-[10px] font-semibold text-blue-600">recommended</div>
											</div>
										</div>
									</label>
									<label
										class="group relative flex cursor-pointer rounded-xl border-2 p-4 transition-all {stakeholderCadence === 'biweekly'
											? 'border-blue-500 bg-blue-50'
											: 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'}"
									>
										<input
											type="radio"
											name="_stakeholderCadenceRadio"
											value="biweekly"
											checked={stakeholderCadence === 'biweekly'}
											onchange={() => (stakeholderCadence = 'biweekly')}
											class="sr-only"
										/>
										<div class="flex w-full items-start gap-3">
											<div
												class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {stakeholderCadence === 'biweekly'
													? 'border-blue-500 bg-blue-500'
													: 'border-slate-300 bg-white'}"
											>
												{#if stakeholderCadence === 'biweekly'}
													<div class="h-2 w-2 rounded-full bg-white"></div>
												{/if}
											</div>
											<div class="flex-1">
												<div class="font-semibold text-slate-900">Biweekly</div>
												<div class="text-xs text-slate-500">Every two weeks — less burden on stakeholders</div>
											</div>
										</div>
									</label>
								</div>
							</div>

							{#if getError('stakeholders')}
								<div
									class="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
								>
									<p class="font-medium">{getError('stakeholders')}</p>
								</div>
							{/if}
							{#if getError('_general')}
								<div
									class="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
								>
									<p class="font-medium">{getError('_general')}</p>
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
							class="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition-all disabled:cursor-not-allowed disabled:opacity-60 hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
								{isEditing ? 'Save Changes' : 'Complete Setup'}
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
								class="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all disabled:cursor-not-allowed disabled:opacity-60 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
