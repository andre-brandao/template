<!--
	The assistant beside the page: a sticky column on desktop, the whole screen on a phone or
	in full screen. Kept mounted while hidden, so its page tools outlive a closed drawer mid-run.
-->
<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import { agent } from '../agent.svelte';
	import Agent from './Agent.svelte';

	const ctx = agent();
	// The Shell's breakpoint: below it the column becomes the whole screen.
	const narrow = new MediaQuery('max-width: 700px');
</script>

<div
	class="dock"
	class:full={ctx.full || narrow.current}
	hidden={!ctx.open}
	role="complementary"
	aria-label="Assistant"
>
	<Agent />
</div>
{#if !ctx.open}
	<button class="open" type="button" aria-label="Open assistant" title="Assistant" onclick={ctx.toggle}>
		<Sparkles size={18} strokeWidth={1.75} />
	</button>
{/if}

<style>
	.dock {
		display: flex;
		flex-direction: column;
		width: min(400px, 100vw);
		flex-shrink: 0;
		position: sticky;
		top: 0;
		height: 100dvh;
		border-left: 1px solid var(--border);
		z-index: 25;
	}

	.dock[hidden] {
		display: none;
	}

	.dock.full {
		position: fixed;
		inset: 0;
		width: auto;
		z-index: 40;
	}

	.open {
		position: fixed;
		right: 1.25em;
		bottom: calc(var(--footer) + 1em);
		z-index: 25;
		display: inline-flex;
		padding: 0.75em;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		color: var(--accent);
		box-shadow: var(--shadow-2);
		cursor: pointer;
	}

	.open:hover {
		background: var(--surface-2);
	}
</style>
