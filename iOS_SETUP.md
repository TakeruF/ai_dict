# iOS Setup Guide - Liquid Glass UI

This guide walks you through setting up the iOS app with native Liquid Glass UI components.

## Prerequisites

- macOS with Xcode 14+ installed
- Node.js 18+
- CocoaPods (installed via Xcode)
- Capacitor CLI (`npm install -g @capacitor/cli`)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Next.js Static Export

```bash
npm run build
```

This outputs the static site to `out/` directory, which Capacitor will serve.

### 3. Initialize iOS Project

If iOS project doesn't exist yet:

```bash
npx cap add ios
```

This creates the `ios/` folder with Xcode project structure.

### 4. Copy Native Components

The Swift components are already prepared in `ios/native-components/`:
- `LiquidGlassComponents.swift` - SwiftUI components (header, search, tabs)
- `LiquidGlassViewController.swift` - Custom view controller
- `LiquidGlassPlugin.swift` - Capacitor plugin for JS communication

**Manual Steps:**
1. Open Xcode project: `ios/App/App.xcworkspace`
2. Drag and drop `ios/native-components/*.swift` files into Xcode (check "Copy items if needed")
3. Ensure files are added to the `App` target

### 5. Update capacitor.config.ts

Already configured to:
- `webDir: 'out'` - Serves static export
- `ios.scheme: 'capacitor'`
- `ios.preferredContentMode: 'mobile'`

### 6. Sync Capacitor Configuration

```bash
npx cap sync ios
```

This copies web assets to native project and installs plugins.

### 7. Open in Xcode

```bash
npx cap open ios
```

Or manually:
```bash
open ios/App/App.xcworkspace
```

**Important:** Open `.xcworkspace`, NOT `.xcodeproj`

### 8. Configure Build Settings (if needed)

In Xcode:
1. Select `App` project in left sidebar
2. Go to Build Settings
3. Search for "Min Deployment Target"
4. Set to iOS 14.0 or higher (to support SwiftUI)

### 9. Build & Run

In Xcode:
1. Select simulator destination (e.g., "iPhone 15 Pro")
2. Press `Cmd + R` to build and run
3. Or use Product > Run menu

### Command Shortcuts

```bash
# Build + sync
npm run ios:sync

# Build + open Xcode
npm run ios:build && npm run ios:open

# Quick open
npm run ios:open
```

## Architecture

### Native UI (Swift)
- **LiquidGlassHeader**: Top navigation bar with "AI Dict" title
- **LiquidGlassSearchBar**: Search input with glass morphism effect
- **LiquidGlassTabBar**: Tab navigation (5 tabs with icons and labels)
- Uses `.ultraThinMaterial` for Apple Design System compliance

### WebView Communication
1. Native UI sends events → WebView listens via `window.addEventListener("liquidGlassEvent")`
2. WebView sends state → Native listens via Capacitor plugin
3. Hook `useLiquidGlassNative()` in React for bi-directional sync

### Styling
- **Liquid Glass Effect**: `UIBlurEffect` + `.ultraThinMaterial`
- **Rounded Corners**: 12pt radius (Apple standard)
- **Typography**: System fonts (San Francisco)
- **Colors**: Dynamic light/dark mode support

## Troubleshooting

### Issue: Swift files not found in Xcode
**Solution:** Manually add via Xcode menu:
- File > Add Files to "App"
- Select `ios/native-components/*.swift`
- Check "Copy items if needed" ✓

### Issue: "Cannot find module 'Capacitor'"
**Solution:** Run `npx cap sync ios` to install pods

### Issue: WebView is blank
**Solution:** 
1. Check that `out/` folder exists: `npm run build`
2. Run `npx cap sync ios` to copy assets
3. Check Capacitor logs in Xcode console

### Issue: Tab navigation not syncing
**Solution:** Ensure `useLiquidGlassNative()` hook is called in page.tsx

## Deploying to Physical Device

1. Connect iPhone via USB
2. In Xcode: Select your device in the build target dropdown
3. Create a development team:
   - Xcode > Settings > Accounts > Add Apple ID
4. Go to project Build Settings > Signing & Capabilities
5. Select your team in "Team"
6. Press `Cmd + R` to build to device

## Next Steps

1. **Test on Simulator**: Run and verify UI appears
2. **Verify WebView Communication**: Check browser console in Safari DevTools
3. **Customize Colors**: Edit `LiquidGlassComponents.swift` color values
4. **Add More Native Features**: Create additional Swift modules as needed

---

**For detailed info on Capacitor iOS:**
https://capacitorjs.com/docs/ios

**For SwiftUI & Material:**
https://developer.apple.com/design/human-interface-guidelines/glass

