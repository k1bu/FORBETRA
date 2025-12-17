<script lang="ts">
	import type { PageData } from './$types';
	import PerformanceEffortChart from '$lib/components/PerformanceEffortChart.svelte';

	const { data }: { data: PageData } = $props();

	// Defensive checks to prevent runtime errors
	if (!data) {
		throw new Error('Page data is missing');
	}
</script>

<section class="mx-auto flex max-w-7xl flex-col gap-8 p-4 pb-12">
	<!-- Hero Header -->
	<header class="relative overflow-hidden rounded-3xl border-2 border-neutral-200 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8 shadow-lg">
		<div class="absolute right-0 top-0 h-64 w-64 rounded-full bg-gradient-to-br from-blue-200/30 to-purple-200/30 blur-3xl"></div>
		<div class="relative">
			<div class="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-xs font-semibold text-blue-700 backdrop-blur-sm">
				<span class="h-2 w-2 animate-pulse rounded-full bg-blue-500"></span>
				Individual Hub
			</div>
			<h1 class="mb-2 text-4xl font-bold text-neutral-900">
				{#if data.isFirstVisit}
					Welcome to Forbetra!
				{:else}
					Welcome back!
				{/if}
			</h1>
			<p class="text-lg text-neutral-700">
				{#if data.isOnboardingComplete}
					Track your progress, complete check-ins, and review insights at a glance.
				{:else}
					Get started by completing your onboarding to set up your first improvement cycle.
				{/if}
			</p>
		</div>
	</header>

	<!-- Onboarding Status Card -->
	{#if !data.isOnboardingComplete}
		<div class="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 shadow-lg">
			<div class="flex items-start gap-4">
				<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100">
					<span class="text-2xl">🚀</span>
				</div>
				<div class="flex-1">
					<h2 class="mb-2 text-xl font-bold text-amber-900">Complete Your Onboarding</h2>
					<p class="mb-4 text-sm leading-relaxed text-amber-800">
						Set up your first improvement cycle by defining your objective, creating measurable subgoals, and inviting stakeholders who can provide feedback on your progress.
					</p>
					<a
						href="/onboarding"
						class="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-amber-700 hover:shadow-lg hover:scale-105"
					>
						Start Onboarding
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
						</svg>
					</a>
				</div>
			</div>
		</div>
	{/if}

	<!-- Action Cards Row -->
	{#if data.isOnboardingComplete && data.nextAction}
		<div class="grid gap-6 md:grid-cols-3">
			<!-- What to do next - Most prominent (left, larger, highlighted) -->
			{#if data.nextAction.url}
				<a
					href={data.nextAction.url}
					class="group relative overflow-hidden rounded-2xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow-lg transition-all hover:border-blue-600 hover:shadow-xl md:col-span-1"
				>
					<div class="mb-3 flex items-center gap-2">
						<div class="rounded-lg bg-blue-500 p-2">
							<span class="text-xl text-white">
								{#if data.nextAction.state === 'missed'}
									⚠
								{:else if data.nextAction.state === 'upcoming'}
									📅
								{:else}
									✓
								{/if}
							</span>
						</div>
						<p class="text-xs font-semibold uppercase tracking-wide text-blue-700">What to do next</p>
					</div>
					<h3 class="mb-2 text-lg font-bold text-neutral-900">{data.nextAction.label}</h3>
					<div class="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-700 transition-transform group-hover:translate-x-1">
						{#if data.nextAction.state === 'missed'}
							Complete now
						{:else if data.nextAction.state === 'upcoming'}
							View details
						{:else}
							Get started
						{/if}
						<span>→</span>
					</div>
				</a>
			{:else}
				<div class="rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-neutral-50 to-neutral-100 p-6 shadow-sm md:col-span-1">
					<div class="mb-3 flex items-center gap-2">
						<div class="rounded-lg bg-neutral-400 p-2">
							<span class="text-xl text-white">✓</span>
						</div>
						<p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">What to do next</p>
					</div>
					<h3 class="mb-2 text-lg font-bold text-neutral-900">{data.nextAction.label}</h3>
					<p class="mt-4 text-sm text-neutral-500">Coming soon</p>
				</div>
			{/if}

			<!-- My Last Ratings -->
			<div class="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm">
				<div class="mb-3 flex items-center gap-2">
					<span class="text-2xl">📊</span>
					<p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">My Last Ratings</p>
				</div>
				{#if data.myLastRatings && (data.myLastRatings.effort !== null || data.myLastRatings.performance !== null)}
					<div class="space-y-4">
						{#if data.myLastRatings.effort !== null}
							<div>
								<div class="mb-1 flex items-baseline gap-2">
									<span class="text-base font-medium text-neutral-700">Effort</span>
									<span class="text-xl font-bold text-blue-600">{data.myLastRatings.effort}</span>
								</div>
								{#if data.myLastRatings.effortChange !== null && data.myLastRatings.weekNumber && data.myLastRatings.weekNumber > 1}
									<div class="flex items-center gap-2">
										<span class="text-xs font-semibold {data.myLastRatings.effortChange >= 0 ? 'text-green-600' : 'text-red-600'}">
											{data.myLastRatings.effortChange > 0 ? '+' : ''}{data.myLastRatings.effortChange.toFixed(1)}
										</span>
										<span class="text-xs text-neutral-500">vs. Week {data.myLastRatings.weekNumber - 1}</span>
									</div>
								{/if}
							</div>
						{/if}
						{#if data.myLastRatings.performance !== null}
							<div>
								<div class="mb-1 flex items-baseline gap-2">
									<span class="text-base font-medium text-neutral-700">Performance</span>
									<span class="text-xl font-bold text-purple-600">{data.myLastRatings.performance}</span>
								</div>
								{#if data.myLastRatings.performanceChange !== null && data.myLastRatings.weekNumber && data.myLastRatings.weekNumber > 1}
									<div class="flex items-center gap-2">
										<span class="text-xs font-semibold {data.myLastRatings.performanceChange >= 0 ? 'text-green-600' : 'text-red-600'}">
											{data.myLastRatings.performanceChange > 0 ? '+' : ''}{data.myLastRatings.performanceChange.toFixed(1)}
										</span>
										<span class="text-xs text-neutral-500">vs. Week {data.myLastRatings.weekNumber - 1}</span>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{:else}
					<p class="text-sm text-neutral-500">No ratings yet</p>
				{/if}
			</div>

			<!-- Stakeholders' Last Ratings -->
			<div class="rounded-2xl border-2 border-neutral-200 bg-white p-6 shadow-sm">
				<div class="mb-3 flex items-center gap-2">
					<span class="text-2xl">👥</span>
					<p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Stakeholders' Last Ratings</p>
				</div>
				{#if data.stakeholdersLastRatings && (data.stakeholdersLastRatings.effort !== null || data.stakeholdersLastRatings.performance !== null)}
					<div class="space-y-4">
						{#if data.stakeholdersLastRatings.effort !== null}
							<div>
								<div class="mb-1 flex items-baseline gap-2">
									<span class="text-base font-medium text-neutral-700">Effort (Avg)</span>
									<span class="text-xl font-bold text-green-600">{data.stakeholdersLastRatings.effort}</span>
								</div>
								{#if data.stakeholdersLastRatings.effortChange !== null && data.stakeholdersLastRatings.weekNumber && data.stakeholdersLastRatings.weekNumber > 1}
									<div class="flex items-center gap-2">
										<span class="text-xs font-semibold {data.stakeholdersLastRatings.effortChange >= 0 ? 'text-green-600' : 'text-red-600'}">
											{data.stakeholdersLastRatings.effortChange > 0 ? '+' : ''}{data.stakeholdersLastRatings.effortChange.toFixed(1)}
										</span>
										<span class="text-xs text-neutral-500">vs. Week {data.stakeholdersLastRatings.weekNumber - 1}</span>
									</div>
								{/if}
							</div>
						{/if}
						{#if data.stakeholdersLastRatings.performance !== null}
							<div>
								<div class="mb-1 flex items-baseline gap-2">
									<span class="text-base font-medium text-neutral-700">Performance (Avg)</span>
									<span class="text-xl font-bold text-red-600">{data.stakeholdersLastRatings.performance}</span>
								</div>
								{#if data.stakeholdersLastRatings.performanceChange !== null && data.stakeholdersLastRatings.weekNumber && data.stakeholdersLastRatings.weekNumber > 1}
									<div class="flex items-center gap-2">
										<span class="text-xs font-semibold {data.stakeholdersLastRatings.performanceChange >= 0 ? 'text-green-600' : 'text-red-600'}">
											{data.stakeholdersLastRatings.performanceChange > 0 ? '+' : ''}{data.stakeholdersLastRatings.performanceChange.toFixed(1)}
										</span>
										<span class="text-xs text-neutral-500">vs. Week {data.stakeholdersLastRatings.weekNumber - 1}</span>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{:else}
					<p class="text-sm text-neutral-500">No stakeholder ratings yet</p>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Performance/Effort Visualization -->
	{#if data.isOnboardingComplete && data.cycle && data.visualizationData && data.visualizationData.individual && data.visualizationData.stakeholders && data.visualizationData.stakeholderList}
		<div class="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-lg">
			<PerformanceEffortChart
				individualData={data.visualizationData.individual}
				stakeholderData={data.visualizationData.stakeholders}
				stakeholders={data.visualizationData.stakeholderList}
			/>
		</div>
	{/if}

	<!-- Navigation Cards -->
	{#if data.isOnboardingComplete}
		<div class="grid gap-6 md:grid-cols-3">
			<a
				href="/individual/dashboard"
				class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-white to-blue-50/30 p-8 shadow-sm transition-all hover:border-blue-300 hover:shadow-lg"
			>
				<div class="mb-4 flex items-center gap-3">
					<div class="rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 p-3">
						<span class="text-2xl">📅</span>
					</div>
					<h2 class="text-xl font-bold text-neutral-900">Dashboard</h2>
				</div>
				<p class="mb-4 text-sm text-neutral-600">
					View your weekly experiences, complete check-ins, and track your cycle progress.
				</p>
				<div class="flex items-center gap-2 text-sm font-semibold text-blue-700 transition-transform group-hover:translate-x-1">
					Go to Dashboard
					<span>→</span>
				</div>
			</a>

			<a
				href="/individual/insights"
				class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-white to-purple-50/30 p-8 shadow-sm transition-all hover:border-purple-300 hover:shadow-lg"
			>
				<div class="mb-4 flex items-center gap-3">
					<div class="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-3">
						<span class="text-2xl">📊</span>
					</div>
					<h2 class="text-xl font-bold text-neutral-900">Insights</h2>
				</div>
				<p class="mb-4 text-sm text-neutral-600">
					Review reflection trends, consistency metrics, and stakeholder alignment over time.
				</p>
				<div class="flex items-center gap-2 text-sm font-semibold text-purple-700 transition-transform group-hover:translate-x-1">
					View Insights
					<span>→</span>
				</div>
			</a>

			<a
				href="/individual/stakeholders"
				class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-white to-emerald-50/30 p-8 shadow-sm transition-all hover:border-emerald-300 hover:shadow-lg"
			>
				<div class="mb-4 flex items-center gap-3">
					<div class="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 p-3">
						<span class="text-2xl">👥</span>
					</div>
					<h2 class="text-xl font-bold text-neutral-900">Stakeholders</h2>
				</div>
				<p class="mb-4 text-sm text-neutral-600">
					Manage the people who provide feedback on your progress and generate feedback links.
				</p>
				<div class="flex items-center gap-2 text-sm font-semibold text-emerald-700 transition-transform group-hover:translate-x-1">
					Manage Stakeholders
					<span>→</span>
				</div>
			</a>
		</div>
	{/if}
</section>
