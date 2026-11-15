<!-- The `?` sheet, raised through `modal(Keys)`: every declared app key, live or not. -->
<script lang="ts">
	import { getAppHotkeyList } from '@tanstack/svelte-hotkeys';
	import { Button, Kbd } from '@template/ui';

	let { close }: { close: () => void } = $props();

	const list = getAppHotkeyList();
	const groups = $derived(
		Map.groupBy(
			list.current.filter((item) => item.appHotkey.hotkey),
			(item) => item.appHotkey.meta?.group ?? 'Other'
		)
	);
</script>

<h2>Keyboard shortcuts</h2>

{#each groups as [name, items] (name)}
	<section>
		<h3>{name}</h3>
		<dl>
			{#each items as item (item.appHotkey.id)}
				<!-- Inactive means nothing on this page binds it, not that it is broken. -->
				<div class={['row', { off: item.status === 'inactive' }]}>
					<dt>{item.appHotkey.meta?.name}</dt>
					<dd>{#if item.appHotkey.hotkey}<Kbd keys={item.appHotkey.hotkey} />{/if}</dd>
				</div>
			{/each}
		</dl>
	</section>
{/each}

<p class="note">Dimmed keys work on the pages that have them.</p>

<div class="actions"><Button onclick={() => close()}>Close</Button></div>

<style>
	h2 {
		margin: 0 0 0.75em;
		font-size: 1.05em;
		font-weight: 600;
	}

	section + section {
		margin-top: 0.75em;
	}

	h3 {
		margin: 0 0 0.25em;
		color: var(--dim);
		font-size: 0.75em;
		font-weight: 500;
	}

	dl {
		margin: 0;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
		min-height: 1.9em;
		font-size: 0.9em;
	}

	.off {
		color: var(--dim);
	}

	dd {
		margin: 0;
	}

	.note {
		margin: 1em 0 0;
		color: var(--dim);
		font-size: 0.8em;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 1.25em;
	}
</style>
