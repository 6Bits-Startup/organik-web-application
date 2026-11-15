import {Component, inject} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {MatButton} from '@angular/material/button';
import {MatError, MatFormField} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {TranslatePipe} from '@ngx-translate/core';
import {Notifier} from '../../../../communication/application/notifier';
import {DomainError} from '../../../../shared/domain/model/domain-error';
import {STORAGE_CONDITIONS, StorageCondition} from '../../../../shared/domain/model/storage-condition';
import {FormCard} from '../../../../shared/presentation/components/form-card/form-card';
import {ConservationStore} from '../../../application/conservation.store';
import {ConservationRange} from '../../../domain/model/conservation-range';

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
  selector: 'app-zone-form',
  styleUrl: './zone-form.css',
  templateUrl: './zone-form.html',
})
/**
 * View to create a storage zone of the minimarket.
 */
export class ZoneForm {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly store = inject(ConservationStore);
  private readonly router = inject(Router);
  private readonly notifier = inject(Notifier);

  protected readonly storageConditions = STORAGE_CONDITIONS;

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    condition: ['' as StorageCondition | '', Validators.required]
  });

  /** Range the zone will keep, shown while the storage condition is chosen. */
  protected rangeOf(condition: StorageCondition | ''): ConservationRange | null {
    return condition ? ConservationRange.forCondition(condition) : null;
  }

  /**
   * Creates the zone and returns to the monitoring.
   */
  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const {name, condition} = this.form.getRawValue();
    try {
      this.store.createZone({name, condition: condition as StorageCondition}).subscribe({
        next: zone => {
          this.notifier.success('conservation.zone-form.saved', {name: zone.name});
          this.router.navigate(['/conservation']).then();
        },
        error: () => this.markNameInUse()
      });
    } catch (error) {
      if (!(error instanceof DomainError)) {
        throw error;
      }
      this.markNameInUse();
    }
  }

  private markNameInUse(): void {
    this.form.controls.name.setErrors({inUse: true});
    this.form.controls.name.markAsTouched();
  }
}
