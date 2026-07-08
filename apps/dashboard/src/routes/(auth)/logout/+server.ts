import { redirect } from '@sveltejs/kit';
import { Auth } from '@template/core/user/auth';
// import { api } from '$lib/server/api';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, locals }) => {
	if (locals.token) await Auth.logout(locals.token);
	// if (locals.token) await api(locals.token).postAuthLogout();
	cookies.delete('token', { path: '/' });
	redirect(303, '/login');
};
