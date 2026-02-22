<script lang="ts">
	import { enhance } from '$app/forms';
	import { addToast } from '$lib/stores/toasts.svelte';
	import { Mail, AlertTriangle, CircleCheck, Clock, Lightbulb, Inbox, Send, Copy, Check } from 'lucide-svelte';
	import type { PageData, ActionData } from './$types';

	type PrefillSubgoal = { label: string; description: string };
	type PrefillStakeholder = { name: string; email: string };

	const { data, form }: { data: PageData; form: ActionData | null } = $props();

	let copiedInviteUrl = $state(false);

	async function copyInviteUrl(url: string) {
		try {
			await navigator.clipboard.writeText(url);
			copiedInviteUrl = true;
			setTimeout(() => {
				copiedInviteUrl = false;
			}, 2000);
		} catch {
			// Fallback: do nothing
		}
	}

	const defaultInviteMessage =
		`Hi there—I'd love for you to join me in Forbetra so we can track your progress together. ` +
		`The link above will guide you through creating your account and connecting with me as your coach.`;

	let showPrefill = $state(false);
	let prefillObjectiveTitle = $state('');
	let prefillObjectiveDescription = $state('');
	let prefillSubgoals = $state<PrefillSubgoal[]>([{ label: '', description: '' }]);
	let prefillStakeholders = $state<PrefillStakeholder[]>([{ name: '', email: '' }]);
	let prefillCycleDurationWeeks = $state('12');
	let prefillCheckInFrequency = $state('3x');
	let prefillStakeholderCadence = $state('weekly');

	function addPrefillSubgoal() {
		if (prefillSubgoals.length < 3) {
			prefillSubgoals = [...prefillSubgoals, { label: '', description: '' }];
		}
	}

	function removePrefillSubgoal(index: number) {
		prefillSubgoals = prefillSubgoals.filter((_, i) => i !== index);
	}

	function addPrefillStakeholder() {
		if (prefillStakeholders.length < 3) {
			prefillStakeholders = [...prefillStakeholders, { name: '', email: '' }];
		}
	}

	function removePrefillStakeholder(index: number) {
		prefillStakeholders = prefillStakeholders.filter((_, i) => i !== index);
	}

	const formatDateTime = (value: string | null | undefined) => {
		if (!value) return '—';
		return new Intl.DateTimeFormat('en-US', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	};

	let emailError = $state('');
	const validateEmail = (email: string) => {
		if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
			emailError = 'Please enter a valid email address.';
		} else {
			emailError = '';
		}
	};

	const formatTimeFromNow = (value: string | null | undefined) => {
		if (!value) return '—';
		const diff = new Date(value).getTime() - Date.now();
		const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
		if (days <= 0) return 'Expired';
		if (days === 1) return '1 day left';
		return `${days} days left`;
	};

	// --- Status helpers ---
	type InviteStatus = 'accepted' | 'cancelled' | 'expired' | 'pending';

	function getInviteStatus(invite: { acceptedAt: string | null; cancelledAt: string | null; expiresAt: string }): InviteStatus {
		if (invite.acceptedAt) return 'accepted';
		if (invite.cancelledAt) return 'cancelled';
		if (new Date(invite.expiresAt).getTime() < Date.now()) return 'expired';
		return 'pending';
	}

	const statusConfig: Record<InviteStatus, { label: string; class: string; dotColor: string }> = {
		accepted: { label: 'Accepted', class: 'text-success', dotColor: 'bg-success' },
		cancelled: { label: 'Cancelled', class: 'text-text-tertiary', dotColor: 'bg-text-muted' },
		expired: { label: 'Expired', class: 'text-error', dotColor: 'bg-error' },
		pending: { label: 'Pending', class: 'text-warning', dotColor: 'bg-warning' }
	};

	// --- Filter tabs ---
	type FilterTab = 'all' | 'pending' | 'accepted' | 'cancelled';
	let activeFilter = $state<FilterTab>('all');

	const filteredInvitations = $derived(() => {
		if (activeFilter === 'all') return data.invitations;
		return data.invitations.filter((invite) => {
			const status = getInviteStatus(invite);
			if (activeFilter === 'cancelled') return status === 'cancelled' || status === 'expired';
			return status === activeFilter;
		});
	});

	function countByFilter(filter: FilterTab): number {
		if (filter === 'all') return data.invitations.length;
		return data.invitations.filter((invite) => {
			const status = getInviteStatus(invite);
			if (filter === 'cancelled') return status === 'cancelled' || status === 'expired';
			return status === filter;
		}).length;
	}

	// --- Loading states ---
	let submittingCreate = $state(false);
	let submittingCancel = $state<string | null>(null);
	let submittingResend = $state<string | null>(null);

	// --- Toast on form success ---
	$effect(() => {
		if (!form) return;
		if (form.action === 'createInvite' && form.success) {
			addToast(`Invitation sent to ${form.email}`, 'success');
		} else if (form.action === 'cancelInvite' && form.success) {
			addToast('Invitation cancelled', 'success');
		} else if (form.action === 'resendInvite' && form.success) {
			addToast(`Invitation resent to ${form.email}`, 'success');
		} else if (form.error) {
			addToast(form.error, 'error');
		}
	});

	const filterTabs: { key: FilterTab; label: string }[] = [
		{ key: 'all', label: 'All' },
		{ key: 'pending', label: 'Pending' },
		{ key: 'accepted', label: 'Accepted' },
		{ key: 'cancelled', label: 'Cancelled' }
	];
