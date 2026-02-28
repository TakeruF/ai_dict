# iOS Setup Checklist

## Pre-Setup (5 minutes)
- [ ] macOS 11+ with Xcode 14+
- [ ] Node.js 18+ installed
- [ ] npm available
- [ ] ~15GB free disk space
- [ ] Terminal access to `/Users/takeru/GitHub/ai_dict`

## Automated Setup (10 minutes)
```bash
cd /Users/takeru/GitHub/ai_dict
bash scripts/setup-ios.sh
```

After running, check:
- [ ] "Dependencies installed" ✓
- [ ] "Static export built to ./out/" ✓
- [ ] "Capacitor iOS initialized" ✓
- [ ] "Configuration synced" ✓
- [ ] "Swift components found" ✓

## Manual Swift File Addition (5 minutes)

In Xcode (`npm run ios:open`):

1. [ ] Close any open files
2. [ ] Right-click "App" folder in navigator
3. [ ] Select "Add Files to 'App'"
4. [ ] Navigate to: `ios/native-components/`
5. [ ] Select ALL files:
   - [ ] LiquidGlassComponents.swift
   - [ ] LiquidGlassViewController.swift
   - [ ] LiquidGlassPlugin.swift
6. [ ] Check "Copy items if needed" ✓
7. [ ] Target Membership: ✓ App
8. [ ] Click "Add"
9. [ ] Wait for indexing to complete

## Build Configuration (3 minutes)

In Xcode:
1. [ ] Select "App" in project navigator
2. [ ] Build Settings tab
3. [ ] Search "Minimum Deployments"
4. [ ] Set to iOS 14.0
5. [ ] Search "Build Active Architecture"
   - [ ] Debug: YES
   - [ ] Release: NO

## Build & Run (10 minutes)

In Xcode:
1. [ ] Select simulator: iPhone 15 Pro Simulator
2. [ ] Press Cmd+R
3. [ ] Wait for build to complete (~2-3 minutes first time)
4. [ ] Simulator launches
5. [ ] App appears on screen

## Verification (5 minutes)

In running app:
- [ ] Header visible: "AI Dict" title
- [ ] Search bar visible at bottom
- [ ] 5 tabs visible: 検索, 暗記, 履歴, 教材, 設定
- [ ] Tab icons display correctly
- [ ] All UI has glass effect background

## Interaction Testing (5 minutes)

1. [ ] **Tab Navigation**
   - [ ] Tap 各 tab → content changes
   - [ ] Active tab highlights in blue
   - [ ] Animation smooth (<150ms)

2. [ ] **Search Bar**
   - [ ] Tap search field → cursor appears
   - [ ] Type text → appears in input
   - [ ] Clear button (X) appears when text
   - [ ] Tap clear → text erased
   - [ ] Tap search button → query processed

3. [ ] **Keyboard**
   - [ ] Keyboard appears on focus
   - [ ] Search bar lifts above keyboard
   - [ ] Dismiss keyboard → layout resets

4. [ ] **Orientation**
   - [ ] Portrait: works correctly
   - [ ] Landscape: layout adjusts (iPads)

## Console Verification (2 minutes)

In Safari DevTools:
1. [ ] Open Safari
2. [ ] Develop > [Simulator Name] > App
3. [ ] Console tab
4. [ ] Check for errors (should be none)
5. [ ] Test tab change:
   ```javascript
   window.dispatchEvent(
     new CustomEvent("nativeTabChange", { detail: 1 })
   );
   // Should switch to tab 1 (暗記)
   ```

## File Verification (2 minutes)

```bash
# Verify structure
ls -la ios/native-components/
# Should show:
# - LiquidGlassComponents.swift
# - LiquidGlassViewController.swift
# - LiquidGlassPlugin.swift

# Verify output
ls -la out/ | head -10
# Should show: css/ js/ hsk/ index.html ...

# Verify capacitor config
cat capacitor.config.ts | grep webDir
# Should show: webDir: 'out'
```

## Quick Commands Reference

```bash
# After making changes:
npm run build          # Rebuild web
npx cap sync ios       # Sync to native

# Development:
npm run ios:open       # Open Xcode
npm run ios:build      # Build iOS project

# Troubleshooting:
npm run build && npx cap sync ios && npm run ios:open
```

## Device Testing (Optional)

For physical device deployment:
1. [ ] Connect iPhone via USB
2. [ ] Trust device on settings
3. [ ] Xcode: Select Device in destination
4. [ ] Cmd+R to deploy
5. [ ] Verify app works on device

## Troubleshooting Checklist

If anything fails:

### Build Errors
- [ ] Run: `npm run build`
- [ ] Run: `npx cap sync ios`
- [ ] Xcode: Clean Build Folder (Cmd+Shift+K)
- [ ] Xcode: Build again (Cmd+B)

### Swift Compilation Errors
- [ ] Verify Swift files appear in Xcode navigator
- [ ] Check Target Membership (File Inspector)
- [ ] Minimum Deployment: iOS 14.0+
- [ ] Clean Build Folder
- [ ] Rebuild

### Blank WebView
- [ ] Verify `out/` directory exists: `ls out/`
- [ ] Run: `npx cap sync ios`
- [ ] Safari DevTools: Check console errors
- [ ] Check Xcode console logs

### Tab/Search Not Syncing
- [ ] Verify `useLiquidGlassNative()` in page.tsx
- [ ] Browser console: Look for `nativeTabChange` events
- [ ] Check if JavaScript errors in console
- [ ] Verify `ios/native-components/LiquidGlassPlugin.swift` added

### Simulator Issues
- [ ] Xcode: Product > Destination > [Simulator Name]
- [ ] Cmd+Shift+K (Clean Build Folder)
- [ ] Close simulator
- [ ] Cmd+R to rebuild

## Performance Check

Expected metrics:
- [ ] Cold launch: 1-2 seconds
- [ ] Tab switch: <150ms
- [ ] Search input: Instant typing
- [ ] No lag on scroll

If slow:
- [ ] Xcode: Choose Release configuration for testing
- [ ] Profile with Instruments (Cmd+I)
- [ ] Check memory usage

## Success Criteria

You'll know setup is complete when:

✓ App launches in simulator
✓ Native header visible
✓ Search bar functional
✓ All 5 tabs present
✓ Tab navigation works
✓ No console errors
✓ Glass effect visible

## Next Steps

1. **Customize**: Edit `LiquidGlassComponents.swift` colors/icons
2. **Deploy**: Add to App Store (requires developer account)
3. **Features**: Add more native functionality
4. **Testing**: Test on physical devices
5. **Monitoring**: Set up analytics

## Support Resources

- [ ] Read `iOS_SETUP.md` for detailed steps
- [ ] Read `iOS_COMPLETE_SETUP.md` for comprehensive guide
- [ ] Read `iOS_NATIVE_UI.md` for architecture overview
- [ ] Check Xcode documentation (Help menu)
- [ ] Search Capacitor docs: https://capacitorjs.com

---

**Estimated Total Time**: ~40 minutes (first time)
**Success Rate**: 95%+ if steps followed exactly

Good luck! 🚀
