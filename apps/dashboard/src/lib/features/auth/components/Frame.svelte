<!--
	The signed-out frame: the mark and the one-line pitch on a dark panel, beside whatever form
	is asking. Login and welcome share it, so onboarding never feels like a different page.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="frame">
	<aside>
		<span class="mark"><span class="dot"></span>Todos</span>
		<p class="line">Track work from capture to shipped.</p>
		<span class="legal">© {new Date().getFullYear()} Todos</span>
	</aside>

	<main>
		<div class="column">{@render children()}</div>
	</main>
</div>

<style>
	.frame {
		display: grid;
		grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
		min-height: 100dvh;
	}

	/* Dark in both themes: `color-scheme` flips every `light-dark()` token inside it. */
	aside {
		color-scheme: dark;
		display: flex;
		flex-direction: column;
		gap: 2.5em;
		padding: 3em;
		color: var(--ink);
		background:
			radial-gradient(90% 70% at 12% 8%, color-mix(in oklab, var(--accent) 16%, transparent), transparent 60%),
			linear-gradient(color-mix(in oklab, var(--ink) 4%, transparent) 1px, transparent 1px),
			linear-gradient(90deg, color-mix(in oklab, var(--ink) 4%, transparent) 1px, transparent 1px),
			var(--bg);
		background-size:
			auto,
			40px 40px,
			40px 40px,
			auto;
	}

	.mark {
		display: inline-flex;
		align-items: center;
		gap: 0.55em;
		font-size: 1.05em;
		font-weight: 600;
		letter-spacing: -0.011em;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		background: var(--accent);
	}

	/* Pushed to the floor of the panel, so the mark tops it and the pitch sits low. */
	.line {
		margin: auto 0 0;
		max-width: 16ch;
		font-size: clamp(1.5rem, 2.6vw, 2.1rem);
		font-weight: 600;
		line-height: 1.2;
		letter-spacing: -0.02em;
		text-wrap: balance;
	}

	.legal {
		font-size: 0.72rem;
		color: var(--dim);
	}

	main {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 3em 1.5em;
		background: var(--bg);
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: 1em;
		width: min(380px, 100%);
	}

	/* One column below the split: the panel collapses to a band above the form. */
	@media (max-width: 860px) {
		.frame {
			grid-template-columns: 1fr;
			grid-template-rows: auto 1fr;
		}

		aside {
			gap: 1.4em;
			padding: 2em 1.5em;
		}

		.line {
			margin-top: 0;
			max-width: none;
			font-size: 1.25rem;
		}

		.legal {
			display: none;
		}

		main {
			align-items: flex-start;
			padding: 2.5em 1.5em 4em;
		}
	}
</style>
