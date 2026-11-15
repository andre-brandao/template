<script lang="ts">
	import { Combobox, Field, Select } from '@template/ui';
	import { Dates, Times, type Patch, type Prefs } from '@template/core/user/prefs';
	import { SAMPLE, date, local, stamp, time } from '$lib/utils/fmt';

	let { prefs, onpick }: { prefs: Prefs; onpick: (patch: Patch) => void } = $props();

	const here = local();
	// Four hundred names are only navigable by search, and the one being looked for is
	// almost always the one the reader is standing in — so it leads, then the rest.
	const zones = [here, ...Intl.supportedValuesOf('timeZone').filter((name) => name !== here)];

	// Twenty's trick: every option is labelled with the output it would produce.
	const dates = $derived(
		Dates.map((d) => {
			const label = date(SAMPLE, { ...prefs, date: d });
			if (d === 'system') return { value: d, label: 'System settings', hint: label };
			return { value: d, label };
		})
	);

	const times = $derived(
		Times.map((t) => {
			const label = time(SAMPLE, { ...prefs, time: t });
			if (t === 'system') return { value: t, label: 'System settings', hint: label };
			return { value: t, label };
		})
	);

	const pick = (e: Event) => {
		const el = e.currentTarget as HTMLSelectElement;
		if (el.name === 'date') return onpick({ date: el.value as Prefs['date'] });
		onpick({ time: el.value as Prefs['time'] });
	};
</script>

<div class="grid">
	<!-- `div`, not the default label: a label wrapping the trigger would toggle it twice. -->
	<Field label="Time zone" as="div">
		<Combobox
			items={zones}
			key={(name) => name}
			value={prefs.zone ?? here}
			label="Time zone"
			placeholder="Search zones"
			onchange={(zone) => onpick({ zone })}
		>
			{#snippet item(name, row)}
				<span class="name">{@render row.marked(name)}</span>
				{#if name === here}<span class="hint">Here</span>{/if}
			{/snippet}
			{#snippet empty()}No zone by that name.{/snippet}
		</Combobox>
	</Field>

	<Field label="Date format">
		<Select name="date" options={dates} value={prefs.date} onchange={pick} />
	</Field>

	<Field label="Time format">
		<Select name="time" options={times} value={prefs.time} onchange={pick} />
	</Field>
</div>

<p class="preview">{stamp(new Date(), prefs)}</p>

<style>
	.grid {
		display: flex;
		flex-direction: column;
		gap: 1em;
		max-width: 28em;
	}

	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Pushed to the trailing edge in both the trigger and the rows. */
	.hint {
		margin-inline-start: auto;
		padding-inline-start: 0.6em;
		color: var(--dim);
	}

	.preview {
		margin: 1em 0 0;
		font-family: var(--font-mono);
		font-size: 0.8em;
		color: var(--muted);
	}
</style>
