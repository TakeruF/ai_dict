# Android release checklist

## Automated checks

Run these from the repository root:

```bash
npm ci
npm run lint
npm run android:check
```

For a Play Console artifact, build an App Bundle with `npm run android:bundle`.
For direct distribution, `npm run android:release` builds an APK.

## Versioning

`android/app/build.gradle` derives both `versionName` and `versionCode` from
`package.json`. The version-code mapping is `major * 10000 + minor * 100 +
patch`, so `0.4.0` is code `400`.

## Signing boundary

The existing public APKs are signed by the tracked development certificate:

```text
SHA-256: 6B:A1:A9:89:72:FB:0F:6D:09:74:13:77:F1:D0:18:8A:07:01:8A:AB:25:5D:8D:E4:08:34:1E:A7:FB:A2:86:3C
```

Changing the signing certificate makes an in-place update impossible for
existing direct-download installations. Do not silently rotate it. Before a
production or Play launch, choose and document one of these paths:

1. Preserve update continuity for current installations and protect the
   existing signing material as a release credential.
2. Move to a new production/Play key and clearly require existing users to
   uninstall and reinstall.

Never commit a new production keystore or its passwords.

## Store and device evidence

- Confirm the 512 px store icon in `store-assets/android/app-icon-512.png`.
- Capture at least two current phone screenshots from the release build.
- Check light mode, dark mode, system back, keyboard/insets, OAuth return, and
  at least one real dictionary lookup.
- Verify the launcher icon with circle and squircle masks, plus Android 13+
  themed icons.
- Inspect APK/AAB package ID, version, SDK levels, and signing certificate.
- Test the signed artifact on a physical Android device before publication.
- Recheck the privacy policy and Data safety answers against actual network and
  local-storage behavior.
