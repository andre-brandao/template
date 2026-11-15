<script lang="ts">
	import Copy from '@lucide/svelte/icons/copy';
	import { Code, IconButton, Tabs, toast } from '@template/ui';
	import { cli, curl, fetch as js, sdk } from './snippets';

	let {
		input
	}: { input: Parameters<typeof curl>[0] } = $props();

	const builders = { curl, fetch: js, sdk, cli };
	const langs = { curl: 'shell', fetch: 'ts', sdk: 'ts', cli: 'shell' };
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
		<Tabs.Root>
			{#each Object.keys(builders) as one (one)}
				<Tabs.Item active={kind === one} onclick={() => (kind = one as Kind)}>
					{one}
				</Tabs.Item>
			{/each}
		</Tabs.Root>
		<IconButton size="sm" label="Copy {kind}" onclick={copy}><Copy size={14} /></IconButton>
	</div>
	<Code value={text} lang={langs[kind]} max="22em" />
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
</style>
