<!-- Pick any number; the recommended options start checked. -->
<script lang="ts">
	import type { Block } from '../catalog';
	import { form } from '../state.svelte';
	import Option from './Option.svelte';
	import Question from './Question.svelte';

	let { props }: Block<'MultiChoice'> = $props();

	const ctx = form();
	const key = $derived(props.name ?? '');
	const picked = $derived((ctx.values[key] as string[] | null) ?? []);

	function toggle(value: string, on: boolean) {
		ctx.values[key] = on ? [...picked, value] : picked.filter((one) => one !== value);
	}
</script>

<Question label={props.label} hint={props.hint} reason={props.reason}>
	<div class="options">
		{#each props.options ?? [] as option (option.value)}
			<Option
				label={option.label}
				description={option.description}
				suggested={props.recommended?.includes(option.value)}
			>
				<input
					type="checkbox"
					checked={picked.includes(option.value)}
					onchange={(e) => toggle(option.value, e.currentTarget.checked)}
				/>
			</Option>
		{/each}
	</div>
</Question>

<style>
	.options {
		display: grid;
		gap: 0.3em;
	}
</style>
