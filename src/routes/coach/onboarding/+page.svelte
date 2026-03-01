<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import {
		Compass,
		Target,
		PenLine,
		Users,
		BrainCircuit,
		Mail,
		Check,
		Smartphone
	} from 'lucide-svelte';

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	type Step = 'welcome' | 'how-it-works' | 'invite';
	const allSteps: Step[] = ['welcome', 'how-it-works', 'invite'];
	let currentStep = $state<Step>('welcome');

	const currentStepIndex = $derived(allSteps.indexOf(currentStep));

	function goNext() {
		const next = allSteps[currentStepIndex + 1];
		if (next) currentStep = next;
	}

	function goBack() {
		const prev = allSteps[currentStepIndex - 1];
		if (prev) currentStep = prev;
	}

	// Pre-fill state
	type PrefillStakeholder = { name: string; email: string };
	let showPrefill = $state(true);
	let prefillObjectiveTitle = $state('');
	let prefillStakeholders = $state<PrefillStakeholder[]>([{ name: '', email: '' }]);

	function addPrefillStakeholder() {
		if (prefillStakeholders.length < 3) {
			prefillStakeholders = [...prefillStakeholders, { name: '', email: '' }];
		}
	}
	function removePrefillStakeholder(index: number) {
		prefillStakeholders = prefillStakeholders.filter((_, i) => i !== index);
	}

	// Form state for invite step
	let email = $state('');
	let name = $state('');
	let phone = $state('');
	let message = $state(
		"I'd like to invite you to join Forbetra so I can support your development journey. You'll set your own objective, track weekly progress, and get feedback from the people around you — and I'll be here to guide you through it."
	);
	let isSubmitting = $state(false);

	const stepLabels = ['Welcome', 'How It Works', 'Invite Client'];

	// Handle successful invite creation — redirect to coach hub
	$effect(() => {
		if (form?.success) {
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			goto('/coach');
		}
		if (form?.skipped) {
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			goto('/coach');
		}
	});
</script>

<svelte:head>
	<title>Coach Setup | Forbetra</title>
</svelte:head>

<section
	class="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 p-4 pb-12"
