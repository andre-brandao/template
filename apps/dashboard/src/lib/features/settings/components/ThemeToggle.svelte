<!-- The account menu's quick theme switch: the Experience page's preference, one click away. -->
<script lang="ts">
	import Monitor from '@lucide/svelte/icons/monitor';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import { Themes } from '@template/core/user/prefs';
	import { user } from '$lib/utils/context';
	import { update } from '../api/prefs.query';
	import { swap } from '../theme';

	const icons = { system: Monitor, light: Sun, dark: Moon };
	const labels = { system: 'System', light: 'Light', dark: 'Dark' };

	const me = user();
	const write = update();
	// The pick leads while it saves and falls back to the stored theme if the save fails.
	const value = $derived((write.isPending && write.variables?.theme) || me.prefs.theme);
</script>

<div class="row" role="radiogroup" aria-label="Theme">
	{#each Themes as theme (theme)}
		{@const Icon = icons[theme]}
		<button
			class="pick"
			type="button"
			role="radio"
			aria-checked={value === theme}
			onclick={(e) => {
				const before = me.prefs.theme;
				swap(theme, e.currentTarget);
				write.mutate({ theme }, { onError: () => swap(before) });
			}}
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
