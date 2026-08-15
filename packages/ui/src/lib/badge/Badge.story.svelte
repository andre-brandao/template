<script module lang="ts">
	import type { Story } from '../story';
	import Badge, { type Tone } from './Badge.svelte';

	export const story: Story = {
		title: 'Badge',
		blurb:
			'A state, not a decoration: `tone` names what is being reported and the token supplies the colour, so the same word reads the same way on every screen. The border is a wash of the text colour, which keeps a mixed row at one weight.',
		of: Badge,
		slot: 'ready',
		props: {
			tone: {
				type: 'select',
				value: 'done',
				options: ['muted', 'pending', 'progress', 'done', 'danger', 'accent']
			}
		}
	};

	const tones: { tone: Tone; label: string }[] = [
		{ tone: 'muted', label: 'draft' },
		{ tone: 'pending', label: 'todo' },
		{ tone: 'progress', label: 'doing' },
		{ tone: 'done', label: 'done' },
		{ tone: 'danger', label: 'failed' },
		{ tone: 'accent', label: 'new' }
	];
</script>

<script lang="ts">
	// import { Badge } from '@template/ui';
</script>

<div class="row">
	{#each tones as one (one.tone)}
		<Badge tone={one.tone}>{one.label}</Badge>
	{/each}
</div>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 0.5em;
		flex-wrap: wrap;
	}
</style>
