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
	class="mt-3 flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent-hover"
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
	<div class="mt-2 overflow-hidden rounded-lg border border-border-default bg-surface-raised">
		<table class="w-full">
			<thead class="bg-surface-subtle">
				<tr>
					<th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
						Week
					</th>
					<th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
						Effort
					</th>
					<th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
						Performance
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border-default">
				{#each sortedRatings as rating (rating.weekNumber)}
					<tr class="transition-colors hover:bg-surface-subtle/50">
						<td class="px-4 py-2.5 text-sm font-medium text-text-primary">Week {rating.weekNumber}</td>
						<td class="px-4 py-2.5 text-sm text-text-secondary">
							{#if rating.effortScore !== null}
								<span class="font-medium">{rating.effortScore}</span>
							{:else}
								<span class="text-text-muted">—</span>
							{/if}
						</td>
						<td class="px-4 py-2.5 text-sm text-text-secondary">
							{#if rating.performanceScore !== null}
								<span class="font-medium">{rating.performanceScore}</span>
							{:else}
								<span class="text-text-muted">—</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
