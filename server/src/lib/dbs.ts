import { env } from "$/lib/env";
import { Deta } from "deta";
import Base from 'deta/dist/types/base';


export const deta = Deta(env.DETA_PROJECT_KEY);

let _channels: { [key: string]: Base } | null = null;

export const useDbs = (channels: Array<string>) => {
  if (!_channels) _channels = channels.reduce(
    (acc, channel) => ({ ...acc, [channel]: deta.Base(channel) }), {}
  ) as { [key: string]: Base }
  return _channels;
}