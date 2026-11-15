<!-- A number, with its unit after the field. -->
<script lang="ts">
	import { Input } from '@template/ui';
	import type { Block } from '../catalog';
	import { form } from '../state.svelte';
	import Question from './Question.svelte';

	let { props }: Block<'NumberField'> = $props();

	const ctx = form();
	const uid = $props.id();
	const key = $derived(props.name ?? '');
	const number = $derived(ctx.values[key] as number | null);
	// An emptied box answers null rather than 0.
	const write = (value: number | null) =>
		(ctx.values[key] = typeof value === 'number' && Number.isFinite(value) ? value : null);
</script>

<Question label={props.label} hint={props.hint} reason={props.reason} id={uid}>
	<span class="row">
		<Input
			id={uid}
			type="number"
			min={props.min ?? undefined}
			max={props.max ?? undefined}
			value={number}
			oninput={(e) => write(e.currentTarget.valueAsNumber)}
			required={props.required}
		/>
		{#if props.unit}<span class="unit">{props.unit}</span>{/if}
	</span>
</Question>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.unit {
		color: var(--muted);
		font-size: 0.85em;
	}
</style>
