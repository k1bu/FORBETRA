<svelte:options runes={false} />

<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteDate } from 'svelte/reactivity';
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
	type StakeholderFormValue = { name: string; email: string; relationship: string; phone: string };

	const DRAFT_KEY = 'forbetra-onboarding-draft';
	const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

	const contexts = data.contexts;
	const errors = (form?.errors as Record<string, string[]>) ?? {};
	const isEditing = data.isEditing;
	const isPrePopulated = (data as unknown as Record<string, unknown>).isPrePopulated ?? false;
	const existingData = data.existingData;

	let draftRestored = false;

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
					if (draft.notificationTime) notificationTime = draft.notificationTime;
					if (draft.notificationTimePreset) notificationTimePreset = draft.notificationTimePreset;
					if (draft.deliveryMethod) deliveryMethod = draft.deliveryMethod;
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
					cycleDurationMode = [8, 12, 16].includes(Number(cycleDurationWeeks))
						? 'preset'
						: 'custom';
					if (cycleDurationMode === 'custom') customDurationWeeks = cycleDurationWeeks;
					draftRestored = true;
					setTimeout(() => {
						draftRestored = false;
					}, 3000);
				} else {
					localStorage.removeItem(DRAFT_KEY);
				}
			}
		} catch {
			/* intentionally empty */
		}
	});

	const values = {
		objectiveTitle: form?.values?.objectiveTitle ?? existingData?.objectiveTitle ?? '',
		objectiveDescription:
			form?.values?.objectiveDescription ?? existingData?.objectiveDescription ?? '',
		subgoals:
			(form?.values?.subgoals as SubgoalFormValue[] | undefined) ?? existingData?.subgoals ?? [],
		stakeholders:
			(form?.values?.stakeholders as StakeholderFormValue[] | undefined) ??
			existingData?.stakeholders ??
			[],
		cycleLabel:
			form?.values?.cycleLabel ?? existingData?.cycleLabel ?? form?.values?.objectiveTitle ?? '',
		cycleStartDate:
			form?.values?.cycleStartDate ?? existingData?.cycleStartDate ?? data.defaults.startDate,
		cycleDurationWeeks: String(
			form?.values?.cycleDurationWeeks ?? existingData?.cycleDurationWeeks ?? 12
		)
	};

	const minSubgoalFields = 3;
	const minStakeholderFields = 3;
	const maxStakeholderFields = 5;

	const initialSubgoalCount = Math.max(values.subgoals.length, minSubgoalFields);
	const initialStakeholderCount = Math.max(values.stakeholders.length, minStakeholderFields);

	let objectiveTitle = values.objectiveTitle;
	let objectiveDescription = values.objectiveDescription;
	let cycleLabel =
		values.cycleLabel ||
		(data.user.name && values.objectiveTitle
			? `${data.user.name} — ${values.objectiveTitle}`
			: values.objectiveTitle) ||
		'';
	let cycleLabelManuallyEdited = values.cycleLabel.length > 0;
	let cycleStartDate = values.cycleStartDate;
	let cycleDurationWeeks = values.cycleDurationWeeks || '12';
	let cycleDurationMode: 'preset' | 'custom' = [8, 12, 16].includes(Number(cycleDurationWeeks))
		? 'preset'
		: 'custom';
	let customDurationWeeks = cycleDurationMode === 'custom' ? cycleDurationWeeks : '';
	let reminderDays: 'wednesday_friday' | 'tuesday_thursday' = 'wednesday_friday';
	// Day picker for unified check-ins
	const allDays: string[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
	const dayLabelsMap: Record<string, string> = {
		mon: 'Mon',
		tue: 'Tue',
		wed: 'Wed',
		thu: 'Thu',
		fri: 'Fri',
		sat: 'Sat',
		sun: 'Sun'
	};

	function parseExistingDaysOnb(freq: string): string[] {
		if (freq === '3x') return ['mon', 'tue', 'wed', 'thu', 'fri'];
		if (freq === '2x') return ['tue', 'fri'];
		if (freq === '1x') return ['fri'];
		const ds = freq
			.split(',')
			.map((d: string) => d.trim().toLowerCase())
			.filter((d: string) => allDays.includes(d));
		return ds.length > 0 ? ds : ['mon', 'tue', 'wed', 'thu', 'fri'];
	}

	let selectedDays: string[] = parseExistingDaysOnb(
		(existingData?.checkInFrequency as string) ?? 'mon,tue,wed,thu,fri'
	);
	let checkInFrequency: string = selectedDays.join(',') || 'fri';

	function toggleDayOnb(day: string) {
		if (selectedDays.includes(day)) {
			if (selectedDays.length > 1) {
				selectedDays = selectedDays.filter((d) => d !== day);
			}
		} else {
			selectedDays = [...selectedDays, day];
		}
		checkInFrequency = selectedDays.join(',');
	}

	let stakeholderCadence: 'weekly' | 'biweekly' | 'custom' =
		(existingData?.stakeholderCadence as 'weekly' | 'biweekly' | 'custom') ?? 'weekly';
	let customCadenceDays = '7';
	let stakeholderFeedbackTime = '09:00';
	let revealScores = true;
	let sendStakeholderIntro = true;
	let phone = '';
	let notificationTime = '17:00';
	let notificationTimePreset: 'morning' | 'evening' | 'night' | 'custom' = 'evening';
	let deliveryMethod: 'email' | 'sms' | 'both' = 'email';

	let subgoalForms: SubgoalFormValue[] = Array.from(
		{ length: initialSubgoalCount },
		(_, index) => ({
			label: values.subgoals[index]?.label ?? '',
			description: values.subgoals[index]?.description ?? ''
		})
	);

	let stakeholderForms: StakeholderFormValue[] = Array.from(
		{ length: initialStakeholderCount },
		(_, index) => ({
			name: values.stakeholders[index]?.name ?? '',
			email: values.stakeholders[index]?.email ?? '',
			relationship: values.stakeholders[index]?.relationship ?? '',
			phone: (values.stakeholders[index] as StakeholderFormValue | undefined)?.phone ?? ''
		})
	);

	let selectedContextId: string | null = null;
	let selectedContext: OnboardingContext | null = null;
	let expandedObjectiveId: string | null = null;
	let appliedObjectiveId: string | null = null;

	// Step wizard state — 5 steps (science removed)
	type Step = 'welcome' | 'objective' | 'subgoals' | 'cycle' | 'stakeholders';
	const allSteps: Step[] = ['welcome', 'objective', 'subgoals', 'cycle', 'stakeholders'];
	let currentStep: Step =
		Object.keys(errors).length > 0
			? 'stakeholders'
			: isEditing
				? 'objective'
				: isPrePopulated
					? 'objective'
					: 'welcome';
	let stepHistory: Step[] =
		currentStep === 'stakeholders'
			? [...allSteps]
			: isEditing || isPrePopulated
				? ['objective']
				: ['welcome'];

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
		key: 'name' | 'email' | 'relationship' | 'phone',
		value: string
	) {
		stakeholderForms = stakeholderForms.map((stakeholder, stakeIndex) =>
			stakeIndex === index ? { ...stakeholder, [key]: value } : stakeholder
		);
	}

	function addStakeholderField() {
		if (stakeholderForms.length >= maxStakeholderFields) return;
		stakeholderForms = [...stakeholderForms, { name: '', email: '', relationship: '', phone: '' }];
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
			relationship: '',
			phone: ''
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
		cycleLabelManuallyEdited = false;
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
		cycleLabelManuallyEdited = false;
		cycleLabel = data.user.name ? `${data.user.name} — ${template.title}` : template.title;
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
			subgoalForms = [
				...subgoalForms,
				{ label: subgoal.label, description: subgoal.description ?? '' }
			];
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
		notificationTime,
		notificationTimePreset,
		deliveryMethod,
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
			} catch {
				/* intentionally empty */
			}
		}, 1000);
	}

	$: stepProgress = (() => {
		const stepIndex = allSteps.indexOf(currentStep);
		if (stepIndex === 0) return 0;
		return (stepIndex / (allSteps.length - 1)) * 100;
	})();

	const getError = (path: string) => errors[path]?.[0];

	// Client-side validation state
	let clientErrors: Record<string, string> = {};
	const validateField = (field: string) => {
		switch (field) {
			case 'objectiveTitle':
				if (objectiveTitle.trim().length === 0)
					clientErrors = { ...clientErrors, objectiveTitle: 'Objective title is required.' };
				else if (objectiveTitle.trim().length < 3)
					clientErrors = {
						...clientErrors,
						objectiveTitle: 'Title must be at least 3 characters.'
					};
				else {
					const { objectiveTitle: _removed, ...rest } = clientErrors;
					void _removed;
					clientErrors = rest;
				}
				break;
			case 'cycleStartDate':
				if (cycleStartDate) {
					const today = new SvelteDate();
					today.setHours(0, 0, 0, 0);
					const start = new SvelteDate(cycleStartDate + 'T00:00:00');
					if (start < today)
						clientErrors = { ...clientErrors, cycleStartDate: 'Start date cannot be in the past.' };
					else {
						const { cycleStartDate: _removed, ...rest } = clientErrors;
						void _removed;
						clientErrors = rest;
					}
				}
				break;
			default:
				if (field.startsWith('stakeholderEmail')) {
					const idx = Number(field.replace('stakeholderEmail', '')) - 1;
					const email = stakeholderForms[idx]?.email ?? '';
					if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
						clientErrors = { ...clientErrors, [field]: 'Please enter a valid email address.' };
					} else {
						const { [field]: _removed, ...rest } = clientErrors;
						void _removed;
						clientErrors = rest;
					}
				}
		}
	};
	const getClientError = (field: string) => clientErrors[field] ?? null;

	$: selectedContext =
		selectedContextId !== null
			? (contexts.find((context) => context.id === selectedContextId) ?? null)
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
	$: if (objectiveTitle.trim().length > 0 && !cycleLabelManuallyEdited) {
		cycleLabel = data.user.name ? `${data.user.name} — ${objectiveTitle}` : objectiveTitle;
	}
	$: endDatePreview = (() => {
		if (!cycleStartDate || !cycleDurationNumber) return '';
		const start = new SvelteDate(cycleStartDate);
		if (isNaN(start.getTime())) return '';
		const end = new SvelteDate(start);
		end.setDate(end.getDate() + cycleDurationNumber * 7);
		return end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
	})();
