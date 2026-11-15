<!--
	The ⌘K palette. Routes may import slices, so the app's actions are composed here; nav
	comes from the layouts' own `nav` data. Opening it reads only memory, never the network.
-->
<script lang="ts">
	import { dev } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { createHotkey } from '@tanstack/svelte-hotkeys';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { getProjectQueryKey, type Project } from '@template/sdk/query';
	import { Command, Kbd, modal, toast, type Action } from '@template/ui';
	import Keys from '$lib/components/layout/Keys.svelte';
	import { account, home, type Nav } from '$lib/components/layout/nav';
	import { sidebar } from '$lib/components/layout/rail.svelte';
	import { agent } from '$lib/features/agent/agent.svelte';
	import KeyForm from '$lib/features/developers/components/key/KeyForm.svelte';
	import { upload } from '$lib/features/files/api/files.query';
	import ProjectForm from '$lib/features/projects/components/ProjectForm.svelte';
	import { update } from '$lib/features/settings/api/prefs.query';
	import { swap } from '$lib/features/settings/theme';
	import TodoForm from '$lib/features/todos/components/form/TodoForm.svelte';
	import { hotkeys } from '$lib/hotkeys';
	import { user } from '$lib/utils/context';

	let { open = $bindable(false), assistant }: { open?: boolean; assistant: boolean } = $props();

	const me = user();
	const rail = sidebar();
	const bot = agent();
	const client = useQueryClient();
	const put = upload();
	const write = update();

	createHotkey(hotkeys.palette, () => (open = !open));
	createHotkey(hotkeys.help, () => modal(Keys));

	const go = (group: string, label: string, href: string): Action => ({
		group,
		label,
		hint: href,
		run: () => goto(href)
	});

	function theme() {
		const before = me.prefs.theme;
		const dark =
			before === 'dark' ||
			(before === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
		const next = dark ? 'light' : 'dark';
		swap(next);
		write.mutate({ theme: next }, { onError: () => swap(before) });
	}

	// A throwaway picker: the palette is gone by the time the files come back.
	function pick() {
		const input = Object.assign(document.createElement('input'), { type: 'file', multiple: true });
		input.onchange = () => {
			goto('/files');
			[...(input.files ?? [])].forEach((file) =>
				put.mutateAsync({ body: { file } }).catch((err: Error) => toast.error(err.message))
			);
		};
		input.click();
	}

	const actions = $derived<Action[]>([
		...(me.can({ project: ['create'] })
			? [{ group: 'Actions', label: 'New project', run: () => modal(ProjectForm) }]
			: []),
		...(me.can({ todo: ['create'] })
			? [{ group: 'Actions', label: 'New todo', run: () => modal(TodoForm) }]
			: []),
		...(me.can({ file: ['create'] }) ? [{ group: 'Actions', label: 'Upload files', run: pick }] : []),
		...(me.can({ key: ['create'] })
			? [{ group: 'Actions', label: 'New access token', run: () => modal(KeyForm) }]
			: []),
		...(assistant
			? [
					{
						group: 'Actions',
						label: bot.open ? 'Close assistant' : 'Open assistant',
						run: bot.toggle
					}
				]
			: []),
		{ group: 'Actions', label: 'Toggle theme', run: theme },
		{ group: 'Actions', label: rail.tight ? 'Expand sidebar' : 'Collapse sidebar', run: rail.toggle },
		{ group: 'Actions', label: 'Keyboard shortcuts', run: () => modal(Keys) },
		// A server route: a client-side goto would find no page to render.
		{ group: 'Actions', label: 'Log out', run: () => location.assign('/logout') }
	]);

	// The section the reader is in, then every top-level place, which wins a repeated href.
	const places = $derived.by(() => {
		const nav: Nav | undefined = page.data.nav;
		const top = [
			go('Go to', 'Home', '/'),
			...home.flatMap((section) => section.items).map((item) => go('Go to', item.label, item.href)),
			...account(me.current?.id ?? '')
				.filter((link) => me.can(link.grants ?? {}))
				.map((link) => go('Go to', link.label, link.href)),
			...(dev ? [go('Go to', 'Dev tools', '/dev')] : [])
		];
		const here = [...(nav?.sections.top ?? []), ...(nav?.sections.bottom ?? [])]
			.flatMap((section) => section.items)
			.filter((item) => !top.some((one) => one.hint === item.href))
			.map((item) => go(nav?.crumbs?.at(-1)?.label ?? 'This section', item.label, item.href));
		return [...here, ...top];
	});

	// Whatever project lists are already cached; read on open, so it costs no request.
	const recent = $derived(
		open
			? client
					.getQueriesData<{ data: Project[] }>({ queryKey: getProjectQueryKey() })
					.flatMap((entry) => entry[1]?.data ?? [])
					.filter((one, i, all) => all.findIndex((other) => other.id === one.id) === i)
					.slice(0, 20)
					.map((one) => go('Projects', one.name, `/projects/${one.id}`))
			: []
	);
</script>

<Command bind:open commands={[...actions, ...places, ...recent]} placeholder="Search pages and actions">
	{#snippet foot()}
		<span><Kbd keys="ArrowUp" /> <Kbd keys="ArrowDown" /> move</span>
		<span><Kbd keys="Enter" /> run</span>
		<span><Kbd keys="Escape" /> close</span>
	{/snippet}
</Command>

<style>
	span {
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
	}
</style>
