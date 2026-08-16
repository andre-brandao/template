<script lang="ts">
	import { Field, Input, Select } from '@template/ui';
	import type { Control } from '@template/ui/story';

	// Bindable because the panel edits the bag in place — that is the whole job.
	let {
		controls,
		state = $bindable({})
	}: { controls: Record<string, Control>; state?: Record<string, unknown> } = $props();

	// A checkbox reads better inline than stacked under its label.
	const row = 'flex-direction: row; align-items: center; justify-content: space-between';
</script>

<aside>
	<h3>Props</h3>
	{#each Object.entries(controls) as [name, control] (name)}
		<Field label={name} style={control.type === 'bool' ? row : undefined}>
			{#if control.type === 'select'}
				<Select
					options={control.options.map((one) => ({ value: one, label: one }))}
					value={String(state[name] ?? '')}
					onchange={(e) => (state[name] = e.currentTarget.value)}
				/>
			{:else if control.type === 'bool'}
				<input
					type="checkbox"
					checked={Boolean(state[name])}
					onchange={(e) => (state[name] = e.currentTarget.checked)}
				/>
			{:else if control.type === 'textarea'}
				<textarea
					rows="6"
					value={String(state[name] ?? '')}
					oninput={(e) => (state[name] = e.currentTarget.value)}
				></textarea>
			{:else if control.type === 'number'}
				<Input
					type="number"
					value={Number(state[name] ?? 0)}
					oninput={(e) => (state[name] = e.currentTarget.valueAsNumber)}
				/>
			{:else}
				<Input
					value={String(state[name] ?? '')}
					oninput={(e) => (state[name] = e.currentTarget.value)}
				/>
			{/if}
		</Field>
	{/each}
</aside>

<style>
	/* A column of the stage's block, not a card of its own: it draws the divider and scrolls
	   inside the height the block fixes. */
	aside {
		display: flex;
		flex-direction: column;
		gap: 0.8em;
		width: 15em;
		flex-shrink: 0;
		overflow-y: auto;
		padding: 1em;
		border-left: 1px solid var(--border);
		background: var(--surface);
	}

	h3 {
		margin: 0;
		font-family: var(--font-mono);
		font-size: 0.7em;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--dim);
	}

	textarea {
		font: inherit;
		font-family: var(--font-mono);
		font-size: 0.78em;
		resize: vertical;
		padding: 0.5em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
	}

	textarea:focus-visible {
		border-color: var(--accent);
		outline: none;
	}

	@media (max-width: 900px) {
		aside {
			width: 100%;
			border-left: none;
			border-top: 1px solid var(--border);
		}
	}
</style>
