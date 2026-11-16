<!--
	A row of radio chips for a remote form field. Each takes its label's tone: a dot while
	idle, a tint, border and icon once picked. Native radios, so arrow keys move the pick.
-->
<script lang="ts" generics="T extends string">
	import type { RemoteFormField } from '$app/server';
	import type { Label } from '../labels';

	let {
		field,
		options,
		fallback,
		label
	}: {
		field: RemoteFormField<string>;
		options: (Label & { value: T })[];
		fallback: T;
		label: string;
	} = $props();

	const hint = $derived(options.find((one) => one.value === (field.value() ?? fallback))?.hint);
</script>

<div class="choice" role="radiogroup" aria-label={label}>
	{#each options as option (option.value)}
		<label class="option" style:--tone="var(--{option.tone})">
			<input {...field.as('radio', option.value, option.value === fallback)} />
			<span class="mark" aria-hidden="true">
				<span class="dot"></span>
				<span class="icon"><option.icon size={15} strokeWidth={2} /></span>
			</span>
			{option.label}
		</label>
	{/each}
</div>
{#if hint}<p class="hint">{hint}</p>{/if}

<style>
	.choice {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: minmax(0, 1fr);
		gap: 0.4em;
	}

	.option {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.45em;
		min-height: var(--control);
		padding: 0 0.6em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--muted);
		font-size: 0.93em;
		font-weight: 500;
		white-space: nowrap;
		cursor: pointer;
		transition:
			background 0.12s ease,
			border-color 0.12s ease,
			color 0.12s ease;
	}

	.option:hover {
		border-color: var(--border-bright);
		color: var(--ink);
	}

	/* Picked: a wash and an edge in the tone, the text pulled toward ink so it stays AA. */
	.option:has(input:checked) {
		border-color: var(--tone);
		background: color-mix(in oklab, var(--tone) 14%, var(--surface));
		color: color-mix(in oklab, var(--tone) 75%, var(--ink));
		font-weight: 600;
	}

	.option:has(input:focus-visible) {
		outline: 2px solid var(--tone);
		outline-offset: 2px;
	}

	/* Hidden but focusable: the label is the control. */
	input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		pointer-events: none;
	}

	.mark {
		display: inline-grid;
		place-items: center;
		flex: none;
		width: 15px;
		height: 15px;
		color: var(--tone);
	}

	.dot {
		width: 0.5em;
		height: 0.5em;
		border-radius: 50%;
		background: var(--tone);
	}

	.icon {
		display: none;
		line-height: 0;
	}

	.option:has(input:checked) .dot {
		display: none;
	}

	.option:has(input:checked) .icon {
		display: block;
	}

	.hint {
		margin: 0;
		font-size: 0.8em;
		color: var(--dim);
	}
</style>
