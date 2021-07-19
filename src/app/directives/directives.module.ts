import { NgModule } from '@angular/core'
import { JsonFormatterDirective } from './json-formatter-directive'

@NgModule({
  exports: [JsonFormatterDirective],
  declarations: [JsonFormatterDirective]
})
export class DirectivesModule {}
