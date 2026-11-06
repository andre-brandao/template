<!-- Free text, prefilled with the suggestion. -->
<script lang="ts">
	import { Input } from '@template/ui';
	import type { Block } from '../catalog';
	import { form } from '../state.svelte';
	import Question from './Question.svelte';

	let { props }: Block<'TextField'> = $props();

	const ctx = form();
	const uid = $props.id();
	const key = $derived(props.name ?? '');
	const text = $derived(String(ctx.values[key] ?? ''));
	const write = (value: string) => (ctx.values[key] = value);
</script>

<Question label={props.label} hint={props.hint} reason={props.reason} id={uid}>
	{#if props.multiline}
		<textarea
			id={uid}
			rows={4}
			bind:value={() => text, write}
			placeholder={props.placeholder ?? undefined}
			required={props.required}
		></textarea>
	{:else}
		<Input
			id={uid}
			value={text}
			oninput={(e) => write(e.currentTarget.value)}
			placeholder={props.placeholder ?? undefined}
			required={props.required}
		/>
	{/if}
</Question>

<style>
	textarea {
		min-width: 0;
		padding: 0.5em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
		resize: vertical;
	}
</style>
