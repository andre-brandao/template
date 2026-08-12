<script lang="ts">
	import { user } from '$lib/utils/context';
	import Rule from '$lib/components/Rule.svelte';
	import Topbar from '$lib/components/layout/Topbar.svelte';
	import Home from './Home.svelte';

	const me = user();
	const current = $derived(me.current);

	// A diagram rather than a measurement — the arc every todo travels, in the colours the
	// board and the charts give those stages. Equal thirds because none of them is bigger.
	// The gloss goes in the value slot, where a signed-in visitor reads a count: nothing is
	// being counted here, so it is the line that deserves the weight.
	const stages = [
		{ label: 'Capture', value: 'write it down', color: 'var(--pending)', pct: 1 },
		{ label: 'Move', value: 'pull it across', color: 'var(--progress)', pct: 1 },
		{ label: 'Ship', value: 'close it out', color: 'var(--done)', pct: 1 }
	];
</script>

<!-- The only page outside the app shell, so it carries its own header. -->
<Topbar user={current} />

<main>
	{#if current}
		<Home name={current.name} />
	{:else}
		<h1>Track work from capture to shipped.</h1>
		<Rule parts={stages} />
		<a class="cta" href="/login">Log in</a>
	{/if}
</main>

<style>
	/* Left-aligned, unlike the centred column this replaced: the rule's left edge is the
	   page's spine, and every other screen in the app hangs off that same edge. */
	main {
		width: 100%;
		max-width: 46em;
		margin: 12vh auto 0;
		padding: 0 1.25em 4em;
	}

	/* The margin is in `em` of a clamped display size, so it scales with the headline —
	   1.2 lands just under 50px at the cap, close enough to the rule to belong to it. */
	h1 {
		margin: 0 0 1.2em;
		max-width: 20ch;
		font-size: clamp(1.8em, 6vw, 2.6em);
		font-weight: 600;
		line-height: 1.15;
		letter-spacing: -0.02em;
		text-wrap: balance;
	}

	.cta {
		display: inline-block;
		margin-top: 2.8em;
		padding: 0.6em 1.4em;
		font-family: var(--font-mono);
		font-size: 0.85em;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		text-decoration: none;
		color: var(--accent-ink);
		background: var(--accent);
		border-radius: var(--radius);
	}

	.cta:hover {
		background: color-mix(in oklab, var(--accent) 88%, var(--ink));
	}

	@media (max-width: 640px) {
		main {
			margin-top: 7vh;
		}
	}
</style>
