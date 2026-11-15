import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {provideTranslateService} from '@ngx-translate/core';
import {provideTranslateHttpLoader} from '@ngx-translate/http-loader';
import {environment} from '../environments/environment';
import {iamInterceptor} from './iam/infrastructure/iam.interceptor';
import {PLATFORM_API_ENABLED} from './shared/infrastructure/platform-api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([iamInterceptor])),
    {provide: PLATFORM_API_ENABLED, useValue: true},
    provideTranslateService({
      loader: provideTranslateHttpLoader({prefix: './i18n/', suffix: '.json'}),
      lang: environment.defaultLanguage,
      fallbackLang: 'en'
    })
  ]
};
