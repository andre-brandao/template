<script lang="ts">
	import { version } from '$app/environment';
	import { brand } from '$lib/brand';
</script>

<!-- The content column's floor; inside the column so its left edge starts where the rail ends. -->
<footer>
	<nav>
		<a href={brand.repo} target="_blank" rel="noreferrer">GitHub</a>
		<a href="/healthz">Status</a>
	</nav>
	<span class="legal">© {new Date().getFullYear()} {brand.name}</span>
	<!-- kit's version.name is the full git SHA (vite.config.ts); short form fits the row. -->
	<span class="version" title={version}>{version.slice(0, 7)}</span>
</footer>

<style>
	footer {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.25em 1.5em;
		/* Same height as the sidebar's strip, so the two top borders read as one line. */
		height: var(--footer);
		padding-inline: 1.25em;
		border-top: 1px solid var(--border);
		font-size: 0.86em;
	}

	nav {
		display: flex;
		gap: 1.5em;
	}

	a {
		color: var(--muted);
		text-decoration: none;
	}

	a:hover {
		color: var(--ink);
	}

	.legal,
	.version {
		color: var(--dim);
	}
</style>
