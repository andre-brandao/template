<script lang="ts">
	import { Code, toast } from '@template/ui';
	import { cli, curl, fetch as js, sdk } from './snippets';
	import { swap } from '$lib/utils/swap';

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
		<div class="tabs">
			{#each Object.keys(builders) as one (one)}
				<button class="tab" class:active={kind === one} onclick={() => swap('kind', () => (kind = one as Kind))}>
					{one}
				</button>
			{/each}
		</div>
		<button class="copy" onclick={copy}>Copy</button>
	</div>
	<div class="body"><Code value={text} lang={langs[kind]} /></div>
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

	section :global(pre.tm-code) {
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

	/* Named only while the swap it owns is running: an unconditional name would make this
	   its own group on every navigation, including ones where it exists on one side only. */
	:global(html[data-swap~='kind']) .body {
		view-transition-name: snippet;
	}

	:global(::view-transition-old(snippet)),
	:global(::view-transition-new(snippet)) {
		animation-duration: 200ms;
		animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
		animation-fill-mode: both;
		mix-blend-mode: normal;
	}

	:global(::view-transition-old(snippet)) {
		animation-name: out;
	}

	:global(::view-transition-new(snippet)) {
		animation-name: in;
	}

	@keyframes out {
		to {
			opacity: 0;
			transform: translateY(-4px);
		}
	}

	@keyframes in {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(::view-transition-old(snippet)),
		:global(::view-transition-new(snippet)) {
			animation: none;
		}
	}
</style>
