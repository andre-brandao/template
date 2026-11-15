<!--
	The gateway's models as `Provider · model`: provider chips, provider then family order, and
	dated snapshots tucked behind a toggle unless searched for or selected.
-->
<script lang="ts">
	import { browser } from '$app/environment';
	import { Badge, Combobox, Kbd, Skeleton } from '@template/ui';
	import { createHotkey } from '@tanstack/svelte-hotkeys';
	import { createQuery } from '@tanstack/svelte-query';
	import { hotkeys } from '$lib/hotkeys';
	import { models } from '../api/agent.query';
	import { agent } from '../agent.svelte';

	let { value = $bindable() }: { value?: string } = $props();

	const ctx = agent();
	const list = createQuery(() => models());
	const store = 'agent-provider';
	const names: Record<string, string> = {
		openai: 'OpenAI',
		anthropic: 'Anthropic',
		google: 'Google',
		gemini: 'Gemini',
		mistral: 'Mistral',
		meta: 'Meta',
		xai: 'xAI',
		deepseek: 'DeepSeek',
		bedrock: 'Bedrock',
		azure: 'Azure'
	};
	// `-YYYY-MM-DD` (or `-YYYYMMDD`) at the end pins a snapshot of its family.
	const dated = /-(\d{4}-?\d{2}-?\d{2})$/;

	let open = $state(false);
	let query = $state('');
	let snaps = $state(false);
	let filter = $state(read());

	const all = $derived(sort(list.data?.ids ?? []));
	const tuck = $derived(tucked(all));
	const current = $derived(value ?? list.data?.default);
	// The current model leads, so its group comes first.
	const items = $derived([
		...all.filter((one) => one.id === current),
		...all.filter((one) => one.id !== current && (snaps || !!query.trim() || !tuck.has(one.id)))
	]);

	createHotkey(hotkeys.model, () => (open = !open), () => ({ enabled: ctx.open }));

	// Storage can throw (private window, blocked site data); then the chip lasts this visit.
	function read() {
		if (!browser) return '';
		try {
			return localStorage.getItem(store) ?? '';
		} catch {
			return '';
		}
	}

	function save(next: string) {
		filter = next;
		try {
			localStorage.setItem(store, next);
		} catch {
			// Kept for this visit only.
		}
	}

	function parse(id: string) {
		const cut = id.indexOf('/');
		const name = id.slice(cut + 1);
		const date = name.match(dated)?.[1];
		const slug = cut < 0 ? '' : id.slice(0, cut);
		const vendor = names[slug] ?? (slug ? slug[0].toUpperCase() + slug.slice(1) : 'Other');
		return { id, name, date, vendor, family: date ? name.slice(0, -date.length - 1) : name };
	}

	type Model = ReturnType<typeof parse>;

	// Provider, family, the family's alias, then its snapshots newest first.
	function sort(ids: string[]) {
		return ids
			.map(parse)
			.sort(
				(a, b) =>
					a.vendor.localeCompare(b.vendor) ||
					a.family.localeCompare(b.family) ||
					Number(!!a.date) - Number(!!b.date) ||
					(b.date ?? '').localeCompare(a.date ?? '')
			);
	}

	// Every snapshot but a family's first row: its alias, or its newest when it has none.
	function tucked(list: Model[]) {
		const seen = new Set<string>();
		return new Set(
			list
				.filter((one) => {
					const fam = `${one.vendor}/${one.family}`;
					const first = !seen.has(fam);
					seen.add(fam);
					return one.date && !first;
				})
				.map((one) => one.id)
		);
	}
</script>

<div class="picker">
	{#if list.isPending}
		<Skeleton h="1.4em" w="9em" />
	{:else if list.isError}
		<span class="quiet">
			Models unavailable
			<button type="button" class="retry" onclick={() => list.refetch()}>Retry</button>
		</span>
	{:else}
		<Combobox
			{items}
			key={(one) => one.id}
			group={(one) => (one.id === current ? 'Current' : one.vendor)}
			facet={(one) => one.vendor}
			bind:value={() => current, (next) => (value = next)}
			bind:open
			bind:query
			bind:filter={() => filter, save}
			label="Model"
			placeholder="Search models"
			side="top"
		>
			{#snippet trigger(one)}
				{#if one}
					<span class="vendor">{one.vendor}</span>
					<span class="dot">·</span>
					<span class="name">{one.name}</span>
				{/if}
			{/snippet}
			{#snippet item(one, row)}
				{#if one.id === current}<span class="vendor">{one.vendor} ·</span>{/if}
				<span class={['name', { snap: one.id !== current && tuck.has(one.id) }]}>
					{@render row.marked(one.name)}
				</span>
				{#if one.id === list.data?.default}<Badge>default</Badge>{/if}
			{/snippet}
			{#snippet foot()}
				{#if tuck.size}
					<button type="button" class="snaps" aria-pressed={snaps} onclick={() => (snaps = !snaps)}>
						{snaps ? 'Hide' : 'Show'} snapshots <span class="count">{tuck.size}</span>
					</button>
				{/if}
				<span class="key"><Kbd keys="Mod+/" /></span>
			{/snippet}
		</Combobox>
	{/if}
</div>

<style>
	/* Shrinks to the name; the trigger fills it. */
	.picker {
		display: flex;
		min-width: 0;
		max-width: 70%;
		font-size: 0.8em;
		--control: 2em;
	}

	.vendor,
	.dot {
		flex: none;
		color: var(--dim);
	}

	.name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* A snapshot sits under its family's alias. */
	.snap {
		padding-inline-start: 0.9em;
		color: var(--dim);
	}

	.snaps {
		flex: none;
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		padding: 0.15em 0.5em;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: none;
		color: var(--muted);
		font: inherit;
		font-size: 0.85em;
		cursor: pointer;
	}

	.snaps[aria-pressed='true'] {
		border-color: var(--border-bright);
		background: var(--surface-2);
		color: var(--ink);
	}

	.count {
		color: var(--dim);
		font-variant-numeric: tabular-nums;
	}

	.key {
		margin-inline-start: auto;
	}

	.quiet {
		color: var(--dim);
		white-space: nowrap;
	}

	.retry {
		padding: 0;
		border: none;
		background: none;
		color: var(--accent);
		font: inherit;
		cursor: pointer;
	}
</style>
