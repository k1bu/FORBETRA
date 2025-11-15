<script lang="ts">
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
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
	{:else}
		<div class="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm">
			<div class="flex items-center gap-3">
				<span class="text-2xl">✅</span>
				<div>
					<p class="font-semibold text-emerald-900">Onboarding Complete</p>
					<p class="text-xs text-emerald-700">Your improvement cycle is set up and ready to go!</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Summary Metrics Cards -->
	{#if data.isOnboardingComplete && data.summary}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<a
				href="/individual/dashboard"
				class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
			>
				<div class="mb-3 flex items-center gap-2">
					<span class="text-2xl">📊</span>
					<p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Completion</p>
				</div>
				<p class="text-4xl font-bold text-neutral-900">
					{data.summary.completionRate !== null ? `${data.summary.completionRate}%` : '—'}
				</p>
				{#if data.summary.completionRate !== null}
					<p class="mt-2 text-xs text-neutral-600">
						{data.summary.totalCompleted} of {data.summary.totalExpected} check-ins
					</p>
				{/if}
				<div class="mt-3 text-xs font-semibold text-blue-700 opacity-0 transition-opacity group-hover:opacity-100">
					View dashboard →
				</div>
			</a>

			<a
				href="/individual/dashboard"
				class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
			>
				<div class="mb-3 flex items-center gap-2">
					<span class="text-2xl">🔥</span>
					<p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Current Streak</p>
				</div>
				<p class="text-4xl font-bold text-neutral-900">{data.summary.currentStreak}</p>
				<p class="mt-2 text-xs text-neutral-600">check-ins</p>
				<div class="mt-3 text-xs font-semibold text-emerald-700 opacity-0 transition-opacity group-hover:opacity-100">
					View dashboard →
				</div>
			</a>

			<a
				href="/individual/dashboard"
				class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm transition-all hover:border-amber-300 hover:shadow-md"
			>
				<div class="mb-3 flex items-center gap-2">
					<span class="text-2xl">⏰</span>
					<p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Open Tasks</p>
				</div>
				<p class="text-4xl font-bold text-neutral-900">{data.summary.openExperiences}</p>
				{#if data.summary.missedExperiences > 0}
					<p class="mt-2 text-xs font-semibold text-amber-700">
						{data.summary.missedExperiences} missed
					</p>
				{:else if data.summary.openExperiences === 0}
					<p class="mt-2 text-xs text-emerald-600">All caught up! 🎉</p>
				{/if}
				<div class="mt-3 text-xs font-semibold text-amber-700 opacity-0 transition-opacity group-hover:opacity-100">
					View dashboard →
				</div>
			</a>

			<a
				href="/individual/stakeholders"
				class="group relative overflow-hidden rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-sm transition-all hover:border-purple-300 hover:shadow-md"
			>
				<div class="mb-3 flex items-center gap-2">
					<span class="text-2xl">👥</span>
					<p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Stakeholders</p>
				</div>
				<p class="text-4xl font-bold text-neutral-900">{data.summary.totalStakeholders}</p>
				<p class="mt-2 text-xs text-neutral-600">invited</p>
				<div class="mt-3 text-xs font-semibold text-purple-700 opacity-0 transition-opacity group-hover:opacity-100">
					Manage stakeholders →
				</div>
			</a>
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
