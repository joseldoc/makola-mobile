import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface TabItem {
  id: string | number;
  label: string;
}

/**
 * Tabs — equal columns, never a gutter: labels touch each other.
 * No pressed state: the content change is enough.
 * Source: @makola Design System, components/navigation/Tabs.jsx.
 */
@Component({
  selector: 'app-tabs',
  template: `
    <div class="tabs" role="tablist" [style.grid-template-columns]="'repeat(' + items().length + ',1fr)'">
      @for (item of items(); track item.id) {
        <div
          class="tab"
          role="tab"
          [class.active]="item.id === value()"
          [attr.aria-selected]="item.id === value()"
          (click)="valueChange.emit(item.id)">
          {{ item.label }}
        </div>
      }
    </div>
  `,
  styleUrl: './tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabsComponent {
  /** Short labels, already translated: columns are equal and never overflow. */
  readonly items = input.required<TabItem[]>();
  readonly value = input.required<string | number>();
  readonly valueChange = output<string | number>();
}
