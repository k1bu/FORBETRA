<script lang="ts">
	import type { PageData, ActionData } from './$types';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	const formValues = (form as { values?: Record<string, string> } | null)?.values;
	let cycleLabel = $state(formValues?.cycleLabel ?? data.defaults.cycleLabel);
	let cycleStartDate = $state(formValues?.cycleStartDate ?? data.defaults.startDate);
	let cycleDurationWeeks = $state(String(formValues?.cycleDurationWeeks ?? data.defaults.durationWeeks));
	let cycleDurationMode: 'preset' | 'custom' = $state([8, 12, 16].includes(Number(cycleDurationWeeks)) ? 'preset' : 'custom');
	let customDurationWeeks = $state(cycleDurationMode === 'custom' ? cycleDurationWeeks : '');
	let checkInFrequency: '3x' | '2x' | '1x' = $state((data.defaults.checkInFrequency as '3x' | '2x' | '1x') ?? '3x');
	let stakeholderCadence: 'weekly' | 'biweekly' = $state((data.defaults.stakeholderCadence as 'weekly' | 'biweekly') ?? 'weekly');
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
	const endDatePreview = $derived((() => {
		if (!cycleStartDate || !cycleDurationNumber) return '';
		const start = new Date(cycleStartDate);
		if (isNaN(start.getTime())) return '';
		const end = new Date(start);
		end.setDate(end.getDate() + cycleDurationNumber * 7);
		return end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
	})());

	function getDurationGuidance(weeks: number): string {
		if (weeks <= 7) return 'Short sprint — focused skill experiments';
		if (weeks <= 12) return 'Standard — enough time for meaningful patterns';
		if (weeks <= 16) return 'Extended — deeper behavioral shifts';
		return 'Long-arc — major transitions';
	}

	const weekPreviewDays = $derived((() => {
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
			return [{ day: endDay, label: 'Weekly reflection', time: '~2 min' }];
		}
	})());
</script>

