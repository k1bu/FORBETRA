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

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
	<section class="mx-auto max-w-3xl space-y-8 pb-12 pt-8 px-4">
		<!-- Header -->
		<div class="space-y-2">
			<a href="/individual" class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors">
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				Back to hub
			</a>
			<h1 class="text-3xl font-bold text-slate-900">Start a New Cycle</h1>
			<p class="text-slate-600">Continue working on your objective with a fresh cycle and updated settings.</p>
		</div>

		<!-- Objective Context (read-only) -->
		<div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
			<p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Your Objective</p>
			<h2 class="text-xl font-bold text-slate-900">{data.objective.title}</h2>
			{#if data.objective.description}
				<p class="mt-1 text-sm text-slate-600">{data.objective.description}</p>
			{/if}
			{#if data.subgoals.length > 0}
				<div class="mt-4">
					<p class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Sub-objectives</p>
					<ul class="space-y-1">
						{#each data.subgoals as subgoal}
							<li class="flex items-start gap-2 text-sm text-slate-600">
								<span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400"></span>
								{subgoal.label}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
			{#if data.lastCycle}
				<div class="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
					Previous cycle: <strong>{data.lastCycle.label ?? 'Cycle'}</strong>
				</div>
			{/if}
		</div>

		<!-- Form errors -->
		{#if form?.error}
			<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
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

			<div class="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg space-y-6">
				<div class="space-y-2">
					<h2 class="text-2xl font-bold text-slate-900">Cycle Settings</h2>
					<p class="text-slate-600">Configure your new cycle. Defaults are carried over from your last cycle.</p>
				</div>

				<div class="grid gap-6 md:grid-cols-2">
					<div class="space-y-2">
						<label class="block text-sm font-semibold text-slate-700" for="cycleLabel">Cycle Name</label>
						<input
							id="cycleLabel"
							name="cycleLabel"
							type="text"
							required
							placeholder="e.g. Q2 2026 Leadership Cycle"
							class="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
							value={cycleLabel}
							oninput={(e) => (cycleLabel = e.currentTarget.value)}
						/>
					</div>

					<div class="space-y-2">
						<label class="block text-sm font-semibold text-slate-700" for="cycleStartDate">Start Date</label>
						<input
							id="cycleStartDate"
							name="cycleStartDate"
							type="date"
							required
							class="w-full rounded-xl border-2 border-slate-300 px-4 py-3 text-slate-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
							value={cycleStartDate}
							oninput={(e) => (cycleStartDate = e.currentTarget.value)}
						/>
					</div>

					<!-- Duration -->
					<div class="space-y-3 md:col-span-2">
						<label class="block text-sm font-semibold text-slate-700">Duration</label>
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
									oninput={(e) => {
										customDurationWeeks = e.currentTarget.value;
										const parsed = Number(e.currentTarget.value);
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
					</div>

					<!-- Check-in Frequency -->
					<div class="space-y-3 md:col-span-2">
						<label class="block text-sm font-semibold text-slate-700">Check-in frequency</label>
						<div class="grid gap-3 md:grid-cols-3">
							{#each [
								{ value: '3x', label: '3x/week', desc: 'Monday intention, midweek effort, end-of-week performance', rec: true },
								{ value: '2x', label: '2x/week', desc: 'Monday intention + end-of-week combined rating', rec: false },
								{ value: '1x', label: '1x/week', desc: 'Single weekly reflection covering effort and performance', rec: false }
							] as opt}
								<label
									class="group relative flex cursor-pointer rounded-xl border-2 p-4 transition-all {checkInFrequency === opt.value
										? 'border-blue-500 bg-blue-50'
										: 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'}"
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
										<div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {checkInFrequency === opt.value ? 'border-blue-500 bg-blue-500' : 'border-slate-300 bg-white'}">
											{#if checkInFrequency === opt.value}
												<div class="h-2 w-2 rounded-full bg-white"></div>
											{/if}
										</div>
										<div class="flex-1">
											<div class="font-semibold text-slate-900">{opt.label}</div>
											<div class="text-xs text-slate-500">{opt.desc}</div>
											{#if opt.rec}
												<div class="mt-1 text-[10px] font-semibold text-blue-600">recommended</div>
											{/if}
										</div>
									</div>
								</label>
							{/each}
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

					<!-- Reminder Days -->
					<div class="space-y-2 md:col-span-2">
						<label class="block text-sm font-semibold text-slate-700">Feedback Reminder Days</label>
						<div class="grid gap-4 md:grid-cols-2">
							{#each [
								{ value: 'wednesday_friday', label: 'Wednesday & Friday', desc: 'Default option' },
								{ value: 'tuesday_thursday', label: 'Tuesday & Thursday', desc: 'Alternative option' }
							] as opt}
								<label
									class="group relative flex cursor-pointer rounded-xl border-2 p-4 transition-all {reminderDays === opt.value
										? 'border-blue-500 bg-blue-50'
										: 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'}"
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
										<div class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {reminderDays === opt.value ? 'border-blue-500 bg-blue-500' : 'border-slate-300 bg-white'}">
											{#if reminderDays === opt.value}
												<div class="h-2 w-2 rounded-full bg-white"></div>
											{/if}
										</div>
										<div class="flex-1">
											<div class="font-semibold text-slate-900">{opt.label}</div>
											<div class="text-xs text-slate-600">{opt.desc}</div>
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
								class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
							/>
							<div>
								<span class="text-sm font-semibold text-slate-700">Allow stakeholders to see my self-scores after they submit feedback</span>
								<p class="text-xs text-slate-500">When enabled, stakeholders see how you rated yourself so they can compare perspectives.</p>
							</div>
						</label>
					</div>

					<!-- Stakeholder Cadence -->
					<div class="space-y-3 md:col-span-2">
						<label class="block text-sm font-semibold text-slate-700">Stakeholder feedback cadence</label>
						<div class="grid gap-3 md:grid-cols-2">
							{#each [
								{ value: 'weekly', label: 'Weekly', desc: 'Stakeholders rate you every week', rec: true },
								{ value: 'biweekly', label: 'Biweekly', desc: 'Every two weeks — less burden on stakeholders', rec: false }
							] as opt}
								<label
									class="group relative flex cursor-pointer rounded-xl border-2 p-4 transition-all {stakeholderCadence === opt.value
										? 'border-blue-500 bg-blue-50'
										: 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'}"
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
										<div class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 {stakeholderCadence === opt.value ? 'border-blue-500 bg-blue-500' : 'border-slate-300 bg-white'}">
											{#if stakeholderCadence === opt.value}
												<div class="h-2 w-2 rounded-full bg-white"></div>
											{/if}
										</div>
										<div class="flex-1">
											<div class="font-semibold text-slate-900">{opt.label}</div>
											<div class="text-xs text-slate-500">{opt.desc}</div>
											{#if opt.rec}
												<div class="mt-1 text-[10px] font-semibold text-blue-600">recommended</div>
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
					class="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
				>
					Cancel
				</a>
				<button
					type="submit"
					class="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
