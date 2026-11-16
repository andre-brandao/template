<script lang="ts">
	import type { Snippet } from 'svelte';
	import { user } from '#lib/utils/context.ts';
	import HomePage from '#lib/features/home/pages/HomePage.svelte';
	import { layouts } from '#lib/features/home/layouts.ts';
	import type { Props } from '#lib/features/home/modules.ts';
	import Experiment from '#lib/features/experiments/components/Experiment.svelte';
	import Glance from '#lib/features/todos/components/Glance.svelte';
	import Recent from '#lib/features/todos/components/Recent.svelte';
	import Shortcuts from '#lib/components/Shortcuts.svelte';
	import CalendarRange from '@lucide/svelte/icons/calendar-range';
	import Kanban from '@lucide/svelte/icons/kanban';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import Palette from '@lucide/svelte/icons/palette';
	import UserRound from '@lucide/svelte/icons/user-round';

	const me = user();

	// Static links into the screens you reach for that have no module tile.
	const links = [
		{ href: '/settings/account', label: 'Account', icon: UserRound },
		{ href: '/settings/keys', label: 'API keys', icon: KeyRound },
		{ href: '/settings/experience', label: 'Experience', icon: Palette },
		{ href: '/todos?view=board', label: 'Board', icon: Kanban },
		{ href: '/todos?view=timeline', label: 'Timeline', icon: CalendarRange }
	];
</script>

{#snippet status()}<Glance />{/snippet}
{#snippet recent()}<Recent />{/snippet}
{#snippet shortcuts()}<Shortcuts grid label="Shortcuts" {links} />{/snippet}
<!-- The layouts under test, for admins only; everyone else gets the default. Drop it once one wins. -->
{#snippet frame(props: Props, heading: Snippet)}
	<Experiment key="home" title="Home page" variants={layouts} {props}
		>{@render heading()}</Experiment
	>
{/snippet}

{#if me.current}
	<HomePage
		name={me.current.name}
		role={me.current.role}
		frame={me.can({ admin: ['read'] }) ? frame : undefined}
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
{/if}
