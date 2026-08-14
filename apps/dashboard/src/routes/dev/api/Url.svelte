<script lang="ts">
	import Method from './Method.svelte';

	// Bindable because the slots edit the bag in place — that is the whole job.
	let {
		method,
		base,
		path,
		search,
		values = $bindable({})
	}: {
		method: string;
		base: string;
		path: string;
		search: string;
		values?: Record<string, string>;
	} = $props();

	// Literal chunks and `{param}` slots, so path params are typed where they land.
	const parts = $derived(path.split(/(\{\w+\})/).filter(Boolean));
	const slot = (part: string) => (part.startsWith('{') ? part.slice(1, -1) : '');
</script>

<!-- Flex, so the newlines between these segments don't render as gaps in the path. -->
<code>
	<span class="verb"><Method {method} /></span>
	<span class="base">{base}</span>
	{#each parts as part, i (i)}
		{@const name = slot(part)}
		{#if name}
			<input
				aria-label={name}
				placeholder={part}
				size={(values[name] || part).length}
				value={values[name] ?? ''}
				oninput={(e) => (values[name] = e.currentTarget.value)}
			/>
		{:else}
			<span>{part}</span>
		{/if}
	{/each}
	{#if search}<span class="query">?{search}</span>{/if}
</code>

<style>
	code {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		padding: 0.4em 0.8em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		font-family: var(--font-mono);
		font-size: 0.8em;
		overflow-x: auto;
		white-space: nowrap;
	}

	.verb {
		margin-right: 0.7em;
	}

	.base,
	.query {
		color: var(--muted);
	}

	input {
		font: inherit;
		/* Hugs its own text, placeholder included; `size` covers browsers without it. */
		field-sizing: content;
		min-width: 2ch;
		padding: 0.1em 0.3em;
		margin: 0 0.1em;
		border: 1px solid var(--border-bright);
		border-radius: 4px;
		background: var(--surface-2);
		color: var(--ink);
	}

	input::placeholder {
		color: var(--dim);
	}

	input:focus-visible {
		border-color: var(--accent);
		outline: none;
	}
</style>
