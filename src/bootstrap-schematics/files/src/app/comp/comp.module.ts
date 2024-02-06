import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {UnauthorizedComponent} from './unauthorized/unauthorized.component';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  imports: [
    CommonModule,
    FontAwesomeModule
  ],
  declarations: [
    UnauthorizedComponent,
    NavbarComponent,
    FooterComponent
  ],
  exports: [
    NavbarComponent,
    FooterComponent
  ],
  entryComponents: []
})
export class CompModule { }
