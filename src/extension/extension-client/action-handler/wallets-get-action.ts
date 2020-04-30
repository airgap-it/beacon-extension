import { Action, WalletInfo, WalletType } from '../Actions'
import { Logger } from '../Logger'

import { ActionContext, MessageHandlerFunction } from './ActionMessageHandler'

export const walletsGetAction: (logger: Logger) => MessageHandlerFunction<Action.WALLETS_GET> = (
  logger: Logger
): MessageHandlerFunction<Action.WALLETS_GET> => async (context: ActionContext<Action.WALLETS_GET>): Promise<void> => {
  logger.log('walletsGetAction', context.data)
  const wallets: WalletInfo<WalletType>[] = await context.storage.get('WALLETS' as any)
  context.sendResponse({ data: { wallets } })
}