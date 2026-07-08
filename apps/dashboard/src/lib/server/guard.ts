import { error, invalid } from '@sveltejs/kit';
import { VisibleError } from '@template/core/error';

/**
 * Schema validation only catches malformed input — business errors (invalid
 * credentials, not found, ...) are only known once the core function actually
 * runs. This turns a thrown `VisibleError` into a form-wide `invalid()` issue,
 * shown via `fields.allIssues()`; anything else fails as a normal SvelteKit
 * error response.
 */
export async function guard<T>(fn: () => Promise<T>): Promise<T> {
	try {
		return await fn();
	} catch (err) {
		if (err instanceof VisibleError) invalid(err.message);
		error(500, 'Internal Error');
	}
}
