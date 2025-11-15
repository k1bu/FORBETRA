<script lang="ts">
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	const stakeholderFormValues =
		form?.action === 'stakeholder' && form?.values
			? {
					name: form.values.name ?? '',
					email: form.values.email ?? '',
					relationship: form.values.relationship ?? ''
				}
			: { name: '', email: '', relationship: '' };

	const stakeholderError =
		form?.action === 'stakeholder' && form?.error ? form.error : null;
	const stakeholderSuccess = form?.action === 'stakeholder' && form?.success ? true : false;

	const formatDateTime = (value: string | null) => {
		if (!value) return '—';
		return new Intl.DateTimeFormat('en-US', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	};

	const formatAverage = (value: number | null | undefined) => {
		if (value === null || value === undefined) {
			return '—';
		}
		return value.toFixed(1);
	};

	const formatPercent = (value: number | null | undefined) => {
		if (value === null || value === undefined) {
			return '—';
		}
		return `${Math.round(value * 100)}%`;
	};

	const formatScore = (value: number | null | undefined) => {
		if (value === null || value === undefined) {
			return '—';
		}
		return `${value}/100`;
	};

	const formatDate = (value: string | null | undefined) => {
		if (!value) return '—';
		return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
	};

	const formatPromptLabel = (type: string) => {
		switch (type) {
			case 'INTENTION':
				return 'Monday intention prompt';
			case 'EFFORT':
				return 'Wednesday check-in';
			case 'PROGRESS':
				return 'Friday check-in';
			default:
				return 'Upcoming prompt';
		}
	};

	const promptTarget = (type: string) => {
		switch (type) {
			case 'INTENTION':
				return '/prompts/monday';
			case 'EFFORT':
			case 'PROGRESS':
				return '/reflections/checkin';
			default:
				return '/individual';
		}
	};

	const getProgressColor = (completion: number) => {
		if (completion < 25) return 'from-amber-500 to-orange-500';
		if (completion < 50) return 'from-blue-500 to-cyan-500';
		if (completion < 75) return 'from-emerald-500 to-teal-500';
		return 'from-purple-500 to-pink-500';
	};

	const getScoreColor = (score: number | null | undefined) => {
		if (score === null || score === undefined) return 'text-neutral-400';
		if (score < 3) return 'text-amber-600';
		if (score < 6) return 'text-blue-600';
		if (score < 8) return 'text-emerald-600';
		return 'text-purple-600';
	};

	const getConsistencyColor = (score: number | null | undefined) => {
		if (score === null || score === undefined) return 'text-neutral-400';
		if (score < 50) return 'text-amber-600';
		if (score < 75) return 'text-blue-600';
		return 'text-emerald-600';
	};
</script>

<section class="mx-auto flex max-w-6xl flex-col gap-8 p-4 pb-12">
	<!-- Back to Hub Link -->
	<div class="flex items-center justify-between">
		<a
			href="/individual"
			class="group flex items-center gap-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
		>
			<svg
				class="h-4 w-4 transition-transform group-hover:-translate-x-1"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Back to Hub
		</a>
	</div>

	<!-- Hero Header -->
	<header class="relative overflow-hidden rounded-3xl border-2 border-neutral-200 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8 shadow-lg">
		<div class="absolute right-0 top-0 h-64 w-64 rounded-full bg-gradient-to-br from-blue-200/30 to-purple-200/30 blur-3xl"></div>
		<div class="relative">
			<div class="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-xs font-semibold text-blue-700 backdrop-blur-sm">
				<span class="h-2 w-2 animate-pulse rounded-full bg-blue-500"></span>
				Active Cycle
			</div>
			<h1 class="mb-3 text-4xl font-bold text-neutral-900">Your Objective: {data.objective.title}</h1>
			{#if data.objective.description}
				<p class="mb-6 text-lg leading-relaxed text-neutral-700">{data.objective.description}</p>
			{/if}
			{#if data.subgoals.length}
				<div class="mt-6 space-y-3">
					<h2 class="text-sm font-semibold uppercase tracking-wide text-neutral-600">Your Subgoals</h2>
					<div class="grid gap-3 md:grid-cols-3">
						{#each data.subgoals as subgoal, index (subgoal.id)}
							<div class="group rounded-xl border-2 border-neutral-100 bg-white/80 p-4 backdrop-blur-sm transition-all hover:border-blue-200 hover:shadow-md">
								<div class="mb-2 flex items-start gap-3">
									<span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
										{index + 1}
									</span>
									<div class="flex-1">
										<p class="font-semibold text-neutral-900">{subgoal.label}</p>
										{#if subgoal.description}
											<p class="mt-1 text-xs text-neutral-600">{subgoal.description}</p>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Identity Anchor Display -->
			{#if data.identityAnchor}
				<div class="mt-6 rounded-xl border-2 border-purple-200/50 bg-white/60 p-5 backdrop-blur-sm">
					<div class="mb-3 flex items-center gap-2">
						<span class="text-xl">🎯</span>
						<h2 class="text-sm font-semibold uppercase tracking-wide text-purple-700">Your Identity Anchor</h2>
					</div>
					<p class="text-base leading-relaxed text-neutral-800 italic">
						"{data.identityAnchor}"
					</p>
					<p class="mt-2 text-xs text-neutral-600">
						This anchor reminds you of who you're choosing to become throughout this cycle.
					</p>
				</div>
			{/if}
		</div>
	</header>

	{#if form?.action === 'feedback'}
		{#if form.error}
			<div class="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-sm text-red-700">
				{form.error}
			</div>
		{:else if form.feedbackLink}
			<div class="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 text-sm text-emerald-700">
				<p class="mb-2 font-semibold">✅ Feedback link generated!</p>
				<p class="mb-2 font-mono break-all text-xs">{form.feedbackLink}</p>
				{#if form.expiresAt}
					<p class="text-xs text-emerald-600">Expires {formatDateTime(form.expiresAt)}.</p>
				{/if}
			</div>
		{/if}
	{/if}

	{#if data.cycle}
		<!-- Quick Stats Grid -->
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<!-- Next Prompt Card -->
			{#if data.nextPrompt}
				<div class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow-sm transition-all hover:border-purple-300 hover:shadow-md">
					<div class="mb-3 flex items-center gap-2">
						<span class="text-2xl">⏰</span>
						<p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Next Up</p>
					</div>
					<p class="mb-1 text-lg font-bold text-neutral-900">{formatPromptLabel(data.nextPrompt.type)}</p>
					<p class="mb-4 text-sm text-neutral-600">{formatDate(data.nextPrompt.date)}</p>
					<form method="get" action={promptTarget(data.nextPrompt.type)}>
						<button
							type="submit"
							class="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-lg hover:scale-105"
						>
							Open Prompt →
						</button>
					</form>
				</div>
			{/if}

			<!-- Cycle Progress Card -->
			<div class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md">
				<div class="mb-3 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<span class="text-2xl">📊</span>
						<p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Progress</p>
					</div>
				</div>
				<div class="mb-3">
					<div class="mb-2 flex items-baseline gap-2">
						<p class="text-3xl font-bold text-neutral-900">{data.cycle.completion}%</p>
						<p class="text-sm text-neutral-500">
							{data.cycle.weeksElapsed}/{data.cycle.totalWeeks} weeks
						</p>
					</div>
					<div class="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
						<div
							class="h-full rounded-full bg-gradient-to-r transition-all duration-500 {getProgressColor(
								data.cycle.completion
							)}"
							style={`width: ${data.cycle.completion}%`}
						></div>
					</div>
				</div>
				<p class="text-xs text-neutral-600">
					<span class="font-semibold">{data.cycle.reflectionsRecorded}</span> reflections submitted
				</p>
			</div>

			<!-- Feedback Summary Card -->
			{#if data.feedbackSummary}
				<div class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md">
					<div class="mb-3 flex items-center gap-2">
						<span class="text-2xl">👥</span>
						<p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Feedback</p>
					</div>
					<div class="mb-2 flex items-baseline gap-2">
						<p class="text-3xl font-bold text-neutral-900">
							{data.feedbackSummary.responded}/{data.feedbackSummary.totalStakeholders}
						</p>
						<p class="text-sm text-neutral-500">responded</p>
					</div>
					<div class="space-y-1 text-xs text-neutral-600">
						<p>
							Effort: <span class="font-semibold {getScoreColor(data.feedbackSummary.avgEffort)}">{formatAverage(data.feedbackSummary.avgEffort)}</span>
						</p>
						<p>
							Progress: <span class="font-semibold {getScoreColor(data.feedbackSummary.avgProgress)}">{formatAverage(data.feedbackSummary.avgProgress)}</span>
						</p>
					</div>
				</div>
			{/if}

			<!-- Engagement Card (Completion Rate & Streaks) -->
			{#if data.engagement}
				<div class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md">
					<div class="mb-3 flex items-center gap-2">
						<span class="text-2xl">🔥</span>
						<p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Engagement</p>
					</div>
					{#if data.engagement.completionRate !== null}
						<div class="mb-4">
							<div class="mb-2 flex items-baseline gap-2">
								<p class="text-3xl font-bold text-neutral-900">{data.engagement.completionRate}%</p>
								<p class="text-xs text-neutral-600">complete</p>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
								<div
									class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
									style={`width: ${data.engagement.completionRate}%`}
								></div>
							</div>
							<p class="mt-1 text-xs text-neutral-600">
								{data.engagement.totalCompleted} of {data.engagement.totalExpected} check-ins
							</p>
						</div>
					{/if}
					<div class="flex gap-4 text-xs">
						<div class="flex-1 rounded-lg bg-white/60 p-3 backdrop-blur-sm">
							<p class="text-neutral-500">Current Streak</p>
							<p class="mt-1 text-2xl font-bold text-emerald-700">{data.engagement.currentStreak}</p>
							<p class="text-neutral-600">check-ins</p>
						</div>
						<div class="flex-1 rounded-lg bg-white/60 p-3 backdrop-blur-sm">
							<p class="text-neutral-500">Best Streak</p>
							<p class="mt-1 text-2xl font-bold text-teal-700">{data.engagement.bestStreak}</p>
							<p class="text-neutral-600">check-ins</p>
						</div>
					</div>
				</div>
			{/if}

		</div>

		<!-- Cycle Details -->
		<div class="space-y-6">
			<div class="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-center gap-2">
					<span class="text-xl">📅</span>
					<h2 class="text-lg font-bold text-neutral-900">Cycle Details</h2>
				</div>
				<div class="mb-4 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
					<span class="font-semibold text-neutral-900">{data.cycle.label}</span>
					<span>Start {formatDate(data.cycle.startDate)}</span>
					{#if data.cycle.endDate}
						<span>End {formatDate(data.cycle.endDate)}</span>
					{/if}
				</div>
				{#if data.weeklyExperiences.length}
					<div class="space-y-3">
						<h3 class="text-sm font-semibold uppercase tracking-wide text-neutral-500">This Week's Experiences</h3>
						<div class="grid gap-3 md:grid-cols-3">
							{#each data.weeklyExperiences as experience (experience.type)}
								{@const stateColors = {
									open: 'border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100',
									completed: 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100',
									missed: 'border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100',
									upcoming: 'border-neutral-300 bg-gradient-to-br from-neutral-50 to-neutral-100'
								}}
								{@const stateIcons = {
									open: '🔵',
									completed: '✅',
									missed: '⏸️',
									upcoming: '⏳'
								}}
								{@const stateLabels = {
									open: 'Open',
									completed: 'Completed',
									missed: 'Missed',
									upcoming: 'Upcoming'
								}}
								<div class="rounded-xl border-2 {stateColors[experience.state]} p-4 transition-all hover:shadow-md">
									<div class="mb-2 flex items-center gap-2">
										<span class="text-lg">{stateIcons[experience.state]}</span>
										<span class="text-xs font-semibold uppercase tracking-wide text-neutral-600">{stateLabels[experience.state]}</span>
									</div>
									<p class="mb-2 font-semibold text-neutral-900">{experience.label}</p>
									{#if experience.availableDate}
										<p class="mb-3 text-xs text-neutral-600">
											Available: {formatDate(experience.availableDate)}
										</p>
									{/if}
									{#if experience.deadlineDate && experience.state !== 'completed'}
										<p class="mb-3 text-xs text-neutral-600">
											Deadline: {formatDate(experience.deadlineDate)}
										</p>
									{/if}
									{#if experience.url && (experience.state === 'open' || experience.state === 'completed')}
										<a
											href={experience.url}
											class="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-all hover:bg-neutral-50 hover:shadow-sm"
										>
											{experience.state === 'open' ? 'Complete →' : 'View →'}
										</a>
									{:else if experience.state === 'missed'}
										<p class="text-xs font-medium text-neutral-600">Window closed — keep going this week!</p>
									{:else if experience.state === 'upcoming'}
										<p class="text-xs font-medium text-neutral-500">Coming soon</p>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</section>
