<script lang="ts">
	import Braces from '@lucide/svelte/icons/braces';
	import Component from '@lucide/svelte/icons/component';
	import FileCode from '@lucide/svelte/icons/file-code';
	import Mail from '@lucide/svelte/icons/mail';
	import { Card } from '@template/ui';
	import { stories } from '@template/ui/story';
	import * as Header from '#lib/components/header/index.ts';

	const tools = [
		{
			href: '/dev/story',
			icon: Component,
			title: 'Storybook',
			blurb: `All ${stories.length} components in @template/ui, with live prop controls.`
		},
		{
			href: '/dev/api',
			icon: Braces,
			title: 'API explorer',
			blurb: 'Browse the OpenAPI surface and fire requests at the api service.'
		},
		{
			href: '/dev/prototype',
			icon: FileCode,
			title: 'Prototypes',
			blurb: 'Read the docs under docs/prototype/ with their mockups live in iframes.'
		},
		{
			href: '/dev/mail',
			icon: Mail,
			title: 'Mail',
			blurb: 'Every email template rendered against stand-in props, html and text side by side.'
		}
	];
</script>

<Header.Root
	title="Dev tools"
	lead="Mounted only in development; the layout 404s otherwise. Nothing here reads production data."
/>

<div class="grid">
	{#each tools as tool (tool.href)}
		<Card href={tool.href} interactive accent="var(--accent)">
			<h2><tool.icon size={17} strokeWidth={1.75} />{tool.title}</h2>
			<p>{tool.blurb}</p>
		</Card>
	{/each}
</div>

<style>
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

	p {
		margin: 0;
		color: var(--muted);
		font-size: 0.85em;
	}
</style>
