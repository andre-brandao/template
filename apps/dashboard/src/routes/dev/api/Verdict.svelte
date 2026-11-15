<script lang="ts">
	import { Badge, type Tone } from '@template/ui';

	let { status }: { status: number } = $props();

	const tone = $derived<Tone>(
		status >= 200 && status < 300 ? 'done' : status >= 400 ? 'danger' : 'muted'
	);
</script>

<Badge {tone}>{status || 'failed'}</Badge>
