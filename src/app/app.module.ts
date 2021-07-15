import { HashLocationStrategy, LocationStrategy } from '@angular/common'
import { ErrorHandler, NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { RouteReuseStrategy } from '@angular/router'
import { IonicModule, IonicRouteStrategy } from '@ionic/angular'
import { NgxJsonViewerModule } from 'ngx-json-viewer'
import { MomentModule } from 'ngx-moment'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { SentryErrorHandler } from './classes/sentry-error-handler'
import { ComponentsModule } from './components/components.module'
import { PipesModule } from './pipes/pipes.module'
import { ProtocolsService } from './services/protocols.service'

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    ComponentsModule,
    PipesModule,
    MomentModule,
    NgxJsonViewerModule
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    { provide: ErrorHandler, useClass: SentryErrorHandler },
    ProtocolsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
