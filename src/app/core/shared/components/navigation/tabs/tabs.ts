import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface TabItem {
  id: string | number;
  label: string;
}

/**
 * Onglets — colonnes égales, jamais de gouttière : les libellés se touchent.
 * Aucun état pressé : le changement de contenu suffit.
 * Source: @makola Design System, components/navigation/Tabs.jsx.
 */
@Component({
  selector: 'app-tabs',
  template: `
    <div class="tabs" [style.grid-template-columns]="'repeat(' + items().length + ',1fr)'">
      @for (item of items(); track item.id) {
        <div class="tab" [class.active]="item.id === value()" (click)="valueChange.emit(item.id)">
          {{ item.label }}
        </div>
      }
    </div>
  `,
  styleUrl: './tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsComponent {
  /** Libellés courts : les colonnes sont égales et ne débordent pas. */
  readonly items = input.required<TabItem[]>();
  readonly value = input.required<string | number>();
  readonly valueChange = output<string | number>();
}
