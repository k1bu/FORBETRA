<script lang="ts">
	import type { PageData } from './$types';
	import { addToast } from '$lib/stores/toasts.svelte';
	import { Play, ChevronRight } from 'lucide-svelte';

	const { data }: { data: PageData } = $props();

	let selectedIndividualId = $state(data.defaults.individualId);
	let selectedCoachId = $state(data.defaults.coachId);

	const impersonateAndOpen = async (userId: string, path: string) => {
		const res = await fetch('/api/admin/impersonate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId })
		});
		if (!res.ok) {
			addToast('Failed to start impersonation. Please try again.', 'error');
			return;
		}
		window.open(path, '_blank');
	};

	type DemoStep = {
		label: string;
		description: string;
		action: () => void;
	};

	type DemoPath = {
		id: string;
		title: string;
		subtitle: string;
		audience: string;
		color: string;
		hoverColor: string;
		bgColor: string;
		steps: DemoStep[];
	};

	const demoPaths = $derived<DemoPath[]>([
		{
			id: 'coach',
			title: 'For Coaches',
			subtitle: 'Show how Forbetra gives coaches real-time intelligence on every client',
			audience: 'Executive coaches, leadership development professionals',
			color: 'text-accent',
			hoverColor: 'hover:border-accent/30 hover:bg-accent-muted/30',
			bgColor: 'bg-accent-muted border-accent/30',
			steps: [
				{
					label: 'Coach Dashboard',
					description: 'Client alerts, quick actions, and portfolio overview',
					action: () => impersonateAndOpen(selectedCoachId, '/coach')
				},
				{
					label: 'Session Prep (live AI)',
					description: 'Generate real-time prep with streaming AI insights',
					action: () => {
						const firstClientPath = '/coach/roster';
						impersonateAndOpen(selectedCoachId, firstClientPath);
					}
				},
				{
					label: 'Portfolio Analytics',
					description: 'Cross-client comparison, trends, and CSV export',
					action: () => impersonateAndOpen(selectedCoachId, '/coach/analytics')
				},
				{
					label: 'Invite with Pre-fill',
					description: 'Set up goal and reviewers before client signs up',
					action: () => impersonateAndOpen(selectedCoachId, '/coach/invitations')
				}
			]
		},
		{
			id: 'individual',
			title: 'For Individual Leaders',
			subtitle: 'Show how individuals track growth with AI-powered self-reflection',
			audience: 'Executives, managers, emerging leaders',
			color: 'text-success',
			hoverColor: 'hover:border-success/30 hover:bg-success-muted/30',
			bgColor: 'bg-success-muted border-success/30',
			steps: [
				{
					label: 'Today Hub',
					description: '"What should I focus on this week?" — single-focus home',
					action: () => impersonateAndOpen(selectedIndividualId, '/individual')
				},
				{
					label: 'Quick Check-in',
					description: '60-second effort + performance rating',
					action: () => impersonateAndOpen(selectedIndividualId, '/individual/checkin')
				},
				{
					label: 'AI Insights (streaming)',
					description: 'Generate a cycle report — watch sections appear live',
					action: () => impersonateAndOpen(selectedIndividualId, '/individual/insights')
				},
				{
					label: 'Ask Your Data',
					description: '"Where have I improved?" — chat grounded in real data',
					action: () => impersonateAndOpen(selectedIndividualId, '/individual/ask')
				},
				{
					label: 'Progress & Scorecard',
					description: 'Trends, perception gaps, self vs reviewer comparison',
					action: () => impersonateAndOpen(selectedIndividualId, '/individual?tab=progress')
				}
			]
		},
		{
			id: 'athlete',
			title: 'For Athletes',
			subtitle: 'Show how athletes and sport coaches track performance and mindset',
			audience: 'Athletes, sport psychologists, performance coaches',
			color: 'text-warning',
			hoverColor: 'hover:border-warning/30 hover:bg-warning-muted/30',
			bgColor: 'bg-warning-muted border-warning/30',
			steps: [
				{
					label: 'Athlete Hub',
					description: 'Weekly effort vs performance — spot the gap between work and results',
					action: () => impersonateAndOpen(selectedIndividualId, '/individual')
				},
				{
					label: 'Daily Check-in',
					description: 'Rate effort and performance after training or competition',
					action: () => impersonateAndOpen(selectedIndividualId, '/individual/checkin')
				},
				{
					label: 'Trend Analysis',
					description: 'See effort-performance patterns over weeks',
					action: () => impersonateAndOpen(selectedIndividualId, '/individual?tab=progress')
				},
				{
					label: 'Coach Prep View',
					description: 'What the sport coach sees before your session',
					action: () => impersonateAndOpen(selectedCoachId, '/coach/roster')
				},
				{
					label: 'AI Performance Report',
					description: 'AI analyzes your training data and spots blind spots',
					action: () => impersonateAndOpen(selectedIndividualId, '/individual/insights')
				}
			]
		},
		{
			id: 'hr',
			title: 'For HR / Corporate',
			subtitle: 'Show how organizations manage coaching programs at scale',
			audience: 'HR leaders, L&D teams, corporate sponsors',
			color: 'text-violet-500',
			hoverColor: 'hover:border-violet-500/30 hover:bg-violet-50',
			bgColor: 'bg-violet-50 border-violet-500/30',
			steps: [
				{
					label: 'Platform Overview',
					description: 'Admin dashboard — users, cycles, and system health',
					action: () => window.open('/admin', '_blank')
				},
				{
					label: 'Organization Management',
					description: 'Create orgs, manage members, domain-based assignment',
					action: () => window.open('/admin/organizations', '_blank')
				},
				{
					label: 'Coach Portfolio Analytics',
					description: 'Cross-client trends, consistency scores, and alerts',
					action: () => impersonateAndOpen(selectedCoachId, '/coach/analytics')
				},
				{
					label: 'Individual Experience',
					description: 'What participants actually see day-to-day',
					action: () => impersonateAndOpen(selectedIndividualId, '/individual')
				},
				{
					label: 'Stakeholder Feedback',
					description: '60-second feedback form — see how easy it is for reviewers',
					action: () => window.open('/stakeholder/feedback/preview?preview=true', '_blank')
				},
				{
					label: 'AI Insights Engine',
					description: 'Watch real-time AI analysis of coaching data',
					action: () => impersonateAndOpen(selectedIndividualId, '/individual/insights')
				}
			]
		}
	]);

	let expandedPath = $state<string | null>(null);
	let stepIndex = $state<Record<string, number>>({});

	function togglePath(id: string) {
		expandedPath = expandedPath === id ? null : id;
	}

	function runStep(pathId: string, step: DemoStep, idx: number) {
		stepIndex = { ...stepIndex, [pathId]: idx };
		step.action();
	}
