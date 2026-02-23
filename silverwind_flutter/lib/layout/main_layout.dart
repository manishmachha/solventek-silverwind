import 'package:flutter/material.dart';
import '../config/app_colors.dart';
import '../config/app_constants.dart';
import 'sidebar.dart';
import 'header.dart';

/// Main layout matching Angular MainLayoutComponent.
/// Sidebar (persistent on tablet+, drawer on mobile) + Header + Content.
class MainLayout extends StatefulWidget {
  final Widget child;

  const MainLayout({super.key, required this.child});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  bool _sidebarOpen = false;

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isDesktop = screenWidth >= AppConstants.breakpointMd;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppColors.gray50, AppColors.gray100],
          ),
        ),
        child: Row(
          children: [
            // Sidebar (desktop only - persistent)
            if (isDesktop)
              SizedBox(
                width: AppConstants.sidebarWidth,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border(
                      right: BorderSide(
                        color: AppColors.surface200.withValues(alpha: 0.5),
                      ),
                    ),
                    boxShadow: AppConstants.shadowSm,
                  ),
                  child: AppSidebar(
                    onMenuTap: () => setState(() => _sidebarOpen = false),
                  ),
                ),
              ),

            // Main Content
            Expanded(
              child: Stack(
                children: [
                  Column(
                    children: [
                      // Header
                      AppHeader(
                        onToggleSidebar: () =>
                            setState(() => _sidebarOpen = !_sidebarOpen),
                      ),
                      // Content
                      Expanded(
                        child: Padding(
                          padding: EdgeInsets.all(isDesktop ? 16 : 8),
                          child: widget.child,
                        ),
                      ),
                    ],
                  ),

                  // Mobile Sidebar Overlay
                  if (!isDesktop && _sidebarOpen) ...[
                    // Backdrop
                    GestureDetector(
                      onTap: () => setState(() => _sidebarOpen = false),
                      child: AnimatedOpacity(
                        opacity: _sidebarOpen ? 1.0 : 0.0,
                        duration: AppConstants.durationNormal,
                        child: Container(
                          color: AppColors.gray900.withValues(alpha: 0.5),
                        ),
                      ),
                    ),
                    // Drawer
                    AnimatedPositioned(
                      duration: AppConstants.durationNormal,
                      curve: Curves.easeInOut,
                      left: _sidebarOpen ? 0 : -AppConstants.sidebarMobileWidth,
                      top: 0,
                      bottom: 0,
                      width: AppConstants.sidebarMobileWidth,
                      child: Material(
                        elevation: 16,
                        child: AppSidebar(
                          onMenuTap: () => setState(() => _sidebarOpen = false),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
