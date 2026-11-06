<!-- Pick one; the recommended option starts picked. "Other" takes free text as the answer. -->
<script lang="ts">
	import { Input } from '@template/ui';
	import type { Block } from '../catalog';
	import { form } from '../state.svelte';
	import Option from './Option.svelte';
	import Question from './Question.svelte';

	let { props }: Block<'Choice'> = $props();

	const ctx = form();
	const uid = $props.id();
	const key = $derived(props.name ?? '');
	const options = $derived(props.options ?? []);
	const value = $derived(ctx.values[key]);
	// Free text is any string that isn't one of the options, '' included.
	const other = $derived(
		typeof value === 'string' && !options.some((option) => option.value === value)
	);
</script>

<Question label={props.label} hint={props.hint} reason={props.reason}>
	<div class="options" role="radiogroup">
		{#each options as option (option.value)}
			<Option
				label={option.label}
				description={option.description}
				suggested={option.value === props.recommended}
			>
				<input
					type="radio"
					name={uid}
					checked={value === option.value}
					onchange={() => (ctx.values[key] = option.value)}
				/>
			</Option>
		{/each}
		<Option label="Other…">
			<input type="radio" name={uid} checked={other} onchange={() => (ctx.values[key] = '')} />
		</Option>
		{#if other}
			<Input
				aria-label="Other answer"
				value={String(value ?? '')}
				oninput={(e) => (ctx.values[key] = e.currentTarget.value)}
			/>
		{/if}
	</div>
</Question>

<style>
	.options {
		display: grid;
		gap: 0.3em;
	}
</style>
