<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { addToast } from '$lib/stores/toasts.svelte';
	import {
		Settings2,
		User,
		Bell,
		Target,
		ListChecks,
		Calendar,
		Users,
		AlertTriangle,
		ChevronDown,
		ChevronUp,
		Plus,
		Trash2,
		Mail,
		Smartphone,
		Clock
	} from 'lucide-svelte';

	const { data }: { data: PageData } = $props();

	// --- Profile state ---
	let isSavingProfile = $state(false);
	let profileName = $state(data.user.name);
	let profilePhone = $state(data.user.phone);
	let profileTimezone = $state(data.user.timezone);
	let notificationTime = $state(data.user.notificationTime);
	let deliveryMethod = $state(data.user.deliveryMethod);

	// --- Objective state ---
	let isSavingObjective = $state(false);
	let objectiveTitle = $state(data.objective?.title ?? '');
	let objectiveDescription = $state(data.objective?.description ?? '');
	let showObjectiveWarning = $state(false);
	let objectivePendingSubmit: (() => void) | null = $state(null);

	// --- Subgoals state ---
	let isSavingSubgoals = $state(false);
	let subgoalForms = $state(
		data.subgoals.length > 0
			? data.subgoals.map((s) => ({ id: s.id, label: s.label, description: s.description }))
			: [{ id: '', label: '', description: '' }]
	);

	// --- Cycle state ---
	let isSavingCycle = $state(false);
	let cycleLabel = $state(data.cycle?.label ?? '');
	let cycleStartDate = $state(data.cycle?.startDate ?? new Date().toISOString().slice(0, 10));
	let cycleDurationWeeks = $state(data.cycle?.durationWeeks ?? 12);
	let checkInFrequency = $state(data.cycle?.checkInFrequency ?? 'tue,fri');
	let stakeholderCadence = $state(data.cycle?.stakeholderCadence ?? 'weekly');
	let stakeholderFeedbackTime = $state(data.cycle?.stakeholderFeedbackTime ?? '09:00');
	let revealScores = $state(data.cycle?.revealScores ?? true);

	// --- Stakeholders state ---
	let isSavingStakeholders = $state(false);
	let stakeholderForms = $state(
		data.stakeholders.length > 0
			? data.stakeholders.map((s) => ({
					id: s.id,
					name: s.name,
					email: s.email,
					relationship: s.relationship,
					phone: s.phone
				}))
			: []
	);

	// --- Section collapse state ---
	let expandedSections = $state<Record<string, boolean>>({
		profile: true,
		objective: false,
		subgoals: false,
		cycle: false,
		stakeholders: false
	});

	function toggleSection(section: string) {
		expandedSections[section] = !expandedSections[section];
	}

	// --- Sync only the saved section after update() ---
	function syncSection(section: string) {
		if (section === 'profile') {
			profileName = data.user.name;
			profilePhone = data.user.phone;
			profileTimezone = data.user.timezone;
			notificationTime = data.user.notificationTime;
			deliveryMethod = data.user.deliveryMethod;
		} else if (section === 'objective') {
			objectiveTitle = data.objective?.title ?? '';
			objectiveDescription = data.objective?.description ?? '';
		} else if (section === 'subgoals') {
			subgoalForms =
				data.subgoals.length > 0
					? data.subgoals.map((s) => ({ id: s.id, label: s.label, description: s.description }))
					: [{ id: '', label: '', description: '' }];
		} else if (section === 'cycle') {
			if (data.cycle) {
				cycleLabel = data.cycle.label;
				cycleStartDate = data.cycle.startDate;
				cycleDurationWeeks = data.cycle.durationWeeks;
				checkInFrequency = data.cycle.checkInFrequency;
				stakeholderCadence = data.cycle.stakeholderCadence;
				stakeholderFeedbackTime = data.cycle.stakeholderFeedbackTime;
				revealScores = data.cycle.revealScores;
			}
		} else if (section === 'stakeholders') {
			stakeholderForms =
				data.stakeholders.length > 0
					? data.stakeholders.map((s) => ({
							id: s.id,
							name: s.name,
							email: s.email,
							relationship: s.relationship,
							phone: s.phone
						}))
					: [];
		}
	}

	// --- Check-in day helpers ---
	const dayLabels = [
		{ key: 'mon', label: 'Mon' },
		{ key: 'tue', label: 'Tue' },
		{ key: 'wed', label: 'Wed' },
		{ key: 'thu', label: 'Thu' },
		{ key: 'fri', label: 'Fri' },
		{ key: 'sat', label: 'Sat' },
		{ key: 'sun', label: 'Sun' }
	];

	let selectedDays = $derived(checkInFrequency.split(',').filter(Boolean));

	function toggleDay(day: string) {
		const current = checkInFrequency.split(',').filter(Boolean);
		if (current.includes(day)) {
			checkInFrequency = current.filter((d) => d !== day).join(',');
		} else {
			checkInFrequency = [...current, day].join(',');
		}
	}

	// --- Stakeholder cadence helpers ---
	let cadenceType = $derived(
		stakeholderCadence.startsWith('custom:')
			? 'custom'
			: stakeholderCadence === 'biweekly'
				? 'biweekly'
				: 'weekly'
	);
	let customCadenceDays = $derived(
		stakeholderCadence.startsWith('custom:') ? stakeholderCadence.split(':')[1] : '7'
	);

	function setCadenceType(type: string) {
		if (type === 'weekly') stakeholderCadence = 'weekly';
		else if (type === 'biweekly') stakeholderCadence = 'biweekly';
		else stakeholderCadence = 'custom:7';
	}

	function setCustomDays(days: string) {
		stakeholderCadence = 'custom:' + days;
	}

	// --- Subgoal helpers ---
	function addSubgoal() {
		if (subgoalForms.length < 5) {
			subgoalForms = [...subgoalForms, { id: '', label: '', description: '' }];
		}
	}

	function removeSubgoal(index: number) {
		subgoalForms = subgoalForms.filter((_, i) => i !== index);
	}

	// --- Stakeholder helpers ---
	function addStakeholder() {
		if (stakeholderForms.length < 5) {
			stakeholderForms = [
				...stakeholderForms,
				{ id: '', name: '', email: '', relationship: '', phone: '' }
			];
		}
	}

	function removeStakeholder(index: number) {
		stakeholderForms = stakeholderForms.filter((_, i) => i !== index);
	}

	// --- Form enhance handler ---
	function enhanceHandler(section: string) {
		return () => {
			if (section === 'profile') isSavingProfile = true;
			else if (section === 'subgoals') isSavingSubgoals = true;
			else if (section === 'cycle') isSavingCycle = true;
			else if (section === 'stakeholders') isSavingStakeholders = true;

			return async ({
				result,
				update
			}: {
				result: { type: string; data?: Record<string, unknown> };
				update: () => Promise<void>;
			}) => {
				isSavingProfile = false;
				isSavingSubgoals = false;
				isSavingCycle = false;
				isSavingStakeholders = false;

				if (result.type === 'redirect') {
					addToast('Session expired — please sign in again.', 'error');
					return;
				}
				if (result.type === 'error') {
					addToast('Something went wrong. Please try again.', 'error');
					return;
				}
				if (result.type === 'failure' && result.data?.error) {
					addToast(result.data.error as string, 'error');
					return;
				}
				if (result.type === 'success' && result.data?.success) {
					addToast(result.data.message as string, 'success');
				}
				await update();
				syncSection(section);
			};
		};
	}

	// --- Objective change detection ---
	let objectiveChanged = $derived(
		data.objective &&
			(objectiveTitle !== data.objective.title ||
				objectiveDescription !== data.objective.description)
	);

	const timezones = [
		'America/New_York',
		'America/Chicago',
		'America/Denver',
		'America/Los_Angeles',
		'America/Anchorage',
		'Pacific/Honolulu',
		'Europe/London',
		'Europe/Paris',
		'Europe/Berlin',
		'Asia/Tokyo',
		'Asia/Shanghai',
		'Asia/Kolkata',
		'Australia/Sydney',
		'Pacific/Auckland'
	];
