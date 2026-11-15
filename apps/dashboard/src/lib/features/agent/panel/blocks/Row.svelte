<!-- Children side by side, sized by its own width rather than the viewport's. -->
<script lang="ts">
	import type { Block } from '../catalog';

	let { children }: Block<'Row'> = $props();
</script>

<div class="row">{@render children?.()}</div>

<style>
	.row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 9rem), 1fr));
		gap: 0.6em;
		min-width: 0;
	}
</style>
