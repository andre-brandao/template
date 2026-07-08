import { form, getRequestEvent } from '$app/server';
import { redirect } from '@sveltejs/kit';
import { Auth } from '@template/core/user/auth';
import { guard } from '$lib/server/guard';
// import { api } from '$lib/server/api';

function session(token: string) {
	getRequestEvent().cookies.set('token', token, { path: '/', maxAge: 60 * 60 * 24 * 30, httpOnly: true });
	redirect(303, '/todos');
}

export const login = form(Auth.login.schema, async (input) => {
	const { token } = await guard(() => Auth.login(input));
	session(token);

	// API/SDK version, kept as an example of calling the HTTP API instead of core directly:
	// const { data, error } = await api().postAuthLogin(input);
	// if (error) return { message: error.message };
	// session(data.token);
});

export const register = form(Auth.register.schema, async (input) => {
	const { token } = await guard(() => Auth.register(input));
	session(token);

	// const { data, error } = await api().postAuthRegister(input);
	// if (error) return { message: error.message };
	// session(data.token);
});
