import {Component, computed, inject, OnInit} from '@angular/core';
import {AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {MatButton} from '@angular/material/button';
import {MatError, MatFormField} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {TranslatePipe} from '@ngx-translate/core';
import {Notifier} from '../../../../communication/application/notifier';
import {CalendarDate} from '../../../../shared/domain/model/calendar-date';
import {Clock} from '../../../../shared/domain/services/clock';
import {FormCard} from '../../../../shared/presentation/components/form-card/form-card';
import {InventoryStore} from '../../../application/inventory.store';

@Component({
  imports: [ReactiveFormsModule, RouterLink, MatButton, MatFormField, MatError, MatInput, TranslatePipe, FormCard],
  selector: 'app-offer-form',
  styleUrl: './offer-form.css',
  templateUrl: './offer-form.html',
})
/**
 * View to put the units of a lot on offer at a special price during a period.
 */
export class OfferForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly inventory = inject(InventoryStore);
  private readonly clock = inject(Clock);
  private readonly router = inject(Router);
  private readonly notifier = inject(Notifier);

  /** First day an offer may start. */
  protected readonly minDate = this.clock.today().toString();
  /** Lots that have stock to offer. */
  protected readonly lots = computed(() => this.inventory.items().filter(item => item.quantity > 0));

  protected readonly form = this.fb.group({
    lotCode: ['', Validators.required],
    price: ['', [Validators.required, Validators.min(0.01)]],
    startsOn: [this.minDate, [Validators.required, (control: AbstractControl<string>) => this.inThePast(control)]],
    endsOn: ['', [Validators.required, (control: AbstractControl<string>) => this.beforeStart(control)]]
  });

  constructor() {
    this.form.controls.startsOn.valueChanges.subscribe(() => this.form.controls.endsOn.updateValueAndValidity());
  }

  ngOnInit(): void {
    this.inventory.loadInventory();
  }

  /**
   * Registers the offer and returns to the inventory history.
   */
  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.inventory.registerOffer({...value, price: Number(value.price)}).subscribe(() => {
      this.notifier.success('inventory.offer-form.saved');
      this.router.navigate(['/inventory/history']).then();
    });
  }

  private inThePast(control: AbstractControl<string>): ValidationErrors | null {
    return control.value && CalendarDate.of(control.value).isBefore(this.clock.today()) ? {past: true} : null;
  }

  private beforeStart(control: AbstractControl<string>): ValidationErrors | null {
    const startsOn = this.form?.controls.startsOn.value;
    return control.value && startsOn && CalendarDate.of(control.value).isBefore(CalendarDate.of(startsOn)) ? {beforeStart: true} : null;
  }
}
