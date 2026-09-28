import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IonApp } from '@ionic/angular/ion-app';

import { LancementStore } from '@core/store/lancement/lancement.store';

@Component({
  selector: 'app-root',
  imports: [IonApp, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('makola-mobile');
  /** Retire l'écran de lancement natif à la fin de la première navigation. */
  private readonly lancement = inject(LancementStore);
}
