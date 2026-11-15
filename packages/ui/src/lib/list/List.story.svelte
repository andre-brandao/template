<script module lang="ts">
	import type { Story } from '../story';
	import Root from './List.svelte';

	export const story: Story = {
		title: 'List',
		blurb:
			'Dense resource rows. `List.Root` is the `ul` (flat on a page, `boxed` inside a Section); ↑/↓, Home and End move between rows. `List.Row` takes a `lead` (avatar, icon), a `title` with an optional stretched `href`, a second line as children, right-aligned `meta`, always-visible `actions`, and `menu` items behind a ⋯ that shows on hover or focus but always keeps its slot. `state` puts a Status dot after the title; `muted` dims a row being deleted. `List.Loading` draws row-height placeholders in the same frame while a list loads.',
		of: Root
	};
</script>

<script lang="ts">
	// import { List, Menu, Avatar, Inline } from '@template/ui';
	import * as List from './index';
	import * as Menu from '../menu';
	import Avatar from '../avatar/Avatar.svelte';
	import Inline from '../inline/Inline.svelte';

	const wait = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

	let name = $state('Internal tools');
	let renaming = $state(false);
	let gone = $state(false);
</script>

<div class="stack">
	<List.Root label="Projects">
		<List.Row title={renaming ? rename : name} href={renaming ? undefined : '#list'}>
			{#snippet lead()}<Avatar {name} size={20} />{/snippet}
			Dashboards and scripts the team runs by hand.
			{#snippet meta()}<time>3m ago</time>{/snippet}
			{#snippet menu()}
				<Menu.Item href="#list">Open</Menu.Item>
				<Menu.Item onselect={() => (renaming = true)}>Rename</Menu.Item>
				<Menu.Separator />
				<Menu.Item danger onselect={() => (gone = true)}>Delete</Menu.Item>
			{/snippet}
		</List.Row>
		<List.Row title="Billing" href="#list" state="pending">
			{#snippet lead()}<Avatar name="Billing" size={20} />{/snippet}
			{#snippet meta()}<time>1h ago</time>{/snippet}
			{#snippet menu()}<Menu.Item>Open</Menu.Item>{/snippet}
		</List.Row>
		<List.Row
			title="Legacy importer"
			href="#list"
			muted={gone}
			state="failed"
			message="Not deleted"
		>
			{#snippet lead()}<Avatar name="Legacy importer" size={20} />{/snippet}
			{#snippet meta()}<time>2d ago</time>{/snippet}
			{#snippet menu()}<Menu.Item danger>Delete</Menu.Item>{/snippet}
		</List.Row>
	</List.Root>

	<List.Root label="API keys" boxed>
		<List.Row title="ci-deploy">
			{#snippet meta()}<code>sk-4f2a…</code>{/snippet}
			{#snippet menu()}<Menu.Item danger>Revoke</Menu.Item>{/snippet}
		</List.Row>
		<List.Row title="local-dev">
			{#snippet meta()}<code>sk-91bc…</code>{/snippet}
			{#snippet menu()}<Menu.Item danger>Revoke</Menu.Item>{/snippet}
		</List.Row>
	</List.Root>

	<List.Loading rows={2} boxed />
</div>

{#snippet rename()}
	<Inline
		label="Project name"
		flush
		required
		value={name}
		onsave={async (next) => {
			await wait(400);
			name = next;
			renaming = false;
		}}
	/>
{/snippet}

<style>
	.stack {
		display: grid;
		gap: 1.5em;
		max-width: 40em;
		margin: 1em;
	}

	code {
		font-family: var(--font-mono);
	}
</style>