</script>

<svelte:head>
	<title>Settings | Forbetra</title>
</svelte:head>

<!-- Objective Change Warning Modal -->
{#if showObjectiveWarning}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="objective-warning-title"
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				showObjectiveWarning = false;
				objectivePendingSubmit = null;
			}
		}}
	>
		<div
			class="w-full max-w-md rounded-2xl border border-warning/30 bg-surface-raised p-6 shadow-xl"
		>
			<div class="mb-4 flex items-center gap-3">
				<div class="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
					<AlertTriangle class="h-5 w-5 text-warning" />
				</div>
				<h3 id="objective-warning-title" class="text-lg font-bold text-text-primary">
					Change Objective?
				</h3>
			</div>
			<p class="mb-2 text-sm text-text-secondary">
				Changing your objective is a significant decision. This change will be:
			</p>
			<ul class="mb-4 space-y-1.5 text-sm text-text-secondary">
				<li class="flex items-start gap-2">
					<span class="mt-0.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-warning"></span>
					Recorded in your progress history with a timestamp
				</li>
				<li class="flex items-start gap-2">
					<span class="mt-0.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-warning"></span>
					Visible as a milestone marker in your data visualizations
				</li>
				<li class="flex items-start gap-2">
					<span class="mt-0.5 block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-warning"></span>
					Noted by your coach (if applicable) and stakeholders
				</li>
			</ul>
			<p class="mb-6 text-xs text-text-muted">
				Your existing check-in data and stakeholder feedback will be preserved. Only the objective
				title and description will change.
			</p>
			<div class="flex justify-end gap-3">
				<button
					type="button"
					onclick={() => {
						showObjectiveWarning = false;
						objectivePendingSubmit = null;
					}}
					class="rounded-xl border border-border-default bg-surface-raised px-5 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-surface-subtle"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={() => {
						showObjectiveWarning = false;
						if (objectivePendingSubmit) {
							objectivePendingSubmit();
							objectivePendingSubmit = null;
						}
					}}
					class="rounded-xl bg-warning px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-warning/90"
				>
					Confirm Change
				</button>
			</div>
		</div>
	</div>
{/if}

