<script lang="ts">
	import { SignedIn, SignedOut } from 'svelte-clerk';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	const { data, form }: { data: PageData; form: any } = $props();

	let submitting = $state(false);

	// Auto-retry when DB user hasn't synced yet
	$effect(() => {
		if (data.dbUser === null && data.showRoleSelection === false) {
			const timer = setTimeout(() => invalidateAll(), 2000);
			return () => clearTimeout(timer);
		}
	});
</script>

<svelte:head>
	<title>Forbetra — You. And Improved.</title>
	<meta name="description" content="Forbetra is a personal development platform that helps you set goals, reflect weekly, and gather stakeholder feedback to drive real growth." />
</svelte:head>

<SignedOut>
	<section class="landing relative flex min-h-screen w-full flex-col bg-surface-base md:flex-row">
		<nav class="absolute inset-x-0 top-0 z-20 flex items-center justify-start px-8 py-6 text-sm text-text-tertiary" aria-hidden="true"></nav>

		<div class="left-panel relative flex w-full flex-col items-center justify-center px-10 pb-16 pt-32 md:w-1/2 md:px-16">
			<div
				class="pointer-events-none absolute inset-0 animate-gradientSlow bg-[length:200%_200%] opacity-70"
				style="background-image: radial-gradient(circle at 20% 20%, rgba(99,102,241,0.15), transparent 55%), radial-gradient(circle at 80% 30%, rgba(6,182,212,0.12), transparent 60%), radial-gradient(circle at 50% 80%, rgba(30,30,40,0.3), transparent 50%);"
				aria-hidden="true"
			></div>
			<div
				class="pointer-events-none absolute inset-0"
				style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22%3E%3Cpath d=%22M0 39.5L0 40 40 40 40 39.5 0 39.5z M39.5 0 39.5 40 40 40 40 0 39.5 0z%22 fill=%22%23ffffff%22 fill-opacity=%220.04%22/%3E%3C/svg%3E');"
				aria-hidden="true"
			></div>
			<div class="relative z-10 w-full max-w-xl rounded-3xl border border-accent/30 glass-raised p-12 md:mx-auto">
				<div class="space-y-5">
					<p class="text-xs uppercase tracking-[0.6em] text-text-muted">Human. Data. Better.</p>
					<h1 class="text-5xl font-semibold tracking-[0.18em] text-text-primary">FORBETRA</h1>
					<div class="h-[2px] w-24 rounded-full bg-border-default"></div>
					<p class="text-lg leading-relaxed text-text-tertiary">
						Forbetra is a tool to help you improve. Structure your development, align with stakeholders
						invested in your growth, and make true progress.
					</p>
				</div>
				<div class="mt-10 grid gap-4 text-sm text-text-secondary">
					<div class="flex items-start gap-3">
						<span class="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent">
							01
						</span>
						<p>Focused objectives anchored in behavioral science.</p>
					</div>
					<div class="flex items-start gap-3">
						<span class="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent">
							02
						</span>
						<p>Weekly reflection rituals calibrated for cognitive clarity.</p>
					</div>
					<div class="flex items-start gap-3">
						<span class="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent">
							03
						</span>
						<p>Stakeholder feedback loops that translate data into human insight.</p>
					</div>
				</div>
			</div>
		</div>

		<div class="right-panel relative flex w-full items-center justify-center px-8 pb-16 pt-32 md:w-1/2 md:px-20">
			<div class="absolute inset-0 md:border-l md:border-border-default" aria-hidden="true"></div>
			<div class="relative z-10 w-full max-w-xl space-y-8 rounded-3xl glass-raised p-12 shadow-[0_30px_60px_-34px_rgba(0,0,0,0.5)] backdrop-blur">
				<header class="space-y-3 text-center md:text-left">
					<h2 class="text-3xl font-semibold text-text-primary">Welcome to Forbetra</h2>
					<p class="text-sm text-text-tertiary">Sign in to continue your progress or create a new account to begin.</p>
				</header>
				<div class="space-y-4">
					<a
						href="/sign-in"
						class="inline-flex w-full items-center justify-center rounded-[1.25rem] bg-gradient-to-r from-accent to-blue-600 px-4 py-3.5 text-[0.95rem] font-semibold text-white shadow-[0_12px_24px_-18px_rgba(99,102,241,0.8)] transition-all duration-200 hover:-translate-y-0.5 hover:from-accent-hover hover:to-blue-700 hover:shadow-[0_16px_28px_-16px_rgba(99,102,241,0.95)]"
					>
						Sign in
					</a>
					<a
						href="/sign-up"
						class="inline-flex w-full items-center justify-center rounded-[1.25rem] border-[1.5px] border-accent/50 bg-surface-raised/75 px-4 py-3.5 text-[0.95rem] font-semibold text-accent transition-all duration-200 hover:-translate-y-px hover:bg-accent-muted"
					>
						Create account
					</a>
				</div>
				<div class="space-y-3 text-xs text-text-tertiary md:text-sm">
					<p>By continuing, you agree to our <a href="/terms" class="font-medium text-text-secondary hover:text-text-primary">Terms of Use</a>.</p>
				</div>
			</div>
		</div>
	</section>
