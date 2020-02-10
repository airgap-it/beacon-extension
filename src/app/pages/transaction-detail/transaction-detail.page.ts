import { Component } from '@angular/core'
import { ActivatedRoute } from '@angular/router'
import { Platform } from '@ionic/angular'
import { getProtocolByIdentifier, IAirGapTransaction, ICoinProtocol } from 'airgap-coin-lib'

declare let cordova: any

@Component({
  selector: 'beacon-transaction-detail',
  templateUrl: './transaction-detail.page.html',
  styleUrls: ['./transaction-detail.page.scss']
})
export class TransactionDetailPage {
  public transaction: IAirGapTransaction | undefined

  constructor(private readonly platform: Platform, private readonly route: ActivatedRoute) {
    if (this.route.snapshot.data.special) {
      this.transaction = this.route.snapshot.data.special
    }
  }

  public openBlockexplorer(): void {
    if (!this.transaction) {
      return
    }
    const transaction: any = this.transaction
    const hash: string = transaction.hash

    const protocol: ICoinProtocol = getProtocolByIdentifier(this.transaction.protocolIdentifier)

    let blockexplorer: string = protocol.blockExplorer

    if (hash) {
      blockexplorer = protocol.getBlockExplorerLinkForTxId(hash)
    } else {
      blockexplorer = protocol.getBlockExplorerLinkForAddress(
        this.transaction.isInbound ? this.transaction.to[0] : this.transaction.from[0]
      )
    }
    this.openUrl(blockexplorer)
  }

  private openUrl(url: string): void {
    if (this.platform.is('ios') || this.platform.is('android')) {
      cordova.InAppBrowser.open(url, '_system', 'location=true')
    } else {
      window.open(url, '_blank')
    }
  }
}
