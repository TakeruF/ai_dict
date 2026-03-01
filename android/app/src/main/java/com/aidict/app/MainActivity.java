package com.aidict.app;

import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Enable edge-to-edge display
        setupEdgeToEdge();
    }
    
    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        // Update status bar icons when theme changes
        updateSystemBarAppearance();
    }
    
    private void setupEdgeToEdge() {
        Window window = getWindow();
        
        // Enable edge-to-edge mode
        WindowCompat.setDecorFitsSystemWindows(window, false);
        
        // Make status bar and navigation bar transparent
        window.setStatusBarColor(android.graphics.Color.TRANSPARENT);
        window.setNavigationBarColor(android.graphics.Color.TRANSPARENT);
        
        // Set appropriate status bar icons based on theme
        updateSystemBarAppearance();
        
        // For Android 10+ enable gesture navigation support
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setNavigationBarContrastEnforced(false);
        }
    }
    
    private void updateSystemBarAppearance() {
        Window window = getWindow();
        View decorView = window.getDecorView();
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(window, decorView);
        
        // Check if dark mode is enabled
        int nightModeFlags = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        boolean isDarkMode = nightModeFlags == Configuration.UI_MODE_NIGHT_YES;
        
        // Light icons for dark mode, dark icons for light mode
        controller.setAppearanceLightStatusBars(!isDarkMode);
        controller.setAppearanceLightNavigationBars(!isDarkMode);
    }
}
