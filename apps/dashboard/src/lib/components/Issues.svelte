<script lang="ts">
	import { Issue } from '@template/ui';

	/** A remote form's `fields.allIssues()`, one `Issue` each. */
	let { issues }: { issues?: { message: string }[] } = $props();
</script>

{#each issues ?? [] as issue, i (i)}
	<Issue>{issue.message}</Issue>
{/each}
