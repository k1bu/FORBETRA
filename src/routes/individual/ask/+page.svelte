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
			class="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
		>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			Back
		</a>
		<h1 class="text-lg font-bold text-neutral-900">Ask About Your Data</h1>
		<div class="w-12"></div>
	</div>

	{#if !data.hasActiveCycle}
		<div class="flex-1 flex items-center justify-center">
			<div class="rounded-2xl border-2 border-neutral-200 bg-neutral-50 p-8 text-center max-w-md">
				<div class="mb-3 text-4xl">💬</div>
				<p class="text-lg font-semibold text-neutral-700">No active cycle</p>
				<p class="mt-1 text-sm text-neutral-500">Start a cycle to ask questions about your development data.</p>
				<a
					href="/individual"
					class="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
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
					<p class="text-lg font-semibold text-neutral-700">Hi {data.userName}!</p>
					<p class="mt-1 text-sm text-neutral-500 max-w-sm">
						Ask me anything about your development data — patterns, trends, comparisons, or recommendations.
					</p>
					<div class="mt-6 flex flex-wrap justify-center gap-2">
						{#each suggestedQuestions as question}
							<button
								type="button"
								onclick={() => { input = question; sendMessage(); }}
								class="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
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
								? 'bg-blue-600 text-white'
								: 'border border-neutral-200 bg-white text-neutral-800'}"
						>
							{#if message.role === 'assistant' && message.content === '' && isStreaming}
								<div class="flex items-center gap-1.5">
									<div class="h-2 w-2 rounded-full bg-neutral-400 animate-pulse"></div>
									<div class="h-2 w-2 rounded-full bg-neutral-400 animate-pulse" style="animation-delay: 0.2s"></div>
									<div class="h-2 w-2 rounded-full bg-neutral-400 animate-pulse" style="animation-delay: 0.4s"></div>
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
		<div class="border-t border-neutral-200 pt-3">
			<div class="flex items-end gap-2">
				<textarea
					bind:value={input}
					onkeydown={handleKeydown}
					placeholder="Ask about your progress, patterns, or what to focus on..."
					rows="1"
					disabled={isStreaming}
					class="flex-1 resize-none rounded-xl border-2 border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-60 transition-all"
				></textarea>
				<button
					type="button"
					onclick={sendMessage}
					disabled={!input.trim() || isStreaming}
					class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-all hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19V5m0 0l-7 7m7-7l7 7" />
					</svg>
				</button>
			</div>
			<p class="mt-2 text-center text-[10px] text-neutral-400">
				AI responses are based on your actual data. Not a substitute for professional coaching.
			</p>
		</div>
	{/if}
</section>
