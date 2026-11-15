<script module lang="ts">
	export type Action = { group: string; label: string; hint?: string; run: () => void };
</script>

<!--
	The palette shell: a modal dialog, a search box and a grouped list. Focus never leaves
	the input; arrows move `aria-activedescendant`, so typing and choosing never fight.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { HotkeysProvider } from '@tanstack/svelte-hotkeys';
	import { dialog } from '../modal/dialog';
	import { bucket, mark, step, words } from './model';

	let {
		open = $bindable(false),
		commands,
		placeholder = 'Type a command or search',
		empty = 'No matching commands',
		foot
	}: {
		open?: boolean;
		commands: Action[];
		placeholder?: string;
		empty?: string;
		/** A strip under the list, e.g. key hints. */
		foot?: Snippet;
	} = $props();

	const id = $props.id();

	let query = $state('');
	let active = $state(0);

	// Every word must match the group or label, in any order.
	const groups = $derived.by(() => {
		const list = words(query);
		return bucket(
			commands.filter((one) => mark(`${one.group} ${one.label}`, list)),
			(one) => one.group
		);
	});
	// Display order, which is what the arrow keys walk.
	const order = $derived(groups.flatMap((group) => group.items));

	function run(item: Action | undefined) {
		if (!item) return;
		open = false;
		item.run();
	}

	function keys(e: KeyboardEvent) {
		if (e.isComposing || !order.length) return;
		const next = step(e.key, active, order.length);
		if (next !== undefined) {
			e.preventDefault();
			active = next;
			return;
		}
		if (e.key !== 'Enter') return;
		e.preventDefault();
		run(order[active]);
	}
</script>

<dialog
	aria-label="Command palette"
	{@attach dialog(open)}
	onclose={() => {
		open = false;
		query = '';
		active = 0;
	}}
>
	{#if open}
		<!-- Owns the keyboard while open, so page hotkeys never fire behind the palette. -->
		<HotkeysProvider scope="command-{id}" exclusive>
		<input
			class="search"
			type="text"
			role="combobox"
			autocomplete="off"
			spellcheck="false"
			aria-expanded="true"
			aria-controls="{id}-list"
			aria-activedescendant={order.length ? `${id}-${active}` : undefined}
			{placeholder}
			bind:value={query}
			oninput={() => (active = 0)}
			onkeydown={keys}
			{@attach (el) => el.focus()}
		/>
		<div class="list" id="{id}-list" role="listbox" aria-label="Commands">
			{#each groups as group, g (group.name)}
				<div class="group" role="group" aria-labelledby="{id}-g{g}">
					<p class="name" id="{id}-g{g}">{group.name}</p>
					{#each group.items as item, i (i)}
						{@const at = order.indexOf(item)}
						<!-- Pointer only: the keyboard drives the same rows through the input. -->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div
							class="option"
							id="{id}-{at}"
							role="option"
							tabindex="-1"
							aria-selected={at === active}
							onpointermove={() => (active = at)}
							onclick={() => run(item)}
							{@attach (el) => {
								if (at === active) el.scrollIntoView({ block: 'nearest' });
							}}
						>
							<span class="label">{item.label}</span>
							{#if item.hint}<span class="hint">{item.hint}</span>{/if}
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty">{empty}</p>
			{/each}
		</div>
		{#if foot}<div class="foot">{@render foot()}</div>{/if}
		</HotkeysProvider>
	{/if}
</dialog>

<style>
	dialog {
		margin: 12vh auto auto;
		width: min(36em, calc(100vw - 2em));
		max-width: none;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) + 2px);
		background: var(--surface);
		color: var(--ink);
		box-shadow: var(--shadow-2);
		overflow: hidden;
		opacity: 0;
		scale: 0.98;
		transition:
			opacity 0.14s ease,
			scale 0.14s ease,
			display 0.14s allow-discrete,
			overlay 0.14s allow-discrete;
	}

	dialog[open] {
		opacity: 1;
		scale: 1;
	}

	@starting-style {
		dialog[open] {
			opacity: 0;
			scale: 0.98;
		}
	}

	dialog::backdrop {
		background: rgb(0 0 0 / 0.24);
	}

	.search {
		display: block;
		width: 100%;
		padding: 0.85em 1em;
		border: none;
		border-bottom: 1px solid var(--border);
		background: none;
		color: inherit;
		font: inherit;
		outline: none;
	}

	.search::placeholder {
		color: var(--dim);
	}

	.list {
		max-height: min(24em, 60vh);
		overflow-y: auto;
		padding: 0.35em;
		scroll-padding: 0.35em;
	}

	.name {
		margin: 0.55em 0.6em 0.25em;
		color: var(--dim);
		font-size: 0.75em;
		font-weight: 500;
	}

	.option {
		display: flex;
		align-items: center;
		gap: 1em;
		min-height: 2.2em;
		padding: 0.35em 0.6em;
		border-radius: var(--radius-sm);
		font-size: 0.9em;
		cursor: pointer;
	}

	.option[aria-selected='true'] {
		background: var(--hover);
	}

	.label {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.hint {
		color: var(--dim);
		font-size: 0.85em;
	}

	.empty {
		margin: 0;
		padding: 1.5em 1em;
		color: var(--dim);
		font-size: 0.9em;
		text-align: center;
	}

	.foot {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.4em 1em;
		padding: 0.5em 1em;
		border-top: 1px solid var(--border);
		color: var(--dim);
		font-size: 0.78em;
	}

	@media (prefers-reduced-motion: reduce) {
		dialog {
			scale: 1;
			transition: none;
		}
	}
</style>
