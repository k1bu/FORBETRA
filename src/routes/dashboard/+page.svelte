<script lang="ts">
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	const formatDate = (value: string | null) => {
		if (!value) return 'TBD';
		return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
	};

	const formatPromptLabel = (type: string) => {
		switch (type) {
			case 'INTENTION':
				return 'Monday intention prompt';
			case 'EFFORT':
				return 'Wednesday effort check-in';
			case 'PROGRESS':
				return 'Friday progress reflection';
			default:
				return 'Upcoming prompt';
		}
	};

	const promptTarget = (type: string) => {
		switch (type) {
			case 'INTENTION':
				return '/prompts/monday';
			case 'EFFORT':
				return '/reflections/effort';
			case 'PROGRESS':
				return '/reflections/progress';
			default:
				return '/dashboard';
		}
	};

	const formatDateTime = (value: string | null) => {
		if (!value) return '—';
		return new Intl.DateTimeFormat('en-US', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	};

	const formatAverage = (value: number | null | undefined) => {
		if (value === null || value === undefined) return '—';
		return value.toFixed(1);
	};
</script>

<section class="mx-auto flex max-w-5xl flex-col gap-6 p-4">
	<header class="space-y-2">
		<p class="text-sm text-neutral-400 uppercase">Active cycle</p>
		<h1 class="text-2xl font-semibold">{data.objective.title}</h1>
		{#if data.objective.description}
			<p class="max-w-3xl text-neutral-600">{data.objective.description}</p>
		{/if}
	</header>

	{#if form?.error}
		<div class="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{form.error}</div>
	{:else if form?.feedbackLink}
		<div
			class="space-y-2 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
		>
			<p>Feedback link generated:</p>
			<p class="font-mono break-all">{form.feedbackLink}</p>
			{#if form.expiresAt}
				<p class="text-xs text-emerald-700">
					Expires {formatDateTime(form.expiresAt)}.
				</p>
			{/if}
		</div>
	{/if}

	{#if data.cycle}
		<section class="grid gap-4 lg:grid-cols-3">
			<article class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm lg:col-span-2">
				<h2 class="text-sm font-semibold text-neutral-500 uppercase">Cycle snapshot</h2>
				<div class="mt-3 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
					<span class="font-medium">{data.cycle.label}</span>
					<span>Start {formatDate(data.cycle.startDate)}</span>
					{#if data.cycle.endDate}
						<span>End {formatDate(data.cycle.endDate)}</span>
					{/if}
				</div>
				<div class="mt-4 space-y-2">
					<div
						class="flex items-center justify-between text-xs tracking-wide text-neutral-500 uppercase"
					>
						<span>Weeks elapsed</span>
						<span>{data.cycle.weeksElapsed}/{data.cycle.totalWeeks}</span>
					</div>
					<div class="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
						<div
							class="h-full rounded-full bg-black transition-all"
							style={`width: ${data.cycle.completion}%`}
						></div>
					</div>
					<p class="text-xs text-neutral-500">
						{data.cycle.reflectionsRecorded} reflections submitted so far.
					</p>
				</div>
				{#if data.overduePrompts.length}
					<div
						class="mt-4 space-y-2 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
					>
						<p class="font-medium uppercase">Overdue this week</p>
						<ul class="list-disc pl-4">
							{#each data.overduePrompts as prompt (prompt.type + prompt.weekNumber)}
								<li>Week {prompt.weekNumber}: {formatPromptLabel(prompt.type)}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</article>

			<article class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
				<h2 class="text-sm font-semibold text-neutral-500 uppercase">Next prompt</h2>
				{#if data.nextPrompt}
					<p class="mt-3 text-base font-medium">{formatPromptLabel(data.nextPrompt.type)}</p>
					<p class="text-sm text-neutral-600">{formatDate(data.nextPrompt.date)}</p>
					<p class="mt-2 text-xs text-neutral-500">
						Prepare to capture focus, effort, and progress throughout the week.
					</p>
					<form method="get" action={promptTarget(data.nextPrompt.type)} class="mt-4">
						<button type="submit" class="rounded bg-black px-4 py-2 text-sm font-medium text-white">
							Open prompt
						</button>
					</form>
				{:else}
					<p class="mt-3 text-sm text-neutral-600">
						We’ll notify you when your next prompt is scheduled.
					</p>
				{/if}
			</article>

			{#if data.feedbackSummary}
				<article class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm lg:col-span-3">
					<h2 class="text-sm font-semibold text-neutral-500 uppercase">Feedback snapshot</h2>
					<div class="mt-3 grid gap-4 text-sm md:grid-cols-3">
						<div>
							<p class="text-xs text-neutral-500 uppercase">Week</p>
							<p class="text-lg font-semibold">{data.feedbackSummary.weekNumber}</p>
						</div>
						<div>
							<p class="text-xs text-neutral-500 uppercase">Responses</p>
							<p class="text-lg font-semibold">
								{data.feedbackSummary.responded}/{data.feedbackSummary.totalStakeholders}
							</p>
						</div>
						<div class="space-y-1">
							<p class="text-xs text-neutral-500 uppercase">Average scores</p>
							<p class="text-sm text-neutral-600">
								Effort {formatAverage(data.feedbackSummary.avgEffort)} · Progress
								{formatAverage(data.feedbackSummary.avgProgress)}
							</p>
						</div>
					</div>
				</article>
			{/if}

			{#if data.reflectionTrend.weeks.length}
				<article class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm lg:col-span-3">
					<h2 class="text-sm font-semibold text-neutral-500 uppercase">
						Reflection trend (last 4 weeks)
					</h2>
					<div class="mt-3 overflow-x-auto">
						<table class="min-w-full text-left text-xs text-neutral-600">
							<thead class="text-neutral-500">
								<tr>
									<th class="px-2 py-2">Week</th>
									<th class="px-2 py-2">Intention</th>
									<th class="px-2 py-2">Effort avg</th>
									<th class="px-2 py-2">Progress avg</th>
								</tr>
							</thead>
							<tbody>
								{#each data.reflectionTrend.weeks as week (week.weekNumber)}
									<tr class="border-t border-neutral-200">
										<td class="px-2 py-2 font-medium">{week.weekNumber}</td>
										<td class="px-2 py-2">
											{#if week.intentionSubmitted}
												<span class="text-emerald-600">Submitted</span>
											{:else}
												<span class="text-amber-600">Missing</span>
											{/if}
										</td>
										<td class="px-2 py-2">{formatAverage(week.effortScore)}</td>
										<td class="px-2 py-2">{formatAverage(week.progressScore)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					<div class="mt-3 flex gap-6 text-xs text-neutral-500">
						<p>Effort avg: {formatAverage(data.reflectionTrend.avgEffort)}</p>
						<p>Progress avg: {formatAverage(data.reflectionTrend.avgProgress)}</p>
					</div>
				</article>
			{/if}
		</section>
	{:else}
		<section
			class="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center text-neutral-600"
		>
			<p>No cycle is active yet. Start one from the onboarding flow to begin tracking.</p>
		</section>
	{/if}

	<section class="grid gap-4 lg:grid-cols-2">
		<article class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
			<h2 class="text-sm font-semibold text-neutral-500 uppercase">Subgoals</h2>
			{#if data.subgoals.length}
				<ul class="mt-3 space-y-2">
					{#each data.subgoals as subgoal (subgoal.id)}
						<li class="rounded border border-neutral-200 px-3 py-2">
							<p class="font-medium">{subgoal.label}</p>
							{#if subgoal.description}
								<p class="text-sm text-neutral-600">{subgoal.description}</p>
							{/if}
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-3 text-sm text-neutral-600">
					Add subgoals to break down your objective into weekly actions.
				</p>
			{/if}
		</article>

		<article class="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
			<h2 class="text-sm font-semibold text-neutral-500 uppercase">Stakeholders</h2>
			{#if data.stakeholders.length}
				<ul class="mt-3 space-y-2">
					{#each data.stakeholders as stakeholder (stakeholder.id)}
						<li class="rounded border border-neutral-200 px-3 py-2">
							<p class="font-medium">{stakeholder.name}</p>
							<p class="text-sm text-neutral-600">{stakeholder.email}</p>
							{#if stakeholder.relationship}
								<p class="text-xs tracking-wide text-neutral-500 uppercase">
									{stakeholder.relationship}
								</p>
							{/if}
							{#if stakeholder.pendingFeedbackLink}
								<div class="mt-2 space-y-1 text-xs text-neutral-600">
									<p>Pending feedback link:</p>
									<p class="font-mono break-all">{stakeholder.pendingFeedbackLink}</p>
									{#if stakeholder.pendingFeedbackExpiresAt}
										<p>
											Expires {formatDateTime(stakeholder.pendingFeedbackExpiresAt)}.
										</p>
									{/if}
								</div>
							{/if}
							{#if stakeholder.lastFeedback}
								<div class="mt-2 text-xs text-neutral-600">
									<p>
										Last feedback {formatDateTime(stakeholder.lastFeedback.submittedAt)} (Effort:
										{stakeholder.lastFeedback.effortScore ?? '—'}, Progress:
										{stakeholder.lastFeedback.progressScore ?? '—'})
									</p>
									{#if stakeholder.lastFeedback.isCurrentWeek}
										<p class="text-emerald-600">Responded this week ✅</p>
									{/if}
								</div>
							{/if}
							<form
								method="post"
								action="?/generateFeedback"
								class="mt-3 flex flex-wrap items-center gap-2"
							>
								<input type="hidden" name="stakeholderId" value={stakeholder.id} />
								<button
									type="submit"
									class="rounded border border-neutral-300 px-3 py-1 text-xs font-medium uppercase"
								>
									Generate feedback link
								</button>
								<p class="text-[11px] text-neutral-500">
									Email/SMS sending coming soon – copy the link above for now.
								</p>
							</form>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="mt-3 text-sm text-neutral-600">
					Invite a stakeholder to share perspectives on your progress.
				</p>
			{/if}
		</article>
	</section>
</section>
