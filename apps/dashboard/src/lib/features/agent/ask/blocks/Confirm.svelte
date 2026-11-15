<!-- Yes or no; the recommendation starts selected. -->
<script lang="ts">
	import type { Block } from '../catalog';
	import { form } from '../state.svelte';
	import Question from './Question.svelte';

	let { props }: Block<'Confirm'> = $props();

	const ctx = form();
	const key = $derived(props.name ?? '');
	const value = $derived(ctx.values[key]);
</script>

<Question label={props.label} hint={props.hint} reason={props.reason}>
	<div class="choices">
		{#each [true, false] as option (option)}
			<button
				type="button"
				class="choice"
				aria-pressed={value === option}
				onclick={() => (ctx.values[key] = option)}
			>
				{option ? 'Yes' : 'No'}{#if props.recommended === option}<em> · suggested</em>{/if}
			</button>
		{/each}
	</div>
</Question>

<style>
	.choices {
		display: flex;
		gap: 0.4em;
	}

	.choice {
		padding: 0.35em 0.9em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: none;
		color: var(--ink);
		font: inherit;
		font-size: 0.88em;
		cursor: pointer;
	}

	.choice[aria-pressed='true'] {
		border-color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}

	em {
		color: var(--accent);
		font-style: normal;
		font-size: 0.85em;
	}
</style>
