import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { NgxJsonViewerModule } from 'ngx-json-viewer'
import { MomentModule } from 'ngx-moment'

import { PipesModule } from '../pipes/pipes.module'

import { AddressRowComponent } from './address-row/address-row.component'
import { FromToComponent } from './from-to/from-to.component'
import { IdenticonComponent } from './identicon/identicon.component'

@NgModule({
  declarations: [IdenticonComponent, FromToComponent, AddressRowComponent],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PipesModule,
    MomentModule,
    NgxJsonViewerModule
  ],
  exports: [IdenticonComponent, FromToComponent, AddressRowComponent]
})
export class ComponentsModule {}
