import { Network } from '@airgap/beacon-sdk'
import { Injectable } from '@angular/core'
import { TezosProtocol } from '@airgap/coinlib-core'
import * as bip39 from 'bip39'
import { Observable, ReplaySubject } from 'rxjs'
import { Action, ExtensionMessageOutputPayload, WalletInfo, WalletType } from 'src/extension/extension-client/Actions'

import { ChromeMessagingService } from './chrome-messaging.service'

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private readonly _wallets: ReplaySubject<WalletInfo[]> = new ReplaySubject(1)
  private readonly _activeWallet: ReplaySubject<WalletInfo> = new ReplaySubject(1)
  private readonly _activeNetwork: ReplaySubject<Network> = new ReplaySubject(1)
  private readonly _selectedDerivationPath: ReplaySubject<string> = new ReplaySubject(1)

  public readonly wallets$: Observable<WalletInfo[]> = this._wallets.asObservable()
  public readonly activeWallet$: Observable<WalletInfo> = this._activeWallet.asObservable()
  public readonly activeNetwork$: Observable<Network> = this._activeNetwork.asObservable()
  public readonly selectedDerivationPath$: Observable<string> = this._selectedDerivationPath.asObservable()

  constructor(private readonly chromeMessagingService: ChromeMessagingService) {
    this.updateWallets().catch(console.error)
    this.loadNetwork().catch(console.error)
    this.chromeMessagingService
      .registerUpdateWalletCallback(this._wallets, () => {
        return this.updateWallets()
      })
      .catch(console.error)
  }

  public async updateWallets(): Promise<void> {
    this.getWallets().catch(console.error)
    this.getActiveWallet().catch(console.error)
  }

  public async loadNetwork(): Promise<void> {
    const data: ExtensionMessageOutputPayload<Action.ACTIVE_NETWORK_GET> = await this.chromeMessagingService.sendChromeMessage(
      Action.ACTIVE_NETWORK_GET,
      undefined
    )

    if (data.data) {
      this._activeNetwork.next(data.data.network)
    }
  }

  public async setNetwork(network: Network): Promise<void> {
    await this.chromeMessagingService.sendChromeMessage(Action.ACTIVE_NETWORK_SET, { network })
    await this.loadNetwork()
  }

  public async setDerivationPath(derivationPath: string): Promise<void> {
    await this.chromeMessagingService.sendChromeMessage(Action.DERIVATION_PATH_SET, { derivationPath: derivationPath })
    this._selectedDerivationPath.next(derivationPath)
  }

  public async getWallets(): Promise<void> {
    this.chromeMessagingService
      .sendChromeMessage(Action.WALLETS_GET, undefined)
      .then((response: ExtensionMessageOutputPayload<Action.WALLETS_GET>) => {
        if (response.data) {
          this._wallets.next(response.data.wallets)
        }
      })
      .catch(console.error)
  }

  public async getAllWallets(): Promise<WalletInfo<WalletType>[]> {
    return new Promise(resolve => {
      this.chromeMessagingService
        .sendChromeMessage(Action.WALLETS_GET, undefined)
        .then((response: ExtensionMessageOutputPayload<Action.WALLETS_GET>) => {
          if (response.data) {
            resolve(response.data.wallets)
          }
        })
        .catch(console.error)
    })
  }

  public async getActiveWallet(): Promise<void> {
    this.chromeMessagingService
      .sendChromeMessage(Action.ACTIVE_WALLET_GET, undefined)
      .then((response: ExtensionMessageOutputPayload<Action.ACTIVE_WALLET_GET>) => {
        if (response.data && response.data.wallet) {
          this._activeWallet.next(response.data.wallet)
        }
      })
      .catch(console.error)
  }

  public async saveMnemonic(mnemonic: string): Promise<void> {
    if (mnemonic && bip39.validateMnemonic(mnemonic)) {
      const {
        publicKey,
        address
      }: {
        privateKey: string
        publicKey: string
        address: string
      } = await this.mnemonicToAddress(mnemonic)
      const walletInfo: WalletInfo<WalletType.LOCAL_MNEMONIC> = {
        address,
        publicKey,
        type: WalletType.LOCAL_MNEMONIC,
        added: new Date().getTime(),
        info: {
          mnemonic
        }
      }

      await this.addAndActiveWallet(walletInfo)
    }
  }

  public async addAndActiveWallet(walletInfo: WalletInfo): Promise<void> {
    await this.chromeMessagingService.sendChromeMessage(Action.WALLET_ADD, { wallet: walletInfo })
    await this.chromeMessagingService.sendChromeMessage(Action.ACTIVE_WALLET_SET, { wallet: walletInfo })

    await this.updateWallets()
  }

  public async setActiveWallet(walletInfo: WalletInfo): Promise<void> {
    await this.chromeMessagingService.sendChromeMessage(Action.ACTIVE_WALLET_SET, { wallet: walletInfo })

    await this.getActiveWallet()
  }

  public async deleteWallet(walletInfo: WalletInfo): Promise<void> {
    await this.chromeMessagingService.sendChromeMessage(Action.WALLET_DELETE, { wallet: walletInfo })

    await this.updateWallets()
  }

  private async mnemonicToAddress(
    mnemonic: string
  ): Promise<{
    privateKey: string
    publicKey: string
    address: string
  }> {
    const protocol: TezosProtocol = new TezosProtocol()
    const privateKey: string = (
      await protocol.getPrivateKeyFromMnemonic(mnemonic, protocol.standardDerivationPath)
    ).toString('hex')

    const publicKey: string = await protocol.getPublicKeyFromMnemonic(mnemonic, protocol.standardDerivationPath)

    const address: string = (await protocol.getAddressFromPublicKey(publicKey)).getValue()

    return {
      privateKey,
      publicKey,
      address
    }
  }
}
