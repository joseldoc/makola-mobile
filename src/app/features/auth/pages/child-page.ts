import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';

import { AppBarComponent } from '@core/shared/components/navigation/app-bar/app-bar';
import { FooterActionComponent } from '@core/shared/components/actions/footer-action/footer-action';
import { OutlinedButtonComponent } from '@core/shared/components/actions/outlined-button/outlined-button';
import { IconComponent } from '@core/shared/components/foundation/icon/icon';

import { AuthFlowStore } from '../auth.store';

/**
 * Confirmation container: the linked child is shown BEFORE confirming, to avoid
 * linking to the wrong student (US-PA01).
 */
@Component({
  selector: 'app-child-page',
  imports: [AppBarComponent, FooterActionComponent, OutlinedButtonComponent, IconComponent, TranslocoPipe],
  templateUrl: './child-page.html',
  styleUrls: ['./auth-page.scss', './child-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChildPageComponent {
  protected readonly store = inject(AuthFlowStore);
  private readonly router = inject(Router);

  /** « ILUNGA Marie » → « Marie »: the first name is enough in a sentence. */
  protected readonly firstName = computed(() => {
    const name = this.store.invitation()?.student ?? '';
    return name.split(' ').slice(1).join(' ') || name;
  });

  protected confirm(): void {
    void this.router.navigateByUrl('/auth/invitation/phone');
  }

  protected goBack(): void {
    void this.router.navigateByUrl('/auth/invitation');
  }

  protected decline(): void {
    this.store.declineInvitation();
    void this.router.navigateByUrl('/auth/invitation');
  }
}
