<script lang="ts">
	type InviteStatus = 'invalid' | 'expired' | 'cancelled' | 'accepted' | 'valid';

	type PageData = {
		status: InviteStatus;
		token?: string;
		invite: {
			id: string;
			email: string;
			name: string | null;
			message: string | null;
			coach: {
				id: string;
				name: string;
				email: string;
			};
			expiresAt: string;
			acceptedAt: string | null;
			cancelledAt: string | null;
			createdAt: string;
			individualId: string | null;
		} | null;
		user: {
			id: string;
			email: string;
			role: string;
			name: string | null;
		} | null;
	};

	type ActionState = {
		success?: boolean;
		error?: string;
	};

	const { data, form }: { data: PageData; form: ActionState | null } = $props();

	const formatDate = (value: string | null | undefined) => {
		if (!value) return '—';
		return new Intl.DateTimeFormat('en-US', {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	};

	const ctaMessage = () => {
		if (data.status === 'invalid') return 'This invitation link is invalid.';
		if (data.status === 'expired') return 'This invitation has expired.';
		if (data.status === 'cancelled') return 'This invitation has been cancelled.';
		if (data.status === 'accepted') return 'This invitation has already been accepted.';
		return null;
	};
	
	const showAcceptForm = () => {
		if (data.status !== 'valid') return false;
		if (!data.user) return false;
		if (data.user.role !== 'INDIVIDUAL') return false;
		if (form?.success) return false;
		return true;
	};
</script>

<section class="mx-auto flex min-h-[70vh] max-w-3xl flex-col gap-6 px-4 py-12">
	<header class="space-y-2 text-center">
		<h1 class="text-3xl font-semibold text-slate-900">Join your coach</h1>
		{#if data.invite}
			<p class="text-sm text-slate-500">
				{data.invite.coach.name} has invited you to collaborate in FORBETRA.
			</p>
		{:else}
			<p class="text-sm text-slate-500">We couldn’t find this invitation.</p>
		{/if}
	</header>

	{#if ctaMessage()}
		<div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
			{ctaMessage()}
		</div>
	{/if}

	{#if data.invite}
		<section class="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
			<div class="space-y-2">
				<p class="text-xs uppercase tracking-[0.35em] text-slate-400">Invitation details</p>
				<p class="text-sm text-slate-500">
					Sent to <span class="font-semibold text-slate-700">{data.invite.email}</span> · Expires{' '}
					{formatDate(data.invite.expiresAt)}
				</p>
				{#if data.invite.message}
					<div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
						<p class="font-semibold text-slate-700">Message from your coach</p>
						<p class="text-xs text-slate-500">{data.invite.message}</p>
					</div>
				{/if}
			</div>

			<section class="space-y-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
				<p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Coach</p>
				<p class="text-lg font-semibold text-slate-900">{data.invite.coach.name}</p>
				<p class="text-sm text-slate-500">{data.invite.coach.email}</p>
			</section>

			{#if !data.user}
				<div class="space-y-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
					<div>
						<p class="font-semibold text-blue-800">Almost there</p>
						<p>
							Sign in or create an account to accept this invitation. Use the email above if your coach
							asked you to.
						</p>
					</div>
					<div class="flex flex-wrap gap-2">
						<a
							href="/sign-in"
							class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
						>
							Sign in
						</a>
						<a
							href="/sign-up"
							class="inline-flex items-center justify-center rounded-lg border border-blue-500 px-4 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
						>
							Create account
						</a>
					</div>
				</div>
			{:else if data.user.role !== 'INDIVIDUAL'}
				<div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					<p class="font-semibold text-red-800">Role not supported</p>
					<p>
						This invitation links an individual account with a coach. You’re currently signed in as a
						{data.user.role.toLowerCase()}. Please use an individual account.
					</p>
				</div>
			{/if}

			{#if form?.error}
				<div class="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
					{form.error}
				</div>
			{/if}

			{#if form?.success}
				<div class="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
					<p class="font-semibold text-emerald-800">You’re connected!</p>
					<p>
						We’ve linked your account with {data.invite.coach.name}. Return to your
						<a href="/dashboard" class="font-semibold text-emerald-900 underline"> dashboard</a> to keep going.
					</p>
				</div>
			{/if}

			{#if showAcceptForm()}
				<form method="post" action="?/accept" class="space-y-4">
					<input type="hidden" name="token" value={data.token} />
					<button
						type="submit"
						class="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
					>
						Accept invitation
					</button>
					<p class="text-center text-xs text-slate-400">
						Need help? Reach out to {data.invite.coach.email}.
					</p>
				</form>
			{:else if data.status === 'valid' && !form?.success}
				<div class="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
					{#if !data.user}
						<p>
							Please sign in first. Use the button in the top-right corner to log in with the email your coach invited.
						</p>
					{:else if data.user.role !== 'INDIVIDUAL'}
						<p>
							Switch to an individual account to accept this invitation.
						</p>
					{/if}
				</div>
			{/if}
		</section>
	{/if}
</section>

