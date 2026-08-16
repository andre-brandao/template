<script module lang="ts">
	import type { Story } from '../story';
	import Skeleton from './Skeleton.svelte';

	export const story: Story = {
		title: 'Skeleton',
		blurb:
			'Holds the space a suspending boundary will fill, in the shape of what is coming — so nothing jumps when it lands. Pair `round` with the avatar size it stands in for. The pulse stops under `prefers-reduced-motion`.',
		of: Skeleton
	};
</script>

<script lang="ts">
	// import { Skeleton } from '@template/ui';
</script>

<div class="stack">
	<!-- The shape a project switcher leaves behind while its query is in flight. -->
	<div class="head">
		<Skeleton h="1.6em" w="1.6em" round />
		<Skeleton h="1.6em" />
	</div>

	<div class="rows">
		<Skeleton h="3.5em" />
		<Skeleton h="3.5em" />
		<Skeleton h="3.5em" />
	</div>
</div>

<style>
	.stack {
		display: grid;
		gap: 1.5em;
		max-width: 22em;
	}

	.head {
		display: flex;
		align-items: center;
		gap: 0.55em;
	}

	.rows {
		display: grid;
		gap: 0.6em;
	}
</style>