</script>

<svelte:head>
	<title>Demo | Forbetra Admin</title>
</svelte:head>

<section class="mx-auto flex max-w-4xl flex-col gap-6 p-6">
	<header>
		<h1 class="text-2xl font-bold text-text-primary">Demo Center</h1>
		<p class="mt-1 text-sm text-text-secondary">
			Guided walkthroughs for different audiences. Each path opens screens in new tabs with the
			right user impersonated.
		</p>
	</header>

	<!-- User selectors -->
	<div
		class="flex flex-wrap gap-4 rounded-xl border border-border-default bg-surface-raised p-4 text-sm"
	>
		<label class="flex flex-col gap-1">
			<span class="text-xs font-semibold text-text-tertiary">Demo Individual</span>
			<select
				bind:value={selectedIndividualId}
				class="rounded-lg border border-border-default bg-surface-subtle px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
			>
				{#each data.individuals as user (user.id)}
					<option value={user.id}>
						{user.name ?? user.email}
						{user.objectiveTitle ? ` — ${user.objectiveTitle}` : ''}
					</option>
				{/each}
			</select>
		</label>
		<label class="flex flex-col gap-1">
			<span class="text-xs font-semibold text-text-tertiary">Demo Coach</span>
			<select
				bind:value={selectedCoachId}
				class="rounded-lg border border-border-default bg-surface-subtle px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
			>
				{#each data.coaches as coach (coach.id)}
					<option value={coach.id}>
						{coach.name ?? coach.email} ({coach.clientCount} clients)
					</option>
				{/each}
			</select>
		</label>
	</div>

	<!-- Demo paths -->
	<div class="flex flex-col gap-3">
		{#each demoPaths as path (path.id)}
			{@const isExpanded = expandedPath === path.id}
			{@const currentStep = stepIndex[path.id] ?? -1}
			<div
				class="overflow-hidden rounded-xl border border-border-default bg-surface-raised transition-all"
			>
				<!-- Header -->
				<button
					onclick={() => togglePath(path.id)}
					class="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-surface-subtle"
				>
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border {path.bgColor}"
					>
						<Play class="h-5 w-5 {path.color}" />
					</div>
					<div class="flex-1">
						<h2 class="text-base font-bold {path.color}">{path.title}</h2>
						<p class="mt-0.5 text-sm text-text-secondary">{path.subtitle}</p>
						<p class="mt-0.5 text-xs text-text-muted">{path.audience}</p>
					</div>
					<div class="flex items-center gap-2">
						<span
							class="rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-semibold text-text-tertiary"
						>
							{path.steps.length} steps
						</span>
						<ChevronRight
							class="h-5 w-5 text-text-muted transition-transform {isExpanded ? 'rotate-90' : ''}"
						/>
					</div>
				</button>

				<!-- Steps -->
				{#if isExpanded}
					<div class="border-t border-border-default px-5 pt-3 pb-5">
						<div class="flex flex-col gap-2">
							{#each path.steps as step, idx (step.label)}
								{@const isDone = currentStep >= idx}
								{@const isCurrent = currentStep === idx}
								<button
									onclick={() => runStep(path.id, step, idx)}
									class="group flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all {isCurrent
										? path.bgColor
										: isDone
											? 'border-border-default bg-surface-subtle'
											: 'border-border-default bg-surface-raised ' + path.hoverColor}"
								>
									<span
										class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold {isCurrent
											? path.color + ' bg-white'
											: isDone
												? 'bg-success/10 text-success'
												: 'bg-surface-subtle text-text-muted'}"
									>
										{#if isDone && !isCurrent}
											&#10003;
										{:else}
											{idx + 1}
										{/if}
									</span>
									<div class="flex-1">
										<p class="text-sm font-semibold {isCurrent ? path.color : 'text-text-primary'}">
											{step.label}
										</p>
										<p class="text-xs text-text-muted">{step.description}</p>
									</div>
									<ChevronRight
										class="h-4 w-4 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
									/>
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<div
		class="rounded-lg border border-border-default bg-surface-raised px-4 py-3 text-xs text-text-tertiary"
	>
		Each step opens in a new tab with the selected user impersonated. Your admin session stays
		active here. Come back to this page between steps to advance the walkthrough.
	</div>
</section>
