<script lang="ts">
	import type { Snippet } from 'svelte';
	import { user } from '$lib/utils/context';
	import Topbar from '$lib/components/layout/Topbar.svelte';
	import Hero from '$lib/features/home/components/Hero.svelte';
	import HomePage from '$lib/features/home/pages/HomePage.svelte';
	import { layouts } from '$lib/features/home/layouts';
	import type { Props } from '$lib/features/home/modules';
	import Experiment from '$lib/features/experiments/components/Experiment.svelte';
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

	// Static links into the screens you reach for that have no module tile.
	const links = [
		{ href: '/settings/account', label: 'Account', icon: UserRound },
		{ href: '/developers/keys', label: 'Personal access tokens', icon: KeyRound },
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
		<!-- The layouts under test; drop the frame once one wins. -->
		{#snippet frame(props: Props, heading: Snippet)}
			<Experiment key="home" title="Home page" variants={layouts} {props}>{@render heading()}</Experiment>
		{/snippet}
		<HomePage
			name={current.name}
			role={current.role}
			{frame}
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
		<Hero />
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

	@media (max-width: 640px) {
		main {
			margin-top: 7vh;
		}

		main.home {
			margin-top: 1.5em;
		}
	}
</style>
