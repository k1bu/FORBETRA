<script lang="ts">
	import { SignedIn, SignedOut } from 'svelte-clerk';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<SignedOut>
	<section class="landing relative flex min-h-screen w-full flex-col bg-[#F7F8FA] md:flex-row">
		<nav class="absolute inset-x-0 top-0 z-20 flex items-center justify-start px-8 py-6 text-sm text-slate-500" aria-hidden="true"></nav>

		<div class="left-panel relative flex w-full flex-col items-center justify-center px-10 pb-16 pt-32 md:w-1/2 md:px-16">
			<div
				class="pointer-events-none absolute inset-0 animate-gradientSlow bg-[length:200%_200%] opacity-70"
				style="background-image: radial-gradient(circle at 20% 20%, rgba(59,130,246,0.12), transparent 55%), radial-gradient(circle at 80% 30%, rgba(148,163,184,0.18), transparent 60%), radial-gradient(circle at 50% 80%, rgba(226,232,240,0.25), transparent 50%);"
				aria-hidden="true"
			></div>
			<div
				class="pointer-events-none absolute inset-0"
				style="background-image: url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22%3E%3Cpath d=%22M0 39.5L0 40 40 40 40 39.5 0 39.5z M39.5 0 39.5 40 40 40 40 0 39.5 0z%22 fill=%22%23cbd5f5%22 fill-opacity=%220.25%22/%3E%3C/svg%3E');"
				aria-hidden="true"
			></div>
			<div class="relative z-10 w-full max-w-xl rounded-3xl border-2 border-[#3B82F6] bg-white/85 p-12 backdrop-blur md:mx-auto">
				<div class="space-y-5">
					<p class="text-xs uppercase tracking-[0.6em] text-slate-400">Human. Data. Better.</p>
					<h1 class="text-5xl font-semibold tracking-[0.18em] text-slate-900">FORBETRA</h1>
					<div class="h-[2px] w-24 rounded-full bg-[#F2EDE6]"></div>
					<p class="text-lg leading-relaxed text-slate-500">
						FORBETRA is a tool to help you improve. Structure your development, align with stakeholders
						invested in your growth, and make true progress.
					</p>
				</div>
				<div class="mt-10 grid gap-4 text-sm text-slate-600">
					<div class="flex items-start gap-3">
						<span class="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
							01
						</span>
						<p>Focused objectives anchored in behavioral science.</p>
					</div>
					<div class="flex items-start gap-3">
						<span class="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
							02
						</span>
						<p>Weekly reflection rituals calibrated for cognitive clarity.</p>
					</div>
					<div class="flex items-start gap-3">
						<span class="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
							03
						</span>
						<p>Stakeholder feedback loops that translate data into human insight.</p>
					</div>
				</div>
			</div>
		</div>

		<div class="right-panel relative flex w-full items-center justify-center px-8 pb-16 pt-32 md:w-1/2 md:px-20">
			<div class="absolute inset-0 md:border-l md:border-slate-200" aria-hidden="true"></div>
			<div class="relative z-10 w-full max-w-xl space-y-8 rounded-3xl bg-white/90 p-12 shadow-[0_30px_60px_-34px_rgba(15,23,42,0.35)] backdrop-blur">
				<header class="space-y-3 text-center md:text-left">
					<h2 class="text-3xl font-semibold text-slate-900">Welcome to FORBETRA</h2>
					<p class="text-sm text-slate-500">Sign in to continue your progress or create a new account to begin.</p>
				</header>
				<div class="space-y-4">
					<a
						href="/sign-in"
						class="cta-primary"
					>
						Sign in
					</a>
					<a
						href="/sign-up"
						class="cta-secondary"
					>
						Create account
					</a>
				</div>
				<div class="space-y-3 text-xs text-slate-500 md:text-sm">
					<p>By continuing, you agree to our <a href="/terms" class="font-medium text-slate-600 hover:text-slate-800">Terms of Use</a>.</p>
				</div>
			</div>
		</div>
	</section>
</SignedOut>

<SignedIn>
	<section class="mx-auto flex min-h-[60vh] max-w-4xl flex-col justify-center gap-6 px-4 py-12">
		{#if data.dbUser}
			<div class="space-y-3">
				<p class="text-sm uppercase tracking-[0.35em] text-slate-400">Signed in</p>
				<h1 class="text-3xl font-semibold text-slate-900">
					Welcome back, <span class="font-medium">{data.dbUser.name ?? data.dbUser.email}</span>
				</h1>
				<p class="text-slate-600">
					You are currently operating as
					<span class="font-semibold uppercase text-slate-900">{data.dbUser.role}</span>.
				</p>
			</div>
			{#if data.dbUser.role === 'INDIVIDUAL'}
				<div class="grid gap-4 sm:grid-cols-2">
					<a
						href="/onboarding"
						class="rounded-2xl bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
					>
						Complete onboarding
					</a>
					<a
						href="/individual"
						class="rounded-2xl border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
					>
						View dashboard
					</a>
				</div>
			{:else if data.dbUser.role === 'COACH'}
				<div class="space-y-3 text-sm text-slate-600">
					<p>
						Coach dashboards surface your roster and performance alerts. We'll notify you as soon as new
						insights land.
					</p>
					<a
						href="/coach"
						class="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
					>
						Go to coach dashboard
					</a>
				</div>
			{:else if data.dbUser.role === 'STAKEHOLDER'}
				<p class="text-sm text-slate-600">
					Stay tuned—feedback prompts arrive when your participant submits reflections for the week.
				</p>
			{:else}
				<p class="text-sm text-slate-600">
					Continue to <a href="/admin/users" class="font-semibold text-slate-900 underline">admin controls</a> to manage roles and oversight.
				</p>
			{/if}
		{:else}
			<p class="text-center text-slate-500">
				We're finalizing your profile. Refresh this page if things don't update in a few seconds.
			</p>
		{/if}
	</section>
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
		background: linear-gradient(160deg, rgba(241, 245, 249, 0.95), rgba(226, 232, 240, 0.9));
	}

	.cta-primary,
	.cta-secondary {
		display: inline-flex;
		width: 100%;
		align-items: center;
		justify-content: center;
		padding: 0.85rem 1rem;
		border-radius: 1.25rem;
		font-weight: 600;
		font-size: 0.95rem;
		transition: transform 200ms ease, box-shadow 200ms ease, background 200ms ease;
	}

	.cta-primary {
		background: linear-gradient(90deg, #3b82f6, #2563eb);
		color: #fff;
		box-shadow: 0 12px 24px -18px rgba(37, 99, 235, 0.8);
	}

	.cta-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 16px 28px -16px rgba(37, 99, 235, 0.95);
		background: linear-gradient(90deg, #2563eb, #1d4ed8);
	}

	.cta-secondary {
		border: 1.5px solid rgba(37, 99, 235, 0.7);
		color: #1d4ed8;
		background: rgba(255, 255, 255, 0.75);
	}

	.cta-secondary:hover {
		transform: translateY(-1px);
		background: rgba(219, 234, 254, 0.4);
	}

	@media (max-width: 768px) {
		.landing::before {
			content: '';
			position: absolute;
			top: 50%;
			left: 10%;
			right: 10%;
			height: 1px;
			background: linear-gradient(90deg, transparent, rgba(148, 163, 184, 0.35), transparent);
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
