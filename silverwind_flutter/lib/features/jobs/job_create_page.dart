import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/services/domain_services.dart';

/// Job Create/Edit page matching Angular's JobCreateComponent.
/// 4 sections: Basic Info, Requirements, Skills & Experience, Compensation.
class JobCreatePage extends ConsumerStatefulWidget {
  final String? jobId;
  const JobCreatePage({super.key, this.jobId});
  @override
  ConsumerState<JobCreatePage> createState() => _JobCreatePageState();
}

class _JobCreatePageState extends ConsumerState<JobCreatePage> {
  bool _submitting = false;
  bool _loading = false;
  final _formKey = GlobalKey<FormState>();

  final _title = TextEditingController();
  final _description = TextEditingController();
  final _requirements = TextEditingController();
  final _rolesAndResponsibilities = TextEditingController();
  final _experience = TextEditingController();
  final _skills = TextEditingController();
  final _billRate = TextEditingController();
  final _payRate = TextEditingController();
  String _employmentType = 'C2H';

  bool get isEditing => widget.jobId != null;

  @override
  void initState() {
    super.initState();
    if (isEditing) _loadJob();
  }

  @override
  void dispose() {
    for (final c in [
      _title,
      _description,
      _requirements,
      _rolesAndResponsibilities,
      _experience,
      _skills,
      _billRate,
      _payRate,
    ])
      c.dispose();
    super.dispose();
  }

