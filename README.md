# Angular Schematics for Bootstrap

List of tools to add Bootstrap to an Angular project with @ng-bootstrap/ng-bootstrap and basic scss override. It does write in angular.json config file and can remove the default styles.css file. Can also run Font Awesome install, Ngx-Spinner and Ng-Oidc.

## Dependencies

You need global install of Typescript and tslint
```bash
npm install tslint typescript -g
```
### Compatiblity table
Target Angular versions :

|Version|Angular|
|-------|-------|
|1.0.x  |9.0.x  |
|1.1.x  |9.1.x  |
|1.2.x  |9.1.x  |
|2.0.x  |10.0.x  |
|3.0.x  |11.2.x  |
|4.0.x  |12.2.x  |

|library|version|ng-add|
|-------|-------|------|
|ng-bootstrap-schematics|4.0.x|:heavy_check_mark:|
|Angular|12.2.x|:x:|
|Bootstrap|4.5.x|:x:|
|@ng-bootstrap/ng-bootstrap|10.0.0|:x:|
|@fortawesome/angular-fontawesome|0.9.x|:heavy_check_mark:|
|@ngneat/transloco|3.0.6|:heavy_check_mark:|
|oidc-client|1.11.5|:x:|
|ngx-spinner|11.0.0|:x:|
|x|x|x|



## Using Shematics

- Create a new project with Angular CLI (check that you build with the proper main version)
- Simply add the package
```bash
ng new myApp
cd myApp
ng add ng-bootstrap-schematics
```
- Eventually remove the current package

### List of options
All options are considered true, without prompt.

- removeStyles : When true, removes the default syles.css in root folder
- replaceAppTemplate : When true, replaces the app.component and adds other classic bootstrap components
- installFontAwesome : When true, installs font awesome and minimal config
- installTransloco : Auto install Transloco i18n library, with default "fr" and "en" langs
- installSpinner :  When true, installs ngx-spinner and minimal config
- installOidc :  When true, installs ng-oidc and minimal config

### Spinner
- If you choose this option, it will print the spinner component in app.component.html template, and you will have to call the spinner when needed.
- Check documentation : https://github.com/Napster2210/ngx-spinner
```js
  constructor(private spinner: NgxSpinnerService) {}

  ngOnInit() {
    /** spinner starts on init */
    this.spinner.show();
  }
```

### Option OIDC
- This will install the standard oidc client library and inject the main service in app.component contructor.
- You need to call the methods.
- TODO : automate service call and error handling.
- IMPORTANT : the configuration.json file provided is a test file, it must be replaced with a real one.
```js
 ngOnInit(): void {
    this.user$ = this.auth.getUser();
  }
```

### Option Font Awesome

- If you choose this option, just call, where needed, the service method under /shared/services/utils.service. It does use free-solid icon package by default, and adds faCheck icon via the library.
- Check documentation : https://github.com/FortAwesome/angular-fontawesome
```js
import {FaIconLibrary} from '@fortawesome/angular-fontawesome';
import {
  faCheck
} from '@fortawesome/free-solid-svg-icons';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  constructor(private faIconLibrary: FaIconLibrary) { }
  initFaIcons(): void {
    this.faIconLibrary.addIcons(
      faCheck
    );
  }
}
```

### Testing

To test locally, install `@angular-devkit/schematics-cli` globally and use the `schematics` command line tool. That tool acts the same as the `generate` command of the Angular CLI, but also has a debug mode.

Check the documentation with
```bash
schematics --help
```

Run these tasks locally to see the results of schematics in the sandbox app :
```bash
npm run build
npm run link:schematic
npm run test
```
Or run without app tests :
```bash
npm run buildschematics
```
Or any of the individual schematics :
```bash
npm run buildschematics:sp
npm run buildschematics:fa
etc...
```

### Unit Testing

`npm run test` will run the unit tests, using Jasmine as a runner and test framework.

### Publishing

To publish, simply do:

```bash
npm run build
npm run publishpackage
```

That's it!
 