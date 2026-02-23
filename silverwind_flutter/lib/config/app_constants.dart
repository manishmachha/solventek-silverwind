import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Constants matching the Angular Silverwind design system.
class AppConstants {
  AppConstants._();

  // ===== Border Radius =====
  static const double radiusSm = 8.0; // 0.5rem
  static const double radiusMd = 12.0; // 0.75rem (inputs)
  static const double radiusLg = 16.0; // 1rem (cards)
  static const double radiusXl = 20.0; // 1.25rem
  static const double radiusFull = 9999.0; // badges, avatars

  static const BorderRadius borderRadiusSm = BorderRadius.all(
    Radius.circular(radiusSm),
  );
  static const BorderRadius borderRadiusMd = BorderRadius.all(
    Radius.circular(radiusMd),
  );
  static const BorderRadius borderRadiusLg = BorderRadius.all(
    Radius.circular(radiusLg),
  );
  static const BorderRadius borderRadiusFull = BorderRadius.all(
    Radius.circular(radiusFull),
  );

  // ===== Shadows =====
  static const List<BoxShadow> shadowSm = [
    BoxShadow(color: Color(0x0D000000), blurRadius: 2, offset: Offset(0, 1)),
  ];

  static const List<BoxShadow> shadowMd = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 6,
      offset: Offset(0, 4),
      spreadRadius: -1,
    ),
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 4,
      offset: Offset(0, 2),
      spreadRadius: -2,
    ),
  ];

  static const List<BoxShadow> shadowLg = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 15,
      offset: Offset(0, 10),
      spreadRadius: -3,
    ),
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 6,
      offset: Offset(0, 4),
      spreadRadius: -4,
    ),
  ];

  static const List<BoxShadow> shadowCard = [
    BoxShadow(
      color: Color(0x0D000000),
      blurRadius: 6,
      offset: Offset(0, 4),
      spreadRadius: -1,
    ),
    BoxShadow(
      color: Color(0x08000000),
      blurRadius: 4,
      offset: Offset(0, 2),
      spreadRadius: -1,
    ),
  ];

  static const List<BoxShadow> shadowCardHover = [
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 25,
      offset: Offset(0, 20),
      spreadRadius: -5,
    ),
    BoxShadow(
      color: Color(0x1A000000),
      blurRadius: 10,
      offset: Offset(0, 8),
      spreadRadius: -6,
    ),
  ];

  static List<BoxShadow> shadowGlow = [
    BoxShadow(color: AppColors.primary.withValues(alpha: 0.25), blurRadius: 20),
  ];

  // ===== Spacing =====
  static const double spacingXs = 4.0;
  static const double spacingSm = 8.0;
  static const double spacingMd = 12.0;
  static const double spacingLg = 16.0;
  static const double spacingXl = 24.0;
  static const double spacing2Xl = 32.0;
  static const double spacing3Xl = 48.0;

  // ===== Durations =====
  static const Duration durationFast = Duration(milliseconds: 150);
  static const Duration durationNormal = Duration(milliseconds: 300);

  // ===== Transition Curve =====
  static const Curve defaultCurve = Curves.easeInOut;

  // ===== Avatar Sizes =====
  static const double avatarSm = 32.0; // 2rem
  static const double avatarMd = 40.0; // 2.5rem
  static const double avatarLg = 48.0; // 3rem

  // ===== Sidebar Width =====
  static const double sidebarWidth = 256.0; // md:w-64
  static const double sidebarMobileWidth = 288.0; // w-72
  static const double headerHeight = 64.0; // h-16

  // ===== Breakpoints =====
  static const double breakpointMd = 768.0;
  static const double breakpointLg = 1024.0;
  static const double breakpointXl = 1280.0;
}
