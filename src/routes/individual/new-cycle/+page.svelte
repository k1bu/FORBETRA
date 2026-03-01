<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	const formValues = (form as { values?: Record<string, string> } | null)?.values;
	let cycleLabel = $state(formValues?.cycleLabel ?? data.defaults.cycleLabel);
	let cycleStartDate = $state(formValues?.cycleStartDate ?? data.defaults.startDate);
	let cycleDurationWeeks = $state(
		String(formValues?.cycleDurationWeeks ?? data.defaults.durationWeeks)
	);
	let cycleDurationMode: 'preset' | 'custom' = $state(
		[8, 12, 16].includes(Number(cycleDurationWeeks)) ? 'preset' : 'custom'
	);
	let customDurationWeeks = $state(cycleDurationMode === 'custom' ? cycleDurationWeeks : '');
	// Day picker for unified check-ins
	const allDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
	const dayLabels: Record<string, string> = {
		mon: 'Mon',
		tue: 'Tue',
		wed: 'Wed',
		thu: 'Thu',
		fri: 'Fri',
		sat: 'Sat',
		sun: 'Sun'
	};

	function parseExistingDays(freq: string): string[] {
		if (freq === '3x') return ['mon', 'wed', 'fri'];
		if (freq === '2x') return ['tue', 'fri'];
		if (freq === '1x') return ['fri'];
		const days = freq
			.split(',')
			.map((d) => d.trim().toLowerCase())
			.filter((d) => (allDays as readonly string[]).includes(d));
		return days.length > 0 ? days : ['tue', 'fri'];
	}

	let selectedDays = $state<string[]>(parseExistingDays(data.defaults.checkInFrequency ?? '3x'));
	const checkInFrequency = $derived(selectedDays.length > 0 ? selectedDays.join(',') : 'fri');

	function toggleDay(day: string) {
		if (selectedDays.includes(day)) {
			if (selectedDays.length > 1) {
				selectedDays = selectedDays.filter((d) => d !== day);
			}
		} else {
			selectedDays = [...selectedDays, day];
		}
	}

	function applyPreset(preset: string[]) {
		selectedDays = [...preset];
	}
	// Cycle mode: continue with same objective or start fresh
	let cycleMode: 'continue' | 'fresh' = $state('continue');
	let freshObjectiveTitle = $state('');
	let freshObjectiveDescription = $state('');

	let stakeholderCadence: 'weekly' | 'biweekly' = $state(
		(data.defaults.stakeholderCadence as 'weekly' | 'biweekly') ?? 'weekly'
	);
	let isSubmitting = $state(false);
	let reminderDays: 'wednesday_friday' | 'tuesday_thursday' = $state('wednesday_friday');
	let revealScores = $state(true);

	function selectPresetDuration(weeks: number) {
		cycleDurationMode = 'preset';
		cycleDurationWeeks = String(weeks);
		customDurationWeeks = '';
	}

	function enableCustomDuration() {
		cycleDurationMode = 'custom';
		customDurationWeeks = cycleDurationWeeks;
	}

	const cycleDurationNumber = $derived(Number(cycleDurationWeeks) || 12);
	const endDatePreview = $derived(
		(() => {
			if (!cycleStartDate || !cycleDurationNumber) return '';
			const start = new Date(cycleStartDate);
			if (isNaN(start.getTime())) return '';
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const end = new Date(start);
			end.setDate(end.getDate() + cycleDurationNumber * 7);
			return end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
		})()
	);

	function getDurationGuidance(weeks: number): string {
		if (weeks <= 7) return 'Short sprint — focused skill experiments';
		if (weeks <= 12) return 'Standard — enough time for meaningful patterns';
		if (weeks <= 16) return 'Extended — deeper behavioral shifts';
		return 'Long-arc — major transitions';
	}

	const weekPreviewDays = $derived(
		(() => {
			const days: Array<{ day: string; label: string; time: string }> = [];
			const sortOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
			const sorted = [...selectedDays].sort((a, b) => sortOrder.indexOf(a) - sortOrder.indexOf(b));
			for (const day of sorted) {
				days.push({
					day: dayLabels[day] ?? day.toUpperCase(),
					label: 'Effort + performance + notes',
					time: '~2 min'
				});
			}
			return days;
		})()
	);

	// === Wizard step state ===
	let step = $state(1);
	const totalSteps = 3;
	const stepLabels = ['Objective', 'Schedule', 'Settings'];

	// Validation per step
	const step1Valid = $derived(cycleMode === 'continue' || freshObjectiveTitle.trim().length >= 3);
	const step2Valid = $derived(
		!!cycleLabel.trim() &&
			!!cycleStartDate &&
			cycleDurationNumber >= 4 &&
			cycleDurationNumber <= 26 &&
			selectedDays.length > 0
	);

	function nextStep() {
		if (step < totalSteps) step++;
	}

	function prevStep() {
		if (step > 1) step--;
	}
