<script lang="ts">
	type PrefillSubgoal = { label: string; description: string };
	type PrefillStakeholder = { name: string; email: string };

	type InvitationSummary = {
		id: string;
		email: string;
		name: string | null;
		message: string | null;
		expiresAt: string;
		acceptedAt: string | null;
		cancelledAt: string | null;
		individual: { id: string; name: string; email: string } | null;
		createdAt: string;
	};

	export let data: {
		coach: { name: string };
		invitations: InvitationSummary[];
	};

	export let form:
		| {
				error?: string;
				success?: boolean;
				inviteUrl?: string;
				inviteId?: string;
				values?: {
					email?: string;
					name?: string;
					message?: string;
				};
		  }
		| null;

	const defaultInviteMessage =
		`Hi there—I'd love for you to join me in FORBETRA so we can track your progress together. ` +
		`The link above will guide you through creating your account and connecting with me as your coach.`;

	let showPrefill = false;
	let prefillObjectiveTitle = '';
	let prefillObjectiveDescription = '';
	let prefillSubgoals: PrefillSubgoal[] = [{ label: '', description: '' }];
	let prefillStakeholders: PrefillStakeholder[] = [{ name: '', email: '' }];
	let prefillCycleDurationWeeks = '12';
	let prefillCheckInFrequency = '3x';
	let prefillStakeholderCadence = 'weekly';

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

	const formatTimeFromNow = (value: string | null | undefined) => {
		if (!value) return '—';
		const diff = new Date(value).getTime() - Date.now();
		const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
		if (days <= 0) return 'Expired';
		if (days === 1) return '1 day left';
		return `${days} days left`;
	};
</script>

