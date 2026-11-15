<script lang="ts">
	import type { Key } from '@template/core/key';
	import { Button, Empty } from '@template/ui';
	import List from '../List.svelte';
	import KeyRow from './KeyRow.svelte';

	let { keys, app, create }: { keys: Key.Info[]; app?: string; create: () => void } = $props();
</script>

{#if keys.length === 0}
	<Empty>
		No keys yet.
		{#snippet action()}
			<Button onclick={create}>New key</Button>
		{/snippet}
	</Empty>
{:else}
	<List>
		{#each keys as key (key.id)}
			<KeyRow {key} {app} />
		{/each}
	</List>
{/if}
