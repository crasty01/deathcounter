import assert from 'assert';
import { ApiClient } from '@twurple/api';
import { authProvider } from '$/lib/auth'

const apiClient = new ApiClient({ authProvider: authProvider });

export const getCurrentGame = async (channelName: string) => {
  const channel = await apiClient.users.getUserByName(channelName);
  assert(channel?.id, 'missing \'channel.id\'')
  const channelInfo = await apiClient.channels.getChannelInfo(channel?.id)
  assert(channelInfo?.gameId, 'missing \'channelInfo.gameId\'')
  assert(channelInfo?.gameName, 'missing \'channelInfo.gameName\'')

  return {
    id: channelInfo?.gameId,
    name: channelInfo?.gameName,
  }
}
export const getUserStatus = async (user: string) => {
  const channel = await apiClient.moderation.getModerators

  return {
  }
}