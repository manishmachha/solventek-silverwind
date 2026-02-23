import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/domain_services.dart';
import '../../core/providers/auth_provider.dart';

class ApplicationFormDialog extends ConsumerStatefulWidget {
  final Map<String, dynamic> job;
  const ApplicationFormDialog({super.key, required this.job});

  @override
  ConsumerState<ApplicationFormDialog> createState() =>
      _ApplicationFormDialogState();
}

class _ApplicationFormDialogState extends ConsumerState<ApplicationFormDialog> {
  int _currentStep = 0;
  bool _isSubmitting = false;

  final _formKey = GlobalKey<FormState>();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _currentTitle = TextEditingController();
  final _currentCompany = TextEditingController();
  final _experienceYears = TextEditingController();
  final _linkedinUrl = TextEditingController();
  final _portfolioUrl = TextEditingController();

  String? _candidateId;
  List<Map<String, dynamic>> _candidates = [];
  bool get _isVendor => ref.read(authProvider).user?.role.name == 'VENDOR';

  int? _selectedFileFakeSize;
  String? _selectedFileName;

  @override
  void initState() {
    super.initState();
    if (_isVendor) _loadCandidates();
  }

  @override
  void dispose() {
    for (final c in [
      _firstName,
      _lastName,
      _email,
      _phone,
      _currentTitle,
      _currentCompany,
      _experienceYears,
      _linkedinUrl,
      _portfolioUrl,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _loadCandidates() async {
    try {
      // Typically there's a candidateService, here we mimic fetching candidates.
      // E.g. final result = await svc.getCandidates();
      // For now, since CandidateService might be separate, we will let users just fill it manually
      // or implement the API call here if we assume it exists in `domain_services.dart`.
    } catch (_) {}
  }

  void _onCandidateSelected(String? id) {
    setState(() => _candidateId = id);
    if (id == null) return;

    final c = _candidates.firstWhere(
      (can) => can['id'] == id,
      orElse: () => {},
    );
    if (c.isNotEmpty) {
      _firstName.text = c['firstName'] ?? '';
      _lastName.text = c['lastName'] ?? '';
      _email.text = c['email'] ?? '';
      _phone.text = c['phone'] ?? '';
      _currentTitle.text = c['currentDesignation'] ?? '';
      _currentCompany.text = c['currentCompany'] ?? '';
      _experienceYears.text = (c['experienceYears'] ?? '').toString();
      _linkedinUrl.text = c['linkedInUrl'] ?? '';
      _portfolioUrl.text = c['portfolioUrl'] ?? '';
    }
  }

  bool _isStepInvalid() {
    if (_currentStep == 0) {
      return _firstName.text.isEmpty ||
          _lastName.text.isEmpty ||
          _email.text.isEmpty;
    }
    return false;
  }

  Future<void> _submit() async {
    if (_isStepInvalid()) return;
    if (_selectedFileName == null && _candidateId == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please select a resume.')));
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final payload = {
        'firstName': _firstName.text,
        'lastName': _lastName.text,
        'email': _email.text,
        'phone': _phone.text,
        'currentTitle': _currentTitle.text,
        'currentCompany': _currentCompany.text,
        'experienceYears': int.tryParse(_experienceYears.text) ?? 0,
        'linkedinUrl': _linkedinUrl.text,
        'portfolioUrl': _portfolioUrl.text,
        'skills': [],
        'candidateId': _candidateId,
      };

      // In a real app we'd construct a multipart request for the file.
      // Here we assume the frontend sends it via the applicationService.apply
      // which in Angular takes (jobId, FormData). In domain_services it might take (jobId, dynamic).
      final svc = ref.read(applicationServiceProvider);
      await svc.apply(widget.job['id'], payload);

      if (mounted) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Application submitted successfully!')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to submit: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        width: 800,
        height: 700,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: Colors.grey.shade100)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Apply for ${widget.job['title']}',
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.indigo,
                        ),
                      ),
                      Text(
                        '${widget.job['location'] ?? 'Remote'} • ${widget.job['employmentType']}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.grey,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),

            // Stepper Indicator
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              color: Colors.grey.shade50,
              child: Row(
                children: [
                  _stepIndicator(0, 'Personal'),
                  _stepLine(0),
                  _stepIndicator(1, 'Experience'),
                  _stepLine(1),
                  _stepIndicator(2, 'Resume'),
                ],
              ),
            ),

            // Content
            Expanded(
              child: Form(
                key: _formKey,
                child: ListView(
                  padding: const EdgeInsets.all(24),
                  children: [
                    if (_isVendor &&
                        _candidates.isNotEmpty &&
                        _currentStep == 0) ...[
                      Container(
                        padding: const EdgeInsets.all(16),
                        margin: const EdgeInsets.only(bottom: 24),
                        decoration: BoxDecoration(
                          color: Colors.indigo.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.indigo.shade100),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Select Existing Candidate',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.indigo,
                              ),
                            ),
                            const SizedBox(height: 8),
                            DropdownButtonFormField<String?>(
                              value: _candidateId,
                              decoration: InputDecoration(
                                filled: true,
                                fillColor: Colors.white,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(
                                    color: Colors.indigo.shade200,
                                  ),
                                ),
                              ),
                              items: [
                                const DropdownMenuItem<String?>(
                                  value: null,
                                  child: Text('-- Create New Candidate --'),
                                ),
                                ..._candidates
                                    .map(
                                      (c) => DropdownMenuItem<String?>(
                                        value: c['id'],
                                        child: Text(
                                          '${c['firstName']} ${c['lastName']} (${c['email']})',
                                        ),
                                      ),
                                    )
                                    .toList(),
                              ],
                              onChanged: _onCandidateSelected,
                            ),
                          ],
                        ),
                      ),
                    ],

                    if (_currentStep == 0) ...[
                      Row(
                        children: [
                          Expanded(child: _field('First Name *', _firstName)),
                          const SizedBox(width: 16),
                          Expanded(child: _field('Last Name *', _lastName)),
                        ],
                      ),
                      Row(
                        children: [
                          Expanded(child: _field('Email Address *', _email)),
                          const SizedBox(width: 16),
                          Expanded(child: _field('Phone Number', _phone)),
                        ],
                      ),
                      _field(
                        'Address / Location',
                        TextEditingController(),
                        hint: 'City, Country',
                      ),
                    ],

                    if (_currentStep == 1) ...[
                      _field('Current Title', _currentTitle),
                      Row(
                        children: [
                          Expanded(
                            child: _field(
                              'Current Company',
                              _currentCompany,
                              icon: Icons.business,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: _field(
                              'Years of Experience',
                              _experienceYears,
                              icon: Icons.work,
                              isNumber: true,
                            ),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: _field(
                              'LinkedIn URL',
                              _linkedinUrl,
                              icon: Icons.link,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: _field(
                              'Portfolio URL',
                              _portfolioUrl,
                              icon: Icons.web,
                            ),
                          ),
                        ],
                      ),
                    ],

                    if (_currentStep == 2) ...[
                      GestureDetector(
                        onTap: () {
                          // Simulate file pick
                          setState(() {
                            _selectedFileName = 'test_resume.pdf';
                            _selectedFileFakeSize = 1048576;
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.all(32),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: Colors.grey.shade300,
                              style: BorderStyle.none,
                            ),
                          ),
                          child: Center(
                            child: Column(
                              children: [
                                CircleAvatar(
                                  radius: 28,
                                  backgroundColor: Colors.indigo.shade100,
                                  child: const Icon(
                                    Icons.cloud_upload,
                                    color: Colors.indigo,
                                    size: 28,
                                  ),
                                ),
                                const SizedBox(height: 16),
                                const Text(
                                  'Click to select a file',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const Text(
                                  'PDF, DOCX up to 5MB',
                                  style: TextStyle(
                                    color: Colors.grey,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      if (_selectedFileName != null ||
                          _candidateId != null) ...[
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.indigo.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.indigo.shade100),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.indigo.shade100,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(
                                  Icons.description,
                                  color: Colors.indigo,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      _selectedFileName ??
                                          'Linked from candidate profile',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    if (_selectedFileFakeSize != null)
                                      Text(
                                        '${(_selectedFileFakeSize! / 1024 / 1024).toStringAsFixed(2)} MB',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey,
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                              if (_selectedFileName != null)
                                IconButton(
                                  icon: const Icon(
                                    Icons.delete,
                                    color: Colors.red,
                                  ),
                                  onPressed: () =>
                                      setState(() => _selectedFileName = null),
                                ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 24),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(
                                  Icons.assignment_turned_in,
                                  color: Colors.indigo,
                                ),
                                SizedBox(width: 8),
                                Text(
                                  'Review Application',
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _reviewItem(
                                    'Applicant',
                                    '${_firstName.text} ${_lastName.text}',
                                  ),
                                ),
                                Expanded(
                                  child: _reviewItem('Contact', _email.text),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _reviewItem(
                                    'Role',
                                    _currentTitle.text.isEmpty
                                        ? 'Not specified'
                                        : _currentTitle.text,
                                  ),
                                ),
                                Expanded(
                                  child: _reviewItem(
                                    'Experience',
                                    '${_experienceYears.text} years',
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            // Footer
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: Colors.grey.shade100)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (_currentStep > 0)
                    TextButton(
                      onPressed: () => setState(() => _currentStep--),
                      child: const Text(
                        'Back',
                        style: TextStyle(color: Colors.grey),
                      ),
                    )
                  else
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text(
                        'Cancel',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ),

                  if (_currentStep < 2)
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.indigo,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 12,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: () {
                        setState(() {
                          _currentStep++;
                        });
                      },
                      child: const Text('Continue'),
                    )
                  else
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.teal,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 12,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: _isSubmitting ? null : _submit,
                      icon: _isSubmitting
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const SizedBox.shrink(),
                      label: Text(
                        _isSubmitting ? 'Submitting...' : 'Submit Application',
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _stepIndicator(int index, String label) {
    bool active = _currentStep >= index;
    bool current = _currentStep == index;
    return Column(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: active ? Colors.indigo : Colors.grey.shade200,
            shape: BoxShape.circle,
            border: current
                ? Border.all(color: Colors.indigo.shade100, width: 4)
                : null,
          ),
          child: Center(
            child: active && !current
                ? const Icon(Icons.check, color: Colors.white, size: 16)
                : Text(
                    '${index + 1}',
                    style: TextStyle(
                      color: active ? Colors.white : Colors.grey,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            color: active ? Colors.indigo : Colors.grey,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _stepLine(int index) {
    bool active = _currentStep > index;
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 16),
        color: active ? Colors.indigo : Colors.grey.shade300,
      ),
    );
  }

  Widget _field(
    String label,
    TextEditingController ctrl, {
    IconData? icon,
    bool isNumber = false,
    String? hint,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 6),
          TextFormField(
            controller: ctrl,
            keyboardType: isNumber ? TextInputType.number : TextInputType.text,
            decoration: InputDecoration(
              hintText: hint,
              prefixIcon: icon != null ? Icon(icon, color: Colors.grey) : null,
              filled: true,
              fillColor: Colors.grey.shade50,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Colors.indigo, width: 2),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _reviewItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: Colors.grey,
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
      ],
    );
  }
}
