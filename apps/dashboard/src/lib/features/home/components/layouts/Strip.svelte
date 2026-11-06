<!-- Strip: modules as a strip of compact links on top, widgets in a grid below it. -->
<script lang="ts">
	import type { Props } from '../../modules';
	import Card from '../Card.svelte';

	let { modules, widgets }: Props = $props();
</script>

<div class="strip">
	<!-- Phones scroll the strip sideways with snap; from 640px it is one row that wraps. -->
	<nav aria-label="Modules">
		{#each modules as module (module.key)}
			<a href={module.href} title={module.hint}>
				<module.icon size={26} strokeWidth={1.5} aria-hidden="true" />
				<span>{module.label}</span>
			</a>
		{/each}
	</nav>

	{#if widgets.length}
		<div class="grid">
			{#each widgets as widget (widget.key)}
				<Card {widget} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.strip {
		display: flex;
		flex-direction: column;
		gap: 1.5em;
	}

	nav {
		display: flex;
		gap: 0.75em;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
	}

	a {
		flex: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.55em;
		width: 7.25rem;
		padding: 0.9em 0.6em 0.75em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		text-decoration: none;
		scroll-snap-align: start;
		transition:
			border-color 150ms ease,
			box-shadow 150ms ease;
	}

	a:hover {
		border-color: var(--border-bright);
		box-shadow: var(--shadow-1);
	}

	span {
		width: 100%;
		overflow: hidden;
		font-size: 0.9em;
		font-weight: 600;
		text-align: center;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Rows stretch cards to one height; a long body grows its row rather than scrolling. */
	.grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1em;
	}

	@media (min-width: 640px) {
		nav {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
			overflow: visible;
		}

		a {
			width: auto;
		}
	}

	@media (min-width: 768px) {
		.grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (min-width: 1100px) {
		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
