<script module lang="ts">
	import type { Story } from '../story';
	import Spinner from './Spinner.svelte';

	export const story: Story = {
		title: 'Spinner',
		blurb: 'No props. Sized in `em` and painted in `currentColor`, so it inherits its context.',
		of: Spinner
	};
</script>

<p class="sizes">
	<Spinner />
	<span class="big"><Spinner /></span>
	<span class="danger"><Spinner /> inside text</span>
</p>

<style>
	.sizes {
		display: flex;
		align-items: center;
		gap: 1.2em;
		color: var(--muted);
	}

	.big {
		font-size: 2em;
	}

	.danger {
		color: var(--danger);
	}
</style>
