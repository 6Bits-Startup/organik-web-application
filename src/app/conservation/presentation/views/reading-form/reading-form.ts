import {Component, inject, OnInit} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {MatButton} from '@angular/material/button';
import {MatError, MatFormField} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {TranslatePipe} from '@ngx-translate/core';
import {Notifier} from '../../../../communication/application/notifier';
import {DateTime} from '../../../../shared/domain/model/date-time';
import {FormCard} from '../../../../shared/presentation/components/form-card/form-card';
import {ConservationStore} from '../../../application/conservation.store';

@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButton,
    MatFormField,
    MatError,
    MatInput,
    TranslatePipe,
    FormCard
  ],
  selector: 'app-reading-form',
  styleUrl: './reading-form.css',
  templateUrl: './reading-form.html',
})
/**
 * View to record a temperature and humidity reading taken by the staff in a storage zone.
 */
export class ReadingForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly store = inject(ConservationStore);
  private readonly router = inject(Router);
  private readonly notifier = inject(Notifier);

  protected readonly zones = this.store.zones;

  protected readonly form = this.fb.group({
    zoneId: ['', Validators.required],
    temperature: [0, [Validators.required, Validators.min(-50), Validators.max(60)]],
    humidity: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    recordedAt: [new DateTime(new Date()).toDisplayString().replace(' ', 'T'), Validators.required]
  });

  ngOnInit(): void {
    this.store.loadConservation();
  }

  /**
   * Records the reading and returns to the monitoring.
   */
  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.store.recordReading(this.form.getRawValue()).subscribe(() => {
      this.notifier.success('conservation.reading-form.saved');
      this.router.navigate(['/conservation']).then();
    });
  }
}
