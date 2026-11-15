<script lang="ts">
	import { resolve } from '$app/paths';
	import { Card } from '@template/ui';
	import * as Header from '#lib/components/header/index.ts';

	let { data } = $props();
</script>

<Header.Root title="Mail">
	{#snippet lead()}
		Every template in <code>packages/core/src/lib/email/template.ts</code>, rendered against
		stand-in props. Nothing is sent.
	{/snippet}
</Header.Root>

<div class="grid">
	{#each data.mails as one (one.name)}
		<Card href={resolve('/dev/mail/[name]', { name: one.name })} interactive>
			<h2>{one.label}</h2>
			<p>{one.blurb}</p>
			<footer><code>Template.Render.{one.name}</code></footer>
		</Card>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(19em, 1fr));
		gap: 1em;
	}

	h2 {
		margin: 0 0 0.4em;
		font-size: 1em;
	}

	p {
		margin: 0;
		color: var(--muted);
		font-size: 0.85em;
	}

	footer {
		margin-top: 0.9em;
		font-size: 0.7em;
	}

	code {
		font-family: var(--font-mono);
		color: var(--dim);
	}
</style>
