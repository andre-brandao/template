<!--
	A radio group drawn as cards or as a segmented bar. The inputs are real and stay in the
	remote form; `fallback` checks an option until the field holds one of them.
-->
<script lang="ts" generics="T extends string">
	import type { Component } from 'svelte';
	import type { RemoteFormField } from '@sveltejs/kit';

	type Option = {
		value: T;
		label: string;
		hint?: string;
		icon?: Component<{ size?: number; strokeWidth?: number }>;
		/** A colour token name: `danger`, `accent`, `progress`, `muted`. */
		tone?: string;
		/** Filled signal bars, out of three. */
		level?: number;
	};

	let {
		field,
		options,
		fallback,
		variant = 'card'
	}: {
		field: RemoteFormField<string>;
		options: Option[];
		fallback?: T;
		variant?: 'card' | 'segment';
	} = $props();

	// A value outside the options (say a stale one from another tag) falls back too.
	const known = $derived(options.some((option) => option.value === field.value()));
</script>

{#snippet bars(level: number)}
	<span class="bars" aria-hidden="true">
		{#each [1, 2, 3] as bar (bar)}
			<i class={{ on: bar <= level }} style:height="{0.3 + bar * 0.2}em"></i>
		{/each}
	</span>
{/snippet}

<div class="group {variant}">
	{#each options as option (option.value)}
		{@const props = field.as('radio', option.value)}
		<label
			class="option"
			style:--tone="var(--{option.tone ?? 'accent'})"
			title={variant === 'segment' ? option.hint : undefined}
		>
			<input {...props} checked={known ? props.checked : option.value === fallback} />
			{#if option.icon}
				<span class="icon"><option.icon size={16} strokeWidth={1.75} /></span>
			{/if}
			{#if option.level}{@render bars(option.level)}{/if}
			<span class="text">
				<span class="label">{option.label}</span>
				{#if option.hint && variant === 'card'}
					<span class="hint">{option.hint}</span>
				{/if}
			</span>
		</label>
	{/each}
</div>

<style>
	.group {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: minmax(0, 1fr);
	}

	.card {
		gap: 0.6em;
	}

	.segment {
		padding: 0.2em;
		gap: 0.2em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface-2);
	}

	.option {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.6em;
		min-width: 0;
		border-radius: var(--radius);
		color: var(--muted);
		cursor: pointer;
		transition:
			background 120ms,
			border-color 120ms,
			color 120ms;
	}

	/* Hidden from the eye, still focusable and still submitted. */
	input {
		position: absolute;
		opacity: 0;
		width: 1px;
		height: 1px;
		margin: 0;
		pointer-events: none;
	}

	.option:has(input:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.card .option {
		align-items: flex-start;
		padding: 0.7em 0.8em;
		border: 1px solid var(--border);
		background: var(--surface);
	}

	.card .option:hover {
		border-color: var(--border-bright);
	}

	.card .option:has(input:checked) {
		border-color: var(--tone);
		background: color-mix(in srgb, var(--tone) 9%, var(--surface));
		color: var(--ink);
	}

	.card .option:has(input:checked) .icon {
		color: var(--tone);
	}

	.segment .option {
		justify-content: center;
		padding: 0.4em 0.5em;
		border: 1px solid transparent;
	}

	.segment .option:hover {
		color: var(--ink);
	}

	.segment .option:has(input:checked) {
		border-color: var(--tone);
		background: color-mix(in srgb, var(--tone) 18%, var(--surface));
		color: var(--tone);
		box-shadow: var(--shadow-1);
	}

	.segment .option:has(input:checked) .label {
		font-weight: 600;
	}

	/* In the bar the bars light up only on the picked option. */
	.segment .option:not(:has(input:checked)) .bars i.on {
		background: var(--muted);
	}

	.icon {
		display: inline-flex;
		margin-top: 0.1em;
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: 0.15em;
		min-width: 0;
	}

	.label {
		font-size: 0.88em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.hint {
		font-size: 0.76em;
		color: var(--muted);
	}

	.bars {
		display: inline-flex;
		align-items: flex-end;
		gap: 0.12em;
		flex: none;
	}

	.bars i {
		width: 0.22em;
		border-radius: 1px;
		background: var(--border-bright);
	}

	.bars i.on {
		background: var(--tone);
	}
</style>
