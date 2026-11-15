<!-- A date, as `YYYY-MM-DD`. -->
<script lang="ts">
	import { Input } from '@template/ui';
	import type { Block } from '../catalog';
	import { form } from '../state.svelte';
	import Question from './Question.svelte';

	let { props }: Block<'DateField'> = $props();

	const ctx = form();
	const uid = $props.id();
	const key = $derived(props.name ?? '');
	const day = $derived(String(ctx.values[key] ?? ''));
	const write = (value: string) => (ctx.values[key] = value || null);
</script>

<Question label={props.label} hint={props.hint} reason={props.reason} id={uid}>
	<Input id={uid} type="date" value={day}
		oninput={(e) => write(e.currentTarget.value)} required={props.required} />
</Question>
