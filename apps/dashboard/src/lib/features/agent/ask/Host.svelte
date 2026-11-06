<!--
	One `ask` call's form, drawn with its own catalog. The answers live here, so the parent
	hides this rather than unmounting it while the user talks about the form.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { JsonUIProvider, Renderer, type Spec } from '@json-render/svelte';
	import { build, createForm } from './state.svelte';
	import { registry } from './registry';

	let { spec, id }: { spec: Spec; id: string } = $props();

	// The spec is final once the call waits, so the form is built once.
	const ctx = untrack(() => build(spec, id));
	createForm(ctx);
</script>

<JsonUIProvider initialState={{}}>
	<Renderer spec={ctx.spec} {registry} />
</JsonUIProvider>
