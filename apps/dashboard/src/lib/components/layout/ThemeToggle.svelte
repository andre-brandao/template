<!--
	The account menu's quick theme switch — the same preference the Experience page owns,
	one click away. Writes through the chrome's own one-field command, not settings'.
-->
<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import Monitor from '@lucide/svelte/icons/monitor';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import { Themes, type Prefs } from '@template/core/user/prefs';
	import { save } from './theme.remote';

	const icons = { system: Monitor, light: Sun, dark: Moon };
	const labels = { system: 'System', light: 'Light', dark: 'Dark' };

	// Local, not `page.data.prefs` straight: the segment has to move on click rather than
	// after the round trip. The reload below realigns it.
	let value = $state<Prefs['theme']>(page.data.prefs.theme);

	// Repaints immediately — waiting on the network to change theme feels broken. The wipe
	// itself is in `layout.css`; this only takes the snapshot and hands it an origin.
	function swap(theme: Prefs['theme'], from: HTMLElement) {
		const root = document.documentElement;
		const set = () => (root.dataset.theme = theme);
		// Browsers without the API, and anyone who opted out of motion, get the instant swap.
		if (!document.startViewTransition) return set();
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return set();

		// The circle grows from the clicked button out to the furthest corner of the viewport.
		const box = from.getBoundingClientRect();
		const x = box.left + box.width / 2;
		const y = box.top + box.height / 2;
		root.style.setProperty('--x', `${x}px`);
		root.style.setProperty('--y', `${y}px`);
		root.style.setProperty(
			'--r',
			`${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`
		);
		// Before the snapshot, so the outgoing frame is captured as one whole-page group.
		root.dataset.scope = 'theme';
		document.startViewTransition(set).finished.finally(() => delete root.dataset.scope);
	}

	async function pick(theme: Prefs['theme'], from: HTMLElement) {
		value = theme;
		swap(theme, from);
		await save(theme);
		// A `command` doesn't invalidate loads, so the settings page would keep the old value.
		await invalidateAll();
	}
</script>

<div class="row" role="radiogroup" aria-label="Theme">
	{#each Themes as theme (theme)}
		{@const Icon = icons[theme]}
		<button
			class="pick"
			type="button"
			role="radio"
			aria-checked={value === theme}
			onclick={(e) => pick(theme, e.currentTarget)}
		>
			<Icon size={14} strokeWidth={1.75} />
			<span>{labels[theme]}</span>
		</button>
	{/each}
</div>

<style>
	.row {
		display: flex;
		gap: 2px;
		padding: 2px;
		margin: 0.35em 0;
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.pick {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3em;
		padding: 0.45em 0.2em;
		border: none;
		border-radius: calc(var(--radius) - 4px);
		background: none;
		font: inherit;
		font-size: 0.7em;
		color: var(--dim);
		cursor: pointer;
	}

	.pick:hover {
		color: var(--ink);
		background: var(--surface-2);
	}

	.pick[aria-checked='true'] {
		color: var(--ink);
		background: var(--surface-2);
	}
</style>
