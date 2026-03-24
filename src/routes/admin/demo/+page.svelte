<script lang="ts">
	import type { PageData } from './$types';
	import { addToast } from '$lib/stores/toasts.svelte';
	import { Play, ChevronRight, ChevronLeft, X, Mic } from 'lucide-svelte';

	const { data }: { data: PageData } = $props();

	let selectedIndividualId = $state(data.defaults.individualId);
	let selectedCoachId = $state(data.defaults.coachId);

	let windowCounter = 0;
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
		windowCounter++;
		window.open(path, `demo-${windowCounter}`);
	};

	const openNew = (path: string) => {
		windowCounter++;
		window.open(path, `demo-${windowCounter}`);
	};

	type DemoStep = {
		label: string;
		description: string;
		action: () => void;
		say: string;
		pointOut: string[];
		tip?: string;
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
					action: () => impersonateAndOpen(selectedCoachId, '/coach'),
					say: "This is your command center. At a glance you see which clients need attention, who's overdue, and where the coaching opportunities are.",
					pointOut: [
						'Alert badges on clients',
						'Quick action buttons',
						'Completion rates per client'
					],
					tip: 'Hover over a client card to show the drill-down'
				},
				{
					label: 'Client Roster',
					description: 'Full client list — click into any client for session prep',
					action: () => impersonateAndOpen(selectedCoachId, '/coach/roster'),
					say: 'Your full client roster with status at a glance. Click any client to open their session prep view.',
					pointOut: [
						'Client status indicators',
						'Objective and cycle info',
						'Click into Alex Rivera to show session prep'
					],
					tip: 'After clicking a client, show the "Generate Prep" button and let it stream live'
				},
				{
					label: 'Portfolio Analytics',
					description: 'Cross-client comparison, trends, and CSV export',
					action: () => impersonateAndOpen(selectedCoachId, '/coach/analytics'),
					say: "Across your entire portfolio — who's consistent, who's improving, who needs intervention. You can sort by any column and export to CSV.",
					pointOut: [
						'Consistency scores',
						'Trajectory arrows',
						'Alert count column',
						'Portfolio trend chart at bottom'
					]
				},
				{
					label: 'Invite with Pre-fill',
					description: 'Set up goal and reviewers before client signs up',
					action: () => impersonateAndOpen(selectedCoachId, '/coach/invitations'),
					say: "When you onboard a new client, you don't just send a link. You pre-fill their goal, focus areas, and suggested reviewers. They sign up and everything is already set up.",
					pointOut: [
						'Expand "Pre-fill their setup"',
						'Goal title field',
						'Focus areas',
						'Suggested reviewers'
					],
					tip: 'Fill in a sample goal to show how it works'
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
					action: () => impersonateAndOpen(selectedIndividualId, '/individual'),
					say: 'This is what you see every day. One question: what should you focus on this week? No clutter — just the next action and your latest AI insight.',
					pointOut: [
						'The single-focus question header',
						'Primary action card',
						'AI insight teaser',
						'Streak badge (top right)'
					]
				},
				{
					label: 'Quick Check-in',
					description: '60-second effort + performance rating',
					action: () => impersonateAndOpen(selectedIndividualId, '/individual/checkin'),
					say: "This takes 60 seconds. Two scores — effort and performance — on a 0 to 10 scale. Optional notes. That's it.",
					pointOut: ['Effort scale (0-10)', 'Performance scale (0-10)', 'Optional notes section'],
					tip: 'Rate effort 7, performance 5 to show an effort-performance gap'
				},
				{
					label: 'AI Insights (streaming)',
					description: 'Generate a cycle report — watch sections appear live',
					action: () => impersonateAndOpen(selectedIndividualId, '/individual/insights'),
					say: 'Now watch this. Click Generate Report and sections appear in real time as the AI analyzes weeks of data.',
					pointOut: [
						'Click "Generate Report"',
						'Watch sections stream in',
						'Each section is grounded in real data, not generic advice'
					],
					tip: 'Pause and let the streaming happen — the visual effect sells itself'
				},
				{
					label: 'Ask Your Data',
					description: '"Where have I improved?" — chat grounded in real data',
					action: () => impersonateAndOpen(selectedIndividualId, '/individual/ask'),
					say: 'This is a conversation with your own data. Ask "Where have I improved the most?" or "What do my reviewers see that I don\'t?" — it\'s grounded in your actual check-ins and feedback.',
					pointOut: [
						'Type a question',
						'Response streams in real time',
						'Suggested questions below the input'
					],
					tip: 'Try: "Where have I improved the most?"'
				},
				{
					label: 'Progress & Scorecard',
					description: 'Trends, perception gaps, self vs reviewer comparison',
					action: () => impersonateAndOpen(selectedIndividualId, '/individual?tab=progress'),
					say: 'The Progress tab shows your trend over time. Switch to Scorecard to see how your self-ratings compare to what your reviewers see — that gap is where the real growth happens.',
					pointOut: [
						'Score cards (4 metrics)',
						'Trend chart',
						'Switch to Scorecard tab for self vs reviewer'
					]
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
					description: 'Weekly effort vs performance — spot the gap',
					action: () => impersonateAndOpen(selectedIndividualId, '/individual'),
					say: "This is the athlete's daily view. The key insight: are you working hard AND getting results? The effort-performance gap tells the whole story.",
					pointOut: [
						'Effort vs performance in the action card',
						'Streak badge — consistency matters in sport',
						'AI insight teaser'
					]
				},
				{
					label: 'Training Check-in',
					description: 'Rate effort and performance after training or competition',
					action: () => impersonateAndOpen(selectedIndividualId, '/individual/checkin'),
					say: 'After every training session or competition, the athlete rates effort and performance. Takes 60 seconds. Over time, patterns emerge that neither the athlete nor coach can see in the moment.',
					pointOut: [
						'Effort: "How hard did I work?"',
						'Performance: "How well did I execute?"',
						'Notes for context (what happened today)'
					],
					tip: 'Frame it as a training journal that turns into data'
				},
				{
					label: 'Trend Analysis',
					description: 'See effort-performance patterns over weeks',
					action: () => impersonateAndOpen(selectedIndividualId, '/individual?tab=progress'),
					say: 'This is where the magic happens. Weeks of data reveal patterns: overtraining shows as high effort, declining performance. Peaking shows the opposite. The coach can use this to adjust training load.',
					pointOut: [
						'Trend chart — look for effort/performance divergence',
						'Score cards for averages',
						'Heat map (if enough weeks)'
					]
				},
				{
					label: 'Coach Prep View',
					description: 'What the sport coach sees before your session',
					action: () => impersonateAndOpen(selectedCoachId, '/coach/roster'),
					say: "Now let's flip to the coach side. Before every session, the coach sees AI-generated prep: trends, risks, and conversation starters — all based on the athlete's actual data.",
					pointOut: [
						'Click into a client',
						'Generate Prep button',
						'Trend chart and stakeholder feedback'
					],
					tip: 'Click into a client and hit "Generate Prep" to show the streaming AI'
				},
				{
					label: 'AI Performance Report',
					description: 'AI analyzes training data and spots blind spots',
					action: () => impersonateAndOpen(selectedIndividualId, '/individual/insights'),
					say: 'The AI analyzes weeks of training data and writes a performance report. It spots patterns humans miss — like when effort is high but results are flat, which often signals a need to recover, not push harder.',
					pointOut: [
						'Click "Generate Report"',
						'Watch for effort-performance gap analysis',
						'Behavioral experiment suggestion at the end'
					],
					tip: 'Let it stream — the live generation is impressive'
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
					action: () => openNew('/admin'),
					say: 'This is the admin view of the entire platform. You see all users, active coaching cycles, and system health at a glance.',
					pointOut: ['Total users and roles', 'Active cycles', 'System status']
				},
				{
					label: 'Organization Management',
					description: 'Create orgs, manage members, domain-based assignment',
					action: () => openNew('/admin/organizations'),
					say: "Organizations can manage all their coaches and participants under one umbrella. Domain-based auto-assignment means when someone with an @company.com email signs up, they're automatically linked.",
					pointOut: [
						'Create Organization form',
						'Add Member by email',
						'Role assignment (Member vs Org Admin)'
					]
				},
				{
					label: 'Coach Portfolio Analytics',
					description: 'Cross-client trends, consistency scores, and alerts',
					action: () => impersonateAndOpen(selectedCoachId, '/coach/analytics'),
					say: 'This is what a coaching program manager cares about: are participants engaging? Are they improving? Which coaches are getting the best outcomes? All sortable, all exportable.',
					pointOut: [
						'Consistency scores across clients',
						'Trajectory indicators',
						'Alert counts',
						'CSV export button'
					]
				},
				{
					label: 'Individual Experience',
					description: 'What participants actually see day-to-day',
					action: () => impersonateAndOpen(selectedIndividualId, '/individual'),
					say: 'This is what your participants see. Simple, focused, and designed for busy leaders who have 60 seconds between meetings.',
					pointOut: ['Single-focus design', 'No training needed — intuitive', 'Mobile-friendly']
				},
				{
					label: 'Stakeholder Feedback',
					description: '60-second feedback form — see how easy it is for reviewers',
					action: () => openNew('/stakeholder/feedback/preview?preview=true'),
					say: 'This is the 360 feedback experience. A stakeholder gets a link, rates effort and performance, and optionally shares a specific observation. Takes 60 seconds. No login required.',
					pointOut: [
						'No account needed — token-based access',
						'Two simple scores',
						'Behavioral observation field (qualitative data)',
						'Score reveal after submission'
					],
					tip: 'Show this on a phone to emphasize how simple it is'
				},
				{
					label: 'AI Insights Engine',
					description: 'Watch real-time AI analysis of coaching data',
					action: () => impersonateAndOpen(selectedIndividualId, '/individual/insights'),
					say: 'Every week, the AI synthesizes check-in data and stakeholder feedback into actionable insights. Coaches get session prep. Individuals get a performance report. All automated.',
					pointOut: [
						'Click "Generate Report"',
						'Streaming AI output',
						'Grounded in actual data, not templates'
					]
				}
			]
		}
	]);

	// --- Overlay state ---
	let expandedPath = $state<string | null>(null);
	let activePathId = $state<string | null>(null);
	let activeStepIdx = $state(0);

	const activePath = $derived(demoPaths.find((p) => p.id === activePathId));
	const activeStep = $derived(activePath?.steps[activeStepIdx]);
	let stepIndex = $state<Record<string, number>>({});

	function togglePath(id: string) {
		expandedPath = expandedPath === id ? null : id;
	}

	function runStep(pathId: string, step: DemoStep, idx: number) {
		stepIndex = { ...stepIndex, [pathId]: idx };
		activePathId = pathId;
		activeStepIdx = idx;
		step.action();
	}

	function nextStep() {
		if (!activePath) return;
		const next = activeStepIdx + 1;
		if (next < activePath.steps.length) {
			runStep(activePath.id, activePath.steps[next], next);
		}
	}

	function prevStep() {
		if (!activePath) return;
		const prev = activeStepIdx - 1;
		if (prev >= 0) {
			activeStepIdx = prev;
			stepIndex = { ...stepIndex, [activePath.id]: prev };
		}
	}

	function closeOverlay() {
		activePathId = null;
	}