</script>

<svelte:head>
	<title>New Cycle | Forbetra</title>
</svelte:head>

<div class="min-h-screen bg-surface-base">
	<section class="mx-auto max-w-3xl px-4 pt-8 pb-12">
		<!-- Header -->
		<div class="mb-6 space-y-2">
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href="/individual"
				class="inline-flex items-center gap-1 text-sm text-text-tertiary transition-colors hover:text-text-secondary"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				Back to hub
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
			<h1 class="text-3xl font-bold text-text-primary">Start a New Cycle</h1>
		</div>

		<!-- Progress dots -->
		<div class="mb-8 flex items-center justify-center gap-3">
			{#each stepLabels as label, i (label)}
				{@const stepNum = i + 1}
				<button
					type="button"
					onclick={() => {
						if (stepNum < step) step = stepNum;
					}}
					class="flex items-center gap-2 {stepNum < step ? 'cursor-pointer' : 'cursor-default'}"
					disabled={stepNum > step}
				>
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all {stepNum ===
						step
							? 'bg-accent text-white'
							: stepNum < step
								? 'bg-accent/20 text-accent'
								: 'bg-surface-subtle text-text-muted'}"
					>
						{stepNum}
					</div>
					<span
						class="hidden text-sm font-medium sm:inline {stepNum === step
							? 'text-text-primary'
							: 'text-text-muted'}"
					>
						{label}
					</span>
				</button>
				{#if i < stepLabels.length - 1}
					<div class="h-px w-8 bg-border-default sm:w-12"></div>
				{/if}
			{/each}
		</div>

		<!-- Form errors -->
		{#if form?.error}
			<div class="mb-6 rounded-xl border border-error/20 bg-error-muted p-4 text-sm text-error">
				<p class="font-medium">{form.error}</p>
			</div>
		{/if}

		<form
			method="post"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					isSubmitting = false;
					await update();
				};
			}}
		>
			<input type="hidden" name="reminderDays" value={reminderDays} />
			<input type="hidden" name="checkInFrequency" value={checkInFrequency} />
			<input type="hidden" name="stakeholderCadence" value={stakeholderCadence} />
			<input type="hidden" name="cycleDurationWeeks" value={cycleDurationWeeks} />
			<input type="hidden" name="revealScores" value={revealScores ? 'true' : 'false'} />
			<input type="hidden" name="cycleMode" value={cycleMode} />
			{#if cycleMode === 'fresh'}
				<input type="hidden" name="freshObjectiveTitle" value={freshObjectiveTitle} />
				<input type="hidden" name="freshObjectiveDescription" value={freshObjectiveDescription} />
			{/if}

			<!-- ═══ STEP 1: Objective ═══ -->
			{#if step === 1}
				<div class="space-y-6">
					<div class="space-y-4 rounded-2xl border border-border-default bg-surface-raised p-6">
						<p class="text-sm font-semibold text-text-secondary">What would you like to do?</p>
						<div class="grid gap-3 md:grid-cols-2">
							<button
								type="button"
								onclick={() => (cycleMode = 'continue')}
								class="flex items-start gap-3 rounded-xl border p-4 text-left transition-all {cycleMode ===
								'continue'
									? 'border-accent bg-accent-muted'
									: 'border-border-default bg-surface-raised hover:border-accent/30 hover:bg-surface-subtle'}"
							>
								<div
									class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {cycleMode ===
									'continue'
										? 'border-accent bg-accent'
										: 'border-border-strong bg-surface-raised'}"
								>
									{#if cycleMode === 'continue'}
										<div class="h-2 w-2 rounded-full bg-white"></div>
									{/if}
								</div>
								<div>
									<p class="font-semibold text-text-primary">Continue with same objective</p>
									<p class="text-xs text-text-tertiary">
										Keep your current objective and sub-objectives
									</p>
								</div>
							</button>
							<button
								type="button"
								onclick={() => (cycleMode = 'fresh')}
								class="flex items-start gap-3 rounded-xl border p-4 text-left transition-all {cycleMode ===
								'fresh'
									? 'border-accent bg-accent-muted'
									: 'border-border-default bg-surface-raised hover:border-accent/30 hover:bg-surface-subtle'}"
							>
								<div
									class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {cycleMode ===
									'fresh'
										? 'border-accent bg-accent'
										: 'border-border-strong bg-surface-raised'}"
								>
									{#if cycleMode === 'fresh'}
										<div class="h-2 w-2 rounded-full bg-white"></div>
									{/if}
								</div>
								<div>
									<p class="font-semibold text-text-primary">Start with a new objective</p>
									<p class="text-xs text-text-tertiary">Set a fresh objective and sub-objectives</p>
								</div>
							</button>
						</div>
					</div>

					{#if cycleMode === 'continue'}
						<div class="rounded-2xl border border-border-default bg-surface-raised p-6">
							<p class="mb-1 text-[10px] font-semibold tracking-wider text-text-muted uppercase">
								Your Objective
							</p>
							<h2 class="text-xl font-bold text-text-primary">{data.objective.title}</h2>
							{#if data.objective.description}
								<p class="mt-1 text-sm text-text-secondary">{data.objective.description}</p>
							{/if}
							{#if data.subgoals.length > 0}
								<div class="mt-4">
									<p class="mb-2 text-xs font-semibold tracking-wider text-text-muted uppercase">
										Sub-objectives
									</p>
									<ul class="space-y-1">
										{#each data.subgoals as subgoal (subgoal.label)}
											<li class="flex items-start gap-2 text-sm text-text-secondary">
												<span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"></span>
												{subgoal.label}
											</li>
										{/each}
									</ul>
								</div>
							{/if}
							{#if data.lastCycle}
								<div class="mt-4 rounded-lg bg-surface-subtle px-3 py-2 text-xs text-text-tertiary">
									Previous cycle: <strong>{data.lastCycle.label ?? 'Cycle'}</strong>
								</div>
							{/if}
						</div>
					{:else}
						<div class="space-y-4 rounded-2xl border border-border-default bg-surface-raised p-6">
							<p class="text-[10px] font-semibold tracking-wider text-text-muted uppercase">
								New Objective
							</p>
							<div class="space-y-2">
								<label
									class="block text-sm font-semibold text-text-secondary"
									for="freshObjectiveTitle">What do you want to work on?</label
								>
								<input
									id="freshObjectiveTitle"
									type="text"
									required
									placeholder="e.g. Develop executive presence in team meetings"
									class="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-text-primary transition-all focus:border-accent focus:ring-4 focus:ring-accent/10 focus:outline-none"
									value={freshObjectiveTitle}
									oninput={(e) => (freshObjectiveTitle = e.currentTarget.value)}
								/>
							</div>
							<div class="space-y-2">
								<label
									class="block text-sm font-semibold text-text-secondary"
									for="freshObjectiveDescription">Description (optional)</label
								>
								<textarea
									id="freshObjectiveDescription"
									rows="3"
									placeholder="Add any context about what success looks like..."
									class="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-sm text-text-primary transition-all focus:border-accent focus:ring-4 focus:ring-accent/10 focus:outline-none"
									value={freshObjectiveDescription}
									oninput={(e) => (freshObjectiveDescription = e.currentTarget.value)}
								></textarea>
							</div>
						</div>
					{/if}
				</div>

				<!-- Step 1 actions -->
				<div class="mt-8 flex items-center justify-between gap-4">
					<!-- eslint-disable svelte/no-navigation-without-resolve -->
					<a
						href="/individual"
						class="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-surface-raised px-6 py-3 font-medium text-text-secondary transition-all hover:border-border-default hover:bg-surface-subtle"
					>
						Cancel
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
					<button
						type="button"
						disabled={!step1Valid}
						onclick={nextStep}
						class="group inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3 font-semibold text-white transition-all hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
					>
						Next: Schedule
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
							/>
						</svg>
					</button>
				</div>
			{/if}

			<!-- ═══ STEP 2: Schedule ═══ -->
			{#if step === 2}
				<div class="space-y-6 rounded-2xl border border-border-default bg-surface-raised p-8">
					<div class="space-y-1">
						<h2 class="text-2xl font-bold text-text-primary">Schedule</h2>
						<p class="text-sm text-text-secondary">Set the timing for your new cycle.</p>
					</div>

					<div class="grid gap-6 md:grid-cols-2">
						<div class="space-y-2">
							<label class="block text-sm font-semibold text-text-secondary" for="cycleLabel"
								>Cycle Name</label
							>
							<input
								id="cycleLabel"
								name="cycleLabel"
								type="text"
								required
								placeholder="e.g. Q2 2026 Leadership Cycle"
								class="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-text-primary transition-all focus:border-accent focus:ring-4 focus:ring-accent/10 focus:outline-none"
								value={cycleLabel}
								oninput={(e) => (cycleLabel = e.currentTarget.value)}
							/>
						</div>

						<div class="space-y-2">
							<label class="block text-sm font-semibold text-text-secondary" for="cycleStartDate"
								>Start Date</label
							>
							<input
								id="cycleStartDate"
								name="cycleStartDate"
								type="date"
								required
								class="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-text-primary transition-all focus:border-accent focus:ring-4 focus:ring-accent/10 focus:outline-none"
								value={cycleStartDate}
								oninput={(e) => (cycleStartDate = e.currentTarget.value)}
							/>
						</div>

						<!-- Duration -->
						<div class="space-y-3 md:col-span-2">
							<p class="block text-sm font-semibold text-text-secondary">Duration</p>
							<div class="grid grid-cols-4 gap-3">
								{#each [8, 12, 16] as weeks (weeks)}
									<button
										type="button"
										onclick={() => selectPresetDuration(weeks)}
										class="relative rounded-xl border px-4 py-3 text-center transition-all {cycleDurationMode ===
											'preset' && cycleDurationWeeks === String(weeks)
											? 'border-accent bg-accent-muted'
											: 'border-border-default bg-surface-raised hover:border-accent/30 hover:bg-surface-subtle'}"
									>
										<div class="text-lg font-bold text-text-primary">{weeks}</div>
										<div class="text-xs text-text-tertiary">weeks</div>
										{#if weeks === 12}
											<div class="mt-1 text-[10px] font-semibold text-accent">recommended</div>
										{/if}
									</button>
								{/each}
								<button
									type="button"
									onclick={enableCustomDuration}
									class="rounded-xl border px-4 py-3 text-center transition-all {cycleDurationMode ===
									'custom'
										? 'border-accent bg-accent-muted'
										: 'border-border-default bg-surface-raised hover:border-accent/30 hover:bg-surface-subtle'}"
								>
									<div class="text-lg font-bold text-text-primary">?</div>
									<div class="text-xs text-text-tertiary">Custom</div>
								</button>
							</div>
							{#if cycleDurationMode === 'custom'}
								<div class="flex items-center gap-3">
									<input
										type="number"
										min="4"
										max="26"
										placeholder="4-26"
										class="w-24 rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-center text-text-primary transition-all focus:border-accent focus:ring-4 focus:ring-accent/10 focus:outline-none"
										value={customDurationWeeks}
										oninput={(e) => {
											customDurationWeeks = e.currentTarget.value;
											const parsed = Number(e.currentTarget.value);
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
									Your cycle will end on <strong>{endDatePreview}</strong>
								</p>
							{/if}
							<p class="text-xs text-text-muted">{getDurationGuidance(cycleDurationNumber)}</p>
						</div>

						<!-- Check-in Days Picker -->
						<div class="space-y-3 md:col-span-2">
							<p class="block text-sm font-semibold text-text-secondary">Check-in days</p>
							<p class="text-xs text-text-tertiary">
								Select which days you want to check in. Each check-in covers effort + performance +
								notes.
							</p>

							<div class="flex flex-wrap gap-2">
								<button
									type="button"
									onclick={() => applyPreset(['tue', 'fri'])}
									class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all {selectedDays.join(
										','
									) === 'tue,fri'
										? 'border-accent bg-accent-muted text-accent'
										: 'border-border-default bg-surface-raised text-text-secondary hover:border-accent/30'}"
								>
									Tue + Fri (recommended)
								</button>
								<button
									type="button"
									onclick={() => applyPreset(['mon', 'wed', 'fri'])}
									class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all {selectedDays.join(
										','
									) === 'mon,wed,fri'
										? 'border-accent bg-accent-muted text-accent'
										: 'border-border-default bg-surface-raised text-text-secondary hover:border-accent/30'}"
								>
									Mon + Wed + Fri
								</button>
								<button
									type="button"
									onclick={() => applyPreset(['fri'])}
									class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all {selectedDays.join(
										','
									) === 'fri'
										? 'border-accent bg-accent-muted text-accent'
										: 'border-border-default bg-surface-raised text-text-secondary hover:border-accent/30'}"
								>
									Fri only
								</button>
							</div>

							<div class="grid grid-cols-7 gap-2">
								{#each allDays as day (day)}
									<button
										type="button"
										onclick={() => toggleDay(day)}
										class="flex flex-col items-center justify-center rounded-xl border py-3 transition-all {selectedDays.includes(
											day
										)
											? 'border-accent bg-accent-muted font-bold text-accent'
											: 'border-border-default bg-surface-raised text-text-tertiary hover:border-accent/30 hover:bg-surface-subtle'}"
									>
										<span class="text-sm">{dayLabels[day]}</span>
									</button>
								{/each}
							</div>

							<div class="rounded-xl border border-border-default bg-surface-subtle p-4">
								<p class="mb-3 text-xs font-semibold tracking-wider text-text-muted uppercase">
									Your Week
								</p>
								<div class="space-y-2">
									{#each weekPreviewDays as item (item.day)}
										<div
											class="flex items-center gap-3 rounded-lg bg-surface-raised px-3 py-2 text-sm"
										>
											<span class="w-10 shrink-0 font-semibold text-accent">{item.day}</span>
											<span class="flex-1 text-text-secondary">{item.label}</span>
											<span class="text-xs text-text-muted">{item.time}</span>
										</div>
									{/each}
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Step 2 actions -->
				<div class="mt-8 flex items-center justify-between gap-4">
					<button
						type="button"
						onclick={prevStep}
						class="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-surface-raised px-6 py-3 font-medium text-text-secondary transition-all hover:border-border-default hover:bg-surface-subtle"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 19l-7-7 7-7"
							/>
						</svg>
						Back
					</button>
					<button
						type="button"
						disabled={!step2Valid}
						onclick={nextStep}
						class="group inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3 font-semibold text-white transition-all hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
					>
						Next: Settings
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
							/>
						</svg>
					</button>
				</div>
			{/if}

			<!-- ═══ STEP 3: Settings & Review ═══ -->
			{#if step === 3}
				<div class="space-y-6">
					<div class="space-y-6 rounded-2xl border border-border-default bg-surface-raised p-8">
						<div class="space-y-1">
							<h2 class="text-2xl font-bold text-text-primary">Settings</h2>
							<p class="text-sm text-text-secondary">Fine-tune how your cycle runs.</p>
						</div>

						<!-- Reminder Days -->
						<div class="space-y-2">
							<p class="block text-sm font-semibold text-text-secondary">Feedback Reminder Days</p>
							<div class="grid gap-4 md:grid-cols-2">
								{#each [{ value: 'wednesday_friday', label: 'Wednesday & Friday', desc: 'Default option' }, { value: 'tuesday_thursday', label: 'Tuesday & Thursday', desc: 'Alternative option' }] as opt (opt.value)}
									<label
										class="group relative flex cursor-pointer rounded-xl border p-4 transition-all {reminderDays ===
										opt.value
											? 'border-accent bg-accent-muted'
											: 'border-border-default bg-surface-raised hover:border-accent/30 hover:bg-surface-subtle'}"
									>
										<input
											type="radio"
											name="_reminderDaysRadio"
											value={opt.value}
											checked={reminderDays === opt.value}
											onchange={() =>
												(reminderDays = opt.value as 'wednesday_friday' | 'tuesday_thursday')}
											class="sr-only"
										/>
										<div class="flex w-full items-center gap-3">
											<div
												class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {reminderDays ===
												opt.value
													? 'border-accent bg-accent'
													: 'border-border-strong bg-surface-raised'}"
											>
												{#if reminderDays === opt.value}
													<div class="h-2 w-2 rounded-full bg-white"></div>
												{/if}
											</div>
											<div class="flex-1">
												<div class="font-semibold text-text-primary">{opt.label}</div>
												<div class="text-xs text-text-secondary">{opt.desc}</div>
											</div>
										</div>
									</label>
								{/each}
							</div>
						</div>

						<!-- Reveal Scores Toggle -->
						<div>
							<label class="flex cursor-pointer items-center gap-3">
								<input
									type="checkbox"
									checked={revealScores}
									onchange={() => (revealScores = !revealScores)}
									class="h-4 w-4 rounded border-border-default text-accent focus:ring-accent"
								/>
								<div>
									<span class="text-sm font-semibold text-text-secondary"
										>Allow stakeholders to see my self-scores after they submit feedback</span
									>
									<p class="text-xs text-text-tertiary">
										When enabled, stakeholders see how you rated yourself so they can compare
										perspectives.
									</p>
								</div>
							</label>
						</div>

						<!-- Stakeholder Cadence -->
						<div class="space-y-3">
							<p class="block text-sm font-semibold text-text-secondary">
								Stakeholder feedback cadence
							</p>
							<div class="grid gap-3 md:grid-cols-2">
								{#each [{ value: 'weekly', label: 'Weekly', desc: 'Stakeholders rate you every week', rec: true }, { value: 'biweekly', label: 'Biweekly', desc: 'Every two weeks — less burden on stakeholders', rec: false }] as opt (opt.value)}
									<label
										class="group relative flex cursor-pointer rounded-xl border p-4 transition-all {stakeholderCadence ===
										opt.value
											? 'border-accent bg-accent-muted'
											: 'border-border-default bg-surface-raised hover:border-accent/30 hover:bg-surface-subtle'}"
									>
										<input
											type="radio"
											name="_stakeholderCadenceRadio"
											value={opt.value}
											checked={stakeholderCadence === opt.value}
											onchange={() => (stakeholderCadence = opt.value as 'weekly' | 'biweekly')}
											class="sr-only"
										/>
										<div class="flex w-full items-start gap-3">
											<div
												class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {stakeholderCadence ===
												opt.value
													? 'border-accent bg-accent'
													: 'border-border-strong bg-surface-raised'}"
											>
												{#if stakeholderCadence === opt.value}
													<div class="h-2 w-2 rounded-full bg-white"></div>
												{/if}
											</div>
											<div class="flex-1">
												<div class="font-semibold text-text-primary">{opt.label}</div>
												<div class="text-xs text-text-tertiary">{opt.desc}</div>
												{#if opt.rec}
													<div class="mt-1 text-[10px] font-semibold text-accent">recommended</div>
												{/if}
											</div>
										</div>
									</label>
								{/each}
							</div>
						</div>
					</div>

					<!-- Review summary -->
					<div class="rounded-2xl border border-accent/20 bg-surface-raised p-6">
						<p class="mb-4 text-xs font-semibold tracking-wider text-text-muted uppercase">
							Review
						</p>
						<div class="grid gap-3 text-sm sm:grid-cols-2">
							<div>
								<span class="text-text-muted">Objective:</span>
								<span class="ml-1 font-medium text-text-primary"
									>{cycleMode === 'continue' ? data.objective.title : freshObjectiveTitle}</span
								>
							</div>
							<div>
								<span class="text-text-muted">Cycle:</span>
								<span class="ml-1 font-medium text-text-primary">{cycleLabel || '—'}</span>
							</div>
							<div>
								<span class="text-text-muted">Duration:</span>
								<span class="ml-1 font-medium text-text-primary">{cycleDurationNumber} weeks</span>
							</div>
							<div>
								<span class="text-text-muted">Starts:</span>
								<span class="ml-1 font-medium text-text-primary">{cycleStartDate || '—'}</span>
							</div>
							<div>
								<span class="text-text-muted">Check-ins:</span>
								<span class="ml-1 font-medium text-text-primary"
									>{selectedDays.map((d) => dayLabels[d]).join(', ')}</span
								>
							</div>
							<div>
								<span class="text-text-muted">Stakeholder cadence:</span>
								<span class="ml-1 font-medium text-text-primary"
									>{stakeholderCadence === 'weekly' ? 'Weekly' : 'Biweekly'}</span
								>
							</div>
						</div>
					</div>
				</div>

				<!-- Step 3 actions -->
				<div class="mt-8 flex items-center justify-between gap-4">
					<button
						type="button"
						onclick={prevStep}
						class="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-surface-raised px-6 py-3 font-medium text-text-secondary transition-all hover:border-border-default hover:bg-surface-subtle"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 19l-7-7 7-7"
							/>
						</svg>
						Back
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						class="group inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3 font-semibold text-white transition-all hover:bg-accent-hover focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
					>
						{#if isSubmitting}
							<span
								class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
							></span>
							Creating...
						{:else}
							Start Cycle
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
								/>
							</svg>
						{/if}
					</button>
				</div>
			{/if}
		</form>
	</section>
</div>
