import type { Actions } from './$types';
import { SERVER_URL } from '$env/static/private';

export const actions: Actions = {
	get_channel: async ({ request, fetch }) => {
		const data = await request.formData();

		const url = new URL(`/channel/${data.get('channel_name')}`, SERVER_URL);
		const res = await fetch(url);
		const json = await res.json();

		console.log(JSON.stringify(json, null, 2));
	}
};