<script lang="ts">
	import type { Key } from '@template/core/key';
	import { Empty, List } from '@template/ui';
	import KeyRow from './KeyRow.svelte';

	// An App's keys sit in a section of its profile, so they take the boxed list.
	let { keys, app }: { keys: Key.Info[]; app?: string } = $props();
</script>

{#if keys.length === 0}
	<Empty>No API keys yet.</Empty>
{:else}
	<List.Root label="API keys" boxed={!!app}>
		{#each keys as key (key.id)}
			<KeyRow {key} {app} />
		{/each}
	</List.Root>
{/if}
