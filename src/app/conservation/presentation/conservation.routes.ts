import { Routes } from '@angular/router';
import { manageGuard } from '../../iam/presentation/guards/auth.guard';

const conservationMonitoring = () =>
  import('./views/conservation-monitoring/conservation-monitoring').then(m => m.ConservationMonitoring);

const conservationAlerts = () =>
  import('./views/conservation-alerts/conservation-alerts').then(m => m.ConservationAlerts);

const zoneForm = () =>
  import('./views/zone-form/zone-form').then(m => m.ZoneForm);

const readingForm = () =>
  import('./views/reading-form/reading-form').then(m => m.ReadingForm);

export const CONSERVATION_ROUTES: Routes = [
  { path: '',             loadComponent: conservationMonitoring, title: 'nav.conservation' },
  { path: 'alerts',       loadComponent: conservationAlerts,     title: 'conservation.alerts.title' },
  { path: 'zones/new',    loadComponent: zoneForm,    canActivate: [manageGuard('conservation')], title: 'conservation.zone-form.title' },
  { path: 'readings/new', loadComponent: readingForm, canActivate: [manageGuard('conservation')], title: 'conservation.reading-form.title' }
];
