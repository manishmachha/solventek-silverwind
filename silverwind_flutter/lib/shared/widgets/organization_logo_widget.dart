import 'package:flutter/material.dart';
import '../../../config/app_colors.dart';

class OrganizationLogoWidget extends StatelessWidget {
  final Map<String, dynamic>? org;
  final String? orgId;
  final double size;
  final bool rounded;

  const OrganizationLogoWidget({
    super.key,
    this.org,
    this.orgId,
    this.size = 48.0,
    this.rounded = true,
  });

  @override
  Widget build(BuildContext context) {
    // If the API had full logo URLs, we'd use Image.network
    // This provides a resilient fallback avatar
    final name = (org != null && org!['name'] != null) ? org!['name'] : 'O';
    final initial = name.isNotEmpty ? name[0].toUpperCase() : '?';

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.1),
        borderRadius: rounded ? BorderRadius.circular(12) : null,
        shape: rounded ? BoxShape.rectangle : BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: TextStyle(
          fontSize: size * 0.4,
          fontWeight: FontWeight.bold,
          color: AppColors.primary,
        ),
      ),
    );
  }
}
