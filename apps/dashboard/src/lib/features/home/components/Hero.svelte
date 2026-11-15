<!-- The signed-out home: the pitch, the arc every todo travels, and the way in. -->
<script lang="ts">
	import Rule from '$lib/components/Rule.svelte';

	// A diagram, not a measurement, in the board's stage colours. Equal thirds because
	// none of them is bigger.
	const stages = [
		{ label: 'Capture', value: 'write it down', color: 'var(--pending)', pct: 1 },
		{ label: 'Move', value: 'pull it across', color: 'var(--progress)', pct: 1 },
		{ label: 'Ship', value: 'close it out', color: 'var(--done)', pct: 1 }
	];
</script>

<section>
	<h1>Track work from capture to shipped.</h1>
	<Rule parts={stages} />
	<a class="cta" href="/login">Log in</a>
</section>

<style>
	/* The margin is in `em` of a clamped display size, so it scales with the headline. */
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
</style>
