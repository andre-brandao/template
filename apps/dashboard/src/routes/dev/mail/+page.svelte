<script lang="ts">
	import { resolve } from '$app/paths';
	import { Card } from '@template/ui';

	let { data } = $props();
</script>

<div class="intro">
	<h1>Mail</h1>
	<p>
		Every template in <code>packages/core/src/lib/email/template.ts</code>, rendered against
		stand-in props. Nothing is sent — the builders are pure, so this reads the same html a driver
		would receive.
	</p>
</div>

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
	.intro h1 {
		margin: 0 0 0.4em;
		font-size: 1.5em;
	}

	.intro p {
		max-width: 60ch;
		color: var(--muted);
		font-size: 0.9em;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(19em, 1fr));
		gap: 1em;
	}

	h2 {
		margin: 0 0 0.4em;
		font-size: 1em;
	}

	.grid p {
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
