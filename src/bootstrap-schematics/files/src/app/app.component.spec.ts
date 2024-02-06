import { TestBed, async, ComponentFixture } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { NgOidcModule } from 'ng-oidc';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCheck, faFolderOpen, faCalculator
} from '@fortawesome/free-solid-svg-icons';
import { FooterComponent } from './comp/footer/footer.component';
import { NavbarComponent } from './comp/navbar/navbar.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { RouterTestingModule } from '@angular/router/testing';

describe('AppComponent', () => {

  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let faIconLibrary: FaIconLibrary;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        NavbarComponent,
        FooterComponent
      ],
      imports: [
        NgxSpinnerModule,
        FontAwesomeModule,
        RouterTestingModule,
        NgOidcModule.forRoot({ protectedApis: [], signOnStartup: false })
      ],
      providers: [FaIconLibrary]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    faIconLibrary = TestBed.inject(FaIconLibrary);
    faIconLibrary.addIcons(faCheck, faFolderOpen, faCalculator);
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it(`should have as title 'Angular'`, () => {
    expect(component.title).toEqual('Angular');
  });

  it('should render title', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('h2 span').textContent).toContain('Angular app is running !');
  });
});