</script>

<svelte:head>
	<title>Onboarding | Forbetra</title>
</svelte:head>

<div class="min-h-screen bg-surface-base">
	{#if draftRestored}
		<div
			class="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-success/30 bg-success-muted px-4 py-2 text-sm font-medium text-success transition-opacity"
		>
			Draft restored
		</div>
	{/if}
	{#if isPrePopulated}
		<div class="mx-auto max-w-5xl px-4 pt-4">
			<div class="rounded-xl border border-accent/30 bg-accent-muted px-4 py-3 text-sm text-accent">
				<p class="font-medium">
					Your coach has pre-filled some details. Feel free to adjust anything below.
				</p>
			</div>
		</div>
	{/if}
	<section class="mx-auto max-w-5xl space-y-8 pt-8 pb-12">
		<!-- Progress Bar -->
		{#if currentStep !== 'welcome'}
			{@const stepNames = {
				welcome: 'Welcome',
				objective: 'Objective',
				subgoals: 'Behaviors',
				cycle: 'Schedule',
				stakeholders: 'Stakeholders'
			}}
			{@const stepDescs = {
				welcome: '',
				objective: 'Define what you want to improve',
				subgoals: 'Break it into observable behaviors',
				cycle: 'Set your check-in rhythm',
				stakeholders: 'Invite people who see your work'
			}}
			{@const stepTimes = {
				welcome: '',
				objective: '~2 min',
				subgoals: '~3 min',
				cycle: '~2 min',
				stakeholders: '~3 min'
			}}
			<div class="mb-8">
				<div class="mb-1 flex items-center justify-between text-sm text-text-secondary">
					<span class="font-medium"
						>Step {allSteps.indexOf(currentStep) + 1}: {stepNames[currentStep]}</span
					>
					<span class="text-text-muted">{Math.round(stepProgress)}% complete</span>
				</div>
				<p class="mb-2 text-xs text-text-muted">
					{stepDescs[currentStep]}{#if stepTimes[currentStep]}
						<span class="ml-1 text-text-tertiary">({stepTimes[currentStep]})</span>{/if}
				</p>
				<div class="h-2 overflow-hidden rounded-full bg-surface-subtle">
					<div
						class="h-full rounded-full bg-accent transition-all duration-500 ease-out"
						style="width: {stepProgress}%"
					></div>
				</div>
				<div class="mt-2 flex items-center justify-between">
					<div class="hidden items-center gap-4 sm:flex">
						{#each allSteps.filter((s) => s !== 'welcome') as step (step)}
							{@const stepIdx = allSteps.indexOf(step)}
							{@const currentIdx = allSteps.indexOf(currentStep)}
							<span
								class="text-[10px] {stepIdx <= currentIdx
									? 'font-semibold text-accent'
									: 'text-text-muted'}"
							>
								{stepNames[step]}
							</span>
						{/each}
					</div>
					{#if stepProgress >= 75}
						<span class="text-[10px] font-medium text-success">Almost there!</span>
					{:else if stepProgress >= 50}
						<span class="text-[10px] font-medium text-accent">Great progress</span>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Welcome Step -->
		{#if currentStep === 'welcome'}
			<div class="animate-in fade-in slide-in-from-bottom-4 duration-500">
				<div class="mx-auto max-w-4xl space-y-8 py-8 text-center">
					<div class="space-y-3">
						<h1 class="text-4xl font-bold tracking-tight text-text-primary md:text-5xl">
							Welcome{data.user.name ? `, ${data.user.name}` : ''}!
						</h1>
						<p class="mx-auto max-w-2xl text-lg leading-relaxed text-text-secondary md:text-xl">
							Let's set up your first growth journey. We'll help you define clear objectives, break
							them into observable behaviors, and gather feedback from people who see you in action.
						</p>
					</div>

					<div
						class="mx-auto max-w-4xl rounded-xl border border-border-default bg-surface-raised p-6 md:p-8"
					>
						<h2 class="mb-4 text-base font-semibold tracking-wide text-text-secondary uppercase">
							Here's how it works
						</h2>
						<div class="grid gap-6 text-left md:grid-cols-3">
							<div class="group space-y-3">
								<div class="flex items-center gap-3">
									<div
										class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-lg font-bold text-accent transition-transform group-hover:scale-110"
									>
										1
									</div>
									<h3 class="text-sm font-semibold text-text-primary md:text-base">
										Pick your focus
									</h3>
								</div>
								<p class="pl-[52px] text-xs leading-relaxed text-text-secondary md:text-sm">
									Choose what you want to develop — from curated templates or your own custom
									objective.
								</p>
							</div>
							<div class="group space-y-3">
								<div class="flex items-center gap-3">
									<div
										class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-lg font-bold text-accent transition-transform group-hover:scale-110"
									>
										2
									</div>
									<h3 class="text-sm font-semibold text-text-primary md:text-base">
										Define success
									</h3>
								</div>
								<p class="pl-[52px] text-xs leading-relaxed text-text-secondary md:text-sm">
									Break it into 3 behaviors others can observe — the clearer, the better.
								</p>
							</div>
							<div class="group space-y-3">
								<div class="flex items-center gap-3">
									<div
										class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-lg font-bold text-accent transition-transform group-hover:scale-110"
									>
										3
									</div>
									<h3 class="text-sm font-semibold text-text-primary md:text-base">
										Set the rhythm
									</h3>
								</div>
								<p class="pl-[52px] text-xs leading-relaxed text-text-secondary md:text-sm">
									Choose your timeline and invite the people who'll give you honest feedback.
								</p>
							</div>
						</div>
					</div>

					<div
						class="mx-auto max-w-2xl rounded-xl border border-success/20 bg-gradient-to-r from-success/5 to-transparent p-5 text-left"
					>
						<p class="mb-2 text-xs font-semibold tracking-wide text-success uppercase">
							By week 4, you'll have
						</p>
						<ul class="space-y-1.5 text-sm text-text-secondary">
							<li class="flex items-center gap-2">
								<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-success"></span>
								Trend data showing how your effort and performance are changing
							</li>
							<li class="flex items-center gap-2">
								<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-success"></span>
								360 perception gaps — where your self-view differs from your raters'
							</li>
							<li class="flex items-center gap-2">
								<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-success"></span>
								AI-generated coaching insights tailored to your data
							</li>
						</ul>
						<p class="mt-2 text-xs text-text-muted">Takes ~60 seconds per week to maintain.</p>
					</div>

					<button
						type="button"
						onclick={() => goToStep('objective')}
						class="group mx-auto inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-accent-hover focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:outline-none md:text-lg"
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
						<div class="rounded-xl border border-error/30 bg-error-muted p-4 text-sm text-error">
							<p class="font-medium">{getError('_general')}</p>
						</div>
					{/if}
					<!-- Hidden inputs -->
					{#if isEditing && existingData}
						<input type="hidden" name="objectiveId" value={existingData.objectiveId} />
					{/if}
					<input type="hidden" name="reminderDays" value={reminderDays} />
					<input type="hidden" name="checkInFrequency" value={checkInFrequency} />
					<input
						type="hidden"
						name="stakeholderCadence"
						value={stakeholderCadence === 'custom'
							? 'custom:' + customCadenceDays
							: stakeholderCadence}
					/>
					<input type="hidden" name="revealScores" value={revealScores ? 'true' : 'false'} />
					<input
						type="hidden"
						name="sendStakeholderIntro"
						value={sendStakeholderIntro ? 'true' : 'false'}
					/>

					<!-- Hidden inputs for all form data when on stakeholders step -->
					{#if currentStep === 'stakeholders'}
						<input type="hidden" name="objectiveTitle" value={objectiveTitle} />
						<input type="hidden" name="objectiveDescription" value={objectiveDescription} />
						<input type="hidden" name="cycleLabel" value={cycleLabel} />
						<input type="hidden" name="cycleStartDate" value={cycleStartDate} />
						<input type="hidden" name="cycleDurationWeeks" value={cycleDurationWeeks} />
						<input type="hidden" name="notificationTime" value={notificationTime} />
						<input type="hidden" name="deliveryMethod" value={deliveryMethod} />
						<input type="hidden" name="phone" value={phone} />
						<input type="hidden" name="stakeholderFeedbackTime" value={stakeholderFeedbackTime} />
						{#each Array.from({ length: 5 }, (_, i) => i) as index (index)}
							{@const subgoal = subgoalForms[index] ?? { label: '', description: '' }}
							<input type="hidden" name={`subgoalLabel${index + 1}`} value={subgoal.label} />
							<input
								type="hidden"
								name={`subgoalDescription${index + 1}`}
								value={subgoal.description}
							/>
						{/each}
					{/if}

					<!-- Objective Step -->
					{#if currentStep === 'objective'}
						<div class="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
							<div class="rounded-2xl border border-border-default bg-surface-raised p-8">
								<div class="mb-6 space-y-2">
									<h2 class="text-3xl font-bold text-text-primary">What do you want to develop?</h2>
									<p class="text-text-secondary">
										Start with a clear objective that matters to you right now. Choose from our
										curated templates or create your own.
									</p>
								</div>

								<div class="space-y-6">
									<div class="space-y-2">
										<label
											class="flex items-center gap-2 text-sm font-semibold text-text-secondary"
											for="objectiveTitle"
										>
											<span>Objective Title</span>
											{#if objectiveTitle.trim().length > 0}
												<span
													class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success-muted text-xs text-success"
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
											class="w-full rounded-xl border px-4 py-3 text-text-primary transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none {getClientError(
												'objectiveTitle'
											)
												? 'border-error'
												: 'border-border-default bg-surface-raised'}"
											value={objectiveTitle}
											oninput={(event) => {
												objectiveTitle = event.currentTarget.value;
												if (getClientError('objectiveTitle')) validateField('objectiveTitle');
											}}
											onblur={() => validateField('objectiveTitle')}
										/>
										{#if getClientError('objectiveTitle')}
											<p class="text-sm text-error">{getClientError('objectiveTitle')}</p>
										{:else if getError('objectiveTitle')}
											<p class="text-sm text-error">{getError('objectiveTitle')}</p>
										{:else if objectiveTitle.trim().length > 0}
											<p class="text-sm text-success">Looks great!</p>
										{/if}
									</div>

									<div class="space-y-2">
										<label
											class="flex items-center gap-2 text-sm font-semibold text-text-secondary"
											for="objectiveDescription"
										>
											<span>Description</span>
											{#if objectiveDescription.trim().length > 20}
												<span
													class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success-muted text-xs text-success"
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
											class="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-text-primary transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
											bind:value={objectiveDescription}
										></textarea>
										{#if getError('objectiveDescription')}
											<p class="text-sm text-error">{getError('objectiveDescription')}</p>
										{:else if objectiveDescription.trim().length > 20}
											<p class="text-sm text-success">
												{objectiveDescription.trim().length} characters — well articulated!
											</p>
										{:else if objectiveDescription.trim().length > 0}
											<p class="text-sm text-text-tertiary">
												Add a bit more detail to help stakeholders understand your objective ({objectiveDescription.trim()
													.length}/20+)
											</p>
										{/if}
									</div>

									<div
										class="rounded-xl border border-accent/30 bg-accent-muted p-4 text-sm text-text-secondary"
									>
										<p class="font-medium text-accent">Tip:</p>
										<p class="mt-1 text-text-secondary">
											Be specific about the impact you want. Instead of "be a better leader," try
											"communicate decisions clearly and inspire my team to take ownership."
										</p>
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Subgoals Step -->
					{#if currentStep === 'subgoals'}
						<div class="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
							<div class="rounded-2xl border border-border-default bg-surface-raised p-8">
								<div class="mb-6 space-y-2">
									<h2 class="text-3xl font-bold text-text-primary">Break it down into behaviors</h2>
									<p class="text-text-secondary">
										Define 3 observable focus areas that others can see and provide feedback on.
										Think: What would someone notice if you were succeeding?
									</p>
								</div>

								{#if getError('subgoals')}
									<div
										class="mb-6 rounded-xl border border-error/30 bg-error-muted p-4 text-sm text-error"
									>
										<p class="font-medium">{getError('subgoals')}</p>
									</div>
								{/if}

								<div class="space-y-6">
									{#each subgoalForms as subgoal, index (index)}
										<div
											class="group relative rounded-xl border p-6 transition-all {subgoal.label.trim()
												.length > 0
												? 'border-success/30 bg-success-muted/30'
												: 'border-border-default bg-surface-subtle'} hover:border-accent/30"
										>
											<div class="mb-4 flex items-center justify-between">
												<div class="flex items-center gap-3">
													<div
														class="flex h-8 w-8 items-center justify-center rounded-lg {subgoal.label.trim()
															.length > 0
															? 'bg-success-muted text-success'
															: 'bg-surface-subtle text-text-tertiary'} font-bold transition-colors"
													>
														{index + 1}
													</div>
													<h3 class="font-semibold text-text-primary">
														Focus area {index + 1}
														{#if subgoal.label.trim().length > 0}
															<span class="ml-2 text-success">✓</span>
														{/if}
													</h3>
												</div>
											</div>

											<div class="space-y-4">
												<div class="space-y-2">
													<label
														class="block text-sm font-medium text-text-secondary"
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
														class="w-full rounded-lg border border-border-default bg-surface-raised px-4 py-3 text-text-primary transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
														value={subgoal.label}
														oninput={(event) =>
															updateSubgoalField(index, 'label', event.currentTarget.value)}
													/>
													{#if getError(`subgoals.${index}.label`)}
														<p class="text-sm text-error">{getError(`subgoals.${index}.label`)}</p>
													{/if}
												</div>

												<div class="space-y-2">
													<label
														class="block text-sm font-medium text-text-secondary"
														for={`subgoalDescription${index + 1}`}
													>
														How will someone know you're succeeding?
													</label>
													<textarea
														id={`subgoalDescription${index + 1}`}
														name={`subgoalDescription${index + 1}`}
														rows="3"
														placeholder="Describe what success looks like — make it observable and measurable..."
														class="w-full rounded-lg border border-border-default bg-surface-raised px-4 py-3 text-text-primary transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
														oninput={(event) =>
															updateSubgoalField(index, 'description', event.currentTarget.value)}
														>{subgoal.description}</textarea
													>
													{#if getError(`subgoals.${index}.description`)}
														<p class="text-sm text-error">
															{getError(`subgoals.${index}.description`)}
														</p>
													{/if}
												</div>
											</div>
										</div>
									{/each}

									<div
										class="rounded-xl border border-accent/30 bg-accent-muted p-4 text-sm text-text-secondary"
									>
										<p class="font-medium text-accent">Make it observable:</p>
										<p class="mt-1 text-text-secondary">
											Good focus areas are things others can see or measure. Instead of "be more
											strategic," try "document strategic implications before major decisions" —
											your raters can observe and confirm this.
										</p>
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Cycle Planning Step -->
					{#if currentStep === 'cycle'}
						<div class="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
							<div class="rounded-2xl border border-border-default bg-surface-raised p-8">
								<div class="mb-6 space-y-2">
									<h2 class="text-3xl font-bold text-text-primary">Check-In Days and Times</h2>
									<p class="text-text-secondary">
										Set up your journey timeline and choose when you want to check in. Consistency
										matters more than frequency.
									</p>
								</div>

								<div class="space-y-8">
									<!-- Cycle Settings -->
									<div class="space-y-4">
										<p class="text-xs font-semibold tracking-wider text-text-muted uppercase">
											Journey Settings
										</p>
										<div class="grid gap-4 md:grid-cols-2">
											<div class="space-y-2">
												<label
													class="block text-sm font-semibold text-text-secondary"
													for="cycleLabel">Journey Name</label
												>
												<input
													id="cycleLabel"
													name="cycleLabel"
													type="text"
													placeholder="e.g. Q1 2026 Leadership Journey"
													class="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-text-primary transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
													value={cycleLabel}
													oninput={(event) => {
														cycleLabel = event.currentTarget.value;
														cycleLabelManuallyEdited = true;
													}}
												/>
												{#if getError('cycleLabel')}
													<p class="text-sm text-error">{getError('cycleLabel')}</p>
												{/if}
											</div>

											<div class="space-y-2">
												<label
													class="block text-sm font-semibold text-text-secondary"
													for="cycleStartDate">Start Date</label
												>
												<input
													id="cycleStartDate"
													name="cycleStartDate"
													type="date"
													required
													class="w-full rounded-xl border px-4 py-3 text-text-primary transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none {getClientError(
														'cycleStartDate'
													)
														? 'border-error'
														: 'border-border-default bg-surface-raised'}"
													value={cycleStartDate}
													oninput={(event) => {
														cycleStartDate = event.currentTarget.value;
														validateField('cycleStartDate');
													}}
													onblur={() => validateField('cycleStartDate')}
												/>
												{#if getClientError('cycleStartDate')}
													<p class="text-sm text-error">{getClientError('cycleStartDate')}</p>
												{:else if getError('cycleStartDate')}
													<p class="text-sm text-error">{getError('cycleStartDate')}</p>
												{/if}
											</div>
										</div>

										<!-- Duration -->
										<div class="space-y-3">
											<p class="block text-sm font-semibold text-text-secondary">Duration</p>
											<input type="hidden" name="cycleDurationWeeks" value={cycleDurationWeeks} />
											<select
												id="cycleDurationSelect"
												class="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-text-primary transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
												value={cycleDurationMode === 'custom' ? 'custom' : cycleDurationWeeks}
												onchange={(event) => {
													const val = event.currentTarget.value;
													if (val === 'custom') {
														enableCustomDuration();
													} else {
														selectPresetDuration(Number(val));
													}
												}}
											>
												<option value="8">8 weeks</option>
												<option value="12">12 weeks</option>
												<option value="16">16 weeks</option>
												<option value="custom">Custom</option>
											</select>
											{#if cycleDurationMode === 'custom'}
												<div class="flex items-center gap-3">
													<input
														type="number"
														min="4"
														max="26"
														placeholder="4-26"
														class="w-24 rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-center text-text-primary transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
														value={customDurationWeeks}
														oninput={(event) => {
															customDurationWeeks = event.currentTarget.value;
															const parsed = Number(event.currentTarget.value);
															if (parsed >= 4 && parsed <= 26) {
																cycleDurationWeeks = String(parsed);
															}
														}}
													/>
													<span class="text-sm text-text-secondary">weeks (4-26)</span>
												</div>
											{/if}
											{#if endDatePreview}
												<p class="text-sm text-text-tertiary">
													Your journey will end on <strong>{endDatePreview}</strong>
												</p>
											{/if}
											<p class="text-xs text-text-muted">
												{getDurationGuidance(cycleDurationNumber)}
											</p>
											{#if getError('cycleDurationWeeks')}
												<p class="text-sm text-error">{getError('cycleDurationWeeks')}</p>
											{/if}
										</div>
									</div>

									<!-- Check-In Schedule -->
									<div class="space-y-4 border-t border-border-default pt-6">
										<p class="text-xs font-semibold tracking-wider text-text-muted uppercase">
											Check-In Schedule
										</p>

										<!-- Day Selection -->
										<div class="space-y-3">
											<p class="text-sm font-semibold text-text-secondary">
												Which days do you want to check in?
											</p>
											<p class="text-xs text-text-tertiary">
												Each check-in covers effort + performance + notes (~2 min).
											</p>
											<div class="grid grid-cols-7 gap-2">
												{#each allDays as day (day)}
													<button
														type="button"
														onclick={() => toggleDayOnb(day)}
														class="flex flex-col items-center justify-center rounded-xl border py-3 transition-all {selectedDays.includes(
															day
														)
															? 'border-accent bg-accent-muted font-bold text-accent'
															: 'border-border-default bg-surface-raised text-text-tertiary hover:border-accent/30 hover:bg-surface-subtle'}"
													>
														<span class="text-sm">{dayLabelsMap[day]}</span>
													</button>
												{/each}
											</div>
											<p class="text-xs text-text-muted">
												Selected: {selectedDays.map((d) => dayLabelsMap[d]).join(', ')}
											</p>
										</div>

										<!-- Notification Time -->
										<div class="space-y-3">
											<p class="text-sm font-semibold text-text-secondary">
												When should we remind you?
											</p>
											<select
												id="notificationTimeSelect"
												class="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-text-primary transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
												value={notificationTimePreset}
												onchange={(event) => {
													const val = event.currentTarget.value as typeof notificationTimePreset;
													notificationTimePreset = val;
													if (val === 'morning') notificationTime = '09:00';
													else if (val === 'evening') notificationTime = '17:00';
													else if (val === 'night') notificationTime = '20:00';
												}}
											>
												<option value="morning">9:00 AM (Start of day)</option>
												<option value="evening">5:00 PM (End of day)</option>
												<option value="night">8:00 PM (Evening)</option>
												<option value="custom">Custom</option>
											</select>
											{#if notificationTimePreset === 'custom'}
												<input
													type="time"
													name="notificationTimeCustom"
													class="w-40 rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-text-primary transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
													value={notificationTime}
													oninput={(event) => (notificationTime = event.currentTarget.value)}
												/>
											{/if}
											<input type="hidden" name="notificationTime" value={notificationTime} />
										</div>

										<!-- Delivery Method -->
										<div class="space-y-3 border-t border-border-default pt-6">
											<p class="text-xs font-semibold tracking-wider text-text-muted uppercase">
												Delivery Method
											</p>
											<p class="text-sm font-semibold text-text-secondary">
												How should we remind you?
											</p>
											<div class="grid gap-2 md:grid-cols-3">
												<label
													class="flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all {deliveryMethod ===
													'email'
														? 'border-accent bg-accent-muted'
														: 'border-border-default bg-surface-raised hover:border-accent/30'}"
												>
													<input
														type="radio"
														name="_deliveryMethodRadio"
														value="email"
														class="sr-only"
														checked={deliveryMethod === 'email'}
														onchange={() => (deliveryMethod = 'email')}
													/>
													<div
														class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {deliveryMethod ===
														'email'
															? 'border-accent bg-accent'
															: 'border-border-strong bg-surface-raised'}"
													>
														{#if deliveryMethod === 'email'}<div
																class="h-2 w-2 rounded-full bg-white"
															></div>{/if}
													</div>
													<div>
														<div class="font-semibold text-text-primary">Email</div>
														<div class="text-xs text-text-tertiary">Check email regularly</div>
													</div>
												</label>
												<label
													class="flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all {deliveryMethod ===
													'sms'
														? 'border-accent bg-accent-muted'
														: 'border-border-default bg-surface-raised hover:border-accent/30'}"
												>
													<input
														type="radio"
														name="_deliveryMethodRadio"
														value="sms"
														class="sr-only"
														checked={deliveryMethod === 'sms'}
														onchange={() => (deliveryMethod = 'sms')}
													/>
													<div
														class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {deliveryMethod ===
														'sms'
															? 'border-accent bg-accent'
															: 'border-border-strong bg-surface-raised'}"
													>
														{#if deliveryMethod === 'sms'}<div
																class="h-2 w-2 rounded-full bg-white"
															></div>{/if}
													</div>
													<div>
														<div class="font-semibold text-text-primary">SMS</div>
														<div class="text-xs text-text-tertiary">Extra accountability</div>
													</div>
												</label>
												<label
													class="flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all {deliveryMethod ===
													'both'
														? 'border-accent bg-accent-muted'
														: 'border-border-default bg-surface-raised hover:border-accent/30'}"
												>
													<input
														type="radio"
														name="_deliveryMethodRadio"
														value="both"
														class="sr-only"
														checked={deliveryMethod === 'both'}
														onchange={() => (deliveryMethod = 'both')}
													/>
													<div
														class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {deliveryMethod ===
														'both'
															? 'border-accent bg-accent'
															: 'border-border-strong bg-surface-raised'}"
													>
														{#if deliveryMethod === 'both'}<div
																class="h-2 w-2 rounded-full bg-white"
															></div>{/if}
													</div>
													<div>
														<div class="font-semibold text-text-primary">Both</div>
														<div class="text-xs text-text-tertiary">Email + SMS</div>
													</div>
												</label>
											</div>
											<input type="hidden" name="deliveryMethod" value={deliveryMethod} />

											{#if deliveryMethod === 'sms' || deliveryMethod === 'both'}
												<div class="space-y-1">
													<label class="block text-sm font-semibold text-text-secondary" for="phone"
														>Phone number</label
													>
													<input
														type="tel"
														id="phone"
														name="phone"
														bind:value={phone}
														placeholder="+1 (555) 123-4567"
														required
														class="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-text-primary transition-all placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
													/>
													<p class="text-xs text-text-muted">We\'ll never share your number.</p>
												</div>
											{/if}
										</div>
									</div>

									<!-- Summary -->
									<div class="rounded-xl border border-accent/20 bg-accent-muted/50 p-4">
										<p class="mb-2 text-xs font-semibold tracking-wider text-accent uppercase">
											Summary
										</p>
										<ul class="space-y-1 text-sm text-text-secondary">
											<li>
												Check-ins: Every {selectedDays.map((d) => dayLabelsMap[d]).join(', ')}
											</li>
											<li>
												Reminders: {notificationTimePreset === 'morning'
													? '9:00 AM'
													: notificationTimePreset === 'evening'
														? '5:00 PM'
														: notificationTimePreset === 'night'
															? '8:00 PM'
															: notificationTime} via {deliveryMethod === 'both'
													? 'Email + SMS'
													: deliveryMethod === 'sms'
														? 'SMS'
														: 'Email'}
											</li>
											<li>Missed check-ins trigger automatic reminders</li>
										</ul>
										<p class="mt-2 text-xs text-text-muted">
											You can change this anytime in Settings.
										</p>
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Stakeholders Step -->
					{#if currentStep === 'stakeholders'}
						<input type="hidden" name="objectiveTitle" value={objectiveTitle} />
						<input type="hidden" name="objectiveDescription" value={objectiveDescription} />
						<input type="hidden" name="cycleLabel" value={cycleLabel} />
						<input type="hidden" name="cycleStartDate" value={cycleStartDate} />
						<input type="hidden" name="cycleDurationWeeks" value={cycleDurationWeeks} />
						{#each Array.from({ length: 5 }, (_, i) => i) as index (index)}
							{@const subgoal = subgoalForms[index] ?? { label: '', description: '' }}
							<input type="hidden" name={`subgoalLabel${index + 1}`} value={subgoal.label} />
							<input
								type="hidden"
								name={`subgoalDescription${index + 1}`}
								value={subgoal.description}
							/>
						{/each}
					{/if}

					<!-- Objective Step -->
					{#if currentStep === 'objective'}
						<div class="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
							<div class="rounded-2xl border border-border-default bg-surface-raised p-8">
								<div class="mb-6 space-y-2">
									<h2 class="text-3xl font-bold text-text-primary">What do you want to develop?</h2>
									<p class="text-text-secondary">
										Start with a clear objective that matters to you right now. Choose from our
										curated templates or create your own.
									</p>
								</div>

								<div class="space-y-6">
									<div class="space-y-2">
										<label
											class="flex items-center gap-2 text-sm font-semibold text-text-secondary"
											for="objectiveTitle"
										>
											<span>Objective Title</span>
											{#if objectiveTitle.trim().length > 0}
												<span
													class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success-muted text-xs text-success"
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
											class="w-full rounded-xl border px-4 py-3 text-text-primary transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none {getClientError(
												'objectiveTitle'
											)
												? 'border-error'
												: 'border-border-default bg-surface-raised'}"
											value={objectiveTitle}
											oninput={(event) => {
												objectiveTitle = event.currentTarget.value;
												if (getClientError('objectiveTitle')) validateField('objectiveTitle');
											}}
											onblur={() => validateField('objectiveTitle')}
										/>
										{#if getClientError('objectiveTitle')}
											<p class="text-sm text-error">{getClientError('objectiveTitle')}</p>
										{:else if getError('objectiveTitle')}
											<p class="text-sm text-error">{getError('objectiveTitle')}</p>
										{:else if objectiveTitle.trim().length > 0}
											<p class="text-sm text-success">Looks great!</p>
										{/if}
									</div>

									<div class="space-y-2">
										<label
											class="flex items-center gap-2 text-sm font-semibold text-text-secondary"
											for="objectiveDescription"
										>
											<span>Description</span>
											{#if objectiveDescription.trim().length > 20}
												<span
													class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success-muted text-xs text-success"
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
											class="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-text-primary transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
											bind:value={objectiveDescription}
										></textarea>
										{#if getError('objectiveDescription')}
											<p class="text-sm text-error">{getError('objectiveDescription')}</p>
										{:else if objectiveDescription.trim().length > 20}
											<p class="text-sm text-success">
												{objectiveDescription.trim().length} characters — well articulated!
											</p>
										{:else if objectiveDescription.trim().length > 0}
											<p class="text-sm text-text-tertiary">
												Add a bit more detail to help stakeholders understand your objective ({objectiveDescription.trim()
													.length}/20+)
											</p>
										{/if}
									</div>

									<div
										class="rounded-xl border border-accent/30 bg-accent-muted p-4 text-sm text-text-secondary"
									>
										<p class="font-medium text-accent">Tip:</p>
										<p class="mt-1 text-text-secondary">
											Be specific about the impact you want. Instead of "be a better leader," try
											"communicate decisions clearly and inspire my team to take ownership."
										</p>
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Subgoals Step -->
					{#if currentStep === 'subgoals'}
						<div class="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
							<div class="rounded-2xl border border-border-default bg-surface-raised p-8">
								<div class="mb-6 space-y-2">
									<h2 class="text-3xl font-bold text-text-primary">Break it down into behaviors</h2>
									<p class="text-text-secondary">
										Define 3 observable focus areas that others can see and provide feedback on.
										Think: What would someone notice if you were succeeding?
									</p>
								</div>

								{#if getError('subgoals')}
									<div
										class="mb-6 rounded-xl border border-error/30 bg-error-muted p-4 text-sm text-error"
									>
										<p class="font-medium">{getError('subgoals')}</p>
									</div>
								{/if}

								<div class="space-y-6">
									{#each subgoalForms as subgoal, index (index)}
										<div
											class="group relative rounded-xl border p-6 transition-all {subgoal.label.trim()
												.length > 0
												? 'border-success/30 bg-success-muted/30'
												: 'border-border-default bg-surface-subtle'} hover:border-accent/30"
										>
											<div class="mb-4 flex items-center justify-between">
												<div class="flex items-center gap-3">
													<div
														class="flex h-8 w-8 items-center justify-center rounded-lg {subgoal.label.trim()
															.length > 0
															? 'bg-success-muted text-success'
															: 'bg-surface-subtle text-text-tertiary'} font-bold transition-colors"
													>
														{index + 1}
													</div>
													<h3 class="font-semibold text-text-primary">
														Focus area {index + 1}
														{#if subgoal.label.trim().length > 0}
															<span class="ml-2 text-success">✓</span>
														{/if}
													</h3>
												</div>
											</div>

											<div class="space-y-4">
												<div class="space-y-2">
													<label
														class="block text-sm font-medium text-text-secondary"
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
														class="w-full rounded-lg border border-border-default bg-surface-raised px-4 py-3 text-text-primary transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
														value={subgoal.label}
														oninput={(event) =>
															updateSubgoalField(index, 'label', event.currentTarget.value)}
													/>
													{#if getError(`subgoals.${index}.label`)}
														<p class="text-sm text-error">{getError(`subgoals.${index}.label`)}</p>
													{/if}
												</div>

												<div class="space-y-2">
													<label
														class="block text-sm font-medium text-text-secondary"
														for={`subgoalDescription${index + 1}`}
													>
														How will someone know you're succeeding?
													</label>
													<textarea
														id={`subgoalDescription${index + 1}`}
														name={`subgoalDescription${index + 1}`}
														rows="3"
														placeholder="Describe what success looks like — make it observable and measurable..."
														class="w-full rounded-lg border border-border-default bg-surface-raised px-4 py-3 text-text-primary transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
														oninput={(event) =>
															updateSubgoalField(index, 'description', event.currentTarget.value)}
														>{subgoal.description}</textarea
													>
													{#if getError(`subgoals.${index}.description`)}
														<p class="text-sm text-error">
															{getError(`subgoals.${index}.description`)}
														</p>
													{/if}
												</div>
											</div>
										</div>
									{/each}

									<div
										class="rounded-xl border border-accent/30 bg-accent-muted p-4 text-sm text-text-secondary"
									>
										<p class="font-medium text-accent">Make it observable:</p>
										<p class="mt-1 text-text-secondary">
											Good focus areas are things others can see or measure. Instead of "be more
											strategic," try "document strategic implications before major decisions" —
											your raters can observe and confirm this.
										</p>
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Stakeholders Step -->
					{#if currentStep === 'stakeholders'}
						<div class="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
							<div class="rounded-2xl border border-border-default bg-surface-raised p-8">
								<div class="mb-6 space-y-2">
									<h2 class="text-3xl font-bold text-text-primary">Invite your raters</h2>
									<p class="text-text-secondary">
										Add 3-5 people who regularly observe you in action. They'll provide feedback on
										your progress throughout the journey. This step is optional — you can add them
										later.
									</p>
								</div>

								<!-- Feedback Schedule Settings -->
								<div
									class="mb-6 space-y-4 rounded-xl border border-border-default bg-surface-subtle p-5"
								>
									<p class="text-xs font-semibold tracking-wider text-text-muted uppercase">
										Feedback Schedule
									</p>

									<!-- Cadence -->
									<div class="space-y-3">
										<p class="text-sm font-semibold text-text-secondary">
											How often should raters provide feedback?
										</p>
										<div class="grid gap-2 md:grid-cols-3">
											<label
												class="flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all {stakeholderCadence ===
												'weekly'
													? 'border-accent bg-accent-muted'
													: 'border-border-default bg-surface-raised hover:border-accent/30'}"
											>
												<input
													type="radio"
													name="_stakeholderCadenceRadio"
													value="weekly"
													class="sr-only"
													checked={stakeholderCadence === 'weekly'}
													onchange={() => (stakeholderCadence = 'weekly')}
												/>
												<div
													class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {stakeholderCadence ===
													'weekly'
														? 'border-accent bg-accent'
														: 'border-border-strong bg-surface-raised'}"
												>
													{#if stakeholderCadence === 'weekly'}<div
															class="h-2 w-2 rounded-full bg-white"
														></div>{/if}
												</div>
												<div>
													<div class="font-semibold text-text-primary">Weekly</div>
													<div class="text-xs text-text-tertiary">Every week</div>
												</div>
											</label>
											<label
												class="flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all {stakeholderCadence ===
												'biweekly'
													? 'border-accent bg-accent-muted'
													: 'border-border-default bg-surface-raised hover:border-accent/30'}"
											>
												<input
													type="radio"
													name="_stakeholderCadenceRadio"
													value="biweekly"
													class="sr-only"
													checked={stakeholderCadence === 'biweekly'}
													onchange={() => (stakeholderCadence = 'biweekly')}
												/>
												<div
													class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {stakeholderCadence ===
													'biweekly'
														? 'border-accent bg-accent'
														: 'border-border-strong bg-surface-raised'}"
												>
													{#if stakeholderCadence === 'biweekly'}<div
															class="h-2 w-2 rounded-full bg-white"
														></div>{/if}
												</div>
												<div>
													<div class="font-semibold text-text-primary">Biweekly</div>
													<div class="text-xs text-text-tertiary">Every two weeks</div>
												</div>
											</label>
											<label
												class="flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all {stakeholderCadence ===
												'custom'
													? 'border-accent bg-accent-muted'
													: 'border-border-default bg-surface-raised hover:border-accent/30'}"
											>
												<input
													type="radio"
													name="_stakeholderCadenceRadio"
													value="custom"
													class="sr-only"
													checked={stakeholderCadence === 'custom'}
													onchange={() => (stakeholderCadence = 'custom')}
												/>
												<div
													class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {stakeholderCadence ===
													'custom'
														? 'border-accent bg-accent'
														: 'border-border-strong bg-surface-raised'}"
												>
													{#if stakeholderCadence === 'custom'}<div
															class="h-2 w-2 rounded-full bg-white"
														></div>{/if}
												</div>
												<div>
													<div class="font-semibold text-text-primary">Custom</div>
													<div class="text-xs text-text-tertiary">Set your own interval</div>
												</div>
											</label>
										</div>
										{#if stakeholderCadence === 'custom'}
											<div class="flex items-center gap-3">
												<span class="text-sm text-text-secondary">Every</span>
												<input
													type="number"
													min="3"
													max="30"
													class="w-20 rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-center text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
													value={customCadenceDays}
													oninput={(event) => (customCadenceDays = event.currentTarget.value)}
												/>
												<span class="text-sm text-text-secondary">days</span>
											</div>
										{/if}
									</div>

									<!-- Feedback Request Time -->
									<div class="space-y-2">
										<p class="text-sm font-semibold text-text-secondary">
											When should feedback requests go out?
										</p>
										<div class="flex items-center gap-3">
											<input
												type="time"
												name="stakeholderFeedbackTime"
												class="w-40 rounded-xl border border-border-default bg-surface-raised px-4 py-2.5 text-text-primary transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
												value={stakeholderFeedbackTime}
												oninput={(event) => (stakeholderFeedbackTime = event.currentTarget.value)}
											/>
											<span class="text-xs text-text-muted">Default: 9:00 AM</span>
										</div>
									</div>

									<!-- Reveal Scores Toggle -->
									<label class="flex cursor-pointer items-center gap-3">
										<input
											type="checkbox"
											checked={revealScores}
											onchange={() => (revealScores = !revealScores)}
											class="h-4 w-4 rounded border-border-default text-accent focus:ring-accent"
										/>
										<div>
											<span class="text-sm font-semibold text-text-secondary"
												>Allow raters to see my self-scores after they submit feedback</span
											>
											<p class="text-xs text-text-tertiary">
												When enabled, raters see how you rated yourself so they can compare
												perspectives.
											</p>
										</div>
									</label>

									<!-- Stakeholder Intro Notification Toggle -->
									<label class="flex cursor-pointer items-center gap-3">
										<input
											type="checkbox"
											checked={sendStakeholderIntro}
											onchange={() => (sendStakeholderIntro = !sendStakeholderIntro)}
											class="h-4 w-4 rounded border-border-default text-accent focus:ring-accent"
										/>
										<div>
											<span class="text-sm font-semibold text-text-secondary"
												>Send introductory notification to raters when they're added</span
											>
											<p class="text-xs text-text-tertiary">
												When enabled, raters receive a welcome email (and SMS if they have a phone
												number) explaining their role. Turn off if you'd prefer to introduce them
												yourself.
											</p>
										</div>
									</label>
								</div>

								{#if getError('stakeholders')}
									<div
										class="mb-6 rounded-xl border border-error/30 bg-error-muted p-4 text-sm text-error"
									>
										<p class="font-medium">{getError('stakeholders')}</p>
									</div>
								{/if}
								{#if getError('_general')}
									<div
										class="mb-6 rounded-xl border border-error/30 bg-error-muted p-4 text-sm text-error"
									>
										<p class="font-medium">{getError('_general')}</p>
									</div>
								{/if}

								<div class="space-y-5">
									{#each stakeholderForms as stakeholder, index (index)}
										<div
											class="group rounded-xl border border-border-default bg-surface-subtle p-6 transition-all hover:border-accent/30"
										>
											<div class="mb-4 flex items-center justify-between">
												<div class="flex items-center gap-3">
													<div
														class="flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted font-semibold text-accent"
													>
														{index + 1}
													</div>
													<h3 class="font-semibold text-text-primary">Stakeholder {index + 1}</h3>
												</div>
												{#if stakeholder.name.trim() && stakeholder.email.trim()}
													<span
														class="rounded-full border border-border-default bg-surface-raised px-3 py-1 text-xs font-medium text-text-muted"
													>
														{sendStakeholderIntro
															? 'Welcome notification will be sent on setup completion'
															: 'No welcome notification'}
													</span>
												{/if}
											</div>

											<div class="grid gap-4 md:grid-cols-2">
												<div class="space-y-2">
													<label
														class="block text-sm font-medium text-text-secondary"
														for={`stakeholderName${index + 1}`}>Name</label
													>
													<input
														id={`stakeholderName${index + 1}`}
														name={`stakeholderName${index + 1}`}
														type="text"
														placeholder="John Smith"
														class="w-full rounded-lg border border-border-default bg-surface-raised px-4 py-2 text-text-primary transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
														value={stakeholder.name}
														oninput={(event) =>
															updateStakeholderField(index, 'name', event.currentTarget.value)}
													/>
													{#if getError(`stakeholders.${index}.name`)}
														<p class="text-sm text-error">
															{getError(`stakeholders.${index}.name`)}
														</p>
													{/if}
												</div>

												<div class="space-y-2">
													<label
														class="block text-sm font-medium text-text-secondary"
														for={`stakeholderEmail${index + 1}`}>Email</label
													>
													<input
														id={`stakeholderEmail${index + 1}`}
														name={`stakeholderEmail${index + 1}`}
														type="email"
														placeholder="john@example.com"
														class="w-full rounded-lg border px-4 py-2 text-text-primary transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none {getClientError(
															`stakeholderEmail${index + 1}`
														)
															? 'border-error'
															: 'border-border-default bg-surface-raised'}"
														value={stakeholder.email}
														oninput={(event) => {
															updateStakeholderField(index, 'email', event.currentTarget.value);
															if (getClientError(`stakeholderEmail${index + 1}`))
																validateField(`stakeholderEmail${index + 1}`);
														}}
														onblur={() => validateField(`stakeholderEmail${index + 1}`)}
													/>
													{#if getClientError(`stakeholderEmail${index + 1}`)}
														<p class="text-sm text-error">
															{getClientError(`stakeholderEmail${index + 1}`)}
														</p>
													{:else if getError(`stakeholders.${index}.email`)}
														<p class="text-sm text-error">
															{getError(`stakeholders.${index}.email`)}
														</p>
													{/if}
												</div>

												<div class="space-y-2">
													<label
														class="block text-sm font-medium text-text-secondary"
														for={`stakeholderRelationship${index + 1}`}>Relationship</label
													>
													<select
														id={`stakeholderRelationship${index + 1}`}
														name={`stakeholderRelationship${index + 1}`}
														class="w-full rounded-lg border border-border-default bg-surface-raised px-4 py-2 text-text-primary transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
														value={stakeholder.relationship}
														onchange={(event) =>
															updateStakeholderField(
																index,
																'relationship',
																event.currentTarget.value
															)}
													>
														<option value="" disabled selected={!stakeholder.relationship}
															>Select relationship</option
														>
														<option value="Direct Manager">Direct Manager</option>
														<option value="Skip-Level Manager">Skip-Level Manager</option>
														<option value="Peer">Peer</option>
														<option value="Direct Report">Direct Report</option>
														<option value="Cross-Functional Partner"
															>Cross-Functional Partner</option
														>
														<option value="HR Partner">HR Partner</option>
														<option value="Other">Other</option>
													</select>
												</div>

												<div class="space-y-2">
													<label
														class="block text-sm font-medium text-text-secondary"
														for={`stakeholderPhone${index + 1}`}
														>Phone <span class="font-normal text-text-muted">(optional)</span
														></label
													>
													<input
														id={`stakeholderPhone${index + 1}`}
														name={`stakeholderPhone${index + 1}`}
														type="tel"
														placeholder="+1 (555) 123-4567"
														class="w-full rounded-lg border border-border-default bg-surface-raised px-4 py-2 text-text-primary transition-all focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
														value={stakeholder.phone}
														oninput={(event) =>
															updateStakeholderField(index, 'phone', event.currentTarget.value)}
													/>
												</div>
											</div>

											<!-- Per-stakeholder schedule summary -->
											{#if stakeholder.name.trim() && stakeholder.email.trim()}
												<div
													class="mt-4 rounded-lg border border-accent/20 bg-accent-muted/30 px-4 py-3 text-xs text-text-secondary"
												>
													<p>
														Feedback requests: {stakeholderCadence === 'weekly'
															? 'Weekly'
															: stakeholderCadence === 'biweekly'
																? 'Every 2 weeks'
																: `Every ${customCadenceDays} days`} at {stakeholderFeedbackTime ||
															'9:00 AM'} via email
													</p>
													{#if sendStakeholderIntro}
														<p class="mt-1 text-success">
															Welcome notification will be sent on setup completion
														</p>
													{:else}
														<p class="mt-1 text-text-muted">
															No welcome notification (you opted out above)
														</p>
													{/if}
												</div>
											{/if}
										</div>
									{/each}

									{#if stakeholderForms.length < maxStakeholderFields}
										<button
											type="button"
											onclick={addStakeholderField}
											class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface-subtle px-4 py-3 text-sm font-medium text-text-secondary transition-all hover:border-accent hover:bg-accent-muted"
										>
											<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
										class="rounded-xl border border-accent/30 bg-accent-muted p-4 text-sm text-text-secondary"
									>
										<p class="font-medium text-accent">What happens next?</p>
										{#if sendStakeholderIntro}
											<p class="mt-1 text-text-secondary">
												When you complete setup, raters with name and email will receive a welcome
												notification (email{stakeholderForms.some((s) => s.phone.trim())
													? ' + SMS for those with a phone number'
													: ''}) introducing them to the process. Feedback requests will follow on
												the schedule you set above.
											</p>
										{:else}
											<p class="mt-1 text-text-secondary">
												You've opted out of sending welcome notifications. Stakeholders will be
												created but won't receive any intro message — their first contact will be
												the scheduled feedback request.
											</p>
										{/if}
										<p class="mt-1 text-text-secondary">
											You can manage invitations, resend, or cancel them at any time from your
											dashboard.
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
							class="inline-flex items-center gap-2 rounded-xl border border-border-default bg-surface-raised px-6 py-3 font-medium text-text-secondary transition-all hover:border-border-strong hover:bg-surface-subtle focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
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
								class="group inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3 font-semibold text-white transition-all hover:bg-accent-hover focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:outline-none"
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
								class="group inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3 font-semibold text-white transition-all hover:bg-accent-hover focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
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
					<aside
						class="sticky top-8 h-fit space-y-6 rounded-2xl border border-border-default bg-surface-raised p-6"
					>
						<div class="space-y-4">
							<div class="flex items-center justify-between">
								<h2 class="text-xl font-bold text-text-primary">Browse Templates</h2>
								<button
									type="button"
									onclick={startCustomBuild}
									class="text-sm font-medium text-accent underline-offset-4 hover:text-accent-hover hover:underline"
								>
									Start from scratch
								</button>
							</div>
							<p class="text-sm text-text-secondary">
								Choose a context to explore curated objectives. Click "Use this objective" to
								automatically fill the form, then customize it to match your goals.
							</p>

							<div class="flex flex-wrap gap-2">
								{#each contexts as context (context.id)}
									<button
										type="button"
										class={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
											selectedContextId === context.id
												? 'border-accent bg-accent text-white'
												: 'border-border-strong bg-surface-raised text-text-secondary hover:border-accent/30 hover:bg-accent-muted'
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
								{#each selectedContext.objectives as objective (objective.id)}
									<article
										class={`group rounded-xl border p-5 transition-all ${
											appliedObjectiveId === objective.id
												? 'border-success/30 bg-success-muted'
												: 'border-border-default bg-surface-raised hover:border-accent/30'
										}`}
									>
										<div class="space-y-3">
											<div class="space-y-2">
												<h3 class="font-bold text-text-primary">{objective.title}</h3>
												<p class="text-sm leading-relaxed text-text-secondary">
													{objective.description}
												</p>
											</div>
											<div class="flex flex-wrap gap-2">
												<button
													type="button"
													class={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
														appliedObjectiveId === objective.id
															? 'bg-success text-white'
															: 'bg-accent text-white hover:bg-accent-hover'
													}`}
													onclick={() =>
														selectedContext && applyObjective(selectedContext.id, objective)}
												>
													{appliedObjectiveId === objective.id ? '✓ Applied' : 'Use this objective'}
												</button>
												<button
													type="button"
													class="rounded-lg border border-border-default bg-surface-raised px-4 py-2 text-sm font-semibold text-text-secondary transition-all hover:border-accent/30 hover:bg-accent-muted"
													onclick={() =>
														selectedContext && toggleObjective(selectedContext.id, objective.id)}
												>
													{expandedObjectiveId === objective.id ? 'Hide details' : 'View details'}
												</button>
											</div>
										</div>

										{#if expandedObjectiveId === objective.id}
											<div
												class="mt-4 space-y-4 rounded-lg border border-dashed border-border-strong bg-surface-subtle p-4"
											>
												<div>
													<p
														class="mb-2 text-xs font-bold tracking-wide text-text-tertiary uppercase"
													>
														Behavioral Focus Areas
													</p>
													<p class="mb-3 text-xs text-text-secondary">
														Click any focus area to add it to your form, then customize it to your
														needs.
													</p>
													<div class="space-y-2">
														{#each objective.subgoals as subgoal (subgoal.label)}
															<button
																type="button"
																onclick={() => addSubgoalToForm(subgoal)}
																class="group w-full rounded-lg border border-border-default bg-surface-raised p-3 text-left transition-all hover:border-accent/30 hover:bg-accent-muted"
															>
																<p class="font-semibold text-text-primary group-hover:text-accent">
																	{subgoal.label}
																</p>
																<p class="mt-1 text-xs text-text-secondary">
																	{subgoal.description}
																</p>
															</button>
														{/each}
													</div>
												</div>
												<div class="rounded-lg border border-accent/30 bg-accent-muted p-3 text-xs">
													<p class="font-semibold text-accent">Stakeholder Guidance</p>
													<p class="mt-2 text-text-secondary">
														{objective.stakeholderGuidance.whyItMatters}
													</p>
													<p class="mt-2 text-text-secondary">
														{objective.stakeholderGuidance.recommendedApproach}
													</p>
													<div class="mt-3 space-y-2">
														<p class="font-semibold text-accent">Recommended roles:</p>
														<ul class="list-disc space-y-1 pl-4 text-text-secondary">
															{#each objective.stakeholderGuidance.recommendedRoles as role (role)}
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
