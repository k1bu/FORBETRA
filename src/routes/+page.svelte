<script lang="ts">
	import { SignedIn, SignedOut } from 'svelte-clerk';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();
</script>

<SignedOut>
	<section class="min-h-screen bg-[#F9FAFB]">
		<div class="mx-auto flex min-h-screen max-w-6xl flex-col md:flex-row">
			<div class="relative flex w-full flex-col justify-center bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] px-8 py-16 md:w-1/2">
				<div
					class="absolute inset-10 -z-10 rounded-3xl border border-blue-100 bg-blue-50/30 opacity-60 blur-2xl"
					aria-hidden="true"
				/>
				<div class="w-full rounded-3xl border-2 border-[#3B82F6] bg-white/80 p-10 backdrop-blur">
					<div class="space-y-4 text-center md:text-left">
						<p class="text-xs uppercase tracking-[0.4em] text-slate-500">Nordic Precision</p>
						<h1 class="text-4xl font-semibold tracking-wide text-slate-900">FORBETRA</h1>
						<p class="text-base text-slate-500">Human. Data. Better.</p>
					</div>
					<div class="mt-10 space-y-4 text-sm text-slate-600">
						<p>🧭 Design Philosophy: Nordic simplicity meets cognitive depth.</p>
						<p>
							We blend Scandinavian calm with psychological precision—structure, contrast, and focus
							for leaders and teams aiming higher.
						</p>
					</div>
				</div>
			</div>

			<div class="flex w-full items-center justify-center bg-[#EFF1F5] px-8 py-16 md:w-1/2">
				<div class="w-full max-w-md space-y-6 rounded-3xl bg-white p-10 shadow-[0_20px_40px_-24px_rgba(15,23,42,0.25)]">
					<header class="space-y-2 text-center">
						<h2 class="text-2xl font-semibold text-slate-900">Welcome to FORBETRA</h2>
						<p class="text-sm text-slate-500">Sign in to continue your performance cycles.</p>
					</header>
					<div class="space-y-3">
						<a
							href="/sign-in"
							class="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#2563EB] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:from-[#2563EB] hover:to-[#1D4ED8]"
						>
							Sign in
						</a>
						<a
							href="/sign-up"
							class="inline-flex w-full items-center justify-center rounded-2xl border border-[#3B82F6] px-4 py-3 text-sm font-semibold text-[#1D4ED8] transition hover:bg-blue-50"
						>
							Create account
						</a>
					</div>
					<p class="text-center text-xs text-slate-400">
						By continuing, you agree to our
						<a href="/terms" class="font-medium text-slate-500 hover:text-slate-700">Terms of Use</a>.
					</p>
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
						href="/dashboard"
						class="rounded-2xl border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
					>
						View dashboard
					</a>
				</div>
			{:else if data.dbUser.role === 'COACH'}
				<p class="text-sm text-slate-600">
					Coach dashboards surface your roster and performance alerts. We’ll notify you as soon as new
					insights land.
				</p>
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
				We’re finalizing your profile. Refresh this page if things don’t update in a few seconds.
			</p>
		{/if}
	</section>
</SignedIn>
