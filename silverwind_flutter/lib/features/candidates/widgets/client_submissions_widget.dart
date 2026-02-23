import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/services/domain_services.dart';
import '../../../core/providers/auth_provider.dart';
import 'package:intl/intl.dart';

class ClientSubmissionsWidget extends ConsumerStatefulWidget {
  final String candidateId;
  final String? jobId;

  const ClientSubmissionsWidget({
    super.key,
    required this.candidateId,
    this.jobId,
  });

  @override
  ConsumerState<ClientSubmissionsWidget> createState() =>
      _ClientSubmissionsWidgetState();
}

class _ClientSubmissionsWidgetState
    extends ConsumerState<ClientSubmissionsWidget> {
  List<dynamic> _submissions = [];
  bool _isLoading = true;
  String? _activeSubmissionId;
  List<dynamic> _comments = [];
  bool _isLoadingComments = false;
  final _commentController = TextEditingController();

  List<dynamic> _clients = [];
  final _clientFormKey = GlobalKey<FormState>();
  String? _selectedClientId;
  String? _externalReferenceId;
  String? _remarks;
  bool _isSubmitting = false;

  final List<String> _allStatuses = [
    'SUBMITTED',
    'CLIENT_SCREENING',
    'CLIENT_INTERVIEW',
    'CLIENT_OFFERED',
    'CLIENT_REJECTED',
    'ONBOARDING',
    'WITHDRAWN',
  ];

  final List<Map<String, String>> _timelineSteps = [
    {'label': 'Submitted', 'status': 'SUBMITTED'},
    {'label': 'Screening', 'status': 'CLIENT_SCREENING'},
    {'label': 'Interview', 'status': 'CLIENT_INTERVIEW'},
    {'label': 'Offer', 'status': 'CLIENT_OFFERED'},
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final subSvc = ref.read(clientSubmissionServiceProvider);
      final clSvc = ref.read(clientServiceProvider);

      final subs = await subSvc.getSubmissionsByCandidate(widget.candidateId);
      final clientsData = await clSvc.getClients();

      setState(() {
        if (widget.jobId != null) {
          _submissions = subs
              .where((s) => s['job'] != null && s['job']['id'] == widget.jobId)
              .toList();
        } else {
          _submissions = subs;
        }
        _submissions.sort(
          (a, b) => DateTime.parse(
            b['submittedAt'],
          ).compareTo(DateTime.parse(a['submittedAt'])),
        );
        _clients = clientsData;
      });
    } catch (e) {
      debugPrint('Error loading submissions: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load submissions: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleComments(String submissionId) async {
    if (_activeSubmissionId == submissionId) {
      setState(() {
        _activeSubmissionId = null;
        _comments = [];
      });
      return;
    }

    setState(() {
      _activeSubmissionId = submissionId;
      _isLoadingComments = true;
      _comments = [];
    });

    try {
      final subSvc = ref.read(clientSubmissionServiceProvider);
      final comments = await subSvc.getComments(submissionId);
      setState(() {
        _comments = comments;
      });
    } catch (e) {
      debugPrint('Error loading comments: $e');
    } finally {
      if (mounted) setState(() => _isLoadingComments = false);
    }
  }

  Future<void> _addComment(String submissionId) async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    try {
      final subSvc = ref.read(clientSubmissionServiceProvider);
      final newComment = await subSvc.addComment(submissionId, text);
      setState(() {
        _comments.insert(0, newComment);
        _commentController.clear();
      });
    } catch (e) {
      debugPrint('Error adding comment: $e');
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to add comment: $e')));
      }
    }
  }

  Future<void> _submitToClient() async {
    if (!(_clientFormKey.currentState?.validate() ?? false)) return;
    _clientFormKey.currentState?.save();

    setState(() => _isSubmitting = true);
    try {
      final subSvc = ref.read(clientSubmissionServiceProvider);
      final data = {
        'candidateId': widget.candidateId,
        'clientId': _selectedClientId,
        'jobId': widget.jobId,
        if (_externalReferenceId?.isNotEmpty == true)
          'externalReferenceId': _externalReferenceId,
        if (_remarks?.isNotEmpty == true) 'remarks': _remarks,
      };

      await subSvc.createSubmission(data);
      if (mounted) {
        Navigator.of(context).pop();
        _loadData();
      }
    } catch (e) {
      debugPrint('Error creating submission: $e');
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to submit: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _updateStatus(String submissionId, String newStatus) async {
    try {
      final subSvc = ref.read(clientSubmissionServiceProvider);
      await subSvc.updateStatus(submissionId, newStatus);
      _loadData();
    } catch (e) {
      debugPrint('Error updating status: $e');
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to update status: $e')));
      }
    }
  }

  String _formatStatus(String status) => status.replaceAll('_', ' ');

  Color _getStatusBgColor(String status) {
    switch (status) {
      case 'SUBMITTED':
        return Colors.blue.shade50;
      case 'CLIENT_SCREENING':
        return Colors.purple.shade50;
      case 'CLIENT_INTERVIEW':
        return Colors.amber.shade50;
      case 'CLIENT_OFFERED':
        return Colors.green.shade50;
      case 'ONBOARDING':
        return Colors.teal.shade50;
      case 'CLIENT_REJECTED':
        return Colors.red.shade50;
      case 'WITHDRAWN':
        return Colors.grey.shade100;
      default:
        return Colors.grey.shade100;
    }
  }

  Color _getStatusTextColor(String status) {
    switch (status) {
      case 'SUBMITTED':
        return Colors.blue.shade800;
      case 'CLIENT_SCREENING':
        return Colors.purple.shade800;
      case 'CLIENT_INTERVIEW':
        return Colors.amber.shade800;
      case 'CLIENT_OFFERED':
        return Colors.green.shade800;
      case 'ONBOARDING':
        return Colors.teal.shade800;
      case 'CLIENT_REJECTED':
        return Colors.red.shade800;
      case 'WITHDRAWN':
        return Colors.grey.shade800;
      default:
        return Colors.grey.shade800;
    }
  }

  IconData _getStepIcon(String stepStatus) {
    switch (stepStatus) {
      case 'SUBMITTED':
        return Icons.send;
      case 'CLIENT_SCREENING':
        return Icons.search;
      case 'CLIENT_INTERVIEW':
        return Icons.people;
      case 'CLIENT_OFFERED':
        return Icons.emoji_events;
      default:
        return Icons.circle;
    }
  }

  double _getProgressRatio(String status) {
    if (status == 'CLIENT_REJECTED' || status == 'WITHDRAWN') return 0.0;
    if (status == 'ONBOARDING') return 1.0;

    final seq = [
      'SUBMITTED',
      'CLIENT_SCREENING',
      'CLIENT_INTERVIEW',
      'CLIENT_OFFERED',
    ];
    final idx = seq.indexOf(status);
    if (idx == -1) return 0.0;
    return idx / (seq.length - 1);
  }

  void _showAddModal(BuildContext context) {
    _selectedClientId = null;
    _externalReferenceId = null;
    _remarks = null;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text(
          'Submit to Client',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        content: Form(
          key: _clientFormKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Client',
                  style: TextStyle(fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 12,
                    ),
                  ),
                  items: _clients
                      .map(
                        (c) => DropdownMenuItem<String>(
                          value: c['id'],
                          child: Text(c['name']),
                        ),
                      )
                      .toList(),
                  onChanged: (val) => _selectedClientId = val,
                  validator: (val) =>
                      val == null || val.isEmpty ? 'Required' : null,
                  hint: const Text('Select Client...'),
                ),
                const SizedBox(height: 16),
                const Text(
                  'External Reference ID',
                  style: TextStyle(fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    hintText: 'e.g. REQ-12345',
                  ),
                  onSaved: (val) => _externalReferenceId = val,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Remarks',
                  style: TextStyle(fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 3,
                  onSaved: (val) => _remarks = val,
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: _isSubmitting ? null : _submitToClient,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.indigo,
              foregroundColor: Colors.white,
            ),
            child: _isSubmitting
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : const Text('Submit'),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeline(String currentStatus) {
    final ratio = _getProgressRatio(currentStatus);
    final isTerminal =
        currentStatus == 'CLIENT_REJECTED' || currentStatus == 'WITHDRAWN';

    final seq = [
      'SUBMITTED',
      'CLIENT_SCREENING',
      'CLIENT_INTERVIEW',
      'CLIENT_OFFERED',
    ];
    final currentIdx = seq.indexOf(currentStatus);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Background Bar
          Positioned(
            left: 20,
            right: 20,
            top: 20,
            child: Container(
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          // Progress Bar
          Positioned(
            left: 20,
            right: 20,
            top: 20,
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: ratio,
              child: Container(
                height: 4,
                decoration: BoxDecoration(
                  color: isTerminal ? Colors.transparent : Colors.indigo,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ),
          // Steps
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: _timelineSteps.map((step) {
              final stepStatus = step['status']!;
              final stepIdx = seq.indexOf(stepStatus);

              Color circleBg = Colors.white;
              Color circleBorder = Colors.grey.shade300;
              Color iconColor = Colors.grey.shade400;
              Color labelColor = Colors.grey.shade400;
              FontWeight labelWeight = FontWeight.normal;

              if (isTerminal) {
                if (stepIdx <= 0) {
                  circleBg = Colors.grey.shade100;
                  circleBorder = Colors.grey.shade300;
                  iconColor = Colors.grey.shade500;
                }
              } else {
                if (stepIdx < currentIdx) {
                  circleBg = Colors.indigo;
                  circleBorder = Colors.indigo;
                  iconColor = Colors.white;
                  labelColor = Colors.grey.shade900;
                  labelWeight = FontWeight.w500;
                } else if (stepIdx == currentIdx) {
                  circleBg = Colors.white;
                  circleBorder = Colors.indigo;
                  iconColor = Colors.indigo;
                  labelColor = Colors.indigo;
                  labelWeight = FontWeight.bold;
                }
              }

              return SizedBox(
                width: 80,
                child: Column(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: circleBg,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: circleBorder,
                          width: stepIdx == currentIdx && !isTerminal ? 2 : 1,
                        ),
                        boxShadow: stepIdx == currentIdx && !isTerminal
                            ? [
                                BoxShadow(
                                  color: Colors.indigo.withValues(alpha: 0.2),
                                  blurRadius: 8,
                                  spreadRadius: 2,
                                ),
                              ]
                            : null,
                      ),
                      child: Icon(
                        _getStepIcon(stepStatus),
                        color: iconColor,
                        size: 20,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      step['label']!,
                      style: TextStyle(
                        color: labelColor,
                        fontWeight: labelWeight,
                        fontSize: 12,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Card(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          side: BorderSide(color: Color(0xFFF3F4F6)),
          borderRadius: BorderRadius.all(Radius.circular(12)),
        ),
        child: Padding(
          padding: EdgeInsets.all(48),
          child: Center(child: CircularProgressIndicator()),
        ),
      );
    }

    final orgType = ref.read(authProvider.notifier).orgType;
    final canEdit = orgType != 'VENDOR';

    return Card(
      color: Colors.white,
      elevation: 0,
      shape: const RoundedRectangleBorder(
        side: BorderSide(color: Color(0xFFF3F4F6)),
        borderRadius: BorderRadius.all(Radius.circular(12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            decoration: const BoxDecoration(
              color: Color(0xFFF9FAFB),
              border: Border(bottom: BorderSide(color: Color(0xFFF3F4F6))),
              borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Client Submissions',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF111827),
                  ),
                ),
                if (canEdit && _submissions.isEmpty)
                  ElevatedButton.icon(
                    onPressed: () => _showAddModal(context),
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Submit to Client'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.indigo,
                      foregroundColor: Colors.white,
                    ),
                  ),
              ],
            ),
          ),

          // No Submissions
          if (_submissions.isEmpty)
            const Padding(
              padding: EdgeInsets.all(32),
              child: Center(
                child: Column(
                  children: [
                    Icon(Icons.send, size: 48, color: Color(0xFFD1D5DB)),
                    SizedBox(height: 8),
                    Text(
                      'No client submissions yet.',
                      style: TextStyle(color: Color(0xFF6B7280)),
                    ),
                  ],
                ),
              ),
            ),

          // Submissions List
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _submissions.length,
            separatorBuilder: (ctx, i) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final sub = _submissions[index];
              return Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Top Row
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                sub['client']['name'],
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              if (sub['job'] != null) ...[
                                const SizedBox(height: 4),
                                Text.rich(
                                  TextSpan(
                                    text: 'Role: ',
                                    style: const TextStyle(
                                      color: Color(0xFF6B7280),
                                      fontSize: 14,
                                    ),
                                    children: [
                                      TextSpan(
                                        text: sub['job']['title'],
                                        style: const TextStyle(
                                          color: Color(0xFF374151),
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                              if (sub['externalReferenceId'] != null) ...[
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Text(
                                      'Ref ID: ',
                                      style: TextStyle(
                                        color: Color(0xFF6B7280),
                                        fontSize: 14,
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 4,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF3F4F6),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        sub['externalReferenceId'],
                                        style: const TextStyle(
                                          fontFamily: 'monospace',
                                          color: Color(0xFF374151),
                                          fontSize: 13,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                        if (canEdit)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            decoration: BoxDecoration(
                              color: _getStatusBgColor(sub['status']),
                              border: Border.all(
                                color: _getStatusBgColor(
                                  sub['status'],
                                ).withValues(alpha: 0.5),
                              ),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: sub['status'],
                                icon: Icon(
                                  Icons.arrow_drop_down,
                                  color: _getStatusTextColor(sub['status']),
                                ),
                                style: TextStyle(
                                  color: _getStatusTextColor(sub['status']),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                                items: _allStatuses
                                    .map(
                                      (s) => DropdownMenuItem(
                                        value: s,
                                        child: Text(_formatStatus(s)),
                                      ),
                                    )
                                    .toList(),
                                onChanged: (val) {
                                  if (val != null && val != sub['status']) {
                                    showDialog(
                                      context: context,
                                      builder: (ctx) => AlertDialog(
                                        title: const Text('Confirm'),
                                        content: Text(
                                          'Change status to ${_formatStatus(val)}?',
                                        ),
                                        actions: [
                                          TextButton(
                                            onPressed: () => Navigator.pop(ctx),
                                            child: const Text('Cancel'),
                                          ),
                                          TextButton(
                                            onPressed: () {
                                              Navigator.pop(ctx);
                                              _updateStatus(sub['id'], val);
                                            },
                                            child: const Text('Update'),
                                          ),
                                        ],
                                      ),
                                    );
                                  }
                                },
                              ),
                            ),
                          )
                        else
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: _getStatusBgColor(sub['status']),
                              border: Border.all(
                                color: _getStatusBgColor(
                                  sub['status'],
                                ).withValues(alpha: 0.5),
                              ),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Text(
                              _formatStatus(sub['status']),
                              style: TextStyle(
                                color: _getStatusTextColor(sub['status']),
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                      ],
                    ),

                    const SizedBox(height: 32),
                    _buildTimeline(sub['status']),
                    const SizedBox(height: 32),

                    // Remarks and Meta
                    Container(
                      padding: const EdgeInsets.only(top: 16),
                      decoration: const BoxDecoration(
                        border: Border(
                          top: BorderSide(color: Color(0xFFF3F4F6)),
                        ),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF9FAFB),
                                border: Border.all(
                                  color: const Color(0xFFF3F4F6),
                                ),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: sub['remarks']?.isNotEmpty == true
                                  ? Text(
                                      '"${sub['remarks']}"',
                                      style: const TextStyle(
                                        color: Color(0xFF374151),
                                        fontStyle: FontStyle.italic,
                                        fontSize: 14,
                                      ),
                                    )
                                  : const Text(
                                      'No remarks added.',
                                      style: TextStyle(
                                        color: Color(0xFF9CA3AF),
                                        fontSize: 14,
                                      ),
                                    ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              TextButton.icon(
                                onPressed: () => _toggleComments(sub['id']),
                                icon: const Icon(
                                  Icons.chat_bubble_outline,
                                  size: 16,
                                ),
                                label: Text(
                                  _activeSubmissionId == sub['id']
                                      ? 'Hide Comments'
                                      : 'Comments',
                                ),
                                style: TextButton.styleFrom(
                                  foregroundColor: Colors.indigo,
                                  padding: EdgeInsets.zero,
                                  minimumSize: const Size(0, 0),
                                  tapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text.rich(
                                TextSpan(
                                  text: 'Submitted on\n',
                                  style: const TextStyle(
                                    color: Color(0xFF9CA3AF),
                                    fontSize: 12,
                                  ),
                                  children: [
                                    TextSpan(
                                      text: DateFormat.yMMMd().format(
                                        DateTime.parse(sub['submittedAt']),
                                      ),
                                      style: const TextStyle(
                                        color: Color(0xFF4B5563),
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                                textAlign: TextAlign.right,
                              ),
                              if (sub['submittedBy'] != null)
                                Text(
                                  'by ${sub['submittedBy']['firstName']}',
                                  style: const TextStyle(
                                    color: Color(0xFF9CA3AF),
                                    fontSize: 12,
                                  ),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // Comments Section
                    if (_activeSubmissionId == sub['id']) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.only(top: 16),
                        decoration: const BoxDecoration(
                          border: Border(
                            top: BorderSide(color: Color(0xFFF3F4F6)),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Comments',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 12),
                            if (_isLoadingComments)
                              const Padding(
                                padding: EdgeInsets.all(16),
                                child: Center(
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                ),
                              )
                            else ...[
                              if (_comments.isEmpty)
                                const Text(
                                  'No comments yet.',
                                  style: TextStyle(
                                    color: Color(0xFF9CA3AF),
                                    fontStyle: FontStyle.italic,
                                    fontSize: 14,
                                  ),
                                ),
                              ..._comments.map(
                                (comment) => Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        width: 32,
                                        height: 32,
                                        decoration: BoxDecoration(
                                          color: Colors.indigo.shade50,
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: Colors.indigo.shade100,
                                          ),
                                        ),
                                        alignment: Alignment.center,
                                        child: Text(
                                          '${comment['author']['firstName'][0]}${comment['author']['lastName'][0]}',
                                          style: TextStyle(
                                            color: Colors.indigo.shade600,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Container(
                                          padding: const EdgeInsets.all(12),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF9FAFB),
                                            border: Border.all(
                                              color: const Color(0xFFF3F4F6),
                                            ),
                                            borderRadius: BorderRadius.circular(
                                              8,
                                            ),
                                          ),
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                mainAxisAlignment:
                                                    MainAxisAlignment
                                                        .spaceBetween,
                                                children: [
                                                  Text(
                                                    '${comment['author']['firstName']} ${comment['author']['lastName']}',
                                                    style: const TextStyle(
                                                      fontWeight:
                                                          FontWeight.bold,
                                                      fontSize: 14,
                                                    ),
                                                  ),
                                                  Text(
                                                    DateFormat.yMMMd()
                                                        .add_jm()
                                                        .format(
                                                          DateTime.parse(
                                                            comment['createdAt'],
                                                          ),
                                                        ),
                                                    style: const TextStyle(
                                                      color: Color(0xFF9CA3AF),
                                                      fontSize: 12,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              const SizedBox(height: 4),
                                              Text(
                                                comment['commentText'],
                                                style: const TextStyle(
                                                  color: Color(0xFF374151),
                                                  fontSize: 14,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),

                              // Add Comment Input
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: TextField(
                                      controller: _commentController,
                                      decoration: const InputDecoration(
                                        hintText: 'Add a professional note...',
                                        border: OutlineInputBorder(),
                                        contentPadding: EdgeInsets.all(12),
                                      ),
                                      maxLines: 3,
                                      minLines: 1,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  ElevatedButton(
                                    onPressed: () => _addComment(sub['id']),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.indigo,
                                      foregroundColor: Colors.white,
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 16,
                                        vertical: 12,
                                      ),
                                    ),
                                    child: const Text('Post'),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
