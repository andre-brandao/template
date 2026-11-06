<!-- The app's mark and home link. `word` is the caller's call: the corner only has room
     for the name when nothing else — a collapsed rail, a project switcher — is using it. -->
<script lang="ts">
	import { resolve } from '$app/paths';

	let { word = false }: { word?: boolean } = $props();
</script>

<a href={resolve('/')} class="brand" aria-label="Home">
	<span class="dot"></span>
	{#if word}<span>Todos</span>{/if}
</a>

<style>
	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.55em;
		flex-shrink: 0;
		font-size: 1.05em;
		font-weight: 600;
		letter-spacing: -0.011em;
		color: var(--ink);
		text-decoration: none;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		background: var(--accent);
	}
</style>