<section class="mx-auto flex max-w-2xl flex-col gap-4 p-4 pb-12">
	<header>
		<div class="flex items-center gap-2">
			<Settings2 class="h-5 w-5 text-accent" />
			<h1 class="text-2xl font-bold text-text-primary">Settings</h1>
		</div>
		<p class="mt-1 text-sm text-text-secondary">Manage your profile, program, and preferences.</p>
	</header>

	<!-- ============ PROFILE & NOTIFICATIONS ============ -->
	<div class="rounded-2xl border border-border-default bg-surface-raised">
		<button
			type="button"
			onclick={() => toggleSection('profile')}
			aria-expanded={expandedSections.profile}
			class="flex w-full items-center justify-between p-5 text-left"
		>
			<div class="flex items-center gap-2">
				<User class="h-4 w-4 text-accent" />
				<h2 class="text-sm font-semibold tracking-wide text-text-tertiary uppercase">
					Profile & Notifications
				</h2>
			</div>
			{#if expandedSections.profile}
				<ChevronUp class="h-4 w-4 text-text-muted" />
			{:else}
				<ChevronDown class="h-4 w-4 text-text-muted" />
			{/if}
		</button>

		{#if expandedSections.profile}
			<form
				method="POST"
				action="?/updateProfile"
				use:enhance={enhanceHandler('profile')}
				class="border-t border-border-default p-5"
			>
				<div class="space-y-4">
					<div>
						<label for="name" class="mb-1.5 block text-sm font-medium text-text-secondary"
							>Display Name</label
						>
						<input
							id="name"
							name="name"
							type="text"
							bind:value={profileName}
							required
							class="w-full rounded-xl border border-border-default bg-surface-subtle px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
						/>
					</div>

					<div>
						<label for="email" class="mb-1.5 block text-sm font-medium text-text-secondary"
							>Email</label
						>
						<input
							id="email"
							type="email"
							value={data.user.email}
							disabled
							class="w-full rounded-xl border border-border-default bg-surface-subtle px-4 py-2.5 text-sm text-text-muted"
						/>
						<p class="mt-1 text-xs text-text-muted">Managed through your login provider.</p>
					</div>

					<div>
						<label for="phone" class="mb-1.5 block text-sm font-medium text-text-secondary"
							>Phone <span class="text-text-muted">(optional)</span></label
						>
						<input
							id="phone"
							name="phone"
							type="tel"
							bind:value={profilePhone}
							class="w-full rounded-xl border border-border-default bg-surface-subtle px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
						/>
					</div>

					<div>
						<label for="timezone" class="mb-1.5 block text-sm font-medium text-text-secondary"
							>Timezone</label
						>
						<select
							id="timezone"
							name="timezone"
							bind:value={profileTimezone}
							class="w-full rounded-xl border border-border-default bg-surface-subtle px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
						>
							<option value="">Auto-detect</option>
							{#each timezones as tz (tz)}
								<option value={tz}>{tz.replace(/_/g, ' ')}</option>
							{/each}
						</select>
					</div>

					<!-- Notification Preferences -->
					<div class="border-t border-border-default pt-4">
						<div class="mb-3 flex items-center gap-2">
							<Bell class="h-4 w-4 text-accent" />
							<span class="text-sm font-semibold text-text-tertiary">NOTIFICATIONS</span>
						</div>

						<div class="space-y-3">
							<div>
								<label
									for="notificationTime"
									class="mb-1.5 block text-sm font-medium text-text-secondary"
									>Notification Time</label
								>
								<div class="flex items-center gap-3">
									<Clock class="h-4 w-4 text-text-muted" />
									<input
										id="notificationTime"
										name="notificationTime"
										type="time"
										bind:value={notificationTime}
										class="w-40 rounded-xl border border-border-default bg-surface-subtle px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
									/>
								</div>
							</div>

							<div>
								<p class="mb-1.5 text-sm font-medium text-text-secondary">Delivery Method</p>
								<div class="flex gap-2">
									<button
										type="button"
										onclick={() => (deliveryMethod = 'email')}
										class="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors {deliveryMethod ===
										'email'
											? 'border-accent bg-accent/10 text-accent'
											: 'border-border-default bg-surface-subtle text-text-secondary hover:border-border-strong'}"
									>
										<Mail class="h-4 w-4" />
										Email
									</button>
									<button
										type="button"
										onclick={() => (deliveryMethod = 'sms')}
										class="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors {deliveryMethod ===
										'sms'
											? 'border-accent bg-accent/10 text-accent'
											: 'border-border-default bg-surface-subtle text-text-secondary hover:border-border-strong'}"
									>
										<Smartphone class="h-4 w-4" />
										SMS
									</button>
									<button
										type="button"
										onclick={() => (deliveryMethod = 'both')}
										class="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors {deliveryMethod ===
										'both'
											? 'border-accent bg-accent/10 text-accent'
											: 'border-border-default bg-surface-subtle text-text-secondary hover:border-border-strong'}"
									>
										<Mail class="h-4 w-4" />
										Both
									</button>
								</div>
								<input type="hidden" name="deliveryMethod" value={deliveryMethod} />
							</div>
						</div>
					</div>
				</div>

				<div class="mt-5 flex justify-end">
					<button
						type="submit"
						disabled={isSavingProfile}
						class="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
					>
						{#if isSavingProfile}
							<span class="inline-flex items-center gap-2">
								<span
									class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
								></span>
								Saving...
							</span>
						{:else}
							Save Profile
						{/if}
					</button>
				</div>
			</form>
		{/if}
	</div>

	<!-- ============ OBJECTIVE ============ -->
	{#if data.objective}
		<div class="rounded-2xl border border-border-default bg-surface-raised">
			<button
				type="button"
				onclick={() => toggleSection('objective')}
				aria-expanded={expandedSections.objective}
				class="flex w-full items-center justify-between p-5 text-left"
			>
				<div class="flex items-center gap-2">
					<Target class="h-4 w-4 text-accent" />
					<h2 class="text-sm font-semibold tracking-wide text-text-tertiary uppercase">
						Objective
					</h2>
				</div>
				{#if expandedSections.objective}
					<ChevronUp class="h-4 w-4 text-text-muted" />
				{:else}
					<ChevronDown class="h-4 w-4 text-text-muted" />
				{/if}
			</button>

			{#if expandedSections.objective}
				<form
					method="POST"
					action="?/updateObjective"
					use:enhance={() => {
						isSavingObjective = true;
						return async ({
							result,
							update
						}: {
							result: { type: string; data?: Record<string, unknown> };
							update: () => Promise<void>;
						}) => {
							isSavingObjective = false;
							if (result.type === 'redirect') {
								addToast('Session expired — please sign in again.', 'error');
								return;
							}
							if (result.type === 'error') {
								addToast('Something went wrong. Please try again.', 'error');
								return;
							}
							if (result.type === 'failure' && result.data?.error) {
								addToast(result.data.error as string, 'error');
								return;
							}
							if (result.type === 'success' && result.data?.success) {
								addToast(result.data.message as string, 'success');
							}
							await update();
							syncSection('objective');
						};
					}}
					id="objectiveForm"
					class="border-t border-border-default p-5"
				>
					<input type="hidden" name="objectiveId" value={data.objective.id} />

					{#if objectiveChanged}
						<div
							class="mb-4 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3"
						>
							<AlertTriangle class="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
							<p class="text-sm text-warning">
								Changing your objective is a significant decision. This change will be recorded and
								reflected in your progress data.
							</p>
						</div>
					{/if}

					<div class="space-y-4">
						<div>
							<label
								for="objectiveTitle"
								class="mb-1.5 block text-sm font-medium text-text-secondary">Objective Title</label
							>
							<input
								id="objectiveTitle"
								name="title"
								type="text"
								bind:value={objectiveTitle}
								required
								class="w-full rounded-xl border border-border-default bg-surface-subtle px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
							/>
						</div>

						<div>
							<label
								for="objectiveDescription"
								class="mb-1.5 block text-sm font-medium text-text-secondary"
								>Description <span class="text-text-muted">(optional)</span></label
							>
							<textarea
								id="objectiveDescription"
								name="description"
								bind:value={objectiveDescription}
								rows="3"
								class="w-full rounded-xl border border-border-default bg-surface-subtle px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
							></textarea>
						</div>
					</div>

					<div class="mt-5 flex justify-end">
						{#if isSavingObjective}
							<button
								type="button"
								disabled
								class="cursor-not-allowed rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white opacity-60"
							>
								<span class="inline-flex items-center gap-2">
									<span
										class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
									></span>
									Saving...
								</span>
							</button>
						{:else if objectiveChanged}
							<button
								type="button"
								onclick={() => {
									const formEl = document.getElementById('objectiveForm') as HTMLFormElement;
									showObjectiveWarning = true;
									objectivePendingSubmit = () => {
										formEl.requestSubmit();
									};
								}}
								class="rounded-xl bg-warning px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-warning/90"
							>
								Update Objective
							</button>
						{:else}
							<button
								type="submit"
								disabled
								class="cursor-not-allowed rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white opacity-60"
							>
								No Changes
							</button>
						{/if}
					</div>
				</form>
			{/if}
		</div>

		<!-- ============ SUB-OBJECTIVES ============ -->
		<div class="rounded-2xl border border-border-default bg-surface-raised">
			<button
				type="button"
				onclick={() => toggleSection('subgoals')}
				aria-expanded={expandedSections.subgoals}
				class="flex w-full items-center justify-between p-5 text-left"
			>
				<div class="flex items-center gap-2">
					<ListChecks class="h-4 w-4 text-accent" />
					<h2 class="text-sm font-semibold tracking-wide text-text-tertiary uppercase">
						Sub-Objectives
					</h2>
					<span class="text-xs text-text-muted">({subgoalForms.length})</span>
				</div>
				{#if expandedSections.subgoals}
					<ChevronUp class="h-4 w-4 text-text-muted" />
				{:else}
					<ChevronDown class="h-4 w-4 text-text-muted" />
				{/if}
			</button>

			{#if expandedSections.subgoals}
				<form
					method="POST"
					action="?/updateSubgoals"
					use:enhance={enhanceHandler('subgoals')}
					class="border-t border-border-default p-5"
				>
					<input type="hidden" name="objectiveId" value={data.objective.id} />

					<div class="space-y-4">
						{#each subgoalForms as subgoal, index (subgoal.id || index)}
							<div class="rounded-xl border border-border-default bg-surface-subtle p-4">
								<div class="mb-3 flex items-center justify-between">
									<span class="text-xs font-semibold tracking-wide text-text-muted uppercase"
										>Sub-objective {index + 1}</span
									>
									{#if subgoalForms.length > 1}
										<button
											type="button"
											onclick={() => removeSubgoal(index)}
											class="text-text-muted transition-colors hover:text-error"
										>
											<Trash2 class="h-4 w-4" />
										</button>
									{/if}
								</div>
								<input type="hidden" name={`subgoalId${index + 1}`} value={subgoal.id} />
								<div class="space-y-2">
									<input
										name={`subgoalLabel${index + 1}`}
										type="text"
										placeholder="Label"
										bind:value={subgoal.label}
										required
										class="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
									/>
									<input
										name={`subgoalDescription${index + 1}`}
										type="text"
										placeholder="Description (optional)"
										bind:value={subgoal.description}
										class="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
									/>
								</div>
							</div>
						{/each}

						{#if subgoalForms.length < 5}
							<button
								type="button"
								onclick={addSubgoal}
								class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-default py-3 text-sm font-medium text-text-muted transition-colors hover:border-accent hover:text-accent"
							>
								<Plus class="h-4 w-4" />
								Add Sub-Objective
							</button>
						{/if}
					</div>

					<div class="mt-5 flex justify-end">
						<button
							type="submit"
							disabled={isSavingSubgoals}
							class="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
						>
							{#if isSavingSubgoals}
								<span class="inline-flex items-center gap-2">
									<span
										class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
									></span>
									Saving...
								</span>
							{:else}
								Save Sub-Objectives
							{/if}
						</button>
					</div>
				</form>
			{/if}
		</div>

		<!-- ============ CYCLE & SCHEDULE ============ -->
		{#if data.cycle}
			<div class="rounded-2xl border border-border-default bg-surface-raised">
				<button
					type="button"
					onclick={() => toggleSection('cycle')}
					aria-expanded={expandedSections.cycle}
					class="flex w-full items-center justify-between p-5 text-left"
				>
					<div class="flex items-center gap-2">
						<Calendar class="h-4 w-4 text-accent" />
						<h2 class="text-sm font-semibold tracking-wide text-text-tertiary uppercase">
							Cycle & Schedule
						</h2>
					</div>
					{#if expandedSections.cycle}
						<ChevronUp class="h-4 w-4 text-text-muted" />
					{:else}
						<ChevronDown class="h-4 w-4 text-text-muted" />
					{/if}
				</button>

				{#if expandedSections.cycle}
					<form
						method="POST"
						action="?/updateCycle"
						use:enhance={enhanceHandler('cycle')}
						class="border-t border-border-default p-5"
					>
						<input type="hidden" name="cycleId" value={data.cycle.id} />

						<div class="space-y-5">
							<!-- Cycle basics -->
							<div class="grid gap-4 sm:grid-cols-2">
								<div>
									<label
										for="cycleLabel"
										class="mb-1.5 block text-sm font-medium text-text-secondary">Cycle Name</label
									>
									<input
										id="cycleLabel"
										name="label"
										type="text"
										bind:value={cycleLabel}
										class="w-full rounded-xl border border-border-default bg-surface-subtle px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
									/>
								</div>
								<div>
									<label
										for="cycleStartDate"
										class="mb-1.5 block text-sm font-medium text-text-secondary">Start Date</label
									>
									<input
										id="cycleStartDate"
										name="startDate"
										type="date"
										bind:value={cycleStartDate}
										class="w-full rounded-xl border border-border-default bg-surface-subtle px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
									/>
								</div>
							</div>

							<div>
								<label
									for="durationWeeks"
									class="mb-1.5 block text-sm font-medium text-text-secondary"
									>Duration (weeks)</label
								>
								<select
									id="durationWeeks"
									name="durationWeeks"
									bind:value={cycleDurationWeeks}
									class="w-40 rounded-xl border border-border-default bg-surface-subtle px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
								>
									{#each [4, 6, 8, 10, 12, 16, 20, 26] as w (w)}
										<option value={w}>{w} weeks</option>
									{/each}
								</select>
							</div>

							<!-- Check-in Days -->
							<div class="border-t border-border-default pt-4">
								<p class="mb-2 text-sm font-medium text-text-secondary">Check-In Days</p>
								<div class="flex flex-wrap gap-2">
									{#each dayLabels as { key, label } (key)}
										<button
											type="button"
											onclick={() => toggleDay(key)}
											class="rounded-full border px-4 py-2 text-sm font-medium transition-colors {selectedDays.includes(
												key
											)
												? 'border-accent bg-accent/10 text-accent'
												: 'border-border-default bg-surface-subtle text-text-muted hover:border-border-strong'}"
										>
											{label}
										</button>
									{/each}
								</div>
								<input type="hidden" name="checkInFrequency" value={checkInFrequency} />
							</div>

							<!-- Stakeholder Cadence -->
							<div class="border-t border-border-default pt-4">
								<p class="mb-2 text-sm font-medium text-text-secondary">
									Stakeholder Feedback Cadence
								</p>
								<div class="flex flex-wrap gap-2">
									{#each [{ key: 'weekly', label: 'Weekly' }, { key: 'biweekly', label: 'Every 2 weeks' }, { key: 'custom', label: 'Custom' }] as { key, label } (key)}
										<button
											type="button"
											onclick={() => setCadenceType(key)}
											class="rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors {cadenceType ===
											key
												? 'border-accent bg-accent/10 text-accent'
												: 'border-border-default bg-surface-subtle text-text-muted hover:border-border-strong'}"
										>
											{label}
										</button>
									{/each}
								</div>

								{#if cadenceType === 'custom'}
									<div class="mt-3 flex items-center gap-2">
										<span class="text-sm text-text-secondary">Every</span>
										<input
											type="number"
											min="3"
											max="30"
											value={customCadenceDays}
											oninput={(e) => setCustomDays(e.currentTarget.value)}
											class="w-20 rounded-lg border border-border-default bg-surface-subtle px-3 py-2 text-center text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
										/>
										<span class="text-sm text-text-secondary">days</span>
									</div>
								{/if}
								<input type="hidden" name="stakeholderCadence" value={stakeholderCadence} />
							</div>

							<!-- Feedback Time -->
							<div class="flex items-center gap-3">
								<Clock class="h-4 w-4 text-text-muted" />
								<div>
									<label
										for="stakeholderFeedbackTime"
										class="text-sm font-medium text-text-secondary">Feedback Request Time</label
									>
									<input
										id="stakeholderFeedbackTime"
										name="stakeholderFeedbackTime"
										type="time"
										bind:value={stakeholderFeedbackTime}
										class="ml-3 w-36 rounded-xl border border-border-default bg-surface-subtle px-4 py-2 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
									/>
								</div>
							</div>

							<!-- Reveal Scores -->
							<label
								class="flex cursor-pointer items-center gap-3 rounded-xl border border-border-default bg-surface-subtle px-4 py-3"
							>
								<input
									type="checkbox"
									bind:checked={revealScores}
									class="rounded text-accent focus:ring-accent"
								/>
								<div>
									<span class="text-sm font-medium text-text-primary"
										>Show scores to stakeholders</span
									>
									<p class="text-xs text-text-muted">
										Stakeholders can see your self-reported scores alongside their own.
									</p>
								</div>
							</label>
							<input type="hidden" name="revealScores" value={revealScores ? 'true' : 'false'} />
						</div>

						<div class="mt-5 flex justify-end">
							<button
								type="submit"
								disabled={isSavingCycle}
								class="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
							>
								{#if isSavingCycle}
									<span class="inline-flex items-center gap-2">
										<span
											class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
										></span>
										Saving...
									</span>
								{:else}
									Save Schedule
								{/if}
							</button>
						</div>
					</form>
				{/if}
			</div>
		{/if}

		<!-- ============ STAKEHOLDERS ============ -->
		<div class="rounded-2xl border border-border-default bg-surface-raised">
			<button
				type="button"
				onclick={() => toggleSection('stakeholders')}
				aria-expanded={expandedSections.stakeholders}
				class="flex w-full items-center justify-between p-5 text-left"
			>
				<div class="flex items-center gap-2">
					<Users class="h-4 w-4 text-accent" />
					<h2 class="text-sm font-semibold tracking-wide text-text-tertiary uppercase">
						Stakeholders
					</h2>
					<span class="text-xs text-text-muted">({stakeholderForms.length})</span>
				</div>
				{#if expandedSections.stakeholders}
					<ChevronUp class="h-4 w-4 text-text-muted" />
				{:else}
					<ChevronDown class="h-4 w-4 text-text-muted" />
				{/if}
			</button>

			{#if expandedSections.stakeholders}
				<form
					method="POST"
					action="?/updateStakeholders"
					use:enhance={enhanceHandler('stakeholders')}
					class="border-t border-border-default p-5"
				>
					<input type="hidden" name="objectiveId" value={data.objective.id} />

					<div class="space-y-4">
						{#each stakeholderForms as stakeholder, index (stakeholder.id || index)}
							<div class="rounded-xl border border-border-default bg-surface-subtle p-4">
								<div class="mb-3 flex items-center justify-between">
									<span class="text-xs font-semibold tracking-wide text-text-muted uppercase"
										>Stakeholder {index + 1}</span
									>
									<button
										type="button"
										onclick={() => removeStakeholder(index)}
										class="text-text-muted transition-colors hover:text-error"
									>
										<Trash2 class="h-4 w-4" />
									</button>
								</div>
								<input type="hidden" name={`stakeholderId${index + 1}`} value={stakeholder.id} />
								<div class="grid gap-2 sm:grid-cols-2">
									<input
										name={`stakeholderName${index + 1}`}
										type="text"
										placeholder="Name"
										bind:value={stakeholder.name}
										required
										class="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
									/>
									<input
										name={`stakeholderEmail${index + 1}`}
										type="email"
										placeholder="Email"
										bind:value={stakeholder.email}
										required
										class="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
									/>
									<input
										name={`stakeholderRelationship${index + 1}`}
										type="text"
										placeholder="Relationship (optional)"
										bind:value={stakeholder.relationship}
										class="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
									/>
									<input
										name={`stakeholderPhone${index + 1}`}
										type="tel"
										placeholder="Phone (optional)"
										bind:value={stakeholder.phone}
										class="w-full rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none"
									/>
								</div>
							</div>
						{/each}

						{#if stakeholderForms.length < 5}
							<button
								type="button"
								onclick={addStakeholder}
								class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-default py-3 text-sm font-medium text-text-muted transition-colors hover:border-accent hover:text-accent"
							>
								<Plus class="h-4 w-4" />
								Add Stakeholder
							</button>
						{/if}

						{#if stakeholderForms.length === 0}
							<p class="py-4 text-center text-sm text-text-muted">
								No stakeholders added yet. Add someone to get external feedback on your progress.
							</p>
						{/if}
					</div>

					<div class="mt-5 flex justify-end">
						<button
							type="submit"
							disabled={isSavingStakeholders}
							class="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
						>
							{#if isSavingStakeholders}
								<span class="inline-flex items-center gap-2">
									<span
										class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
									></span>
									Saving...
								</span>
							{:else}
								Save Stakeholders
							{/if}
						</button>
					</div>
				</form>
			{/if}
		</div>
	{:else}
		<div class="rounded-2xl border border-border-default bg-surface-raised p-6 text-center">
			<Target class="mx-auto mb-3 h-8 w-8 text-text-muted" />
			<p class="text-sm text-text-secondary">
				No active objective found. Complete onboarding to set up your program.
			</p>
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href="/onboarding"
				class="mt-3 inline-block rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
			>
				Start Onboarding
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</div>
	{/if}
</section>
