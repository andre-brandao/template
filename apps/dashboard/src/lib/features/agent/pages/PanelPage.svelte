<!-- One saved panel, its blocks querying as the viewer. -->
<script lang="ts">
	import { createQuery, useQueryClient } from '@tanstack/svelte-query';
	import { Button, Issue, Skeleton } from '@template/ui';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import * as Header from '#lib/components/header/index.ts';
	import { fmt } from '#lib/utils/fmt.ts';
	import { panel } from '../api/panel.query';
	import Render from '../panel/Render.svelte';

	let { id }: { id: string } = $props();

	const one = createQuery(() => panel(id));
	const client = useQueryClient();
	const f = fmt();
	// Rows are cached for a minute; this reruns every block's SQL now.
	const rerun = () => client.invalidateQueries({ queryKey: ['rows'] });
</script>

{#snippet back()}<a href="/settings/panels">Panels</a>{/snippet}

{#snippet actions()}
	<Button onclick={rerun}>
		<RotateCcw size={14} strokeWidth={1.75} />
		Refresh
	</Button>
{/snippet}

{#if one.isSuccess}
	<Header.Root title={one.data.title} eyebrow={back} {actions}>
		<Header.Item label="Author">{one.data.author || 'Unknown'}</Header.Item>
		<Header.Item label="Updated">
			<span title={f.stamp(one.data.timeUpdated)}>{f.ago(one.data.timeUpdated)}</span>
		</Header.Item>
	</Header.Root>
	<Render spec={one.data.spec} />
{:else}
	<Header.Root title="Panel" eyebrow={back} />
	{#if one.isError}
		<Issue>{one.error.message}</Issue>
	{:else}
		<Skeleton h="12em" />
	{/if}
{/if}