<section class="mx-auto flex max-w-7xl flex-col gap-8 p-4 pb-12">
	<!-- Header -->
	<header class="flex items-center justify-between">
		<div>
			<a
				href="/coach"
				class="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900"
			>
				← Back to Hub
			</a>
			<h1 class="text-3xl font-bold text-neutral-900">Manage Invitations</h1>
			<p class="mt-2 text-neutral-600">Send invitations to new clients and track active invites</p>
		</div>
	</header>

	<!-- Invite Section -->
	<section class="grid gap-6 rounded-2xl border-2 border-neutral-200 bg-gradient-to-br from-white to-purple-50/30 p-6 shadow-sm lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
		<div class="space-y-4">
			<header class="space-y-2">
				<div class="flex items-center gap-2">
					<span class="text-2xl" role="img" aria-label="envelope">✉️</span>
					<h2 class="text-xl font-bold text-neutral-900">Invite an Individual</h2>
				</div>
				<p class="text-sm text-neutral-600">
					Send a secure invite so they join FORBETRA automatically linked to you.
				</p>
			</header>

			{#if form?.error}
				<div class="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					<p class="font-semibold">⚠️ {form.error}</p>
				</div>
			{:else if form?.success}
				<div class="space-y-3 rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 px-4 py-3 text-sm text-emerald-700">
					<div class="flex items-center gap-2">
						<span class="text-xl" role="img" aria-label="check mark">✅</span>
						<p class="font-semibold">Invitation created successfully!</p>
					</div>
					{#if form.emailFailed}
						<div class="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-xs text-amber-700">
							The invitation email could not be sent. Please share the link below directly.
						</div>
					{/if}
					{#if form.inviteUrl}
						<div class="rounded-lg border-2 border-emerald-300 bg-white px-4 py-3 text-xs text-emerald-700">
							<p class="mb-2 font-bold uppercase tracking-wide text-emerald-800">Invite Link</p>
							<p class="mb-2 break-all font-mono font-medium">{form.inviteUrl}</p>
							<p class="text-emerald-600">
								💡 Copy and share this link. It expires in 14 days.
							</p>
						</div>
					{/if}
				</div>
			{/if}

			<form method="post" action="?/createInvite" class="space-y-4">
				<div class="grid gap-3 md:grid-cols-2">
					<label class="space-y-1 text-sm">
						<span class="font-semibold text-neutral-700">Individual email</span>
						<input
							type="email"
							name="email"
							class="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
							placeholder="alex@example.com"
							required
							value={form?.values?.email}
						/>
					</label>
					<label class="space-y-1 text-sm">
						<span class="font-semibold text-neutral-700">Name (optional)</span>
						<input
							type="text"
							name="name"
							class="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
							placeholder="Alex Jensen"
							value={form?.values?.name}
						/>
					</label>
				</div>
				<label class="space-y-1 text-sm">
					<span class="font-semibold text-neutral-700">Message (optional)</span>
					<textarea
						name="message"
						rows="3"
						class="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
						placeholder="Add context for why you're inviting them."
					>{form?.values?.message ?? defaultInviteMessage}</textarea>
				</label>
				<!-- Pre-fill Accordion -->
				<div class="rounded-xl border border-neutral-200 bg-neutral-50">
					<button
						type="button"
						on:click={() => showPrefill = !showPrefill}
						class="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-neutral-700 hover:text-neutral-900"
					>
						<span>Pre-fill client's onboarding (optional)</span>
						<svg class="h-4 w-4 transition-transform {showPrefill ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>
					{#if showPrefill}
						<div class="space-y-4 border-t border-neutral-200 px-4 py-4">
							<div class="space-y-1">
								<label class="text-xs font-semibold text-neutral-600">Objective Title</label>
								<input type="text" name="prefillObjectiveTitle" bind:value={prefillObjectiveTitle} placeholder="e.g., Enhance strategic thinking" class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
							</div>
							<div class="space-y-1">
								<label class="text-xs font-semibold text-neutral-600">Objective Description</label>
								<textarea name="prefillObjectiveDescription" bind:value={prefillObjectiveDescription} rows="2" placeholder="Why this matters..." class="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"></textarea>
							</div>
							<!-- Subgoals -->
							<div class="space-y-2">
								<label class="text-xs font-semibold text-neutral-600">Subgoals (up to 3)</label>
								{#each prefillSubgoals as subgoal, i}
									<div class="flex gap-2">
										<input type="text" bind:value={subgoal.label} placeholder="Behavior label" class="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm" />
										<input type="text" bind:value={subgoal.description} placeholder="Description" class="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm" />
										{#if prefillSubgoals.length > 1}
											<button type="button" on:click={() => removePrefillSubgoal(i)} class="text-xs text-red-500 hover:text-red-700">Remove</button>
										{/if}
									</div>
								{/each}
								{#if prefillSubgoals.length < 3}
									<button type="button" on:click={addPrefillSubgoal} class="text-xs font-medium text-blue-600 hover:text-blue-800">+ Add subgoal</button>
								{/if}
							</div>
							<!-- Stakeholders -->
							<div class="space-y-2">
								<label class="text-xs font-semibold text-neutral-600">Stakeholders (up to 3)</label>
								{#each prefillStakeholders as sh, i}
									<div class="flex gap-2">
										<input type="text" bind:value={sh.name} placeholder="Name" class="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm" />
										<input type="email" bind:value={sh.email} placeholder="Email" class="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm" />
										{#if prefillStakeholders.length > 1}
											<button type="button" on:click={() => removePrefillStakeholder(i)} class="text-xs text-red-500 hover:text-red-700">Remove</button>
										{/if}
									</div>
								{/each}
								{#if prefillStakeholders.length < 3}
									<button type="button" on:click={addPrefillStakeholder} class="text-xs font-medium text-blue-600 hover:text-blue-800">+ Add stakeholder</button>
								{/if}
							</div>
							<!-- Cycle settings -->
							<div class="grid gap-3 md:grid-cols-3">
								<div class="space-y-1">
									<label class="text-xs font-semibold text-neutral-600">Duration</label>
									<select name="prefillCycleDurationWeeks" bind:value={prefillCycleDurationWeeks} class="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm">
										<option value="8">8 weeks</option>
										<option value="12">12 weeks</option>
										<option value="16">16 weeks</option>
									</select>
								</div>
								<div class="space-y-1">
									<label class="text-xs font-semibold text-neutral-600">Check-in Frequency</label>
									<select name="prefillCheckInFrequency" bind:value={prefillCheckInFrequency} class="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm">
										<option value="3x">3x/week</option>
										<option value="2x">2x/week</option>
										<option value="1x">1x/week</option>
									</select>
								</div>
								<div class="space-y-1">
									<label class="text-xs font-semibold text-neutral-600">Stakeholder Cadence</label>
									<select name="prefillStakeholderCadence" bind:value={prefillStakeholderCadence} class="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm">
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
					class="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-lg hover:scale-105"
				>
					<span role="img" aria-label="envelope">✉️</span>
					Send Invitation
				</button>
			</form>
		</div>

		<div class="space-y-4">
			<header class="flex items-center justify-between">
				<div>
					<div class="mb-1 flex items-center gap-2">
						<span class="text-xl" role="img" aria-label="incoming mail">📬</span>
						<h3 class="text-sm font-bold text-neutral-900">Active Invites</h3>
					</div>
					<p class="text-xs text-neutral-500">Track invitations waiting for acceptance.</p>
				</div>

				<span class="rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-1.5 text-xs font-bold text-blue-700">
					{data.invitations.filter((invite) => !invite.acceptedAt && !invite.cancelledAt).length}
				</span>
			</header>

			{#if data.invitations.length === 0}
				<div class="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
					<p class="text-sm text-neutral-500">
						No invitations yet. Send one using the form to the left.
					</p>
				</div>
			{:else}
				<ul class="space-y-3 text-sm">
					{#each data.invitations as invite (invite.id)}
						<li
							class="group rounded-xl border-2 border-neutral-200 bg-white px-4 py-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
						>
							<div class="flex flex-wrap items-baseline justify-between gap-3">
								<div>
									<p class="font-bold text-neutral-900">
										{invite.name ?? invite.email}
									</p>
									<p class="text-xs text-neutral-500">{invite.email}</p>
								</div>
								<span class="rounded-full px-3 py-1 text-xs font-semibold {invite.acceptedAt
									? 'bg-emerald-100 text-emerald-700'
									: invite.cancelledAt
									? 'bg-neutral-100 text-neutral-500'
									: 'bg-amber-100 text-amber-700'}">
									{invite.acceptedAt
										? '✅ Accepted'
										: invite.cancelledAt
										? '❌ Canceled'
										: `⏰ ${formatTimeFromNow(invite.expiresAt)}`}
								</span>
							</div>
							{#if invite.message}
								<p class="mt-2 text-xs text-slate-500">
									Message: <span class="font-medium text-slate-600">{invite.message}</span>
								</p>
							{/if}
							<div class="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
								<span>Created {formatDateTime(invite.createdAt)}</span>
								{#if invite.acceptedAt}
									<span class="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
										Joined as {invite.individual?.name ?? invite.individual?.email}
									</span>
								{:else if invite.cancelledAt}
									<span class="rounded-full bg-slate-100 px-2 py-1 text-slate-500">
										Canceled {formatDateTime(invite.cancelledAt)}
									</span>
								{:else}
									<form method="post" action="?/cancelInvite" class="inline">
										<input type="hidden" name="inviteId" value={invite.id} />
										<button
											type="submit"
											class="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
										>
											Cancel invite
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