  Future<void> _loadJob() async {
    setState(() => _loading = true);
    try {
      final svc = ref.read(jobServiceProvider);
      final data = await svc.getJob(widget.jobId!);
      if (!mounted) return;
      setState(() {
        _title.text = data['title'] ?? '';
        _description.text = data['description'] ?? '';
        _requirements.text = data['requirements'] ?? '';
        _rolesAndResponsibilities.text = data['rolesAndResponsibilities'] ?? '';
        _experience.text = data['experience'] ?? '';
        _skills.text = data['skills'] ?? '';
        _billRate.text = (data['billRate'] ?? '').toString();
        _payRate.text = (data['payRate'] ?? '').toString();
        _employmentType = data['employmentType'] ?? 'C2H';
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Map<String, dynamic> _buildPayload(String status) => {
    'title': _title.text,
    'description': _description.text,
    'requirements': _requirements.text.isNotEmpty ? _requirements.text : null,
    'rolesAndResponsibilities': _rolesAndResponsibilities.text.isNotEmpty
        ? _rolesAndResponsibilities.text
        : null,
    'experience': _experience.text.isNotEmpty ? _experience.text : null,
    'skills': _skills.text.isNotEmpty ? _skills.text : null,
    'employmentType': _employmentType,
    'status': status,
    'billRate': _billRate.text.isNotEmpty
        ? double.tryParse(_billRate.text)
        : null,
    'payRate': _payRate.text.isNotEmpty ? double.tryParse(_payRate.text) : null,
  };

  Future<void> _submit({String status = 'SUBMITTED'}) async {
    if (status != 'DRAFT' && !(_formKey.currentState?.validate() ?? false))
      return;
    setState(() => _submitting = true);
    try {
      final svc = ref.read(jobServiceProvider);
      final payload = _buildPayload(status);
      if (isEditing) {
        await svc.updateJob(widget.jobId!, payload);
        if (mounted) context.go('/jobs/${widget.jobId}');
      } else {
        await svc.createJob(payload);
        if (mounted) context.go('/jobs');
      }
    } catch (e) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading)
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF6366F1), Color(0xFF9333EA)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.work, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isEditing ? 'Edit Job' : 'Create New Job',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF111827),
                      ),
                    ),
                    Text(
                      isEditing
                          ? 'Update the details of this job requisition'
                          : 'Fill in the details to post a new job requisition',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),
            // Section 1: Basic Information
            _sectionCard(
              'Basic Information',
              Icons.info_outline,
              const Color(0xFF6366F1),
              [
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: _field('Job Title', _title, required: true),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _dropdown(
                        'Employment Type',
                        _employmentType,
                        const {
                          'FULL_TIME': 'Full Time',
                          'CONTRACT': 'Contract',
                          'C2H': 'Contract to Hire',
                          'FREELANCE': 'Freelance',
                          'PART_TIME': 'Part Time',
                        },
                        (v) => setState(() => _employmentType = v ?? 'C2H'),
                      ),
                    ),
                  ],
                ),
                _field(
                  'Job Description',
                  _description,
                  required: true,
                  maxLines: 4,
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Section 2: Requirements & Responsibilities
            _sectionCard(
              'Requirements & Responsibilities',
              Icons.checklist,
              const Color(0xFF10B981),
              [
                _field(
                  'Requirements',
                  _requirements,
                  maxLines: 4,
                  hint: 'List qualifications, certifications, prerequisites...',
                ),
                _field(
                  'Roles & Responsibilities',
                  _rolesAndResponsibilities,
                  maxLines: 4,
                  hint: 'Describe key duties and responsibilities...',
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Section 3: Skills & Experience
            _sectionCard(
              'Skills & Experience',
              Icons.star_border,
              const Color(0xFFF59E0B),
              [
                Row(
                  children: [
                    Expanded(
                      child: _field(
                        'Experience Required',
                        _experience,
                        hint: 'e.g., 3-5 years',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _field(
                        'Key Skills',
                        _skills,
                        hint: 'e.g., Pega PRPC, Java, SQL',
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Section 4: Compensation
            _sectionCard(
              'Compensation',
              Icons.attach_money,
              const Color(0xFF10B981),
              [
                Row(
                  children: [
                    Expanded(
                      child: _field(
                        'Bill Rate (\$/hr)',
                        _billRate,
                        keyboardType: TextInputType.number,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _field(
                        'Pay Rate (\$/hr)',
                        _payRate,
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),
            // Action Buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton.icon(
                  onPressed: () => context.go('/jobs'),
                  icon: const Icon(Icons.arrow_back, size: 16),
                  label: const Text('Back to Jobs'),
                ),
                Row(
                  children: [
                    OutlinedButton.icon(
                      onPressed: _submitting
                          ? null
                          : () => _submit(status: 'DRAFT'),
                      icon: const Icon(Icons.save_outlined, size: 16),
                      label: const Text('Save as Draft'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 12,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton.icon(
                      onPressed: _submitting ? null : () => _submit(),
                      icon: _submitting
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.send, size: 16),
                      label: Text(
                        _submitting
                            ? (isEditing ? 'Updating...' : 'Submitting...')
                            : (isEditing ? 'Update Job' : 'Submit Job'),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF6366F1),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 12,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionCard(
    String title,
    IconData icon,
    Color iconColor,
    List<Widget> children,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(16),
              ),
              border: Border(bottom: BorderSide(color: Colors.grey.shade100)),
            ),
            child: Row(
              children: [
                Icon(icon, size: 18, color: iconColor),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF111827),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: children,
            ),
          ),
        ],
      ),
    );
  }

  Widget _field(
    String label,
    TextEditingController ctrl, {
    bool required = false,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? hint,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: ctrl,
        maxLines: maxLines,
        keyboardType: keyboardType,
        validator: required
            ? (v) => (v == null || v.isEmpty) ? '$label is required' : null
            : null,
        decoration: InputDecoration(
          labelText: label + (required ? ' *' : ''),
          hintText: hint,
          labelStyle: TextStyle(fontSize: 14, color: Colors.grey.shade600),
          hintStyle: TextStyle(fontSize: 13, color: Colors.grey.shade400),
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade200),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade200),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2),
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 14,
          ),
        ),
      ),
    );
  }

  Widget _dropdown(
    String label,
    String value,
    Map<String, String> items,
    Function(String?) onChanged,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: DropdownButtonFormField<String>(
        value: value,
        decoration: InputDecoration(
          labelText: '$label *',
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade200),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade200),
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 14,
          ),
        ),
        items: items.entries
            .map(
              (e) => DropdownMenuItem(
                value: e.key,
                child: Text(e.value, style: const TextStyle(fontSize: 14)),
              ),
            )
            .toList(),
        onChanged: onChanged,
      ),
    );
  }
}
