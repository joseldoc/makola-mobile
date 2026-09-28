import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'makola-mobile',
  webDir: 'dist/makola-mobile/browser',
  plugins: {
    SplashScreen: {
      // Masqué par l'app (AppStore) dès le premier écran rendu : pas d'écran
      // blanc entre le lancement natif et Angular sur terminal lent.
      launchAutoHide: false,
      launchFadeOutDuration: 150,
      backgroundColor: '#1B4FD8',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    },
    StatusBar: {
      // Edge-to-edge sur les deux plateformes : `overlaysWebView: false` est
      // ignoré sur Android 15+ (edge-to-edge imposé), et sur iOS il laisse une
      // bande blanche au lieu de la teinte de rôle. La WebView passe donc sous
      // la barre de statut et `app-bar` réserve `--mk-zone-haut` (styles.scss).
      overlaysWebView: true,
      // `LIGHT` = icônes SOMBRES pour fond clair (`DARK` = icônes blanches).
      // Les fonds d'app-bar @makola sont des teintes de rôle claires.
      style: 'LIGHT'
    }
  }
};

export default config;
