<!-- A date, as `YYYY-MM-DD`. -->
<script lang="ts">
	import { DatePicker } from '@template/ui';
	import type { Block } from '../catalog';
	import { form } from '../state.svelte';
	import Question from './Question.svelte';

	let { props }: Block<'DateField'> = $props();

	const ctx = form();
	const key = $derived(props.name ?? '');
</script>

<Question label={props.label} hint={props.hint} reason={props.reason}>
	<DatePicker
		bind:value={
			() => (ctx.values[key] ? String(ctx.values[key]) : undefined),
			(next) => (ctx.values[key] = next ?? null)
		}
		label={props.label}
		clearable={!props.required}
	/>
</Question>
