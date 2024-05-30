import { AccessToken, RefreshingAuthProvider } from '@twurple/auth';
import type { Sql } from "postgres";
import { crypto } from "https://deno.land/std@0.224.0/crypto/crypto.ts";
import { AccessTokenTableRow, AuthProviderOptions } from "/types.ts";

export default class AuthProvider {
	#sql: Sql;
	#options: AuthProviderOptions;
	#provider: RefreshingAuthProvider;

	constructor(sql: Sql, options: AuthProviderOptions) {
		this.#sql = sql;
		this.#options = options;

		this.#provider = new RefreshingAuthProvider({
			clientId: this.#options.client_id,
			clientSecret: this.#options.client_secret,
			appImpliedScopes: this.#options.scope,
		});

		this.#provider.onRefresh((user_id, token) => this.on_refresh(user_id, token));
	}
	
	get provider() {
		return this.#provider;
	}
	
	get sql() {
		return this.#sql;
	}

	async initialize() {
		await this.#sql`
			create table if not exists access_tokens (
				user_id text primary key,
				access_token text not null,
				refresh_token text not null,
				scope text[] not null,
				expires_in integer,
				obtainment_timestamp bigint not null
			);`;
	}

	async get_token_from_database(user_id: string): Promise<AccessToken | undefined> {
		const [token] = await this.#sql<[AccessTokenTableRow?]>`select * from access_tokens where user_id = ${ user_id }`;

		return token && {
			expiresIn: token.expires_in,
			obtainmentTimestamp: token.obtainment_timestamp,
			refreshToken: await this.decrypt(user_id, token.refresh_token),
			accessToken: await this.decrypt(user_id, token.access_token),
			scope: token.scope,
		}
	}

	async add_user(user_id: string) {
		const token = await this.get_token_from_database(user_id);

		if (token) {
			this.#provider.addUser(user_id, token);
			return true;
		} else {
			console.error('[ERROR]: unknown user');
			return false;
		}
	}

	async add_user_for_token(token: AccessToken) {
		return await this.#provider.addUserForToken({
			...token,
			expiresIn: 0, // for instant refresh and thus save to database
		});
	}

	async on_refresh(this: AuthProvider, user_id: string, token: AccessToken) {
		await this.sql`insert into access_tokens ${ this.sql({
			user_id: user_id,
			access_token: await this.encrypt(user_id, token.accessToken),
			refresh_token: token.refreshToken && await this.encrypt(user_id, token.refreshToken),
			scope: this.sql.array(token.scope),
			expires_in: token.expiresIn,
			obtainment_timestamp: token.obtainmentTimestamp,
		}) }
		on conflict (user_id) 
		do update set 
			access_token = excluded.access_token,
			refresh_token = excluded.refresh_token,
			scope = excluded.scope,
			expires_in = excluded.expires_in,
			obtainment_timestamp = excluded.obtainment_timestamp;
		`;
	}



	private async derive_key(user_id: string, key_length: number = 256): Promise<CryptoKey> {
		const encoder = new TextEncoder();
		const user_id_bytes = encoder.encode(user_id);
		const key_material = await crypto.subtle.importKey(
			"raw",
			user_id_bytes,
			{ name: "PBKDF2" },
			false,
			["deriveKey"]
		);
		return await crypto.subtle.deriveKey(
			{
				name: "PBKDF2",
				salt: user_id_bytes,
				iterations: 100000,
				hash: "SHA-256"
			},
			key_material,
			{ name: "AES-GCM", length: key_length },
			false,
			["encrypt", "decrypt"]
		);
	}
	
	private async encrypt(user_id: string, token: string): Promise<string> {
		const key = await this.derive_key(user_id);
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const encoder = new TextEncoder();
		const token_bytes = encoder.encode(token);
		const cipher_text = await crypto.subtle.encrypt(
			{ name: "AES-GCM", iv },
			key,
			token_bytes
		);
		const iv_and_cipher_text = new Uint8Array(iv.length + cipher_text.byteLength);
		iv_and_cipher_text.set(iv);
		iv_and_cipher_text.set(new Uint8Array(cipher_text), iv.length);
		return btoa(String.fromCharCode(...iv_and_cipher_text));
	}
	
	private async decrypt(user_id: string, encrypted_token: string): Promise<string> {
		const key = await this.derive_key(user_id);
		const iv_and_cipher_text = Uint8Array.from(atob(encrypted_token), c => c.charCodeAt(0));
		const iv = iv_and_cipher_text.slice(0, 12);
		const cipher_text = iv_and_cipher_text.slice(12);
		const decrypted_token_bytes = await crypto.subtle.decrypt(
			{ name: "AES-GCM", iv },
			key,
			cipher_text
		);
		const decoder = new TextDecoder();
		return decoder.decode(decrypted_token_bytes);
	}

}





// GET https://id.twitch.tv/oauth2/authorize?client_id=quhzcu84hdnzgl3p71zcbbsp71l1ai&redirect_uri=http://localhost&response_type=code&scope=chat:read+chat:edit
// POST https://id.twitch.tv/oauth2/token?client_id=quhzcu84hdnzgl3p71zcbbsp71l1ai&client_secret=liqu0bx91vf50j3sudmebk8ltzgbm9&code=5m43hk031a7fh5ncj2ev3lt2xs8g48&grant_type=authorization_code&redirect_uri=http://localhost