import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

/// App theme matching the Angular Silverwind design system.
/// Uses Google Fonts for Inter instead of local font assets.
class AppTheme {
  AppTheme._();

  static ThemeData get lightTheme {
    final textTheme = GoogleFonts.interTextTheme(
      const TextTheme(
        displayLarge: TextStyle(
          fontWeight: FontWeight.w700,
          color: AppColors.textMain,
        ),
        displayMedium: TextStyle(
          fontWeight: FontWeight.w700,
          color: AppColors.textMain,
        ),
        displaySmall: TextStyle(
          fontWeight: FontWeight.w700,
          color: AppColors.textMain,
        ),
        headlineLarge: TextStyle(
          fontWeight: FontWeight.w700,
          color: AppColors.textMain,
        ),
        headlineMedium: TextStyle(
          fontWeight: FontWeight.w600,
          color: AppColors.textMain,
        ),
        headlineSmall: TextStyle(
          fontWeight: FontWeight.w600,
          color: AppColors.textMain,
        ),
        titleLarge: TextStyle(
          fontWeight: FontWeight.w600,
          color: AppColors.textMain,
        ),
        titleMedium: TextStyle(
          fontWeight: FontWeight.w600,
          color: AppColors.textMain,
        ),
        titleSmall: TextStyle(
          fontWeight: FontWeight.w500,
          color: AppColors.textMain,
        ),
        bodyLarge: TextStyle(
          fontWeight: FontWeight.w400,
          color: AppColors.textMain,
        ),
        bodyMedium: TextStyle(
          fontWeight: FontWeight.w400,
          color: AppColors.textMain,
        ),
        bodySmall: TextStyle(
          fontWeight: FontWeight.w400,
          color: AppColors.textMuted,
        ),
        labelLarge: TextStyle(
          fontWeight: FontWeight.w600,
          color: AppColors.textMain,
        ),
        labelMedium: TextStyle(
          fontWeight: FontWeight.w500,
          color: AppColors.textMuted,
        ),
        labelSmall: TextStyle(
          fontWeight: FontWeight.w500,
          color: AppColors.textLight,
        ),
      ),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      textTheme: textTheme,
      colorScheme: ColorScheme.light(
        primary: AppColors.primary,
        onPrimary: Colors.white,
        primaryContainer: AppColors.primary50,
        secondary: AppColors.secondary,
        onSecondary: Colors.white,
        secondaryContainer: AppColors.secondaryLight,
        surface: AppColors.surface50,
        onSurface: AppColors.textMain,
        error: AppColors.danger,
        onError: Colors.white,
        outline: AppColors.surface200,
      ),
      scaffoldBackgroundColor: AppColors.surface50,
      appBarTheme: AppBarTheme(
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textMain,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: AppColors.textMain,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.surface200),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          side: const BorderSide(color: AppColors.surface200),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          textStyle: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.surface200),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.surface200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.danger),
        ),
        hintStyle: GoogleFonts.inter(color: AppColors.textLight),
        labelStyle: GoogleFonts.inter(color: AppColors.textMuted),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.primary50,
        labelStyle: GoogleFonts.inter(
          color: AppColors.primary,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(9999),
          side: const BorderSide(color: AppColors.primary100),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        contentTextStyle: GoogleFonts.inter(
          fontWeight: FontWeight.w500,
          fontSize: 14,
          color: Colors.white,
        ),
      ),
      dialogTheme: DialogThemeData(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.surface200,
        thickness: 1,
      ),
    );
  }
}
