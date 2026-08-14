<script lang="ts">
	import Braces from '@lucide/svelte/icons/braces';
	import Component from '@lucide/svelte/icons/component';
	import Plug from '@lucide/svelte/icons/plug';
	import { Card } from '@template/ui';
	import { stories } from '@template/ui/story';

	const tools = [
		{
			href: '/dev/story',
			icon: Component,
			title: 'Storybook',
			blurb: `All ${stories.length} components in @template/ui, with live prop controls.`,
			ready: true
		},
		{
			href: '/dev/api',
			icon: Braces,
			title: 'API explorer',
			blurb: 'Browse the OpenAPI surface and fire requests at the api service.',
			ready: false
		},
		{
			href: '/dev/mcp',
			icon: Plug,
			title: 'MCP explorer',
			blurb: 'List the MCP tools and call them with their input schemas.',
			ready: false
		}
	];
</script>

<h1>Dev tools</h1>
<p class="lede">
	Only mounted when the dashboard runs in development — the layout 404s otherwise. Nothing here
	reads production data.
</p>

<div class="grid">
	{#each tools as tool (tool.href)}
		<Card href={tool.href} interactive accent={tool.ready ? 'var(--accent)' : 'var(--dim)'}>
			<h2><tool.icon size={17} strokeWidth={1.75} />{tool.title}</h2>
			<p>{tool.blurb}</p>
			{#if !tool.ready}<span class="soon">placeholder</span>{/if}
		</Card>
	{/each}
</div>

<style>
	h1 {
		margin: 0 0 0.3em;
		font-size: 1.5em;
	}

	.lede {
		margin: 0 0 2em;
		max-width: 60ch;
		color: var(--muted);
		font-size: 0.9em;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(17em, 1fr));
		gap: 1em;
	}

	h2 {
		display: flex;
		align-items: center;
		gap: 0.5em;
		margin: 0 0 0.4em;
		font-size: 1em;
	}

	.grid p {
		margin: 0;
		color: var(--muted);
		font-size: 0.85em;
	}

	.soon {
		display: inline-block;
		margin-top: 0.7em;
		padding: 0.1em 0.45em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		font-family: var(--font-mono);
		font-size: 0.65em;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--dim);
	}
</style>
