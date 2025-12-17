<script lang="ts">
	type Props = {
		historicRatings: Array<{
			weekNumber: number;
			effortScore: number | null;
			performanceScore: number | null;
		}>;
	};

	const { historicRatings }: Props = $props();

	let isExpanded = $state(false);

	// Sort ratings by week number (descending - most recent first)
	const sortedRatings = $derived(
		[...historicRatings].sort((a, b) => b.weekNumber - a.weekNumber)
	);
</script>

<button
	type="button"
	onclick={() => (isExpanded = !isExpanded)}
	class="mt-3 flex items-center gap-1.5 text-xs font-medium text-blue-600 transition-colors hover:text-blue-800"
>
	<span>{isExpanded ? 'Hide' : 'Click to see'} full historic ratings</span>
	<svg
		class="h-3.5 w-3.5 transition-transform {isExpanded ? 'rotate-180' : ''}"
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
	</svg>
</button>

{#if isExpanded}
	<div class="mt-2 overflow-hidden rounded-lg border border-blue-100/50 bg-white">
		<table class="w-full">
			<thead class="bg-blue-50/30">
				<tr>
					<th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
						Week
					</th>
					<th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
						Effort
					</th>
					<th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
						Performance
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-neutral-100">
				{#each sortedRatings as rating (rating.weekNumber)}
					<tr class="transition-colors hover:bg-neutral-50/50">
						<td class="px-4 py-2.5 text-sm font-medium text-neutral-900">Week {rating.weekNumber}</td>
						<td class="px-4 py-2.5 text-sm text-neutral-700">
							{#if rating.effortScore !== null}
								<span class="font-medium">{rating.effortScore}</span>
							{:else}
								<span class="text-neutral-400">—</span>
							{/if}
						</td>
						<td class="px-4 py-2.5 text-sm text-neutral-700">
							{#if rating.performanceScore !== null}
								<span class="font-medium">{rating.performanceScore}</span>
							{:else}
								<span class="text-neutral-400">—</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
