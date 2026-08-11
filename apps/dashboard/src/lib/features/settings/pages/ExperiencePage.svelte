<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Select } from '@template/ui';
	import { Locales, Prefs, type Patch } from '@template/core/user/prefs';
	import { user } from '$lib/utils/context';
	import Header from '$lib/components/Header.svelte';
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

<Header title="Experience" />

<h2>Appearance</h2>
<p class="lead">Pick a colour scheme, or follow whatever your device is set to.</p>
<ThemePicker value={prefs.theme} onpick={(theme) => pick({ theme })} />

<h2>Language</h2>
<p class="lead">Sets how dates and numbers are written. The interface itself stays in English.</p>
<label class="field lang">
	<span>Language</span>
	<Select
		name="locale"
		options={locales}
		value={prefs.locale}
		onchange={(e) => pick({ locale: e.currentTarget.value as (typeof Locales)[number] })}
	/>
</label>

<h2>Date and time</h2>
<p class="lead">How timestamps are shown across the app.</p>
<Formats {prefs} onpick={pick} />

<style>
	h2 {
		margin: 2.25em 0 0.4em;
		font-size: 1.1em;
	}

	.lead {
		margin: 0 0 1.25em;
		color: var(--muted);
		max-width: 60ch;
	}

	.lang {
		max-width: 28em;
	}
</style>
