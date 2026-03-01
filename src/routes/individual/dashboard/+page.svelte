<script lang="ts">
	/* eslint-disable @typescript-eslint/no-unused-vars */
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

	const stakeholderError = form?.action === 'stakeholder' && form?.error ? form.error : null;
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
			case 'RATING_A':
				return 'Check-in';
			case 'RATING_B':
				return 'Check-in';
			default:
				return 'Upcoming prompt';
		}
	};

	const promptTarget = (type: string) => {
		switch (type) {
			case 'RATING_A':
			case 'RATING_B':
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

	import {
		Clock,
		BarChart3,
		Users,
		Flame,
		Calendar,
		CircleCheck,
		CircleX,
		RotateCcw
	} from 'lucide-svelte';
	import PerformanceEffortChart from '$lib/components/PerformanceEffortChart.svelte';
	import { getScoreColorNullable, getStabilityColor } from '$lib/utils/scoreColors';

	const getScoreColor = (
		score: number | null | undefined,
		type: 'effort' | 'performance' = 'effort'
	) => getScoreColorNullable(score, type);
</script>

<svelte:head>
	<title>Dashboard | Forbetra</title>
</svelte:head>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<section class="mx-auto flex max-w-6xl flex-col gap-8 p-4 pb-12">
	<!-- Page Header -->
	<header>
		<nav aria-label="Breadcrumb" class="mb-2">
			<ol class="flex items-center gap-1.5 text-sm text-text-tertiary">
				<li>
					<a
						href="/individual"
						class="rounded transition-colors hover:text-text-primary focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
						>Hub</a
					>
				</li>
				<li aria-hidden="true" class="text-text-muted">
					<svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/></svg
					>
				</li>
				<li><span class="font-medium text-text-primary">Dashboard</span></li>
			</ol>
		</nav>
		<h1 class="text-3xl font-bold text-text-primary">{data.objective.title}</h1>
		{#if data.objective.description}
			<p class="mt-1 text-text-secondary">{data.objective.description}</p>
		{/if}
		{#if data.subgoals.length}
			<div class="mt-4 flex flex-wrap gap-2">
				{#each data.subgoals as subgoal, index (subgoal.id)}
					<span
						class="rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-secondary"
					>
						{subgoal.label}
					</span>
				{/each}
			</div>
		{/if}
	</header>

	{#if form?.action === 'feedback'}
		{#if form.error}
			<div class="rounded-xl border border-error/20 bg-error-muted p-4 text-sm text-error">
				{form.error}
			</div>
		{:else if form.feedbackLink}
			<div class="rounded-xl border border-success/20 bg-success-muted p-4 text-sm text-success">
				<p class="mb-2 font-semibold">
					<CircleCheck class="inline h-4 w-4 text-success" /> Feedback link generated!
				</p>
				<p class="mb-2 font-mono text-xs break-all">{form.feedbackLink}</p>
				{#if form.expiresAt}
					<p class="text-xs text-success">Expires {formatDateTime(form.expiresAt)}.</p>
				{/if}
			</div>
		{/if}
	{/if}

	{#if data.cycle}
		<!-- Quick Stats Grid -->
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<!-- Next Prompt Card -->
			{#if data.nextPrompt}
				<div
					class="rounded-xl border border-border-default bg-surface-raised p-6 transition-all hover:border-accent/30"
				>
					<div class="mb-3 flex items-center gap-2">
						<Clock class="h-4 w-4 text-text-muted" />
						<p class="text-xs font-semibold tracking-wide text-text-tertiary uppercase">Next Up</p>
					</div>
					<p class="mb-1 text-lg font-bold text-text-primary">
						{formatPromptLabel(data.nextPrompt.type)}
					</p>
					<p class="mb-4 text-sm text-text-secondary">{formatDate(data.nextPrompt.date)}</p>
					<form method="get" action={promptTarget(data.nextPrompt.type)}>
						<button
							type="submit"
							class="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-hover"
						>
							Open Prompt →
						</button>
					</form>
				</div>
			{/if}

			<!-- Cycle Progress Card -->
			<div
				class="rounded-xl border border-border-default bg-surface-raised p-6 transition-all hover:border-accent/30"
			>
				<div class="mb-3 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<BarChart3 class="h-4 w-4 text-text-muted" />
						<p class="text-xs font-semibold tracking-wide text-text-tertiary uppercase">Progress</p>
					</div>
				</div>
				<div class="mb-3">
					<div class="mb-2 flex items-baseline gap-2">
						<p class="text-3xl font-bold text-text-primary">{data.cycle.completion}%</p>
						<p class="text-sm text-text-tertiary">
							{data.cycle.weeksElapsed}/{data.cycle.totalWeeks} weeks
						</p>
					</div>
					<div class="relative h-3 w-full rounded-full bg-surface-subtle">
						<div
							class="h-full rounded-full bg-accent transition-all duration-500"
							style={`width: ${data.cycle.completion}%`}
						></div>
						<div class="pointer-events-none absolute inset-y-0 left-[25%] w-px bg-white/10"></div>
						<div class="pointer-events-none absolute inset-y-0 left-[50%] w-px bg-white/10"></div>
						<div class="pointer-events-none absolute inset-y-0 left-[75%] w-px bg-white/10"></div>
					</div>
					<div class="mt-0.5 flex justify-between text-[9px] text-text-muted" aria-hidden="true">
						<span>0</span>
						<span>25%</span>
						<span>50%</span>
						<span>75%</span>
						<span>100%</span>
					</div>
				</div>
				<p class="text-xs text-text-secondary">
					<span class="font-semibold">{data.cycle.reflectionsRecorded}</span> check-ins submitted
				</p>
				{#if data.cycle.completion >= Math.round((data.cycle.weeksElapsed / data.cycle.totalWeeks) * 100)}
					<p class="mt-1 text-[10px] text-success">On pace or ahead</p>
				{:else if data.cycle.completion >= Math.round((data.cycle.weeksElapsed / data.cycle.totalWeeks) * 100) - 15}
					<p class="mt-1 text-[10px] text-text-muted">Slightly behind pace</p>
				{:else}
					<p class="mt-1 text-[10px] text-warning">Behind pace — catch up this week</p>
				{/if}
			</div>

			<!-- Feedback Summary Card -->
			{#if data.feedbackSummary}
				<div
					class="rounded-xl border border-border-default bg-surface-raised p-6 transition-all hover:border-accent/30"
				>
					<div class="mb-3 flex items-center gap-2">
						<Users class="h-4 w-4 text-text-muted" />
						<p class="text-xs font-semibold tracking-wide text-text-tertiary uppercase">Feedback</p>
					</div>
					<div class="mb-2 flex items-baseline gap-2">
						<p class="text-3xl font-bold text-text-primary">
							{data.feedbackSummary.responded}/{data.feedbackSummary.totalStakeholders}
						</p>
						<p class="text-sm text-text-tertiary">responded</p>
					</div>
					<div class="space-y-1 text-xs text-text-secondary">
						<p>
							Effort: <span
								class="font-semibold {getScoreColor(data.feedbackSummary.avgEffort, 'effort')}"
								>{formatAverage(data.feedbackSummary.avgEffort)}</span
							>
						</p>
						<p>
							Progress: <span
								class="font-semibold {getScoreColor(
									data.feedbackSummary.avgProgress,
									'performance'
								)}">{formatAverage(data.feedbackSummary.avgProgress)}</span
							>
						</p>
					</div>
				</div>
			{/if}

			<!-- Engagement Card (Completion Rate & Streaks) -->
			{#if data.engagement}
				<div
					class="rounded-xl border border-border-default bg-surface-raised p-6 transition-all hover:border-accent/30"
				>
					<div class="mb-3 flex items-center gap-2">
						<Flame class="h-4 w-4 text-text-muted" />
						<p class="text-xs font-semibold tracking-wide text-text-tertiary uppercase">
							Engagement
						</p>
					</div>
					{#if data.engagement.completionRate !== null}
						<div class="mb-4">
							<div class="mb-2 flex items-baseline gap-2">
								<p class="text-3xl font-bold text-text-primary">
									{data.engagement.completionRate}%
								</p>
								<p class="text-xs text-text-secondary">complete</p>
							</div>
							<div class="h-2 w-full overflow-hidden rounded-full bg-surface-subtle">
								<div
									class="h-full rounded-full bg-accent transition-all duration-500"
									style={`width: ${data.engagement.completionRate}%`}
								></div>
							</div>
							<p class="mt-1 text-xs text-text-secondary">
								{data.engagement.totalCompleted} of {data.engagement.totalExpected} check-ins
							</p>
						</div>
					{/if}
					<div class="flex gap-4 text-xs">
						<div class="flex-1 rounded-xl border border-border-default bg-surface-raised p-3">
							<p class="text-text-tertiary">Current Streak</p>
							<p class="mt-1 text-2xl font-bold text-success">{data.engagement.currentStreak}</p>
							<p class="text-text-secondary">check-ins</p>
						</div>
						<div class="flex-1 rounded-xl border border-border-default bg-surface-raised p-3">
							<p class="text-text-tertiary">Best Streak</p>
							<p class="mt-1 text-2xl font-bold text-accent">{data.engagement.bestStreak}</p>
							<p class="text-text-secondary">check-ins</p>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Cycle Details -->
		<div class="space-y-6">
			<div class="rounded-xl border border-border-default bg-surface-raised p-6">
				<div class="mb-4 flex items-center gap-2">
					<Calendar class="h-4 w-4 text-text-muted" />
					<h2 class="text-lg font-bold text-text-primary">Journey Details</h2>
				</div>
				<div class="mb-4 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
					<span class="font-semibold text-text-primary">{data.cycle.label}</span>
					<span>Start {formatDate(data.cycle.startDate)}</span>
					{#if data.cycle.endDate}
						<span>End {formatDate(data.cycle.endDate)}</span>
					{/if}
				</div>
				{#if data.weeklyExperiences.length}
					<div class="space-y-3">
						<h3 class="text-sm font-semibold tracking-wide text-text-tertiary uppercase">
							This Week's Check-ins
						</h3>
						<div class="grid gap-3 md:grid-cols-3">
							{#each data.weeklyExperiences as experience (experience.type)}
								{@const stateLabels = {
									open: 'Open',
									completed: 'Completed',
									missed: 'Missed',
									upcoming: 'Upcoming',
									catchup: 'Catch Up'
								}}
								<div
									class="rounded-xl border border-border-default bg-surface-raised p-4 transition-all"
								>
									<div class="mb-2 flex items-center gap-2">
										{#if experience.state === 'open'}
											<span class="h-2 w-2 rounded-full bg-accent"></span>
										{:else if experience.state === 'completed'}
											<CircleCheck class="h-4 w-4 text-success" />
										{:else if experience.state === 'missed'}
											<CircleX class="h-4 w-4 text-text-muted" />
										{:else if experience.state === 'upcoming'}
											<Clock class="h-4 w-4 text-text-muted" />
										{:else if experience.state === 'catchup'}
											<RotateCcw class="h-4 w-4 text-warning" />
										{/if}
										<span class="text-xs font-semibold tracking-wide text-text-secondary uppercase"
											>{stateLabels[experience.state]}</span
										>
									</div>
									<p class="mb-2 font-semibold text-text-primary">{experience.label}</p>
									{#if experience.availableDate}
										<p class="mb-3 text-xs text-text-secondary">
											Available: {formatDate(experience.availableDate)}
										</p>
									{/if}
									{#if experience.deadlineDate && experience.state !== 'completed'}
										<p class="mb-3 text-xs text-text-secondary">
											Deadline: {formatDate(experience.deadlineDate)}
										</p>
									{/if}
									{#if experience.url && (experience.state === 'open' || experience.state === 'completed')}
										<a
											href={experience.url}
											class="inline-flex items-center gap-1 rounded-lg bg-surface-raised px-3 py-1.5 text-xs font-semibold text-text-secondary transition-all hover:bg-surface-subtle"
										>
											{experience.state === 'open' ? 'Complete →' : 'View →'}
										</a>
									{:else if experience.state === 'catchup' && experience.url}
										<a
											href={experience.url}
											class="inline-flex items-center gap-1 rounded-lg bg-warning-muted px-3 py-1.5 text-xs font-semibold text-warning transition-all hover:bg-warning-muted/80"
										>
											Catch up →
										</a>
										{#if experience.catchupDeadline}
											<p class="mt-2 text-xs text-warning">
												You have until {formatDateTime(experience.catchupDeadline)} to complete this
											</p>
										{/if}
									{:else if experience.state === 'missed'}
										<p class="text-xs font-medium text-text-secondary">
											Window closed — keep going this week!
										</p>
									{:else if experience.state === 'upcoming'}
										<p class="text-xs font-medium text-text-tertiary">Closed/Not Yet Available</p>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Performance/Effort Visualization -->
	{#if data.cycle && data.visualizationData && data.visualizationData.individual && data.visualizationData.stakeholders && data.visualizationData.stakeholderList}
		<div class="rounded-xl border border-border-default bg-surface-raised p-6">
			<PerformanceEffortChart
				individualData={data.visualizationData.individual}
				stakeholderData={data.visualizationData.stakeholders}
				stakeholders={data.visualizationData.stakeholderList}
			/>
		</div>
	{/if}
</section>
