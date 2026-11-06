<script lang="ts">
	import { user } from '$lib/utils/context';
	import Rule from '$lib/components/Rule.svelte';
	import Topbar from '$lib/components/layout/Topbar.svelte';
	import HomePage from '$lib/features/home/pages/HomePage.svelte';
	import Glance from '$lib/features/todos/components/Glance.svelte';
	import Recent from '$lib/features/todos/components/Recent.svelte';
	import Shortcuts from '$lib/components/Shortcuts.svelte';
	import CalendarRange from '@lucide/svelte/icons/calendar-range';
	import Kanban from '@lucide/svelte/icons/kanban';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import Palette from '@lucide/svelte/icons/palette';
	import UserRound from '@lucide/svelte/icons/user-round';

	const me = user();
	const current = $derived(me.current);

	// A diagram, not a measurement — the arc every todo travels, in the board's stage
	// colours. Equal thirds because none of them is bigger.
	const stages = [
		{ label: 'Capture', value: 'write it down', color: 'var(--pending)', pct: 1 },
		{ label: 'Move', value: 'pull it across', color: 'var(--progress)', pct: 1 },
		{ label: 'Ship', value: 'close it out', color: 'var(--done)', pct: 1 }
	];

	// Static links into the screens you reach for that have no module tile.
	const links = [
		{ href: '/settings/profile', label: 'Profile', icon: UserRound },
		{ href: '/settings/keys', label: 'API keys', icon: KeyRound },
		{ href: '/settings/experience', label: 'Experience', icon: Palette },
		{ href: '/todos?view=board', label: 'Board', icon: Kanban },
		{ href: '/todos?view=timeline', label: 'Timeline', icon: CalendarRange }
	];
</script>

<!-- The only page outside the app shell, so it carries its own header. -->
<Topbar user={current} />

<main class={{ home: !!current }}>
	{#if current}
		{#snippet status()}<Glance />{/snippet}
		{#snippet recent()}<Recent />{/snippet}
		{#snippet shortcuts()}<Shortcuts grid label="Shortcuts" links={links} />{/snippet}
		<HomePage
			name={current.name}
			role={current.role}
			widgets={{
				status: {
					title: 'Last 90 days',
					hint: 'Everything opened, by where it stands now.',
					body: status
				},
				recent: { title: 'Recent todos', body: recent },
				shortcuts: { title: 'Shortcuts', body: shortcuts }
			}}
		/>
	{:else}
		<h1>Track work from capture to shipped.</h1>
		<Rule parts={stages} />
		<a class="cta" href="/login">Log in</a>
	{/if}
</main>

<style>
	/* Left-aligned, unlike the centred column this replaced: the rule's left edge is the
	   page's spine, and every other screen in the app hangs off that same edge. */
	main {
		width: 100%;
		max-width: 46em;
		margin: 12vh auto 0;
		padding: 0 1.25em 4em;
	}

	/* Signed in, the page holds a tile grid and a widget column, so it needs the width. */
	main.home {
		max-width: 76em;
		margin-top: 2.5em;
	}

	/* The margin is in `em` of a clamped display size, so it scales with the headline —
	   1.2 lands just under 50px at the cap, close enough to the rule to belong to it. */
	h1 {
		margin: 0 0 1.2em;
		max-width: 20ch;
		font-size: clamp(1.8em, 6vw, 2.6em);
		font-weight: 600;
		line-height: 1.15;
		letter-spacing: -0.02em;
		text-wrap: balance;
	}

	.cta {
		display: inline-block;
		margin-top: 2.8em;
		padding: 0.6em 1.4em;
		font-family: var(--font-mono);
		font-size: 0.85em;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		text-decoration: none;
		color: var(--accent-ink);
		background: var(--accent);
		border-radius: var(--radius);
	}

	.cta:hover {
		background: color-mix(in oklab, var(--accent) 88%, var(--ink));
	}

	@media (max-width: 640px) {
		main {
			margin-top: 7vh;
		}

		main.home {
			margin-top: 1.5em;
		}
	}
</style>
