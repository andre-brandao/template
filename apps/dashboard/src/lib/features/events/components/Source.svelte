<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { label } from '../api/sources.query';

	// Resolves a `{source, sourceID}` ref to its display name; the fallback shows until it lands.
	let { source, sourceID, fallback }: { source?: string; sourceID?: string; fallback: string } =
		$props();

	const q = createQuery(() => label(source, sourceID));
</script>

{q.data?.name ?? fallback}
