import type { PageServerLoad } from './$types';
import { PUBLIC_SERVER_URL } from '$env/static/public';

type Data = {
  channel_id: string;
  channel_name: string;
  channel_display_name: string;
  game_id: string;
  game_name: string;
  deaths: number;
}

export const load: PageServerLoad = async ({ fetch, params }) => {
	const url = new URL(`/channel/${params.channel_id}`, PUBLIC_SERVER_URL);
	const res = await fetch(url);
	const data = await res.json() as Data;

	return data;
}