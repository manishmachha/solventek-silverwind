import 'package:flutter/material.dart';
import '../../config/app_colors.dart';

/// User avatar matching Angular's avatar styles.
/// Shows initials over gradient background.
class UserAvatar extends StatelessWidget {
  final String firstName;
  final String lastName;
  final String? profilePhotoUrl;
  final double size;
  final double fontSize;

  const UserAvatar({
    super.key,
    required this.firstName,
    required this.lastName,
    this.profilePhotoUrl,
    this.size = 40,
    this.fontSize = 14,
  });

  factory UserAvatar.sm({
    required String firstName,
    required String lastName,
    String? profilePhotoUrl,
  }) => UserAvatar(
    firstName: firstName,
    lastName: lastName,
    profilePhotoUrl: profilePhotoUrl,
    size: 32,
    fontSize: 12,
  );

  factory UserAvatar.lg({
    required String firstName,
    required String lastName,
    String? profilePhotoUrl,
  }) => UserAvatar(
    firstName: firstName,
    lastName: lastName,
    profilePhotoUrl: profilePhotoUrl,
    size: 48,
    fontSize: 16,
  );

  String get initials =>
      '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'
          .toUpperCase();

  @override
  Widget build(BuildContext context) {
    if (profilePhotoUrl != null && profilePhotoUrl!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(size),
        child: Image.network(
          profilePhotoUrl!,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _buildInitials(),
        ),
      );
    }
    return _buildInitials();
  }

  Widget _buildInitials() {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: AppColors.gradientPrimary,
      ),
      child: Center(
        child: Text(
          initials,
          style: TextStyle(
            color: Colors.white,
            fontSize: fontSize,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}
