<script module lang="ts">
	import type { Story } from '../story';
	import * as Combobox from './index';
	import Root from './Combobox.svelte';

	export const story: Story = {
		title: 'Combobox',
		blurb:
			'Composed from parts rather than configured: `Root` owns the open state and the query, and every `Item` filters itself against it. Under the root’s `narrow` breakpoint the content leaves the popover and comes up as a bottom drawer — resize the window to see it. Arrow keys walk the options that survived the query; an `Item` with `href` navigates instead of selecting.',
		of: Root
	};

	const langs = [
		{ id: 'ts', name: 'TypeScript', hint: 'structural' },
		{ id: 'rs', name: 'Rust', hint: 'affine' },
		{ id: 'ml', name: 'OCaml', hint: 'inferred' },
		{ id: 'ex', name: 'Elixir', hint: 'dynamic' },
		{ id: 'go', name: 'Go', hint: 'structural' },
		{ id: 'zg', name: 'Zig', hint: 'comptime' }
	];
</script>

<script lang="ts">
	// import { Combobox } from '@template/ui';

	let value = $state('ts');

	const current = $derived(langs.find((one) => one.id === value));
</script>

<div class="frame">
	<Combobox.Root bind:value>
		<Combobox.Trigger>
			<span class="face">{current?.name ?? 'Pick a language'}</span>
		</Combobox.Trigger>

		<Combobox.Content title="Languages">
			<Combobox.Search placeholder="Filter languages" />
			<Combobox.List label="Languages">
				{#each langs as lang (lang.id)}
					<Combobox.Item value={lang.id} label="{lang.name} {lang.hint}">
						<span class="name">{lang.name}</span>
						<span class="hint">{lang.hint}</span>
					</Combobox.Item>
				{/each}
			</Combobox.List>
			<Combobox.Empty>Nothing matches that.</Combobox.Empty>
		</Combobox.Content>
	</Combobox.Root>

	<p class="picked">selected <code>{value}</code></p>
</div>

<style>
	.frame {
		display: flex;
		align-items: center;
		gap: 1em;
	}

	.frame :global(.combobox) {
		width: 14em;
	}

	.face {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.name {
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

	.picked {
		margin: 0;
		color: var(--dim);
		font-family: var(--font-mono);
		font-size: 0.78em;
	}
</style>
