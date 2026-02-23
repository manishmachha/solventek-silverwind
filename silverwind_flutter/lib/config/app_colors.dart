import 'package:flutter/material.dart';

/// Color constants matching the Angular Silverwind design system CSS variables.
class AppColors {
  AppColors._();

  // Primary Colors - Deep Indigo/Violet
  static const Color primary = Color(0xFF6366F1); // Indigo 500
  static const Color primaryDark = Color(0xFF4F46E5); // Indigo 600
  static const Color primaryLight = Color(0xFF818CF8); // Indigo 400
  static const Color primary50 = Color(0xFFEEF2FF); // Indigo 50
  static const Color primary100 = Color(0xFFE0E7FF); // Indigo 100

  // Secondary Colors - Violet
  static const Color secondary = Color(0xFF8B5CF6); // Violet 500
  static const Color secondaryDark = Color(0xFF7C3AED); // Violet 600
  static const Color secondaryLight = Color(0xFFA78BFA); // Violet 400

  // Neutral / Surface Colors
  static const Color surface50 = Color(0xFFF8FAFC); // Slate 50
  static const Color surface100 = Color(0xFFF1F5F9); // Slate 100
  static const Color surface200 = Color(0xFFE2E8F0); // Slate 200
  static const Color surface300 = Color(0xFFCBD5E1); // Slate 300
  static const Color textMain = Color(0xFF0F172A); // Slate 900
  static const Color textMuted = Color(0xFF64748B); // Slate 500
  static const Color textLight = Color(0xFF94A3B8); // Slate 400

  // Status Colors
  static const Color success = Color(0xFF10B981);
  static const Color successBg = Color(0xFFD1FAE5);
  static const Color successDark = Color(0xFF047857); // Emerald 700
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningBg = Color(0xFFFEF3C7);
  static const Color warningDark = Color(0xFFB45309); // Amber 700
  static const Color danger = Color(0xFFEF4444);
  static const Color dangerBg = Color(0xFFFEE2E2);
  static const Color dangerDark = Color(0xFFB91C1C); // Red 700
  static const Color info = Color(0xFF3B82F6);
  static const Color infoBg = Color(0xFFDBEAFE);

  // Snackbar
  static const Color snackbarSuccess = Color(0xFF16A34A); // Green 600
  static const Color snackbarError = Color(0xFFDC2626); // Red 600

  // Additional
  static const Color white = Colors.white;
  static const Color black = Colors.black;
  static const Color transparent = Colors.transparent;

  // Material Dark overrides (for form fields)
  static const Color slate600 = Color(0xFF475569);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate200 = Color(0xFFE2E8F0);
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color blue400 = Color(0xFF60A5FA);
  static const Color gray50 = Color(0xFFF9FAFB);
  static const Color gray100 = Color(0xFFF3F4F6);
  static const Color gray200 = Color(0xFFE5E7EB);
  static const Color gray900 = Color(0xFF111827);

  // Emerald / Teal for vendor branding
  static const Color emerald500 = Color(0xFF10B981);
  static const Color emerald600 = Color(0xFF059669);
  static const Color teal600 = Color(0xFF0D9488);
  static const Color emerald50 = Color(0xFFECFDF5);
  static const Color teal50 = Color(0xFFF0FDFA);

  // Gradients
  static const LinearGradient gradientPrimary = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primary, secondary],
  );

  static const LinearGradient gradientSuccess = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF10B981), Color(0xFF059669)],
  );

  static const LinearGradient gradientDark = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
  );

  static const LinearGradient gradientSurface = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Colors.white, surface50],
  );

  // Vendor gradients
  static const LinearGradient gradientVendor = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [emerald500, teal600],
  );

  static const LinearGradient gradientVendorLight = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [emerald50, teal50],
  );
}
