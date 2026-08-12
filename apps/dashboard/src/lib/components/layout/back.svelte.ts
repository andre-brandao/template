// The sidebar's "Back" link should return to wherever the user entered the section from,
// not a fixed page. The section layout mounts once on entry and stays mounted while
// navigating within it, so `afterNavigate` sees the crossing: the first navigation whose
// origin lies outside `prefix` is where "Back" points. On a direct load or refresh there
// is no origin (`nav.from` is null) and the link falls back — never a dead button.
import { afterNavigate } from '$app/navigation';

export function origin(prefix: string, fallback: string) {
	let from = $state<string>();
	afterNavigate((nav) => {
		const url = nav.from?.url;
		if (url && !url.pathname.startsWith(prefix)) from = url.pathname + url.search;
	});
	return {
		get href() {
			return from ?? fallback;
		}
	};
}
