import { NgModule } from '@angular/core'
import { PreloadAllModules, RouterModule, Routes } from '@angular/router'

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'pair',
    loadChildren: () => import('./pages/pair/pair.module').then(m => m.PairPageModule)
  },
  {
    path: 'local-mnemonic',
    loadChildren: () => import('./pages/local-mnemonic/local-mnemonic.module').then(m => m.ListPageModule)
  },
  {
    path: 'settings',
    loadChildren: () => import('./pages/settings/settings.module').then(m => m.SettingsPageModule)
  },
  {
    path: 'beacon-request',
    loadChildren: () => import('./pages/beacon-request/beacon-request.module').then(m => m.BeaconRequestPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule)
  },
  {
    path: 'permission-list',
    loadChildren: () =>
      import('./pages/permission-list/permission-list-routing.module').then(m => m.PermissionListPageRoutingModule)
  },
  {
    path: 'dry-run-preview',
    loadChildren: () => import('./pages/dry-run-preview/dry-run-preview.module').then(m => m.DryRunPreviewPageModule)
  }
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules, relativeLinkResolution: 'corrected' })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
