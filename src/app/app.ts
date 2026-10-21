import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IonApp } from '@ionic/angular/ion-app';

import { LaunchStore } from '@core/store/launch/launch.store';

@Component({
  selector: 'app-root',
  imports: [IonApp, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  /** Removes the native launch screen at the end of the first navigation. */
  private readonly launch = inject(LaunchStore);
}
