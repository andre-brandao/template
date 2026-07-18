<script lang="ts">
	import type { Todo } from '@template/core/todo';
	import { color, label } from '../state';

	let { state }: { state: Todo.State } = $props();
</script>

<span class="pill" style:--c={color(state)}>{label(state)}</span>

<style>
	.pill {
		display: inline-flex;
		align-items: center;
		font-family: var(--font-mono);
		font-size: 0.72em;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		white-space: nowrap;
		padding: 0.25em 0.6em;
		border-radius: 999px;
		border: 1px solid color-mix(in srgb, var(--c) 45%, transparent);
		background: color-mix(in srgb, var(--c) 12%, transparent);
		color: var(--c);
		transition: color 0.3s ease, background 0.3s ease, border-color 0.3s ease;
	}
</style>
