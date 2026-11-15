<!-- One module row: icon, name and a plain line on what it holds. -->
<script lang="ts">
	import type { Module } from '../modules';

	let { module }: { module: Module } = $props();
</script>

<a href={module.href}>
	<span class="icon"><module.icon size={18} strokeWidth={1.6} aria-hidden="true" /></span>
	<span class="label">{module.label}</span>
	<span class="hint">{module.hint}</span>
</a>

<style>
	a {
		display: grid;
		grid-template-columns: 2em minmax(0, 1fr);
		align-items: center;
		column-gap: 0.75em;
		padding: 0.6em 0.75em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		text-decoration: none;
		transition: border-color 150ms ease;
	}

	a:hover {
		border-color: var(--border-bright);
	}

	.icon {
		grid-row: span 2;
		display: grid;
		place-items: center;
		width: 2em;
		height: 2em;
		border-radius: var(--radius-sm);
		background: var(--surface-2);
		color: var(--muted);
	}

	.label,
	.hint {
		overflow: hidden;
		line-height: 1.3;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.label {
		font-weight: 600;
	}

	.hint {
		font-size: 0.85em;
		color: var(--muted);
	}
</style>
