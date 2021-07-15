import { Network, NetworkType } from '@airgap/beacon-sdk'
import { Injectable } from '@angular/core'
import {
  TezblockBlockExplorer,
  TezosProtocol,
  TezosProtocolNetwork,
  TezosProtocolNetworkExtras,
  TezosProtocolOptions
} from '@airgap/coinlib-core'
import { TezosNetwork } from '@airgap/coinlib-core/protocols/tezos/TezosProtocol'
import { NetworkType as AirGapNetworkType } from '@airgap/coinlib-core/utils/ProtocolNetwork'
import { Observable, ReplaySubject } from 'rxjs'

import { StorageKey, StorageService } from './storage.service'

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  public readonly _devSettingsEnabled: ReplaySubject<boolean> = new ReplaySubject(1)

  constructor(private readonly storageService: StorageService) {
    this.storageService
      .get(StorageKey.DEV_SETTINGS_ENABLED)
      .then((enabled: boolean) => {
        this._devSettingsEnabled.next(enabled)
      })
      .catch(console.error)
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
      [NetworkType.DELPHINET]: 'https://tezos-delphinet-node.prod.gke.papers.tech',
      [NetworkType.EDONET]: 'https://tezos-edonet-node.prod.gke.papers.tech',
      [NetworkType.FLORENCENET]: 'https://florence-tezos.giganode.io', // TODO: UPDATE TO PAPERS URL
      [NetworkType.CUSTOM]: ''
    }
    const apiUrls: { [key in NetworkType]: string } = {
      [NetworkType.MAINNET]: 'https://tezos-mainnet-conseil.prod.gke.papers.tech',
      [NetworkType.DELPHINET]: 'https://tezos-delphinet-conseil.prod.gke.papers.tech',
      [NetworkType.EDONET]: 'https://tezos-edonet-conseil.prod.gke.papers.tech',
      [NetworkType.FLORENCENET]: '', // TODO: ADD CONSEIL URL
      [NetworkType.CUSTOM]: ''
    }

    const names: { [key in NetworkType]: string } = {
      [NetworkType.MAINNET]: 'Mainnet',
      [NetworkType.DELPHINET]: 'Delphinet',
      [NetworkType.EDONET]: 'Edonet',
      [NetworkType.FLORENCENET]: 'Florencenet',
      [NetworkType.CUSTOM]: 'Custom'
    }
    const airgapNetworks: { [key in NetworkType]: AirGapNetworkType } = {
      [NetworkType.MAINNET]: AirGapNetworkType.MAINNET,
      [NetworkType.DELPHINET]: AirGapNetworkType.TESTNET,
      [NetworkType.EDONET]: AirGapNetworkType.TESTNET,
      [NetworkType.FLORENCENET]: AirGapNetworkType.TESTNET,
      [NetworkType.CUSTOM]: AirGapNetworkType.CUSTOM
    }
    const blockExplorers: { [key in Exclude<NetworkType, NetworkType.DELPHINET>]: string } = {
      [NetworkType.MAINNET]: 'https://tezblock.io',
      [NetworkType.EDONET]: 'https://edonet.tezblock.io',
      [NetworkType.FLORENCENET]: 'https://florencenet.tezblock.io',
      [NetworkType.CUSTOM]: 'https://florencenet.tezblock.io'
    }
    const tezosNetworks: { [key in Exclude<NetworkType, NetworkType.DELPHINET>]: TezosNetwork } = {
      [NetworkType.MAINNET]: TezosNetwork.MAINNET,
      [NetworkType.EDONET]: TezosNetwork.EDONET,
      [NetworkType.FLORENCENET]: TezosNetwork.FLORENCENET, // TODO: UPDATE IN COINLIB
      [NetworkType.CUSTOM]: TezosNetwork.EDONET
    }

    const name: string = names[network.type]
    const airgapNetwork: AirGapNetworkType = airgapNetworks[network.type]
    const blockExplorer: string = blockExplorers[network.type]
    const tezosNetwork: TezosNetwork = tezosNetworks[network.type]
    const rpcUrl: string = network.rpcUrl ? network.rpcUrl : rpcUrls[network.type]
    const apiUrl: string = apiUrls[network.type]

    return new TezosProtocol(
      new TezosProtocolOptions(
        new TezosProtocolNetwork(
          name,
          airgapNetwork,
          rpcUrl,
          new TezblockBlockExplorer(blockExplorer),
          new TezosProtocolNetworkExtras(tezosNetwork, apiUrl, tezosNetwork, 'airgap00391')
        )
      )
    )
  }
}