<div class="min-h-screen bg-surface-base">
	<section class="mx-auto max-w-3xl space-y-8 pb-12 pt-8 px-4">
		<!-- Header -->
		<div class="space-y-2">
			<a href="/individual" class="inline-flex items-center gap-1 text-sm text-text-tertiary hover:text-text-secondary transition-colors">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Back to hub
			</a>
			<h1 class="text-3xl font-bold text-text-primary">Start a New Cycle</h1>
			<p class="text-text-secondary">Continue working on your objective with a fresh cycle and updated settings.</p>
		</div>

		<!-- Objective Context (read-only) -->
		<div class="rounded-2xl border border-border-default bg-surface-raised p-6">
			<p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Your Objective</p>
			<h2 class="text-xl font-bold text-text-primary">{data.objective.title}</h2>
			{#if data.objective.description}
				<p class="mt-1 text-sm text-text-secondary">{data.objective.description}</p>
			{/if}
			{#if data.subgoals.length > 0}
				<div class="mt-4">
					<p class="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">Sub-objectives</p>
					<ul class="space-y-1">
						{#each data.subgoals as subgoal}
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

		<!-- Form errors -->
		{#if form?.error}
			<div class="rounded-xl border border-error/20 bg-error-muted p-4 text-sm text-error">
				<p class="font-medium">{form.error}</p>
			</div>
		{/if}

		<!-- Cycle Config Form -->
		<form method="post" class="space-y-8">
			<input type="hidden" name="reminderDays" value={reminderDays} />
			<input type="hidden" name="checkInFrequency" value={checkInFrequency} />
			<input type="hidden" name="stakeholderCadence" value={stakeholderCadence} />
			<input type="hidden" name="cycleDurationWeeks" value={cycleDurationWeeks} />
			<input type="hidden" name="revealScores" value={revealScores ? 'true' : 'false'} />

			<div class="rounded-2xl border border-border-default bg-surface-raised p-8 space-y-6">
				<div class="space-y-2">
					<h2 class="text-2xl font-bold text-text-primary">Cycle Settings</h2>
					<p class="text-text-secondary">Configure your new cycle. Defaults are carried over from your last cycle.</p>
				</div>

				<div class="grid gap-6 md:grid-cols-2">
					<div class="space-y-2">
						<label class="block text-sm font-semibold text-text-secondary" for="cycleLabel">Cycle Name</label>
						<input
							id="cycleLabel"
							name="cycleLabel"
							type="text"
							required
							placeholder="e.g. Q2 2026 Leadership Cycle"
							class="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-text-primary transition-all focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10"
							value={cycleLabel}
							oninput={(e) => (cycleLabel = e.currentTarget.value)}
						/>
					</div>

					<div class="space-y-2">
						<label class="block text-sm font-semibold text-text-secondary" for="cycleStartDate">Start Date</label>
						<input
							id="cycleStartDate"
							name="cycleStartDate"
							type="date"
							required
							class="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-text-primary transition-all focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10"
							value={cycleStartDate}
							oninput={(e) => (cycleStartDate = e.currentTarget.value)}
						/>
					</div>

					<!-- Duration -->
					<div class="space-y-3 md:col-span-2">
						<label class="block text-sm font-semibold text-text-secondary">Duration</label>
						<div class="grid grid-cols-4 gap-3">
							{#each [8, 12, 16] as weeks}
								<button
									type="button"
									onclick={() => selectPresetDuration(weeks)}
									class="relative rounded-xl border px-4 py-3 text-center transition-all {cycleDurationMode === 'preset' && cycleDurationWeeks === String(weeks)
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
								class="rounded-xl border px-4 py-3 text-center transition-all {cycleDurationMode === 'custom'
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
									class="w-24 rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-center text-text-primary transition-all focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10"
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

					<!-- Check-in Frequency -->
					<div class="space-y-3 md:col-span-2">
						<label class="block text-sm font-semibold text-text-secondary">Check-in frequency</label>
						<div class="grid gap-3 md:grid-cols-3">
							{#each [
								{ value: '3x', label: '3x/week', desc: 'Monday intention, midweek effort, end-of-week performance', rec: true },
								{ value: '2x', label: '2x/week', desc: 'Monday intention + end-of-week combined rating', rec: false },
								{ value: '1x', label: '1x/week', desc: 'Single weekly reflection covering effort and performance', rec: false }
							] as opt}
								<label
									class="group relative flex cursor-pointer rounded-xl border p-4 transition-all {checkInFrequency === opt.value
										? 'border-accent bg-accent-muted'
										: 'border-border-default bg-surface-raised hover:border-accent/30 hover:bg-surface-subtle'}"
								>
									<input
										type="radio"
										name="_checkInFrequencyRadio"
										value={opt.value}
										checked={checkInFrequency === opt.value}
										onchange={() => (checkInFrequency = opt.value as '3x' | '2x' | '1x')}
										class="sr-only"
									/>
									<div class="flex w-full items-start gap-3">
										<div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {checkInFrequency === opt.value ? 'border-accent bg-accent' : 'border-border-strong bg-surface-raised'}">
											{#if checkInFrequency === opt.value}
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

						<!-- Your Week Preview -->
						<div class="rounded-xl border border-border-default bg-surface-subtle p-4">
							<p class="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Your Week</p>
							<div class="space-y-2">
								{#each weekPreviewDays as item}
									<div class="flex items-center gap-3 rounded-lg bg-surface-raised px-3 py-2 text-sm">
										<span class="w-10 shrink-0 font-semibold text-accent">{item.day}</span>
										<span class="flex-1 text-text-secondary">{item.label}</span>
										<span class="text-xs text-text-muted">{item.time}</span>
									</div>
								{/each}
							</div>
						</div>
					</div>

					<!-- Reminder Days -->
					<div class="space-y-2 md:col-span-2">
						<label class="block text-sm font-semibold text-text-secondary">Feedback Reminder Days</label>
						<div class="grid gap-4 md:grid-cols-2">
							{#each [
								{ value: 'wednesday_friday', label: 'Wednesday & Friday', desc: 'Default option' },
								{ value: 'tuesday_thursday', label: 'Tuesday & Thursday', desc: 'Alternative option' }
							] as opt}
								<label
									class="group relative flex cursor-pointer rounded-xl border p-4 transition-all {reminderDays === opt.value
										? 'border-accent bg-accent-muted'
										: 'border-border-default bg-surface-raised hover:border-accent/30 hover:bg-surface-subtle'}"
								>
									<input
										type="radio"
										name="_reminderDaysRadio"
										value={opt.value}
										checked={reminderDays === opt.value}
										onchange={() => (reminderDays = opt.value as 'wednesday_friday' | 'tuesday_thursday')}
										class="sr-only"
									/>
									<div class="flex w-full items-center gap-3">
										<div class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {reminderDays === opt.value ? 'border-accent bg-accent' : 'border-border-strong bg-surface-raised'}">
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
					<div class="space-y-2 md:col-span-2">
						<label class="flex items-center gap-3 cursor-pointer">
							<input
								type="checkbox"
								checked={revealScores}
								onchange={() => (revealScores = !revealScores)}
								class="h-4 w-4 rounded border-border-default text-accent focus:ring-accent"
							/>
							<div>
								<span class="text-sm font-semibold text-text-secondary">Allow stakeholders to see my self-scores after they submit feedback</span>
								<p class="text-xs text-text-tertiary">When enabled, stakeholders see how you rated yourself so they can compare perspectives.</p>
							</div>
						</label>
					</div>

					<!-- Stakeholder Cadence -->
					<div class="space-y-3 md:col-span-2">
						<label class="block text-sm font-semibold text-text-secondary">Stakeholder feedback cadence</label>
						<div class="grid gap-3 md:grid-cols-2">
							{#each [
								{ value: 'weekly', label: 'Weekly', desc: 'Stakeholders rate you every week', rec: true },
								{ value: 'biweekly', label: 'Biweekly', desc: 'Every two weeks — less burden on stakeholders', rec: false }
							] as opt}
								<label
									class="group relative flex cursor-pointer rounded-xl border p-4 transition-all {stakeholderCadence === opt.value
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
										<div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {stakeholderCadence === opt.value ? 'border-accent bg-accent' : 'border-border-strong bg-surface-raised'}">
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
			</div>

			<!-- Submit -->
			<div class="flex items-center justify-between gap-4">
				<a
					href="/individual"
					class="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-surface-raised px-6 py-3 font-medium text-text-secondary transition-all hover:border-border-default hover:bg-surface-subtle"
				>
					Cancel
				</a>
				<button
					type="submit"
					class="group inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3 font-semibold text-white transition-all hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
				>
					Start Cycle
					<svg class="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
					</svg>
				</button>
			</div>
		</form>
	</section>
</div>
