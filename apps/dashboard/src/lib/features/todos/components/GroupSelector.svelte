<script lang="ts">
	import type { By } from '../group';

	let { by = 'status', onchange }: { by?: By; onchange: (by: By) => void } = $props();
</script>

<label class="group">
	<span>Group</span>
	<select value={by} onchange={(e) => onchange(e.currentTarget.value as By)}>
		<option value="status">Status</option>
		<option value="stage">Stage</option>
		<option value="assignee">Assignee</option>
	</select>
</label>

<style>
	.group {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
	}

	span {
		font-family: var(--font-mono);
		font-size: 0.72em;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted);
	}

	select {
		font: inherit;
		font-size: 0.85em;
		padding: 0.35em 0.5em;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--surface);
		color: var(--ink);
	}

	select:focus-visible {
		border-color: var(--accent);
		outline: none;
	}
</style>
