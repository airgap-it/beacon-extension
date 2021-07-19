import {
  BeaconErrorType,
  BeaconMessageType,
  BroadcastRequestOutput,
  ChromeStorage,
  Network,
  NetworkType,
  OperationRequestOutput,
  PermissionRequestOutput,
  PermissionScope,
  SignPayloadRequestOutput
} from '@airgap/beacon-sdk'
import { ModalOptions } from '@ionic/core'
import { Component, OnInit } from '@angular/core'
import { AlertController, ModalController } from '@ionic/angular'
import { IAirGapTransaction, TezosProtocol } from '@airgap/coinlib-core'
import { take, takeUntil } from 'rxjs/operators'
import { ChromeMessagingService } from 'src/app/services/chrome-messaging.service'
import { WalletService } from 'src/app/services/local-wallet.service'
import { PopupService } from 'src/app/services/popup.service'
import { Action, ExtensionMessageOutputPayload, WalletInfo, WalletType } from 'src/extension/extension-client/Actions'
import { WalletChromeMessageTransport } from 'src/extension/extension-client/chrome-message-transport/WalletChromeMessageTransport'
import { AddLedgerConnectionPage } from '../add-ledger-connection/add-ledger-connection.page'
import { ErrorPage } from '../error/error.page'
import { AirGapOperationProvider, FullOperationGroup } from 'src/extension/AirGapSigner'
import { Subject } from 'rxjs'
import { DryRunPreviewPage } from '../dry-run-preview/dry-run-preview.page'

@Component({
  selector: 'beacon-request',
  templateUrl: './beacon-request.page.html',
  styleUrls: ['./beacon-request.page.scss']
})
export class BeaconRequestPage implements OnInit {
  public title: string = ''
  public protocol: TezosProtocol = new TezosProtocol()
  public readonly operationProvider: AirGapOperationProvider = new AirGapOperationProvider()
  public network: Network | undefined
  public walletType: WalletType | undefined
  public request:
    | PermissionRequestOutput
    | OperationRequestOutput
    | SignPayloadRequestOutput
    | BroadcastRequestOutput
    | undefined
  public requesterName: string = ''
  public address: string = ''
  public requestedNetwork: Network | undefined
  public inputs?: any
  public transactionsPromise: Promise<IAirGapTransaction[]> | undefined
  public operationGroupPromise: Promise<FullOperationGroup> | undefined

  public responseHandler: (() => Promise<void>) | undefined

  public transport: WalletChromeMessageTransport = new WalletChromeMessageTransport(
    'Spire',
    undefined as any,
    new ChromeStorage()
  )

  public confirmButtonText: string = 'Confirm'
  private unsubscribe = new Subject()

  constructor(
    private readonly popupService: PopupService,
    private readonly alertController: AlertController,
    private readonly modalController: ModalController,
    private readonly walletService: WalletService,
    private readonly chromeMessagingService: ChromeMessagingService
  ) {
    this.walletService.activeNetwork$.pipe(takeUntil(this.unsubscribe)).subscribe(async (network: Network) => {
      this.network = network
    })

    this.walletService.activeWallet$.pipe(take(1), takeUntil(this.unsubscribe)).subscribe((wallet: WalletInfo) => {
      this.address = wallet.address
    })
    if (this.walletType === WalletType.LEDGER) {
      this.confirmButtonText = 'Sign with Ledger'
    }
  }

  public async ngOnInit(): Promise<void> {
    console.log('new request', this.request)
    if (this.request && this.request.type === BeaconMessageType.PermissionRequest) {
      this.title = 'Permission Request'
      this.requesterName = this.request.appMetadata.name
      await this.permissionRequest(this.request)
    }

    if (this.request && this.request.type === BeaconMessageType.SignPayloadRequest) {
      this.title = 'Sign Payload Request'
      this.requesterName = this.request.appMetadata.name
      await this.signRequest(this.request)
    }

    if (this.request && this.request.type === BeaconMessageType.OperationRequest) {
      this.title = 'Operation Request'
      this.requesterName = this.request.appMetadata.name
      await this.operationRequest(this.request)
    }

    if (this.request && this.request.type === BeaconMessageType.BroadcastRequest) {
      this.title = 'Broadcast Request'
      this.requesterName = this.request.appMetadata.name
      await this.broadcastRequest(this.request)
    }
  }

  public async cancel(): Promise<void> {
    if (this.request) {
      await this.sendAbortedError(this.request)
    }
    this.dismiss().catch(console.error)
  }

  public async dismiss(): Promise<void> {
    this.modalController.dismiss().catch(console.error)
  }

  public async done(): Promise<void> {
    if (this.responseHandler) {
      await this.responseHandler()
    } else {
      await this.dismiss()
    }
  }

  public async performDryRun() {
    const operationDetails = (this.request as OperationRequestOutput).operationDetails
    const wrappedOperation = {
      branch: '',
      contents: operationDetails
    }
    const sourceAddress = (this.request as OperationRequestOutput).sourceAddress
    const wallets: WalletInfo<WalletType>[] | undefined = await this.walletService.getAllWallets()
    const wallet = wallets.find(wallet => wallet.address === sourceAddress)
    try {
      const dryRunPreview = await this.operationProvider.performDryRun(
        wrappedOperation,
        this.network ? this.network : { type: NetworkType.MAINNET },
        wallet
      )

      this.openModal(
        {
          component: DryRunPreviewPage,
          componentProps: {
            dryRunPreview: dryRunPreview
          }
        },
        false
      )
    } catch (error) {
      this.openModal({
        component: ErrorPage,
        componentProps: {
          title: error.name,
          message: error.message,
          data: error.stack
        }
      })
    }
  }
  private async openModal(modalOptions: ModalOptions, dismissParent = true): Promise<void> {
    const modal = await this.modalController.create(modalOptions)

    modal
      .onDidDismiss()
      .then(({ data: closeParent }) => {
        if (closeParent && dismissParent) {
          setTimeout(() => {
            this.dismiss()
          }, 500)
        }
      })
      .catch(error => console.error(error))

    return modal.present()
  }

