<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Field, Section, Select } from '@template/ui';
	import { Locales, Prefs, type Patch } from '@template/core/user/prefs';
	import { user } from '$lib/utils/context';
	import * as Header from '$lib/components/header';
	import { save } from '../api/prefs.remote';
	import ThemePicker from '../components/ThemePicker.svelte';
	import Formats from '../components/Formats.svelte';

	const me = user();

	// Local state, not `me.prefs` directly: binding a control to server data makes it
	// round-trip on every change, which shows up as a visible flicker. The parse also
	// narrows the context's structural type back to core's enums.
	let prefs = $state(Prefs.parse(me.prefs));

	const names = new Intl.DisplayNames(['en'], { type: 'language' });
	const locales = Locales.map((locale) => ({
		value: locale,
		label: names.of(locale) ?? locale
	}));

	async function pick(patch: Patch) {
		Object.assign(prefs, patch);
		// Repaint before the round trip — waiting on the network to change theme feels broken.
		if (patch.theme) document.documentElement.dataset.theme = patch.theme;
		await save(patch);
		// `command` doesn't invalidate loads, so the rest of the app would keep formatting
		// dates with the old preferences until the next navigation.
		await invalidateAll();
	}
</script>

<Header.Root title="Experience" lead="Theme, language and how dates read. Saved as you pick." />

<Section title="Appearance" description="A colour scheme, or whatever your device is set to.">
	<ThemePicker value={prefs.theme} onpick={(theme) => pick({ theme })} />
</Section>

<Section
	divider
	title="Language"
	description="How dates and numbers are written. The interface stays in English."
>
	<Field label="Language" style="max-width: 28em">
		<Select
			name="locale"
			options={locales}
			value={prefs.locale}
			onchange={(e) => pick({ locale: e.currentTarget.value as (typeof Locales)[number] })}
		/>
	</Field>
</Section>

<Section divider title="Date and time" description="How timestamps are shown across the app.">
	<Formats {prefs} onpick={pick} />
</Section>
