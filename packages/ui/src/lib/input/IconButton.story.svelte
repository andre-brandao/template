<script module lang="ts">
	import type { Story } from '../story';
	import IconButton from './IconButton.svelte';

	export const story: Story = {
		title: 'IconButton',
		blurb:
			'A button that is only an icon. `label` is required: it becomes the accessible name and the hover title, so an icon control can never ship unnamed. Ghost by default; `secondary` gives it the input box. `md` is one `--control` tall, `sm` sits inside a row. `pressed` makes it a toggle. Spread a Popover or Menu `trigger` attrs straight onto it.',
		of: IconButton
	};
</script>

<script lang="ts">
	// import { IconButton } from '@template/ui';

	let starred = $state(false);
</script>

{#snippet dots()}
	<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<circle cx="5" cy="12" r="1.6" />
		<circle cx="12" cy="12" r="1.6" />
		<circle cx="19" cy="12" r="1.6" />
	</svg>
{/snippet}

<div class="row">
	<IconButton label="More actions">{@render dots()}</IconButton>
	<IconButton label="More actions" size="sm">{@render dots()}</IconButton>
	<IconButton label="More actions" variant="secondary">{@render dots()}</IconButton>
	<IconButton label="Star" pressed={starred} onclick={() => (starred = !starred)}>★</IconButton>
	<IconButton label="Close" disabled>✕</IconButton>
</div>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 0.6em;
		margin: 1em;
	}

	svg {
		width: 1.1em;
		height: 1.1em;
	}
</style>
