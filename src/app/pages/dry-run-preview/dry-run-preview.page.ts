import { Component, Input } from '@angular/core'
import { ModalController } from '@ionic/angular'

@Component({
  selector: 'app-dry-run-preview',
  templateUrl: './dry-run-preview.page.html',
  styleUrls: ['./dry-run-preview.page.scss']
})
export class DryRunPreviewPage {
  @Input()
  public dryRunPreview: string | undefined

  constructor(private readonly modalController: ModalController) {}

  public async dismiss(): Promise<void> {
    await this.modalController.dismiss(true)
  }
}