</SignedOut>

<SignedIn>
	{#if data.showRoleSelection}
		<section class="flex min-h-screen items-center justify-center bg-surface-base px-4 py-12">
			<div class="w-full max-w-3xl space-y-10">
				<div class="space-y-3 text-center">
					<p class="text-xs uppercase tracking-[0.6em] text-text-muted">Welcome to</p>
					<h1 class="text-4xl font-semibold tracking-[0.18em] text-text-primary">FORBETRA</h1>
					<div class="mx-auto h-[2px] w-24 rounded-full bg-border-default"></div>
					{#if data.dbUser?.name}
						<p class="mx-auto max-w-md text-lg text-text-tertiary">{data.dbUser.name}, how will you be using Forbetra?</p>
					{:else}
						<p class="mx-auto max-w-md text-lg text-text-tertiary">How will you be using Forbetra?</p>
					{/if}
				</div>

				{#if form?.error}
					<p class="rounded-xl bg-error-muted px-4 py-3 text-center text-sm text-error">{form.error}</p>
				{/if}

				<div class="grid gap-6 sm:grid-cols-2">
					<form method="post" action="?/selectRole" use:enhance={() => { submitting = true; return async ({ update }) => { submitting = false; await update(); }; }}>
						<input type="hidden" name="role" value="INDIVIDUAL" />
						<button
							type="submit"
							disabled={submitting}
							class="group w-full cursor-pointer rounded-3xl border border-border-default bg-surface-raised p-8 text-left transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_20px_40px_-20px_rgba(99,102,241,0.3)] disabled:pointer-events-none disabled:opacity-60"
						>
							<div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-muted">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
							</div>
							<h2 class="mb-2 text-xl font-semibold text-text-primary">Individual</h2>
							<p class="mb-4 text-sm leading-relaxed text-text-tertiary">
								Set development objectives, reflect weekly, and get feedback from stakeholders.
							</p>
							<div class="space-y-2 text-xs text-text-muted">
								<div class="flex items-center gap-2">
									<span class="inline-block h-1.5 w-1.5 rounded-full bg-accent"></span>
									Focused development objectives
								</div>
								<div class="flex items-center gap-2">
									<span class="inline-block h-1.5 w-1.5 rounded-full bg-accent"></span>
									Weekly reflection rituals
								</div>
								<div class="flex items-center gap-2">
									<span class="inline-block h-1.5 w-1.5 rounded-full bg-accent"></span>
									Stakeholder feedback loops
								</div>
							</div>
							<div class="mt-6 text-sm font-semibold text-accent transition group-hover:text-accent-hover">
								{#if submitting}Setting up&hellip;{:else}Get started &rarr;{/if}
							</div>
						</button>
					</form>

					<form method="post" action="?/selectRole" use:enhance={() => { submitting = true; return async ({ update }) => { submitting = false; await update(); }; }}>
						<input type="hidden" name="role" value="COACH" />
						<button
							type="submit"
							disabled={submitting}
							class="group w-full cursor-pointer rounded-3xl border border-border-default bg-surface-raised p-8 text-left transition-all duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_20px_40px_-20px_rgba(99,102,241,0.3)] disabled:pointer-events-none disabled:opacity-60"
						>
							<div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-subtle">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
									<path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
							</div>
							<h2 class="mb-2 text-xl font-semibold text-text-primary">Coach</h2>
							<p class="mb-4 text-sm leading-relaxed text-text-tertiary">
								Invite clients, track their progress, and provide guidance.
							</p>
							<div class="space-y-2 text-xs text-text-muted">
								<div class="flex items-center gap-2">
									<span class="inline-block h-1.5 w-1.5 rounded-full bg-text-muted"></span>
									Client roster management
								</div>
								<div class="flex items-center gap-2">
									<span class="inline-block h-1.5 w-1.5 rounded-full bg-text-muted"></span>
									Progress tracking & alerts
								</div>
								<div class="flex items-center gap-2">
									<span class="inline-block h-1.5 w-1.5 rounded-full bg-text-muted"></span>
									Data-driven coaching notes
								</div>
							</div>
							<div class="mt-6 text-sm font-semibold text-text-secondary transition group-hover:text-text-primary">
								{#if submitting}Setting up&hellip;{:else}Get started &rarr;{/if}
							</div>
						</button>
					</form>
				</div>

				<p class="text-center text-xs text-text-muted">You can change your role later from settings.</p>
			</div>
		</section>
	{:else}
		<section class="mx-auto flex min-h-[60vh] max-w-4xl flex-col justify-center gap-6 px-4 py-12">
			{#if data.dbUser}
				<div class="space-y-3">
					<p class="text-sm uppercase tracking-[0.35em] text-text-muted">Signed in</p>
					<h1 class="text-3xl font-semibold text-text-primary">
						Welcome back, <span class="font-medium">{data.dbUser.name ?? data.dbUser.email}</span>
					</h1>
					<p class="text-text-secondary">
						You are currently operating as
						<span class="font-semibold uppercase text-text-primary">{data.dbUser.role}</span>.
					</p>
				</div>
				{#if data.dbUser.role === 'INDIVIDUAL'}
					<div class="grid gap-4 sm:grid-cols-2">
						<a
							href="/onboarding"
							class="rounded-2xl bg-accent px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-accent-hover"
						>
							Complete onboarding
						</a>
						<a
							href="/individual"
							class="rounded-2xl border border-border-strong px-5 py-3 text-center text-sm font-semibold text-text-primary transition hover:border-accent/30 hover:bg-surface-subtle"
						>
							View dashboard
						</a>
					</div>
				{:else if data.dbUser.role === 'COACH'}
					<div class="space-y-3 text-sm text-text-secondary">
						<p>
							Coach dashboards surface your roster and performance alerts. We'll notify you as soon as new
							insights land.
						</p>
						<a
							href="/coach"
							class="inline-flex items-center justify-center rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-accent/30 hover:text-text-primary"
						>
							Go to coach dashboard
						</a>
					</div>
				{:else if data.dbUser.role === 'STAKEHOLDER'}
					<p class="text-sm text-text-secondary">
						Stay tuned—feedback prompts arrive when your participant submits reflections for the week.
					</p>
				{:else}
					<p class="text-sm text-text-secondary">
						Continue to <a href="/admin/users" class="font-semibold text-text-primary underline">admin controls</a> to manage roles and oversight.
					</p>
				{/if}
			{:else}
				<p class="text-center text-text-tertiary">
					We're finalizing your profile. Refresh this page if things don't update in a few seconds.
				</p>
			{/if}
		</section>
	{/if}
</SignedIn>

<style>
	@keyframes gradientSlow {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}

	.left-panel {
		position: relative;
		overflow: hidden;
	}

	.right-panel {
		position: relative;
		background: linear-gradient(160deg, rgba(28, 28, 32, 0.95), rgba(20, 20, 24, 0.9));
	}

	@media (max-width: 768px) {
		.landing::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 10%;
			right: 10%;
			height: 1px;
			background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
		}

		.landing nav {
			position: static;
			padding-bottom: 0;
			justify-content: center;
			gap: 3rem;
		}

		.left-panel,
		.right-panel {
			padding-left: 1.5rem;
			padding-right: 1.5rem;
			padding-top: 5rem;
		}
	}
</style>
