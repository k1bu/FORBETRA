<script lang="ts">
	import type { ActionData, PageData } from './$types';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	let intention = $state(data.existing?.intention ?? '');
	let isSubmitting = $state(false);
	let characterCount = $derived(intention.length);

	const formatDate = (value: string) =>
		new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));

	const getPromptEmoji = (heading: string) => {
		const emojiMap: Record<string, string> = {
			'Identity anchor': '🎯',
			'Momentum check': '⚡',
			'Stakeholder alignment': '🤝',
			'Energy audit': '🔋',
			'Skill rep': '💪',
			'Obstacle planning': '🛡️',
			'Feedback loop': '🔄',
			'Well-being reset': '🌱',
			'Stretch moment': '🚀',
			'Systems tune-up': '⚙️',
			'Storytelling': '📖',
			'Integration': '✨'
		};
		return emojiMap[heading] || '💭';
	};

	const handleSubmit = () => {
		isSubmitting = true;
	};

	const isIdentityAnchor = data.weekNumber === 1 && data.prompt.heading === 'Identity anchor';
</script>

<section class="mx-auto flex max-w-4xl flex-col gap-6 p-4 pb-12">
	<!-- Back to Dashboard Link -->
	<div class="flex items-center justify-between">
		<a
			href="/individual"
			class="group flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
		>
			<svg
				class="h-4 w-4 transition-transform group-hover:-translate-x-1"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Back to Dashboard
		</a>
	</div>

	<!-- Header with encouraging messaging -->
	<header class="space-y-4 text-center">
		<div class="inline-flex items-center gap-2 rounded-full bg-accent-muted px-4 py-1.5 text-xs font-medium text-accent">
			<span class="h-2 w-2 rounded-full bg-accent"></span>
			Week {data.weekNumber} Intention
		</div>
		<div class="space-y-2">
			<div class="flex items-center justify-center gap-3">
				<span class="text-4xl" role="img" aria-label={data.prompt.heading}>{getPromptEmoji(data.prompt.heading)}</span>
				<h1 class="text-3xl font-bold text-text-primary">{data.prompt.heading}</h1>
			</div>
			{#if isIdentityAnchor}
				<p class="mx-auto max-w-2xl text-base leading-relaxed text-text-secondary">{data.prompt.question}</p>
			{:else}
				<p class="mx-auto max-w-2xl text-lg leading-relaxed text-text-secondary">{data.prompt.question}</p>
			{/if}
		</div>
		<p class="text-xs tracking-wide text-text-tertiary uppercase">
			Cycle started on {formatDate(data.cycle.startDate)}
		</p>
	</header>

	{#if data.coachNotes && data.coachNotes.length > 0}
		<section class="mx-auto w-full max-w-2xl space-y-3 rounded-2xl border border-accent/30 bg-accent-muted p-6">
			<div class="flex items-center gap-2">
				<span class="text-2xl" role="img" aria-label="speech bubble">💬</span>
				<h2 class="text-base font-semibold text-accent">Message from your coach</h2>
			</div>
			{#each data.coachNotes as note (note.id)}
				<div class="rounded-xl border border-accent/30 glass-raised p-4">
					<p class="text-sm leading-relaxed text-accent">{note.content}</p>
					<p class="mt-2 text-xs font-medium text-accent">— {note.coachName}</p>
				</div>
			{/each}
		</section>
	{/if}

	<div aria-live="polite">
		{#if form?.error}
			<div class="mx-auto w-full max-w-2xl rounded-xl border border-error/30 bg-error-muted p-4 text-sm text-error">
				<p class="font-medium">{form.error}</p>
			</div>
		{/if}

		{#if form?.success}
			<div class="mx-auto w-full max-w-2xl animate-in fade-in slide-in-from-top-2 rounded-xl border border-success/30 bg-success-muted p-6 text-center">
				<div class="mb-2 text-4xl">🎉</div>
				<p class="text-lg font-semibold text-success">Intention saved!</p>
				<p class="mt-1 text-sm text-success">Your intention has been recorded. You've got this!</p>
				<a
					href="/individual"
					class="mt-4 inline-flex items-center gap-2 rounded-lg bg-success px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-success/90"
				>
					Return to Dashboard
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</a>
			</div>
		{/if}
	</div>

	<div class="mx-auto w-full max-w-2xl space-y-6">
		<!-- Objective Card with Visual Appeal -->
		<div class="group relative overflow-hidden rounded-2xl border border-border-default bg-surface-raised p-8 transition-all hover:border-accent/30">
			<div class="relative">
				<div class="mb-4 flex items-start justify-between">
					<div class="flex-1">
						<div class="mb-2 inline-flex items-center gap-2 rounded-lg bg-accent-muted px-3 py-1 text-xs font-semibold text-accent">
							<span role="img" aria-label="target">🎯</span>
							Your Objective
						</div>
						<h2 class="mt-3 text-2xl font-bold text-text-primary">{data.objective.title}</h2>
						{#if data.objective.description}
							<p class="mt-2 text-base leading-relaxed text-text-secondary">{data.objective.description}</p>
						{/if}
					</div>
				</div>

				<!-- Subgoals as Visual Reference Cards -->
				{#if data.subgoals && data.subgoals.length > 0}
					<div class="mt-6 rounded-xl border border-border-default glass p-5">
						<div class="mb-3 flex items-center gap-2">
							<span class="text-lg" role="img" aria-label="clipboard">📋</span>
							<p class="text-sm font-semibold text-text-secondary">Your behavioral indicators</p>
						</div>
						<p class="mb-4 text-xs leading-relaxed text-text-secondary">
							Keep these in mind as you set your intention. They help define what success looks like for your objective.
						</p>
						<div class="grid gap-3 sm:grid-cols-1">
							{#each data.subgoals as subgoal, index (subgoal.id)}
								<div class="flex items-start gap-3 rounded-lg border border-border-default bg-surface-subtle p-3 transition-all hover:border-accent/30 hover:bg-accent-muted/30">
									<span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-bold text-accent">
										{index + 1}
									</span>
									<div class="flex-1">
										<p class="font-semibold text-text-primary">{subgoal.label}</p>
										{#if subgoal.description}
											<p class="mt-1 text-xs text-text-secondary">{subgoal.description}</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Why This Matters & Example for Identity Anchor (Week 1) -->
		{#if isIdentityAnchor}
			<div class="mx-auto w-full max-w-2xl space-y-4">
				<!-- Why This Is Effective -->
				<div class="rounded-2xl border border-accent/30 bg-accent-muted p-6">
					<div class="mb-3 flex items-center gap-2">
						<span class="text-2xl" role="img" aria-label="brain">🧠</span>
						<h3 class="text-base font-semibold text-accent">Why This Is Effective</h3>
					</div>
					<div class="space-y-2 text-sm leading-relaxed text-text-secondary">
						<p>
							<strong>Identity-based goals are more powerful than action-based goals.</strong> When you connect your objective to who you're becoming, you're not just changing behaviors—you're transforming your identity.
						</p>
						<p>
							This identity anchor will be displayed on your dashboard throughout the cycle, serving as a constant reminder of your deeper "why" and helping you stay motivated when challenges arise.
						</p>
						<p>
							Research shows that people who frame goals in terms of identity (e.g., "I am a leader who...") rather than actions (e.g., "I will do...") are significantly more likely to achieve lasting change.
						</p>
					</div>
				</div>

				<!-- Example -->
				<div class="rounded-2xl border border-warning/30 bg-warning-muted p-6">
					<div class="mb-3 flex items-center gap-2">
						<span class="text-2xl" role="img" aria-label="light bulb">💡</span>
						<h3 class="text-base font-semibold text-warning">Example Identity Anchor</h3>
					</div>
					<p class="mb-3 text-sm leading-relaxed text-text-secondary">
						Here's an example of what an identity anchor statement might look like:
					</p>
					<div class="rounded-xl border border-warning/30 glass-raised p-4">
						<p class="text-sm italic leading-relaxed text-text-secondary">
							"To realize my objective of becoming a more effective leader, I'm choosing to be someone who listens deeply before responding, who shows up with curiosity rather than judgment, and who creates space for others to contribute their best ideas. This cycle, I'm anchoring myself in the belief that leadership is about enabling others, not just directing them. When challenges arise, I'll return to this: I am someone who builds trust through consistency and who sees setbacks as learning opportunities."
						</p>
					</div>
					<p class="mt-3 text-xs text-warning">
						Notice how this connects who you're becoming to your objective, and how it will guide you throughout the entire cycle.
					</p>
				</div>
			</div>
		{/if}

		<!-- Intention Form with Enhanced UX -->
		<form method="post" onsubmit={handleSubmit} class="space-y-6">
			<div class="group rounded-2xl border border-border-default bg-surface-raised p-6 transition-all hover:border-accent/30">
				<div class="mb-4 flex items-center gap-3">
					<span class="text-2xl" role="img" aria-label="writing hand">✍️</span>
					<div class="flex-1">
						<label for="intention" class="text-lg font-bold text-text-primary">
							{#if isIdentityAnchor}
								How will achieving "{data.objective.title}" change or improve your performance?
							{:else}
								Your intention for this week
							{/if}
						</label>
						<p class="mt-1 text-xs text-text-tertiary">
							{#if isIdentityAnchor}
								Describe how reaching this objective will transform who you are and how you show up. This statement will be displayed on your dashboard throughout the cycle.
							{:else}
								Take your time. This is your space to reflect and set your intention.
							{/if}
						</p>
					</div>
				</div>

				<textarea
					id="intention"
					name="intention"
					rows="8"
					bind:value={intention}
					class="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-4 text-base leading-relaxed text-text-primary placeholder:text-text-muted focus:border-accent focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
					placeholder={isIdentityAnchor
						? `How will achieving "${data.objective.title}" change or improve your performance? What will be different about how you show up, lead, or operate? How does this connect to who you're becoming? Let your thoughts flow...`
						: "What do you want to focus on this week? How will you show up? What matters most right now? Let your thoughts flow..."}
				></textarea>

				<div class="mt-3 flex items-center justify-between">
					<p class="text-xs text-text-tertiary">
						{#if characterCount < 25}
							<span class="text-warning font-medium">
								{25 - characterCount} more characters needed
							</span>
						{:else if characterCount < 100}
							<span class="text-accent">Great start! Keep going...</span>
						{:else}
							<span class="text-success">You're doing great!</span>
						{/if}
					</p>
					<p class="text-xs text-text-muted">
						{characterCount} / 1500 characters
					</p>
				</div>
			</div>

			<!-- Submit Button with Enhanced Design -->
			<div class="flex flex-col gap-4 rounded-2xl border border-border-default bg-accent-muted p-6 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex-1">
					{#if data.existing}
						<p class="font-semibold text-text-primary">
							{#if isIdentityAnchor}
								Updating your identity anchor
							{:else}
								Updating your intention
							{/if}
						</p>
						<p class="mt-1 text-xs text-text-secondary">
							{#if isIdentityAnchor}
								You can revise your identity anchor until the next Monday.
							{:else}
								You can revise your intention until the next Monday.
							{/if}
						</p>
					{:else}
						<p class="font-semibold text-text-primary">
							{#if isIdentityAnchor}
								Ready to set your identity anchor?
							{:else}
								Ready to set your intention?
							{/if}
						</p>
						<p class="mt-1 text-xs text-text-secondary">
							{#if isIdentityAnchor}
								Your identity anchor will be displayed on your dashboard throughout the cycle to remind you of who you're choosing to become.
							{:else}
								Your intention helps guide your week and keeps you aligned with your objective.
							{/if}
						</p>
					{/if}
				</div>
				<div class="flex items-center gap-3">
					<a
						href="/individual"
						class="rounded-xl border border-border-default bg-surface-raised px-6 py-3.5 text-sm font-semibold text-text-secondary transition-all hover:border-border-strong hover:bg-surface-subtle"
					>
						Back to Dashboard
					</a>
					<button
						type="submit"
						disabled={characterCount < 25 || isSubmitting}
						class="group relative overflow-hidden rounded-xl bg-accent px-8 py-3.5 font-semibold text-white shadow-lg transition-all hover:bg-accent-hover hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
					>
						<span class="relative z-10 flex items-center gap-2">
							{#if isSubmitting}
								<span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
								Saving...
							{:else}
								<span role="img" aria-label="sparkles">✨</span>
								{#if isIdentityAnchor}
									{data.existing ? 'Update Identity Anchor' : 'Save Identity Anchor'}
								{:else}
									{data.existing ? 'Update Intention' : 'Save Intention'}
								{/if}
							{/if}
						</span>
						<div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity group-hover:opacity-100"></div>
					</button>
				</div>
			</div>
		</form>
	</div>
</section>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slide-in-from-top-2 {
		from {
			transform: translateY(-0.5rem);
		}
		to {
			transform: translateY(0);
		}
	}

	.animate-in {
		animation: fade-in 0.3s ease-out, slide-in-from-top-2 0.3s ease-out;
	}
</style>