</script>

<svelte:head>
	<title>Demo | Forbetra Admin</title>
</svelte:head>

<section class="mx-auto flex max-w-4xl flex-col gap-6 p-6 pb-48">
	<header>
		<h1 class="text-2xl font-bold text-text-primary">Demo Center</h1>
		<p class="mt-1 text-sm text-text-secondary">
			Guided walkthroughs for different audiences. Each step opens a screen and shows you what to
			say.
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

				{#if isExpanded}
					<div class="border-t border-border-default px-5 pt-3 pb-5">
						<div class="flex flex-col gap-2">
							{#each path.steps as step, idx (step.label)}
								{@const isDone = currentStep >= idx}
								{@const isCurrent = currentStep === idx && activePathId === path.id}
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
</section>

<!-- ═══ Talking Points Overlay ═══ -->
{#if activeStep && activePath}
	<div
		class="fixed right-0 bottom-0 left-0 z-50 border-t border-border-default bg-surface-raised shadow-2xl"
	>
		<div class="mx-auto flex max-w-4xl flex-col gap-3 px-6 py-4">
			<!-- Header row -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg border {activePath.bgColor}"
					>
						<Mic class="h-4 w-4 {activePath.color}" />
					</div>
					<div>
						<p class="text-xs font-semibold text-text-tertiary">
							{activePath.title} — Step {activeStepIdx + 1} of {activePath.steps.length}
						</p>
						<p class="text-sm font-bold {activePath.color}">{activeStep.label}</p>
					</div>
				</div>
				<button
					onclick={closeOverlay}
					class="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary"
					aria-label="Close talking points"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Content -->
			<div class="flex gap-4">
				<!-- Say this -->
				<div class="flex-1 rounded-lg bg-surface-subtle px-4 py-3">
					<p class="mb-1 text-xs font-bold tracking-wide text-text-tertiary uppercase">Say</p>
					<p class="text-sm leading-relaxed text-text-primary">"{activeStep.say}"</p>
				</div>

				<!-- Point out -->
				<div class="w-64 shrink-0 rounded-lg bg-surface-subtle px-4 py-3">
					<p class="mb-1 text-xs font-bold tracking-wide text-text-tertiary uppercase">Point out</p>
					<ul class="space-y-1">
						{#each activeStep.pointOut as point (point)}
							<li class="flex items-start gap-1.5 text-xs text-text-secondary">
								<span class="mt-0.5 text-accent">&#9654;</span>
								{point}
							</li>
						{/each}
					</ul>
					{#if activeStep.tip}
						<p class="mt-2 rounded bg-warning-muted px-2 py-1 text-xs font-medium text-warning">
							{activeStep.tip}
						</p>
					{/if}
				</div>
			</div>

			<!-- Navigation -->
			<div class="flex items-center justify-between">
				<button
					onclick={prevStep}
					disabled={activeStepIdx === 0}
					class="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-subtle disabled:opacity-30"
				>
					<ChevronLeft class="h-4 w-4" /> Previous
				</button>

				<!-- Step dots -->
				<div class="flex gap-1.5">
					{#each Array.from({ length: activePath.steps.length }, (__, i) => i) as idx (idx)}
						<button
							onclick={() => runStep(activePath.id, activePath.steps[idx], idx)}
							class="h-2 w-2 rounded-full transition-all {idx === activeStepIdx
								? 'scale-125 bg-accent'
								: idx <= (stepIndex[activePath.id] ?? -1)
									? 'bg-success/40'
									: 'bg-border-strong'}"
							aria-label="Go to step {idx + 1}"
						></button>
					{/each}
				</div>

				{#if activeStepIdx < activePath.steps.length - 1}
					<button
						onclick={nextStep}
						class="flex items-center gap-1 rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
					>
						Next <ChevronRight class="h-4 w-4" />
					</button>
				{:else}
					<button
						onclick={closeOverlay}
						class="flex items-center gap-1 rounded-lg bg-success px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-success/80"
					>
						Done &#10003;
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}