>
	<!-- Progress Steps -->
	<div class="flex items-center gap-6">
		{#each allSteps as step, i (step)}
			<button
				type="button"
				onclick={() => {
					if (i <= currentStepIndex) currentStep = step;
				}}
				class="flex flex-col items-center gap-1.5"
				aria-label="Step {i + 1}: {stepLabels[i]}"
			>
				<span
					class="h-3 w-3 rounded-full transition-all {i === currentStepIndex
						? 'scale-110 bg-accent shadow-md shadow-accent/30'
						: i < currentStepIndex
							? 'bg-accent/60 hover:bg-accent/70'
							: 'bg-surface-subtle'}"
				></span>
				<span
					class="text-[10px] font-medium {i === currentStepIndex
						? 'text-accent'
						: i < currentStepIndex
							? 'text-text-secondary'
							: 'text-text-muted'}"
				>
					{stepLabels[i]}
				</span>
			</button>
		{/each}
	</div>

	<!-- Step 1: Welcome -->
	{#if currentStep === 'welcome'}
		<div class="w-full space-y-8 text-center">
			<div class="space-y-4">
				<div
					class="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent shadow-xl shadow-accent/20"
				>
					<Compass class="h-10 w-10 text-white" />
				</div>
				<h1 class="text-4xl font-bold text-text-primary">Welcome to Forbetra, {data.coach.name}</h1>
				<p class="mx-auto max-w-lg text-lg text-text-secondary">
					Your coaching hub for guiding individuals through structured development cycles.
				</p>
			</div>

			<div class="mx-auto max-w-xl space-y-4">
				<div class="rounded-2xl border border-border-default bg-surface-raised p-6 text-left">
					<h3 class="mb-3 text-sm font-semibold tracking-wide text-accent uppercase">Your role</h3>
					<p class="text-sm leading-relaxed text-text-secondary">
						Guide individuals through development cycles, review their progress data, and provide
						targeted feedback that helps them grow.
					</p>
				</div>
				<div class="rounded-2xl border border-border-default bg-surface-raised p-6 text-left">
					<h3 class="mb-3 text-sm font-semibold tracking-wide text-accent uppercase">
						What you'll have access to
					</h3>
					<ul class="space-y-2 text-sm text-text-secondary">
						<li class="flex items-start gap-2">
							<Check class="mt-0.5 h-4 w-4 shrink-0 text-accent" />
							Real-time tracking of client effort and performance
						</li>
						<li class="flex items-start gap-2">
							<Check class="mt-0.5 h-4 w-4 shrink-0 text-accent" />
							AI-generated insights and coaching prep
						</li>
						<li class="flex items-start gap-2">
							<Check class="mt-0.5 h-4 w-4 shrink-0 text-accent" />
							Stakeholder feedback trends and blind-spot alerts
						</li>
					</ul>
				</div>
			</div>

			<button
				type="button"
				onclick={goNext}
				class="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3.5 font-semibold text-white transition-all hover:bg-accent-hover"
			>
				See How It Works
				<span>&#8594;</span>
			</button>
		</div>
	{/if}

	<!-- Step 2: How It Works -->
	{#if currentStep === 'how-it-works'}
		<div class="w-full space-y-8 text-center">
			<div class="space-y-3">
				<h1 class="text-3xl font-bold text-text-primary">How Forbetra Works</h1>
				<p class="mx-auto max-w-md text-base text-text-secondary">
					A continuous cycle of reflection, feedback, and insight — powered by the people around
					your client.
				</p>
			</div>

			<div class="mx-auto max-w-xl space-y-3">
				{#each [{ num: 1, icon: Target, title: 'Individual sets an objective', desc: 'They define what they want to improve and break it into observable behaviors.' }, { num: 2, icon: PenLine, title: 'Weekly check-ins', desc: 'Self-rated effort and performance scores (0-10) with reflection notes.' }, { num: 3, icon: Users, title: 'Stakeholders rate the same dimensions', desc: 'External perspectives reveal blind spots between self-perception and reality.' }, { num: 4, icon: BrainCircuit, title: 'AI analyzes patterns', desc: 'Weekly synthesis, trend detection, and actionable coaching prep.' }, { num: 5, icon: Compass, title: 'You see everything', desc: 'Alerts, trends, stakeholder feedback, and AI insights — all in one dashboard.' }] as card (card.num)}
					<div
						class="flex items-start gap-4 rounded-xl border border-border-default bg-surface-raised p-5 text-left transition-all hover:border-accent/30"
					>
						<div
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-muted text-sm font-bold text-accent"
						>
							{card.num}
						</div>
						<div class="flex-1">
							<div class="flex items-center gap-2">
								<card.icon class="h-5 w-5 text-accent" />
								<h3 class="text-sm font-bold text-text-primary">{card.title}</h3>
							</div>
							<p class="mt-1 text-xs leading-relaxed text-text-secondary">{card.desc}</p>
						</div>
					</div>
				{/each}
			</div>

			<div class="flex items-center justify-center gap-4">
				<button
					type="button"
					onclick={goBack}
					class="rounded-xl border border-border-default px-6 py-3 text-sm font-semibold text-text-secondary transition-all hover:border-border-strong hover:bg-surface-subtle"
				>
					&#8592; Back
				</button>
				<button
					type="button"
					onclick={goNext}
					class="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3.5 font-semibold text-white transition-all hover:bg-accent-hover"
				>
					Invite Your First Client
					<span>&#8594;</span>
				</button>
			</div>
		</div>
	{/if}

	<!-- Step 3: Invite Your First Client -->
	{#if currentStep === 'invite'}
		<div class="w-full space-y-8 text-center">
			<div class="space-y-3">
				<div
					class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent shadow-lg shadow-accent/20"
				>
					<Mail class="h-8 w-8 text-white" />
				</div>
				<h1 class="text-3xl font-bold text-text-primary">Invite Your First Client</h1>
				<p class="mx-auto max-w-md text-base text-text-secondary">
					Send an invitation to an individual you'd like to coach. They'll set up their own
					objective and stakeholders.
				</p>
				<p class="mx-auto max-w-md text-xs text-text-tertiary">
					You can optionally pre-fill their objective and stakeholders below.
				</p>
			</div>

			{#if form?.error}
				<div
					class="mx-auto max-w-md rounded-xl border border-error/50 bg-error-muted p-4 text-sm text-error"
				>
					<p class="font-medium">{form.error}</p>
				</div>
			{/if}

			<form
				method="post"
				action="?/createInvite"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						isSubmitting = false;
						await update();
					};
				}}
				class="mx-auto max-w-md space-y-5 text-left"
			>
				<div>
					<label for="email" class="mb-1.5 block text-sm font-semibold text-text-primary">
						Email address <span class="text-error">*</span>
					</label>
					<input
						type="email"
						id="email"
						name="email"
						bind:value={email}
						required
						placeholder="client@example.com"
						class="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
					/>
				</div>

				<div>
					<label for="name" class="mb-1.5 block text-sm font-semibold text-text-primary">
						Name <span class="text-xs font-normal text-text-tertiary">(optional)</span>
					</label>
					<input
						type="text"
						id="name"
						name="name"
						bind:value={name}
						placeholder="Their name"
						class="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
					/>
				</div>

				<div>
					<label
						for="phone"
						class="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-text-primary"
					>
						<Smartphone class="h-3.5 w-3.5" />
						Phone
						<span class="text-xs font-normal text-text-tertiary"
							>(optional — enables SMS invite)</span
						>
					</label>
					<input
						type="tel"
						id="phone"
						name="phone"
						bind:value={phone}
						placeholder="+1 555 123 4567"
						class="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
					/>
				</div>

				<div>
					<label for="message" class="mb-1.5 block text-sm font-semibold text-text-primary">
						Personal message <span class="text-xs font-normal text-text-tertiary">(optional)</span>
					</label>
					<textarea
						id="message"
						name="message"
						bind:value={message}
						rows="4"
						class="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
						placeholder="Add a personal note to your invitation..."
					></textarea>
				</div>

				<!-- Pre-fill toggle -->
				<div class="rounded-xl border border-border-default bg-surface-subtle p-4">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-semibold text-text-primary">Pre-fill client's setup</p>
							<p class="text-xs text-text-tertiary">
								Save them time by pre-filling their objective and stakeholders
							</p>
						</div>
						<button
							type="button"
							onclick={() => (showPrefill = !showPrefill)}
							class="relative ml-3 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors {showPrefill
								? 'bg-accent'
								: 'border border-border-default bg-surface-subtle'}"
							role="switch"
							aria-checked={showPrefill}
						>
							<span
								class="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform {showPrefill
									? 'translate-x-5'
									: 'translate-x-1'}"
							></span>
						</button>
					</div>
					{#if showPrefill}
						<div class="mt-4 space-y-4">
							<div>
								<label for="prefillObjectiveTitle" class="text-xs font-semibold text-text-secondary"
									>Objective title</label
								>
								<input
									id="prefillObjectiveTitle"
									type="text"
									name="prefillObjectiveTitle"
									bind:value={prefillObjectiveTitle}
									placeholder="e.g. Improve executive presence"
									class="mt-1 w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent/30 focus:outline-none"
								/>
							</div>

							<div>
								<p class="text-xs font-semibold text-text-secondary">Stakeholders</p>
								{#each prefillStakeholders as sh, i (i)}
									<div class="mt-1.5 flex items-center gap-2">
										<input
											type="text"
											bind:value={sh.name}
											placeholder="Name"
											class="flex-1 rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
										/>
										<input
											type="email"
											bind:value={sh.email}
											placeholder="Email"
											class="flex-1 rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
										/>
										{#if prefillStakeholders.length > 1}
											<button
												type="button"
												onclick={() => removePrefillStakeholder(i)}
												class="text-xs text-text-muted hover:text-error"
											>
												&times;
											</button>
										{/if}
									</div>
								{/each}
								{#if prefillStakeholders.length < 3}
									<button
										type="button"
										onclick={addPrefillStakeholder}
										class="mt-1.5 text-xs font-medium text-accent hover:underline"
									>
										+ Add stakeholder
									</button>
								{/if}
							</div>

							<!-- Hidden serialized fields -->
							<input
								type="hidden"
								name="prefillStakeholders"
								value={JSON.stringify(
									prefillStakeholders.filter((s) => s.name.trim() && s.email.trim())
								)}
							/>
						</div>
					{/if}
				</div>

				<div class="flex flex-col gap-3 pt-2">
					<button
						type="submit"
						disabled={isSubmitting || !email}
						class="w-full rounded-xl bg-accent px-8 py-3.5 font-semibold text-white transition-all hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
					>
						{#if isSubmitting}
							<span class="inline-flex items-center gap-2">
								<span
									class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
								></span>
								Sending Invitation...
							</span>
						{:else}
							Send Invitation & Continue
						{/if}
					</button>
				</div>
			</form>

			<div class="flex items-center justify-center gap-4 pt-2">
				<button
					type="button"
					onclick={goBack}
					class="rounded-xl border border-border-default px-6 py-3 text-sm font-semibold text-text-secondary transition-all hover:border-border-strong hover:bg-surface-subtle"
				>
					&#8592; Back
				</button>
				<form
					method="post"
					action="?/skip"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
						};
					}}
				>
					<button
						type="submit"
						class="text-sm font-medium text-text-tertiary underline decoration-text-muted underline-offset-4 transition-colors hover:text-text-secondary hover:decoration-text-tertiary"
					>
						Skip for now
					</button>
				</form>
			</div>
		</div>
	{/if}
</section>
