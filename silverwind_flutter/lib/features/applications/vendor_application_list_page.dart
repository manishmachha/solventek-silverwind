import 'package:flutter/material.dart';
import 'track_application_list_page.dart';

class VendorApplicationListPage extends StatelessWidget {
  const VendorApplicationListPage({super.key});

  @override
  Widget build(BuildContext context) {
    // Vendor and Employee view share the exact same UI in Flutter right now.
    return const TrackApplicationListPage();
  }
}
