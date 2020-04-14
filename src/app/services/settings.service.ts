import { Network, NetworkType } from '@airgap/beacon-sdk/dist/types/Messages'
import { Injectable } from '@angular/core'
import { TezosProtocol } from 'airgap-coin-lib'
import { Observable, ReplaySubject } from 'rxjs'
import { Action, ExtensionMessageOutputPayload } from 'src/extension/Methods'

import { ChromeMessagingService } from './chrome-messaging.service'
import { StorageKey, StorageService } from './storage.service'

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  public readonly _devSettingsEnabled: ReplaySubject<boolean> = new ReplaySubject(1)

  constructor(
    private readonly storageService: StorageService,
    private readonly chromeMessagingService: ChromeMessagingService
  ) {
    this.storageService
      .get(StorageKey.DEV_SETTINGS_ENABLED)
      .then((enabled: boolean) => this._devSettingsEnabled.next(enabled))
      .catch(console.error)
  }

  public async getNetwork(): Promise<Network | undefined> {
    const data: ExtensionMessageOutputPayload<Action.ACTIVE_NETWORK_GET> = await this.chromeMessagingService.sendChromeMessage(
      Action.ACTIVE_NETWORK_GET,
      undefined
    )

    return data.data ? data.data.network : undefined
  }

  public async setNetwork(network: Network): Promise<void> {
    await this.chromeMessagingService.sendChromeMessage(Action.ACTIVE_NETWORK_SET, { network })
  }

  public getDevSettingsEnabled(): Observable<boolean> {
    return this._devSettingsEnabled.asObservable()
  }

  public setToggleDevSettingsEnabled(value: boolean): void {
    this._devSettingsEnabled.next(value)
    this.storageService.set(StorageKey.DEV_SETTINGS_ENABLED, value).catch(console.error)
  }

  public async getProtocolForNetwork(network: Network): Promise<TezosProtocol> {
    const rpcUrls: { [key in NetworkType]: string } = {
      [NetworkType.MAINNET]: 'https://tezos-node.prod.gke.papers.tech',
      [NetworkType.BABYLONNET]: 'https://tezos-babylonnet-node-1.kubernetes.papers.tech',
      [NetworkType.CARTHAGENET]: 'https://tezos-carthagenet-node-1.kubernetes.papers.tech',
      [NetworkType.CUSTOM]: ''
    }

    const apiUrls: { [key in NetworkType]: string } = {
      [NetworkType.MAINNET]: 'https://tezos-mainnet-conseil-1.kubernetes.papers.tech',
      [NetworkType.BABYLONNET]: 'https://tezos-babylonnet-conseil-1.kubernetes.papers.tech',
      [NetworkType.CARTHAGENET]: 'https://tezos-carthagenet-conseil-1.kubernetes.papers.tech',
      [NetworkType.CUSTOM]: ''
    }
    const rpcUrl: string = network.rpcUrl ? network.rpcUrl : rpcUrls[network.type]
    const apiUrl: string = apiUrls[network.type]

    return new TezosProtocol(rpcUrl, apiUrl)
  }
}
