<script lang="ts">
	import { Field, Select } from '@template/ui';
	import { Dates, Times, type Patch, type Prefs } from '@template/core/user/prefs';
	import { SAMPLE, date, local, stamp, time } from '$lib/utils/fmt';

	let { prefs, onpick }: { prefs: Prefs; onpick: (patch: Patch) => void } = $props();

	const zone = [
		{ value: '', label: 'Local time', hint: local() },
		{ value: 'UTC', label: 'UTC' }
	];

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
		if (el.name === 'zone') return onpick({ zone: el.value || null });
		if (el.name === 'date') return onpick({ date: el.value as Prefs['date'] });
		onpick({ time: el.value as Prefs['time'] });
	};
</script>

<div class="grid">
	<Field label="Time zone">
		<Select name="zone" options={zone} value={prefs.zone === 'UTC' ? 'UTC' : ''} onchange={pick} />
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

	.preview {
		margin: 1em 0 0;
		font-family: var(--font-mono);
		font-size: 0.8em;
		color: var(--muted);
	}
</style>
