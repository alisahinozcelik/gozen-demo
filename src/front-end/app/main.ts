/// <reference path="../front-end.d.ts" />
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { ENVIRONMENT } from './app.constants';
import { AppModule } from './app.module';

if (!ENVIRONMENT.isDev) {
	enableProdMode();
}

const platform = platformBrowserDynamic();

platform.bootstrapModule(AppModule);