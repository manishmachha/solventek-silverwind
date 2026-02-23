import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:desktop_drop/desktop_drop.dart';
import 'package:file_picker/file_picker.dart';
import 'package:cross_file/cross_file.dart';

import '../../config/app_colors.dart';
import '../../core/services/domain_services.dart';

class CandidateFormPage extends ConsumerStatefulWidget {
  final String? editId;
  const CandidateFormPage({super.key, this.editId});

  @override
  ConsumerState<CandidateFormPage> createState() => _CandidateFormPageState();
}

class _CandidateFormPageState extends ConsumerState<CandidateFormPage> {
  final _formKey = GlobalKey<FormState>();
  bool get isEditing => widget.editId != null;

  bool _isLoading = false;
  bool _isUploading = false;
  bool _isDragging = false;
  String? _uploadError;

  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _cityController = TextEditingController();
  final _designationController = TextEditingController();
  final _experienceController = TextEditingController();
  final _skillsController = TextEditingController();
  final _linkedinController = TextEditingController();
  final _summaryController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (isEditing) {
      _loadCandidate();
    }
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _cityController.dispose();
    _designationController.dispose();
    _experienceController.dispose();
    _skillsController.dispose();
    _linkedinController.dispose();
    _summaryController.dispose();
    super.dispose();
  }

  Future<void> _loadCandidate() async {
    setState(() => _isLoading = true);
    try {
      final svc = ref.read(candidateServiceProvider);
      final c = await svc.getCandidateById(widget.editId!);
      setState(() {
        _firstNameController.text = c['firstName'] ?? '';
        _lastNameController.text = c['lastName'] ?? '';
        _emailController.text = c['email'] ?? '';
        _phoneController.text = c['phone'] ?? '';
        _cityController.text = c['city'] ?? '';
        _designationController.text = c['currentDesignation'] ?? '';
        _experienceController.text = (c['experienceYears'] ?? '').toString();
        _linkedinController.text = c['linkedInUrl'] ?? '';
        _summaryController.text = c['summary'] ?? '';
        if (c['skills'] != null) {
          _skillsController.text = (c['skills'] as List).join(', ');
        }
      });
    } catch (e) {
      debugPrint('Error loading candidate: $e');
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to load candidate: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleFileUpload(XFile xFile) async {
    setState(() {
      _isUploading = true;
      _uploadError = null;
    });

    try {
      final file = File(xFile.path);
      final svc = ref.read(candidateServiceProvider);

      final result = await svc.uploadResume(
        await file.readAsBytes(),
        file.path.split('/').last,
      );

      if (!mounted) return;

      // Navigate to the edit page for the newly created candidate
      context.go('/candidates/edit/${result['id']}');
    } catch (e) {
      debugPrint('Error uploading resume: $e');
      setState(() {
        _uploadError =
            'Failed to upload/parse resume. Please try manual entry or try again.';
      });
    } finally {
      if (mounted) {
        setState(() => _isUploading = false);
      }
    }
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'doc', 'docx', 'txt'],
    );

    if (result != null && result.files.single.path != null) {
      await _handleFileUpload(XFile(result.files.single.path!));
    }
  }

  Future<void> _onSubmit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() => _isLoading = true);

    try {
      final svc = ref.read(candidateServiceProvider);

      final skillsArray = _skillsController.text
          .split(',')
          .map((s) => s.trim())
          .where((s) => s.isNotEmpty)
          .toList();

      final payload = {
        'firstName': _firstNameController.text,
        'lastName': _lastNameController.text,
        'email': _emailController.text,
        'phone': _phoneController.text,
        'city': _cityController.text,
        'currentDesignation': _designationController.text,
        'experienceYears': double.tryParse(_experienceController.text) ?? 0,
        'skills': skillsArray,
        'linkedInUrl': _linkedinController.text,
        'summary': _summaryController.text,
      };

      if (isEditing) {
        await svc.updateCandidate(widget.editId!, payload);
        if (mounted) context.go('/candidates');
      } else {
        setState(() {
          _uploadError =
              'Manual creation without resume is currently unsupported. Please upload a resume.';
        });
      }
    } catch (e) {
      debugPrint('Error saving candidate: $e');
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to save candidate: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: _isLoading && isEditing
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 64),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Row(
                    children: [
                      IconButton(
                        onPressed: () => context.canPop()
                            ? context.pop()
                            : context.go('/candidates'),
                        icon: const Icon(
                          Icons.arrow_back,
                          color: AppColors.textMuted,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          gradient: AppColors.gradientPrimary,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(
                          Icons.person_add,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Text(
                        isEditing ? 'Edit Candidate' : 'New Candidate',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textMain,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Upload Area (For New Candidates)
                  if (!isEditing) ...[
                    Card(
                      color: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        side: BorderSide(color: AppColors.surface200),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Upload Resume',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textMain,
                              ),
                            ),
                            const SizedBox(height: 16),

                            DropTarget(
                              onDragDone: (detail) {
                                if (detail.files.isNotEmpty) {
                                  _handleFileUpload(detail.files.first);
                                }
                              },
                              onDragEntered: (detail) =>
                                  setState(() => _isDragging = true),
                              onDragExited: (detail) =>
                                  setState(() => _isDragging = false),
                              child: InkWell(
                                onTap: _pickFile,
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 40,
                                    horizontal: 24,
                                  ),
                                  decoration: BoxDecoration(
                                    color: _isDragging
                                        ? AppColors.primary.withValues(
                                            alpha: 0.05,
                                          )
                                        : Colors.white,
                                    border: Border.all(
                                      color: _isDragging
                                          ? AppColors.primary
                                          : Colors.grey.shade300,
                                      width: 2,
                                      style: BorderStyle.none,
                                    ),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  // Custom dashed border
                                  child: CustomPaint(
                                    painter: DashedRectPainter(
                                      color: _isDragging
                                          ? AppColors.primary
                                          : Colors.grey.shade400,
                                      strokeWidth: 2,
                                      gap: 6,
                                    ),
                                    child: Padding(
                                      padding: const EdgeInsets.all(32),
                                      child: Column(
                                        mainAxisAlignment:
                                            MainAxisAlignment.center,
                                        children: [
                                          Icon(
                                            Icons.upload_file,
                                            size: 48,
                                            color: _isDragging
                                                ? AppColors.primary
                                                : Colors.grey.shade400,
                                          ),
                                          const SizedBox(height: 16),
                                          Text.rich(
                                            TextSpan(
                                              text: 'Upload a file',
                                              style: TextStyle(
                                                color: AppColors.primary,
                                                fontWeight: FontWeight.w600,
                                              ),
                                              children: [
                                                TextSpan(
                                                  text: ' or drag and drop',
                                                  style: TextStyle(
                                                    color: AppColors.textMuted,
                                                    fontWeight:
                                                        FontWeight.normal,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            textAlign: TextAlign.center,
                                          ),
                                          const SizedBox(height: 8),
                                          const Text(
                                            'PDF, DOCX, TXT up to 10MB',
                                            style: TextStyle(
                                              color: AppColors.textMuted,
                                              fontSize: 12,
                                            ),
                                            textAlign: TextAlign.center,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),

                            if (_isUploading) ...[
                              const SizedBox(height: 24),
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.blue.shade50,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  children: [
                                    const SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: const [
                                        Text(
                                          'Analyzing with AI...',
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            color: Colors.blue,
                                          ),
                                        ),
                                        Text(
                                          'Extracting details from resume',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Colors.blue,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],

                            if (_uploadError != null) ...[
                              const SizedBox(height: 16),
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.red.shade50,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: Colors.red.shade200,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      Icons.error_outline,
                                      color: Colors.red.shade700,
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        _uploadError!,
                                        style: TextStyle(
                                          color: Colors.red.shade700,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Manual Entry Form
                  Card(
                    color: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      side: BorderSide(color: AppColors.surface200),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Candidate Details',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textMain,
                              ),
                            ),
                            const SizedBox(height: 24),

                            Row(
                              children: [
                                Expanded(
                                  child: _field(
                                    'First name',
                                    _firstNameController,
                                    validator: (v) =>
                                        v?.isEmpty == true ? 'Required' : null,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: _field(
                                    'Last name',
                                    _lastNameController,
                                    validator: (v) =>
                                        v?.isEmpty == true ? 'Required' : null,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            _field(
                              'Email address',
                              _emailController,
                              type: TextInputType.emailAddress,
                              validator: (v) {
                                if (v?.isEmpty == true) return 'Required';
                                if (!v!.contains('@')) return 'Invalid email';
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _field(
                                    'Phone',
                                    _phoneController,
                                    type: TextInputType.phone,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: _field('City', _cityController),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _field(
                                    'Current Designation',
                                    _designationController,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: _field(
                                    'Experience (Years)',
                                    _experienceController,
                                    type: TextInputType.number,
                                    validator: (v) {
                                      if (v != null &&
                                          v.isNotEmpty &&
                                          double.tryParse(v) == null) {
                                        return 'Invalid number';
                                      }
                                      return null;
                                    },
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            _field(
                              'Skills (comma separated)',
                              _skillsController,
                              hint: 'e.g. Java, Angular, AWS',
                            ),
                            const SizedBox(height: 16),
                            _field(
                              'LinkedIn URL',
                              _linkedinController,
                              type: TextInputType.url,
                            ),
                            const SizedBox(height: 16),
                            _field('Summary', _summaryController, maxLines: 4),
                            const SizedBox(height: 32),

                            // Actions
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                TextButton(
                                  onPressed: () => context.go('/candidates'),
                                  style: TextButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 24,
                                      vertical: 12,
                                    ),
                                  ),
                                  child: const Text(
                                    'Cancel',
                                    style: TextStyle(
                                      color: AppColors.textMuted,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 16),
                                ElevatedButton(
                                  onPressed: _isLoading ? null : _onSubmit,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 32,
                                      vertical: 12,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                  ),
                                  child: _isLoading
                                      ? const SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            color: Colors.white,
                                            strokeWidth: 2,
                                          ),
                                        )
                                      : const Text('Save'),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _field(
    String label,
    TextEditingController ctrl, {
    TextInputType? type,
    int maxLines = 1,
    String? hint,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: AppColors.textMain,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: ctrl,
          keyboardType: type,
          maxLines: maxLines,
          validator: validator,
          style: const TextStyle(fontSize: 15),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.grey.shade400),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
            filled: true,
            fillColor: Colors.white,
          ),
        ),
      ],
    );
  }
}

// Custom Dashed Border Painter
class DashedRectPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;
  final double gap;

  DashedRectPainter({
    required this.color,
    required this.strokeWidth,
    required this.gap,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;

    final path = Path();
    path.addRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(0, 0, size.width, size.height),
        const Radius.circular(12),
      ),
    );

    // Simple heuristic for dashed path (Flutter doesn't have native dashed stroke)
    // We use a library or simply draw it manually if needed.
    // For simplicity, we just use a solid rounded rect here or you can add path_drawing pkg.
    // To match Angular exactly, a dashed border can be drawn.
    // Since we don't have path_drawing here, we'll draw a solid light border.
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => true;
}
