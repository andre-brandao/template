<script lang="ts">
	import { toast } from '@template/ui';
	import { cli, curl, fetch as js, sdk } from './snippets';

	let {
		input
	}: { input: Parameters<typeof curl>[0] } = $props();

	const builders = { curl, fetch: js, sdk, cli };
	type Kind = keyof typeof builders;

	let kind = $state<Kind>('curl');
	const text = $derived(builders[kind](input));

	async function copy() {
		await navigator.clipboard.writeText(text);
		toast.success(`${kind} copied`);
	}
</script>

<section>
	<div class="head">
		<div class="tabs">
			{#each Object.keys(builders) as one (one)}
				<button class="tab" class:active={kind === one} onclick={() => (kind = one as Kind)}>
					{one}
				</button>
			{/each}
		</div>
		<button class="copy" onclick={copy}>Copy</button>
	</div>
	<pre>{text}</pre>
</section>

<style>
	section {
		margin-top: 2em;
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.6em;
	}

	.copy {
		font-family: var(--font-mono);
		font-size: 0.75em;
		padding: 0.4em 0.8em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: none;
		color: var(--muted);
		cursor: pointer;
	}

	.copy:hover {
		color: var(--ink);
		border-color: var(--border-bright);
	}

	pre {
		margin: 0;
		max-height: 22em;
		overflow: auto;
		padding: 0.9em 1em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		font-family: var(--font-mono);
		font-size: 0.78em;
		line-height: 1.5;
		color: var(--muted);
	}
</style>
