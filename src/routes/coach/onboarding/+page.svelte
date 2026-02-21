<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

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

	// Form state for invite step
	let email = $state('');
	let name = $state('');
	let message = $state(
		"I'd like to invite you to join Forbetra so I can support your development journey. You'll set your own objective, track weekly progress, and get feedback from the people around you — and I'll be here to guide you through it."
	);
	let isSubmitting = $state(false);

	// Handle successful invite creation — redirect to coach hub
	$effect(() => {
		if (form?.success) {
			goto('/coach');
		}
		if (form?.skipped) {
			goto('/coach');
		}
	});
</script>

<section class="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 p-4 pb-12">
	<!-- Progress Dots -->
	<div class="flex items-center gap-3">
		{#each allSteps as step, i}
			<button
				type="button"
				onclick={() => { if (i <= currentStepIndex) currentStep = step; }}
				class="h-3 w-3 rounded-full transition-all {i === currentStepIndex
					? 'scale-110 bg-purple-600 shadow-md shadow-purple-300'
					: i < currentStepIndex
						? 'bg-purple-400 hover:bg-purple-500'
						: 'bg-neutral-300'}"
				aria-label="Step {i + 1}"
			></button>
		{/each}
	</div>

	<!-- Step 1: Welcome -->
	{#if currentStep === 'welcome'}
		<div class="w-full space-y-8 text-center">
			<div class="space-y-4">
				<div class="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-xl shadow-purple-200">
					<span class="text-4xl">🧭</span>
				</div>
				<h1 class="text-4xl font-bold text-neutral-900">Welcome to Forbetra, {data.coach.name}</h1>
				<p class="mx-auto max-w-lg text-lg text-neutral-600">
					Your coaching hub for guiding individuals through structured development cycles.
				</p>
			</div>

			<div class="mx-auto max-w-xl space-y-4">
				<div class="rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-white to-purple-50/30 p-6 text-left shadow-sm">
					<h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-purple-700">Your role</h3>
					<p class="text-sm text-neutral-700 leading-relaxed">
						Guide individuals through development cycles, review their progress data, and provide targeted feedback that helps them grow.
					</p>
				</div>
				<div class="rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-white to-blue-50/30 p-6 text-left shadow-sm">
					<h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-700">What you'll have access to</h3>
					<ul class="space-y-2 text-sm text-neutral-700">
						<li class="flex items-start gap-2">
							<span class="mt-0.5 text-blue-500">&#10003;</span>
							Real-time tracking of client effort and performance
						</li>
						<li class="flex items-start gap-2">
							<span class="mt-0.5 text-blue-500">&#10003;</span>
							AI-generated insights and coaching prep
						</li>
						<li class="flex items-start gap-2">
							<span class="mt-0.5 text-blue-500">&#10003;</span>
							Stakeholder feedback trends and blind-spot alerts
						</li>
					</ul>
				</div>
			</div>

			<button
				type="button"
				onclick={goNext}
				class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-3.5 font-semibold text-white shadow-lg transition-all hover:from-purple-700 hover:to-blue-700 hover:shadow-xl hover:scale-105"
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
				<h1 class="text-3xl font-bold text-neutral-900">How Forbetra Works</h1>
				<p class="mx-auto max-w-md text-base text-neutral-600">
					A continuous cycle of reflection, feedback, and insight — powered by the people around your client.
				</p>
			</div>

			<div class="mx-auto max-w-xl space-y-3">
				{#each [
					{ num: 1, icon: '🎯', title: 'Individual sets an objective', desc: 'They define what they want to improve and break it into observable behaviors.' },
					{ num: 2, icon: '📝', title: 'Weekly check-ins', desc: 'Self-rated effort and performance scores (0-10) with reflection notes.' },
					{ num: 3, icon: '👥', title: 'Stakeholders rate the same dimensions', desc: 'External perspectives reveal blind spots between self-perception and reality.' },
					{ num: 4, icon: '🤖', title: 'AI analyzes patterns', desc: 'Weekly synthesis, trend detection, and actionable coaching prep.' },
					{ num: 5, icon: '🧭', title: 'You see everything', desc: 'Alerts, trends, stakeholder feedback, and AI insights — all in one dashboard.' }
				] as card}
					<div class="flex items-start gap-4 rounded-xl border-2 border-neutral-200 bg-white p-5 text-left shadow-sm transition-all hover:border-purple-200 hover:shadow-md">
						<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-blue-100 text-sm font-bold text-purple-700">
							{card.num}
						</div>
						<div class="flex-1">
							<div class="flex items-center gap-2">
								<span class="text-lg">{card.icon}</span>
								<h3 class="text-sm font-bold text-neutral-900">{card.title}</h3>
							</div>
							<p class="mt-1 text-xs text-neutral-600 leading-relaxed">{card.desc}</p>
						</div>
					</div>
				{/each}
			</div>

			<div class="flex items-center justify-center gap-4">
				<button
					type="button"
					onclick={goBack}
					class="rounded-xl border-2 border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 transition-all hover:border-neutral-400 hover:bg-neutral-50"
				>
					&#8592; Back
				</button>
				<button
					type="button"
					onclick={goNext}
					class="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-3.5 font-semibold text-white shadow-lg transition-all hover:from-purple-700 hover:to-blue-700 hover:shadow-xl hover:scale-105"
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
				<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-200">
					<span class="text-3xl">✉️</span>
				</div>
				<h1 class="text-3xl font-bold text-neutral-900">Invite Your First Client</h1>
				<p class="mx-auto max-w-md text-base text-neutral-600">
					Send an invitation to an individual you'd like to coach. They'll set up their own objective and stakeholders.
				</p>
			</div>

			{#if form?.error}
				<div class="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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
					<label for="email" class="mb-1.5 block text-sm font-semibold text-neutral-800">
						Email address <span class="text-red-500">*</span>
					</label>
					<input
						type="email"
						id="email"
						name="email"
						bind:value={email}
						required
						placeholder="client@example.com"
						class="w-full rounded-xl border-2 border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
					/>
				</div>

				<div>
					<label for="name" class="mb-1.5 block text-sm font-semibold text-neutral-800">
						Name <span class="text-xs font-normal text-neutral-500">(optional)</span>
					</label>
					<input
						type="text"
						id="name"
						name="name"
						bind:value={name}
						placeholder="Their name"
						class="w-full rounded-xl border-2 border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
					/>
				</div>

				<div>
					<label for="message" class="mb-1.5 block text-sm font-semibold text-neutral-800">
						Personal message <span class="text-xs font-normal text-neutral-500">(optional)</span>
					</label>
					<textarea
						id="message"
						name="message"
						bind:value={message}
						rows="4"
						class="w-full rounded-xl border-2 border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
						placeholder="Add a personal note to your invitation..."
					></textarea>
				</div>

				<div class="flex flex-col gap-3 pt-2">
					<button
						type="submit"
						disabled={isSubmitting || !email}
						class="w-full rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-3.5 font-semibold text-white shadow-lg transition-all hover:from-purple-700 hover:to-blue-700 hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
					>
						{#if isSubmitting}
							<span class="inline-flex items-center gap-2">
								<span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
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
					class="rounded-xl border-2 border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 transition-all hover:border-neutral-400 hover:bg-neutral-50"
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
						class="text-sm font-medium text-neutral-500 underline decoration-neutral-400 underline-offset-4 transition-colors hover:text-neutral-700 hover:decoration-neutral-600"
					>
						Skip for now
					</button>
				</form>
			</div>
		</div>
	{/if}
</section>
