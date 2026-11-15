<!-- One module tile: icon, name and hint. A row on phones, a square tile from 700px. -->
<script lang="ts">
	import type { Module } from '../modules';

	let { module }: { module: Module } = $props();
</script>

<a href={module.href}>
	<span class="icon"><module.icon size={22} strokeWidth={1.5} aria-hidden="true" /></span>
	<span class="label">{module.label}</span>
	<span class="hint">{module.hint}</span>
</a>

<style>
	a {
		display: grid;
		grid-template-columns: 2.4em minmax(0, 1fr);
		align-items: center;
		column-gap: 0.9em;
		padding: 0.8em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		text-decoration: none;
		transition:
			border-color 150ms ease,
			box-shadow 150ms ease;
	}

	a:hover {
		border-color: var(--border-bright);
		box-shadow: var(--shadow-1);
	}

	.icon {
		grid-row: span 2;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.4em;
		height: 2.4em;
		border-radius: var(--radius-sm);
		background: var(--surface-2);
	}

	.label {
		align-self: end;
		font-weight: 600;
	}

	.hint {
		align-self: start;
		font-size: 0.93em;
		color: var(--muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Two hint lines reserved so names line up across a row of tiles. */
	@media (min-width: 700px) {
		a {
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: 1fr auto auto;
			row-gap: 0.25em;
			aspect-ratio: 5 / 4;
			padding: 1em;
		}

		.icon {
			grid-row: auto;
			align-self: start;
		}

		.hint {
			min-height: 2.8em;
			line-height: 1.4;
			white-space: normal;
			display: -webkit-box;
			-webkit-line-clamp: 2;
			line-clamp: 2;
			-webkit-box-orient: vertical;
		}
	}
</style>
