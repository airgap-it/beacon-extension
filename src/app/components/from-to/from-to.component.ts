import { Component, Input } from '@angular/core'
import { IAirGapTransaction } from '@airgap/coinlib-core'
import { FullOperationGroup } from 'src/extension/AirGapSigner'

@Component({
  selector: 'beacon-from-to',
  templateUrl: './from-to.component.html',
  styleUrls: ['./from-to.component.scss']
})
export class FromToComponent {
  @Input()
  public transactionsPromise: Promise<IAirGapTransaction[]> | undefined

  @Input()
  public operationGroupPromise: Promise<FullOperationGroup> | undefined

  public displayRawData: boolean = false
}