</script>

<svelte:head>
	<title>Invitations | Forbetra</title>
</svelte:head>

<section class="mx-auto flex max-w-7xl flex-col gap-8 p-4 pb-12">
	<!-- Email mode banner -->
	{#if data.emailMode === 'mock'}
		<div class="rounded-xl border border-accent/30 bg-accent-muted px-4 py-3 text-sm text-accent">
			<p class="font-semibold">Dev mode — emails are logged to the console but not actually sent.</p>
		</div>
	{/if}

	<!-- Header -->
	<header class="flex items-center justify-between">
		<div>
			<nav aria-label="Breadcrumb" class="mb-2">
				<ol class="flex items-center gap-1.5 text-sm text-text-tertiary">
					<li><a href="/coach" class="rounded transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Coach Hub</a></li>
					<li aria-hidden="true" class="text-text-muted"><svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg></li>
					<li><span class="font-medium text-text-primary">Invitations</span></li>
				</ol>
			</nav>
			<h1 class="text-3xl font-bold text-text-primary">Manage Invitations</h1>
			<p class="mt-2 text-text-secondary">Send invitations to new clients and track active invites</p>
		</div>
	</header>

	<!-- Invite Section -->
	<section class="grid gap-6 rounded-lg border border-border-default bg-surface-raised p-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
		<div class="space-y-4">
			<header class="space-y-2">
				<div class="flex items-center gap-2">
					<Mail class="h-4 w-4 text-text-muted" />
					<h2 class="text-xl font-bold text-text-primary">Invite an Individual</h2>
				</div>
				<p class="text-sm text-text-secondary">
					Send a secure invite so they join Forbetra automatically linked to you.
				</p>
			</header>

			<!-- Duplicate warning card -->
			{#if form?.duplicate && form?.existingInvite}
				<div class="space-y-3 rounded-xl border border-border-strong bg-warning-muted px-4 py-3 text-sm text-warning">
					<div class="flex items-center gap-2">
						<AlertTriangle class="h-4 w-4 text-warning" />
						<p class="font-semibold">An active invitation already exists for {form.existingInvite.email}</p>
					</div>
					<div class="text-xs text-warning">
						<p>Created {formatDateTime(form.existingInvite.createdAt)} — Expires {formatDateTime(form.existingInvite.expiresAt)}</p>
					</div>
					<div class="flex gap-2">
						<form method="post" action="?/resendInvite" use:enhance={() => {
							submittingResend = form?.existingInvite?.id ?? null;
							return async ({ update }) => {
								submittingResend = null;
								await update();
							};
						}}>
							<input type="hidden" name="inviteId" value={form.existingInvite.id} />
							<button
								type="submit"
								disabled={submittingResend === form.existingInvite.id}
								class="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-hover disabled:opacity-50"
							>
								{submittingResend === form.existingInvite.id ? 'Resending...' : 'Resend Invitation'}
							</button>
						</form>
						<form method="post" action="?/cancelInvite" use:enhance={() => {
							submittingCancel = form?.existingInvite?.id ?? null;
							return async ({ update }) => {
								submittingCancel = null;
								await update();
							};
						}}>
							<input type="hidden" name="inviteId" value={form.existingInvite.id} />
							<button
								type="submit"
								disabled={submittingCancel === form.existingInvite.id}
								class="rounded-lg border border-border-strong bg-surface-raised px-4 py-2 text-xs font-semibold text-warning transition hover:bg-surface-subtle disabled:opacity-50"
							>
								{submittingCancel === form.existingInvite.id ? 'Cancelling...' : 'Cancel Invitation'}
							</button>
						</form>
					</div>
				</div>
			{:else if form?.action === 'createInvite' && form?.success}
				<div class="space-y-3 rounded-xl border border-success/50 bg-success-muted px-4 py-3 text-sm text-success">
					<div class="flex items-center gap-2">
						<CircleCheck class="h-4 w-4 text-success" />
						<p class="font-semibold">Invitation sent to {form.email}!</p>
					</div>
					{#if form.emailFailed}
						<div class="rounded-lg border border-border-strong bg-warning-muted px-4 py-2 text-xs text-warning">
							The invitation email could not be sent. Please share the link below directly.
						</div>
					{/if}
					{#if form.inviteUrl}
						<div class="rounded-lg border border-success/50 bg-surface-raised px-4 py-3 text-xs text-success">
							<p class="mb-2 font-bold uppercase tracking-wide text-success">Invite Link</p>
							<div class="mb-2 flex items-center gap-2">
								<p class="flex-1 break-all font-mono font-medium">{form.inviteUrl}</p>
								<button
									type="button"
									onclick={() => copyInviteUrl(form?.inviteUrl ?? '')}
									class="shrink-0 rounded-md border border-success/30 bg-success-muted p-1.5 text-success transition-all hover:bg-success/20"
									aria-label="Copy invite link"
								>
									{#if copiedInviteUrl}
										<Check class="h-4 w-4" />
									{:else}
										<Copy class="h-4 w-4" />
									{/if}
								</button>
								{#if copiedInviteUrl}
									<span class="text-xs font-medium text-success">Copied!</span>
								{/if}
							</div>
							<p class="text-success">
								<Lightbulb class="h-3.5 w-3.5 inline text-text-muted" /> Share this link with your client. It expires in 30 days.
							</p>
						</div>
					{/if}
				</div>
			{:else if form?.error}
				<div class="rounded-xl border border-error/50 bg-error-muted px-4 py-3 text-sm text-error">
					<p class="font-semibold"><AlertTriangle class="h-4 w-4 inline text-error" /> {form.error}</p>
				</div>
			{/if}

			<form method="post" action="?/createInvite" use:enhance={() => {
				submittingCreate = true;
				return async ({ update }) => {
					submittingCreate = false;
					await update();
				};
			}} class="space-y-4">
				<div class="grid gap-3 md:grid-cols-2">
					<label class="space-y-1 text-sm">
						<span class="font-semibold text-text-secondary">Individual email</span>
						<input
							type="email"
							name="email"
							class="w-full rounded-xl border bg-surface-raised px-4 py-2.5 text-sm text-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 {emailError ? 'border-error' : 'border-border-default'}"
							placeholder="alex@example.com"
							required
							value={form?.values?.email ?? ''}
							onblur={(e) => validateEmail(e.currentTarget.value)}
							oninput={(e) => { if (emailError) validateEmail(e.currentTarget.value); }}
						/>
						{#if emailError}
							<p class="text-xs text-error">{emailError}</p>
						{/if}
					</label>
					<label class="space-y-1 text-sm">
						<span class="font-semibold text-text-secondary">Name (optional)</span>
						<input
							type="text"
							name="name"
							class="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-2.5 text-sm text-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
							placeholder="Alex Jensen"
							value={form?.values?.name ?? ''}
						/>
					</label>
				</div>
				<label class="space-y-1 text-sm">
					<span class="font-semibold text-text-secondary">Message (optional)</span>
					<textarea
						name="message"
						rows="3"
						class="w-full rounded-xl border border-border-default bg-surface-raised px-4 py-2.5 text-sm text-text-primary transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
						placeholder="Add context for why you're inviting them."
					>{form?.values?.message ?? defaultInviteMessage}</textarea>
				</label>
				<!-- Pre-fill Accordion -->
				<div class="rounded-xl border border-border-default bg-surface-raised">
					<button
						type="button"
						onclick={() => showPrefill = !showPrefill}
						class="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-text-secondary hover:text-text-primary"
					>
						<span>Pre-fill client's onboarding (optional)</span>
						<svg class="h-4 w-4 transition-transform {showPrefill ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					{#if showPrefill}
						<div class="space-y-4 border-t border-border-default px-4 py-4">
							<div class="space-y-1">
								<label for="prefillObjectiveTitle" class="text-xs font-semibold text-text-secondary">Objective Title</label>
								<input id="prefillObjectiveTitle" type="text" name="prefillObjectiveTitle" bind:value={prefillObjectiveTitle} placeholder="e.g., Enhance strategic thinking" class="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary" />
							</div>
							<div class="space-y-1">
								<label for="prefillObjectiveDescription" class="text-xs font-semibold text-text-secondary">Objective Description</label>
								<textarea id="prefillObjectiveDescription" name="prefillObjectiveDescription" bind:value={prefillObjectiveDescription} rows="2" placeholder="Why this matters..." class="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary"></textarea>
							</div>
							<!-- Subgoals -->
							<div class="space-y-2">
								<p class="text-xs font-semibold text-text-secondary">Sub-objectives (up to 3)</p>
								{#each prefillSubgoals as subgoal, i}
									<div class="flex gap-2">
										<input type="text" bind:value={subgoal.label} placeholder="Behavior label" class="flex-1 rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-sm text-text-primary" />
										<input type="text" bind:value={subgoal.description} placeholder="Description" class="flex-1 rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-sm text-text-primary" />
										{#if prefillSubgoals.length > 1}
											<button type="button" onclick={() => removePrefillSubgoal(i)} class="text-xs text-error hover:text-error">Remove</button>
										{/if}
									</div>
								{/each}
								{#if prefillSubgoals.length < 3}
									<button type="button" onclick={addPrefillSubgoal} class="text-xs font-medium text-accent hover:text-accent-hover">+ Add sub-objective</button>
								{/if}
							</div>
							<!-- Stakeholders -->
							<div class="space-y-2">
								<p class="text-xs font-semibold text-text-secondary">Stakeholders (up to 3)</p>
								{#each prefillStakeholders as sh, i}
									<div class="flex gap-2">
										<input type="text" bind:value={sh.name} placeholder="Name" class="flex-1 rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-sm text-text-primary" />
										<input type="email" bind:value={sh.email} placeholder="Email" class="flex-1 rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-sm text-text-primary" />
										{#if prefillStakeholders.length > 1}
											<button type="button" onclick={() => removePrefillStakeholder(i)} class="text-xs text-error hover:text-error">Remove</button>
										{/if}
									</div>
								{/each}
								{#if prefillStakeholders.length < 3}
									<button type="button" onclick={addPrefillStakeholder} class="text-xs font-medium text-accent hover:text-accent-hover">+ Add stakeholder</button>
								{/if}
							</div>
							<!-- Cycle settings -->
							<div class="grid gap-3 md:grid-cols-3">
								<div class="space-y-1">
									<label for="prefillCycleDurationWeeks" class="text-xs font-semibold text-text-secondary">Duration</label>
									<select id="prefillCycleDurationWeeks" name="prefillCycleDurationWeeks" bind:value={prefillCycleDurationWeeks} class="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-sm text-text-primary">
										<option value="8">8 weeks</option>
										<option value="12">12 weeks</option>
										<option value="16">16 weeks</option>
									</select>
								</div>
								<div class="space-y-1">
									<label for="prefillCheckInFrequency" class="text-xs font-semibold text-text-secondary">Check-in Frequency</label>
									<select id="prefillCheckInFrequency" name="prefillCheckInFrequency" bind:value={prefillCheckInFrequency} class="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-sm text-text-primary">
										<option value="3x">3x/week</option>
										<option value="2x">2x/week</option>
										<option value="1x">1x/week</option>
									</select>
								</div>
								<div class="space-y-1">
									<label for="prefillStakeholderCadence" class="text-xs font-semibold text-text-secondary">Stakeholder Cadence</label>
									<select id="prefillStakeholderCadence" name="prefillStakeholderCadence" bind:value={prefillStakeholderCadence} class="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-sm text-text-primary">
										<option value="weekly">Weekly</option>
										<option value="biweekly">Biweekly</option>
									</select>
								</div>
							</div>
							<!-- Hidden JSON inputs -->
							<input type="hidden" name="prefillSubgoals" value={JSON.stringify(prefillSubgoals.filter(s => s.label.trim()))} />
							<input type="hidden" name="prefillStakeholders" value={JSON.stringify(prefillStakeholders.filter(s => s.name.trim() && s.email.trim()))} />
						</div>
					{/if}
				</div>

				<button
					type="submit"
					disabled={submittingCreate}
					class="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-accent-hover disabled:opacity-50"
				>
					<Send class="h-4 w-4" />
					{submittingCreate ? 'Sending...' : 'Send Invitation'}
				</button>
			</form>
		</div>

		<div class="space-y-4">
			<header class="flex items-center justify-between">
				<div>
					<div class="mb-1 flex items-center gap-2">
						<Inbox class="h-4 w-4 text-text-muted" />
						<h3 class="text-sm font-bold text-text-primary">Invitations</h3>
					</div>
					<p class="text-xs text-text-tertiary">Track invitations and manage their status.</p>
				</div>

				<span class="rounded-full bg-accent-muted px-4 py-1.5 text-xs font-bold text-accent">
					{data.invitations.filter((invite) => !invite.acceptedAt && !invite.cancelledAt && new Date(invite.expiresAt).getTime() > Date.now()).length} active
				</span>
			</header>

			<!-- Filter tabs -->
			<div class="flex gap-1 rounded-lg bg-surface-subtle p-1">
				{#each filterTabs as tab}
					{@const count = countByFilter(tab.key)}
					<button
						type="button"
						onclick={() => activeFilter = tab.key}
						class="flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all {activeFilter === tab.key
							? 'bg-surface-raised text-text-primary'
							: 'text-text-tertiary hover:text-text-secondary'}"
					>
						{tab.label}
						<span class="ml-1 rounded-full bg-surface-subtle px-1.5 py-0.5 text-[10px] font-bold {activeFilter === tab.key ? 'bg-accent-muted text-accent' : ''}">{count}</span>
					</button>
				{/each}
			</div>

			{#if filteredInvitations().length === 0}
				<div class="rounded-xl border border-dashed border-border-strong bg-surface-raised p-6 text-center">
					<p class="text-sm text-text-tertiary">
						{#if activeFilter === 'all'}
							No invitations yet. Send one using the form to the left.
						{:else}
							No {activeFilter} invitations.
						{/if}
					</p>
				</div>
			{:else}
				<ul class="space-y-3 text-sm">
					{#each filteredInvitations() as invite (invite.id)}
						{@const status = getInviteStatus(invite)}
						{@const config = statusConfig[status]}
						<li
							class="group rounded-xl border border-border-default bg-surface-raised px-4 py-4 transition-all hover:border-accent/30"
						>
							<div class="flex flex-wrap items-baseline justify-between gap-3">
								<div>
									<p class="font-bold text-text-primary">
										{invite.name ?? invite.email}
									</p>
									<p class="text-xs text-text-tertiary">{invite.email}</p>
								</div>
								<span class="flex items-center gap-1.5 text-xs font-semibold {config.class}">
									<span class="h-2 w-2 rounded-full {config.dotColor}"></span>
									{status === 'pending' ? formatTimeFromNow(invite.expiresAt) : config.label}
								</span>
							</div>
							{#if invite.message}
								<p class="mt-2 text-xs text-text-tertiary">
									Message: <span class="font-medium text-text-secondary">{invite.message}</span>
								</p>
							{/if}
							<div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-tertiary">
								<span>Created {formatDateTime(invite.createdAt)}</span>
								{#if status === 'accepted'}
									<span class="rounded-full px-2 py-1 text-success">
										Joined as {invite.individual?.name ?? invite.individual?.email}
									</span>
								{:else if status === 'cancelled'}
									<span class="rounded-full px-2 py-1 text-text-tertiary">
										Cancelled {formatDateTime(invite.cancelledAt)}
									</span>
								{/if}

								<!-- Action buttons -->
								{#if status === 'pending'}
									<form method="post" action="?/cancelInvite" use:enhance={() => {
										submittingCancel = invite.id;
										return async ({ update }) => {
											submittingCancel = null;
											await update();
										};
									}} class="inline">
										<input type="hidden" name="inviteId" value={invite.id} />
										<button
											type="submit"
											disabled={submittingCancel === invite.id}
											class="rounded-full border border-border-default px-3 py-1 text-xs font-semibold text-text-secondary transition hover:border-border-strong hover:text-text-primary disabled:opacity-50"
										>
											{submittingCancel === invite.id ? 'Cancelling...' : 'Cancel invite'}
										</button>
									</form>
								{/if}

								{#if status === 'pending' || status === 'cancelled' || status === 'expired'}
									<form method="post" action="?/resendInvite" use:enhance={() => {
										submittingResend = invite.id;
										return async ({ update }) => {
											submittingResend = null;
											await update();
										};
									}} class="inline">
										<input type="hidden" name="inviteId" value={invite.id} />
										<button
											type="submit"
											disabled={submittingResend === invite.id}
											class="rounded-full border border-accent/30 bg-accent-muted px-3 py-1 text-xs font-semibold text-accent transition hover:border-accent hover:bg-accent-muted disabled:opacity-50"
										>
											{submittingResend === invite.id ? 'Resending...' : 'Resend'}
										</button>
									</form>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</section>
</section>
