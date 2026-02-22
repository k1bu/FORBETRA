<script lang="ts">
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

	type Message = { role: 'user' | 'assistant'; content: string };

	let messages = $state<Message[]>([]);
	let input = $state('');
	let isStreaming = $state(false);
	let scrollContainer = $state<HTMLElement | null>(null);

	const scrollToBottom = () => {
		if (scrollContainer) {
			requestAnimationFrame(() => {
				scrollContainer!.scrollTop = scrollContainer!.scrollHeight;
			});
		}
	};

	const sendMessage = async () => {
		const text = input.trim();
		if (!text || isStreaming) return;

		const userMessage: Message = { role: 'user', content: text };
		messages = [...messages, userMessage];
		input = '';
		isStreaming = true;
		scrollToBottom();

		const assistantMessage: Message = { role: 'assistant', content: '' };
		messages = [...messages, assistantMessage];

		try {
			const response = await fetch('/api/insights/ask', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messages: messages.filter((m) => m.content.length > 0) })
			});

			if (!response.ok) {
				const err = await response.json();
				messages[messages.length - 1].content = err.error || 'Something went wrong. Please try again.';
				messages = [...messages];
				isStreaming = false;
				return;
			}

			const reader = response.body?.getReader();
			const decoder = new TextDecoder();

			if (!reader) {
				messages[messages.length - 1].content = 'Failed to connect. Please try again.';
				messages = [...messages];
				isStreaming = false;
				return;
			}

			let buffer = '';
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const payload = line.slice(6).trim();
						if (payload === '[DONE]') break;
						try {
							const parsed = JSON.parse(payload);
							if (parsed.text) {
								messages[messages.length - 1].content += parsed.text;
								messages = [...messages];
								scrollToBottom();
							}
							if (parsed.error) {
								messages[messages.length - 1].content += '\n\n[Error: ' + parsed.error + ']';
								messages = [...messages];
							}
						} catch {}
					}
				}
			}
		} catch {
			messages[messages.length - 1].content = 'Network error. Please check your connection.';
			messages = [...messages];
		} finally {
			isStreaming = false;
			scrollToBottom();
		}
	};

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	};

	const suggestedQuestions = [
		'What patterns do you see in my effort scores?',
		'How does my self-assessment compare to my stakeholders?',
		'What should I focus on next week?',
		'Am I making progress toward my objective?'
	];
</script>

<section class="mx-auto flex max-w-3xl flex-col h-[calc(100vh-2rem)] p-4">
	<div class="flex items-center justify-between mb-4">
		<a
			href="/individual"
			class="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover transition-colors"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Back
		</a>
		<h1 class="text-lg font-bold text-text-primary">Ask About Your Data</h1>
		<div class="w-12"></div>
	</div>

	{#if !data.hasActiveCycle}
		<div class="flex-1 flex items-center justify-center">
			<div class="rounded-2xl border border-border-default bg-surface-raised p-8 text-center max-w-md">
				<div class="mb-3 text-4xl">💬</div>
				<p class="text-lg font-semibold text-text-secondary">No active cycle</p>
				<p class="mt-1 text-sm text-text-tertiary">Start a cycle to ask questions about your development data.</p>
				<a
					href="/individual"
					class="mt-4 inline-block rounded-lg bg-accent px-6 py-2 text-sm font-semibold text-white hover:bg-accent-hover transition-colors"
				>
					Go to Dashboard
				</a>
			</div>
		</div>
	{:else}
		<!-- Messages -->
		<div
			bind:this={scrollContainer}
			class="flex-1 overflow-y-auto space-y-4 pb-4"
		>
			{#if messages.length === 0}
				<div class="flex flex-col items-center justify-center h-full text-center">
					<div class="mb-4 text-5xl">💬</div>
					<p class="text-lg font-semibold text-text-secondary">Hi {data.userName}!</p>
					<p class="mt-1 text-sm text-text-tertiary max-w-sm">
						Ask me anything about your development data — patterns, trends, comparisons, or recommendations.
					</p>
					<div class="mt-6 flex flex-wrap justify-center gap-2">
						{#each suggestedQuestions as question}
							<button
								type="button"
								onclick={() => { input = question; sendMessage(); }}
								class="rounded-full border border-accent/20 bg-accent-muted px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-muted/80 transition-colors"
							>
								{question}
							</button>
						{/each}
					</div>
				</div>
			{:else}
				{#each messages as message}
					<div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
						<div
							class="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed {message.role === 'user'
								? 'bg-accent text-white'
								: 'border border-border-default bg-surface-raised text-text-primary'}"
						>
							{#if message.role === 'assistant' && message.content === '' && isStreaming}
								<div class="flex items-center gap-1.5">
									<div class="h-2 w-2 rounded-full bg-text-muted animate-pulse"></div>
									<div class="h-2 w-2 rounded-full bg-text-muted animate-pulse" style="animation-delay: 0.2s"></div>
									<div class="h-2 w-2 rounded-full bg-text-muted animate-pulse" style="animation-delay: 0.4s"></div>
								</div>
							{:else}
								<div class="whitespace-pre-wrap">{message.content}</div>
							{/if}
						</div>
					</div>
				{/each}
			{/if}
		</div>

		<!-- Input -->
		<div class="border-t border-border-default pt-3">
			<div class="flex items-end gap-2">
				<textarea
					bind:value={input}
					onkeydown={handleKeydown}
					placeholder="Ask about your progress, patterns, or what to focus on..."
					rows="1"
					disabled={isStreaming}
					class="flex-1 resize-none rounded-xl border border-border-default bg-surface-raised px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60 transition-all"
				></textarea>
				<button
					type="button"
					onclick={sendMessage}
					disabled={!input.trim() || isStreaming}
					class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-white transition-all hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19V5m0 0l-7 7m7-7l7 7" />
					</svg>
				</button>
			</div>
			<p class="mt-2 text-center text-[10px] text-text-muted">
				AI responses are based on your actual data. Not a substitute for professional coaching.
			</p>
		</div>
	{/if}
</section>
