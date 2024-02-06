import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {UnauthorizedComponent} from './comp/unauthorized/unauthorized.component';
import {AuthRoleGuard} from 'ng-oidc';
import { AppComponent } from './app.component';


const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomeModule),
    canActivate: [AuthRoleGuard]
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '', component: AppComponent, canActivate: [AuthRoleGuard] },
  { path: 'denied', component: UnauthorizedComponent },
  { path: '**', component: AppComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
