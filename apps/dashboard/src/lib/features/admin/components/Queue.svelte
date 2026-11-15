<!-- The job queue as one fact: pending, then running, failed and the oldest wait when there are any. -->
<script lang="ts">
	import type { Admin } from '@template/core/admin';
	import { fmt } from '#lib/utils/fmt.ts';

	let { queue }: { queue: Awaited<ReturnType<typeof Admin.queue>> } = $props();

	const f = fmt();
</script>

{queue.pending} pending
{#if queue.running}<small>{queue.running} running</small>{/if}
{#if queue.failed > 0}<span class="failed">{queue.failed} failed</span>{/if}
{#if queue.oldest}<small>oldest {f.ago(queue.oldest)}</small>{/if}

<style>
	small {
		font-weight: 400;
		color: var(--dim);
	}

	.failed {
		color: var(--danger);
	}
</style>
