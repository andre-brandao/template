<script lang="ts">
	import { Field, Section, Select, Status } from '@template/ui';
	import { Locales, Prefs, type Patch } from '@template/core/user/prefs';
	import { user } from '#lib/utils/context.ts';
	import * as Header from '#lib/components/header/index.ts';
	import { update } from '../api/prefs.query';
	import { swap } from '../theme';
	import ThemePicker from '../components/ThemePicker.svelte';
	import Formats from '../components/Formats.svelte';

	const me = user();
	const write = update();

	// The pick leads while it saves, then the stored prefs take over, so a failed save reverts.
	// The parse narrows the context's structural type back to core's enums.
	const prefs = $derived(
		Prefs.parse({ ...me.prefs, ...(write.isPending ? write.variables : undefined) })
	);

	const names = new Intl.DisplayNames(['en'], { type: 'language' });
	const locales = Locales.map((locale) => ({
		value: locale,
		label: names.of(locale) ?? locale
	}));

	function pick(patch: Patch) {
		const before = me.prefs.theme;
		if (patch.theme) swap(patch.theme);
		write.mutate(patch, { onError: () => swap(before) });
	}
</script>

<Header.Root title="Experience" lead="Theme, language and how dates read. Saved as you pick.">
	{#snippet actions()}<Status of={write} />{/snippet}
</Header.Root>

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
