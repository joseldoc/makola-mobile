import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { BarTargetComponent } from './bar-target';

export type AppBarRole = 'prof' | 'parent' | 'etab' | 'neutre';

export interface AppBarAction {
  icon: string;
  label: string;
}

const ROLE: Record<AppBarRole, [fond: string, presse: string]> = {
  prof: ['var(--mk-role-prof)', 'var(--mk-role-prof-forme)'],
  parent: ['var(--mk-role-parent)', 'var(--mk-role-parent-forme)'],
  etab: ['var(--mk-role-etab)', 'var(--mk-role-etab-forme)'],
  neutre: ['var(--mk-role-neutre)', 'var(--mk-role-neutre-forme)']
};

/**
 * Barre d'app M3, 64 dp, sur la teinte du rôle. `scrolled` est obligatoire
 * dès que le contenu défile : sans lui la barre se confond avec la liste.
 * Source: @makola Design System, components/navigation/AppBar.jsx.
 */
@Component({
  selector: 'app-bar',
  imports: [BarTargetComponent],
  template: `
    <div
      class="app-bar"
      [class.tight]="showBack() || hasLeading()"
      [class.scrolled]="scrolled()"
      [style.background]="fond()"
      [style.gap]="showBack() ? 'var(--mk-esp-1)' : 'var(--mk-esp-3)'"
    >
      @if (showBack()) {
        <app-bar-target icon="chevron-back-outline" [tone]="presse()" label="Retour" (clicked)="back.emit()" />
      }
      <ng-content select="[leading]" />
      <div class="titles">
        <div class="title">{{ title() }}</div>
        @if (subtitle()) {
          <div class="subtitle">{{ subtitle() }}</div>
        }
      </div>
      @for (action of actions(); track $index) {
        <app-bar-target [icon]="action.icon" [tone]="presse()" [label]="action.label" (clicked)="actionSelected.emit($index)" />
      }
    </div>
  `,
  styleUrl: './app-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppBarComponent {
  /** 22 sp, graisse 400 — jamais en gras. */
  readonly title = input.required<string>();
  /** Établissement, classe, période. Toujours sous le titre. */
  readonly subtitle = input('');
  /** Détermine la teinte de fond. Le rôle de l'écran, pas un choix graphique. */
  readonly role = input<AppBarRole>('prof');
  readonly showBack = input(false);
  readonly back = output<void>();
  readonly actions = input<AppBarAction[]>([]);
  readonly actionSelected = output<number>();
  /** `true` dès que le contenu a défilé : ajoute le remplissage M3. */
  readonly scrolled = input(false);
  /** À mettre à `true` quand du contenu est projeté dans le slot `[leading]` (avatar, initiales). */
  readonly hasLeading = input(false);

  protected readonly fond = computed(() => ROLE[this.role()][0]);
  protected readonly presse = computed(() => ROLE[this.role()][1]);
}
