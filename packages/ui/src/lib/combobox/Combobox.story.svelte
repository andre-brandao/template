<script module lang="ts">
	import type { Story } from '../story';
	import Combobox from './Combobox.svelte';

	export const story: Story = {
		title: 'Combobox',
		blurb:
			'A picker over data on a `Popover`. Focus stays in the search box and ↑/↓/Home/End move `aria-activedescendant`, as in `Command`; Enter picks, Escape closes back to the trigger. Words match substrings or prefixes of successive letter and digit runs, so “g6 luna” finds `gpt-6-luna`, and the hit is marked. `group` gives sticky headers, `facet` a chip row counted against the query, `filters` extra controls beside it. The trigger opens on ↑/↓ or on any printable key, already searching for it. Rows mount only while open, and off-screen ones skip paint. `multiple` binds `values` instead: Enter (or Space, before anything is typed) toggles a row, the panel stays open with a Clear action, and the trigger shows `limit` chips then “+N”. `name` posts the pick with a form.',
		of: Combobox
	};

	// About 150 gateway ids over four providers, dated snapshots included.
	const families = {
		openai: ['gpt-6', 'gpt-6-luna', 'gpt-5.4', 'gpt-5.4-mini', 'gpt-5.4-nano', 'o5', 'o5-mini', 'gpt-4.1', 'gpt-4.1-mini', 'o4-mini'],
		anthropic: ['claude-opus-5-5', 'claude-sonnet-5', 'claude-haiku-5', 'claude-sonnet-4-5', 'claude-opus-4-1', 'claude-3-7-sonnet'],
		google: ['gemini-3-pro', 'gemini-3-flash', 'gemini-3-flash-lite', 'gemma-4-27b', 'gemini-2.5-pro', 'gemini-2.5-flash'],
		mistral: ['mistral-large-3', 'mistral-medium-3', 'codestral-3', 'ministral-8b', 'pixtral-large', 'mistral-small-3']
	};
	const dates = ['2026-03-17', '2026-01-08', '2025-11-20', '2025-09-02', '2025-06-14', '2025-04-01'];
	const ids = Object.entries(families).flatMap((entry) =>
		entry[1].flatMap((name, i) => [
			`${entry[0]}/${name}`,
			...dates.slice(0, 3 + (i % 4)).map((date) => `${entry[0]}/${name}-${date}`)
		])
	);
	const names: Record<string, string> = {
		openai: 'OpenAI',
		anthropic: 'Anthropic',
		google: 'Google',
		mistral: 'Mistral'
	};
	const vendor = (id: string) => names[id.split('/')[0]] ?? 'Other';
	const model = (id: string) => id.slice(id.indexOf('/') + 1);
</script>

<script lang="ts">
	// import { Combobox } from '@template/ui';

	let value = $state('openai/gpt-6-luna');
	let filter = $state('');
	let picks = $state(['anthropic/claude-opus-5-5', 'openai/gpt-6', 'google/gemini-3-pro']);
</script>

<div class="frame">
	<div class="pick">
	<Combobox
		items={ids}
		key={(id) => id}
		group={vendor}
		facet={vendor}
		bind:value
		bind:filter
		label="Model"
		placeholder="Search {ids.length} models"
	>
		{#snippet trigger(id)}
			{#if id}<span class="dim">{vendor(id)} ·</span> {model(id)}{/if}
		{/snippet}
		{#snippet item(id, row)}
			<span class="name">{@render row.marked(model(id))}</span>
		{/snippet}
	</Combobox>
	</div>

	<p class="picked">selected <code>{value}</code>{filter ? ` · in ${filter}` : ''}</p>
</div>

<div class="frame">
	<div class="pick">
		<Combobox
			items={ids}
			key={(id) => id}
			group={vendor}
			multiple
			bind:values={picks}
			label="Models"
			placeholder="Search {ids.length} models"
		>
			{#snippet chip(id)}{model(id)}{/snippet}
			{#snippet item(id, row)}
				<span class="name">{@render row.marked(model(id))}</span>
			{/snippet}
		</Combobox>
	</div>

	<p class="picked">multiple <code>{picks.length ? picks.join(', ') : '—'}</code></p>
</div>

<style>
	.frame {
		display: flex;
		margin-bottom: 1em;
		align-items: center;
		gap: 1em;
	}

	.pick {
		display: flex;
		width: 17em;
		font-size: 0.85em;
	}

	.dim {
		color: var(--dim);
	}

	.name {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.picked {
		margin: 0;
		color: var(--dim);
		font-family: var(--font-mono);
		font-size: 0.78em;
	}
</style>
