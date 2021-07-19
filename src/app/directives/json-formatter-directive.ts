import { ElementRef, OnChanges } from '@angular/core'
import { Directive, Input } from '@angular/core'
import JSONFormatter from 'json-formatter-js'

@Directive({
  selector: 'json-formatter'
})
export class JsonFormatterDirective implements OnChanges {
  @Input() json: any

  constructor(private elRef: ElementRef) {}

  ngOnChanges() {
    if (this.json) {
      const config = {
        hoverPreviewEnabled: true,
        hoverPreviewArrayCount: 100,
        hoverPreviewFieldCount: 5
      }
      const levelsOpen = Infinity
      const formatter = new JSONFormatter(this.json, levelsOpen, config)
      this.elRef.nativeElement.appendChild(formatter.render())
    }
  }
}
