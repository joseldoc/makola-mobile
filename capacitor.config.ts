import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'makola-mobile',
  webDir: 'dist/makola-mobile/browser',
  plugins: {
    SplashScreen: {
      // Hidden by the app (LaunchStore) once the first screen has rendered: no
      // white screen between the native launch and Angular on a slow device.
      launchAutoHide: false,
      launchFadeOutDuration: 150,
      backgroundColor: '#1B4FD8',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    },
    StatusBar: {
      // Edge-to-edge on both platforms: `overlaysWebView: false` is ignored on
      // Android 15+ (edge-to-edge is enforced), and on iOS it leaves a white strip
      // instead of the role tint. So the WebView runs under the status bar and
      // `app-bar` reserves `--mk-safe-top` (styles.scss).
      overlaysWebView: true,
      // `LIGHT` = DARK icons for a light background (`DARK` = white icons).
      // @makola app bar backgrounds are light role tints.
      style: 'LIGHT'
    }
  }
};

export default config;