  private async permissionRequest(request: PermissionRequestOutput): Promise<void> {
    this.requestedNetwork = request.network
    this.walletService.activeWallet$.pipe(take(1)).subscribe((wallet: WalletInfo) => {
      this.inputs = [
        {
          name: 'sign',
          type: 'checkbox',
          label: 'Sign transactions',
          value: 'sign',
          icon: 'create',
          checked: request.scopes.indexOf(PermissionScope.SIGN) >= 0
        },

        {
          name: 'operation_request',
          type: 'checkbox',
          label: 'Operation request',
          value: 'operation_request',
          icon: 'color-wand',
          checked: request.scopes.indexOf(PermissionScope.OPERATION_REQUEST) >= 0
        },

        {
          name: 'threshold',
          type: 'checkbox',
          label: 'Threshold',
          value: 'threshold',
          icon: 'code-working',
          checked: request.scopes.indexOf(PermissionScope.THRESHOLD) >= 0
        }
      ]

      this.responseHandler = async (): Promise<void> => {
        await this.sendResponse(request, {
          publicKey: wallet.publicKey,
          scopes: this.inputs.filter(input => input.checked).map(input => input.value)
        })
        await this.dismiss()
      }
    })
  }

  private async signRequest(request: SignPayloadRequestOutput): Promise<void> {
    this.responseHandler = async (): Promise<void> => {
      if (this.walletType === WalletType.LOCAL_MNEMONIC) {
        await this.sendResponse(request, {})
      } else {
        await this.openModal({
          component: AddLedgerConnectionPage,
          componentProps: {
            request,
            targetMethod: Action.RESPONSE
          }
        })
      }
    }
  }

  private async operationRequest(request: OperationRequestOutput): Promise<void> {
    this.transactionsPromise = this.protocol.getAirGapTxFromWrappedOperations({
      branch: '',
      contents: request.operationDetails as any // TODO Fix conflicting types from coinlib and beacon-sdk
    })

    const wrappedOperation = {
      branch: '',
      contents: request.operationDetails
    }

    this.operationGroupPromise = this.operationProvider.operationGroupFromWrappedOperation(
      wrappedOperation,
      this.network ? this.network : { type: NetworkType.MAINNET }
    )

    this.responseHandler = async (): Promise<void> => {
      if (this.walletType === WalletType.LOCAL_MNEMONIC) {
        await this.sendResponse(request, {})
      } else {
        await this.openModal({
          component: AddLedgerConnectionPage,
          componentProps: {
            request,
            targetMethod: Action.RESPONSE
          }
        })
      }
    }
  }

  private async broadcastRequest(request: BroadcastRequestOutput): Promise<void> {
    this.transactionsPromise = this.protocol.getTransactionDetailsFromSigned({
      accountIdentifier: '',
      transaction: request.signedTransaction
    })

    this.responseHandler = async (): Promise<void> => {
      await this.sendResponse(request, {})
    }
  }

  private async sendResponse(
    request: PermissionRequestOutput | OperationRequestOutput | SignPayloadRequestOutput | BroadcastRequestOutput,
    extras: unknown
  ): Promise<void> {
    const response: ExtensionMessageOutputPayload<Action.RESPONSE> = await this.chromeMessagingService.sendChromeMessage(
      Action.RESPONSE,
      {
        request,
        extras
      }
    )

    if (response && response.error) {
      const error: Error = response.error as Error
      const modal = await this.modalController.create({
        component: ErrorPage,
        componentProps: {
          title: error.name,
          message: error.message,
          data: error.stack
        }
      })

      modal
        .onDidDismiss()
        .then(({ data: closeParent }) => {
          if (closeParent) {
            setTimeout(() => {
              this.dismiss()
            }, 500)
          }
        })
        .catch(error => console.error(error))

      return modal.present()
    } else {
      this.popupService.close(0).catch(console.error)

      await this.showSuccessAlert()
      await this.dismiss()
    }
  }

  private async showSuccessAlert(buttons: { text: string; handler(): void }[] = []): Promise<void> {
    const alert: HTMLIonAlertElement = await this.alertController.create({
      header: 'Success!',
      message: 'The response has been sent back to the dApp.',
      buttons: [
        ...buttons,
        {
          text: 'Ok'
        }
      ]
    })

    await alert.present()
  }

  public async openBlockexplorer(address: string, hash: string): Promise<void> {
    let blockexplorer: string = this.protocol.options.network.blockExplorer.blockExplorer

    if (hash) {
      blockexplorer = await this.protocol.getBlockExplorerLinkForTxId(hash)
    } else if (address) {
      blockexplorer = await this.protocol.getBlockExplorerLinkForAddress(address)
    }

    this.openUrl(blockexplorer)
  }

  private openUrl(url: string): void {
    window.open(url, '_blank')
  }

  private async sendAbortedError(
    request: PermissionRequestOutput | OperationRequestOutput | SignPayloadRequestOutput | BroadcastRequestOutput
  ): Promise<void> {
    await this.sendResponse(request, {
      errorType: BeaconErrorType.ABORTED_ERROR
    })
  }

  ngOnDestroy() {
    this.unsubscribe.next()
    this.unsubscribe.complete()
  }
}
