# MakolaMobile

A cross-platform mobile app built with [Angular](https://angular.dev) (v22) and [Capacitor](https://capacitorjs.com) (v8), targeting web, iOS, and Android from a single codebase.

## Prerequisites

- **Node.js** 20.19+ or 22.12+ (LTS recommended) and npm — [nodejs.org](https://nodejs.org)
- **Angular CLI** — installed automatically via `devDependencies`, but you can also install it globally with `npm install -g @angular/cli`
- For native builds:
  - **iOS**: macOS with [Xcode](https://developer.apple.com/xcode/) and [CocoaPods](https://cocoapods.org) installed
  - **Android**: [Android Studio](https://developer.android.com/studio) with the Android SDK configured

## Getting Started

1. Clone the repository:

   ```bash
   git clone git@github.com:joseldoc/makola-mobile.git
   cd makola-mobile
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

## Development Server

Start a local development server:

```bash
npm start
```

This runs `ng serve`. Once it's running, open your browser at `http://localhost:4200/`. The app automatically reloads whenever you modify source files.

## Building

Build the project for production:

```bash
npm run build
```

Build artifacts are output to `dist/makola-mobile/browser`. For a development build with source maps and no optimization:

```bash
npm run watch
```

This watches for file changes and rebuilds automatically using the `development` configuration.

## Running Tests

Run unit tests with [Vitest](https://vitest.dev/):

```bash
npm test
```

## Running on Mobile (iOS / Android)

This project uses [Capacitor](https://capacitorjs.com) to package the Angular app as a native mobile app.

1. Build the web app first, then sync the native projects with the latest web build:

   ```bash
   npm run build
   npx cap sync
   ```

2. Open the native project in its IDE:

   ```bash
   # iOS (requires Xcode, macOS only)
   npx cap open ios

   # Android (requires Android Studio)
   npx cap open android
   ```

3. Run the app from Xcode or Android Studio using a simulator/emulator or a connected device.

   Alternatively, run directly from the CLI:

   ```bash
   npx cap run ios
   npx cap run android
   ```

> **Note:** Re-run `npx cap sync` after every `npm run build` (or whenever you change native dependencies/config) to keep the `ios/` and `android/` projects up to date with the web app and Capacitor plugins.

## Code Scaffolding

Generate a new component using the Angular CLI:

```bash
ng generate component component-name
```

For a full list of available schematics (components, directives, pipes, etc.):

```bash
ng generate --help
```

## Project Structure

```
src/
├── app/           # Application source (components, routes, config)
├── index.html     # App entry HTML
├── main.ts        # App bootstrap
└── styles.scss    # Global styles
android/           # Native Android project (Capacitor)
ios/                # Native iOS project (Capacitor)
```

## Additional Resources

- [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli)
- [Capacitor Documentation](https://capacitorjs.com/docs)
