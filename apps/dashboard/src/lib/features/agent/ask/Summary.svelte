<!-- A settled `ask`: the answers, folded under the form's title. -->
<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import type { Answer } from './catalog';

	let { heading, answers, chat }: { heading: string; answers: Answer[]; chat: boolean } =
		$props();
</script>

<details>
	<summary>
		<Check size={13} strokeWidth={2} />
		{heading}{chat ? ' · answered in chat' : ''}
	</summary>
	<dl>
		{#each answers as one (one.name)}
			<div>
				<dt>{one.label}</dt>
				<dd>{one.answer}{#if one.recommended}<span class="kept"> · suggested</span>{/if}</dd>
			</div>
		{/each}
	</dl>
</details>

<style>
	summary {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		color: var(--muted);
		font-size: 0.85em;
		cursor: pointer;
	}

	dl {
		display: flex;
		flex-direction: column;
		gap: 0.4em;
		margin: 0.5em 0 0;
		font-size: 0.82em;
	}

	dt {
		color: var(--muted);
	}

	dd {
		margin: 0;
	}

	.kept {
		color: var(--accent);
	}
</style>
