import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/services/api_service.dart';
import '../../core/services/domain_services.dart';

/// Multi-step user create/edit form matching Angular's UserCreateDialogComponent.
/// 4 steps: Account → Employment → Address → Other
class UserCreatePage extends ConsumerStatefulWidget {
  final String? userId; // null = create mode
  const UserCreatePage({super.key, this.userId});
  @override
  ConsumerState<UserCreatePage> createState() => _UserCreatePageState();
}

class _UserCreatePageState extends ConsumerState<UserCreatePage> {
  int _step = 0;
  bool _saving = false;
  bool _loading = false;
  final _formKey = GlobalKey<FormState>();
  final _steps = const ['Account', 'Employment', 'Address', 'Other'];

  // Step 1: Account
  final _employeeCode = TextEditingController();
  final _username = TextEditingController();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  String _roleId = '';
  List<Map<String, dynamic>> _roles = [];

  // Step 2: Employment
  final _dob = TextEditingController();
  String _gender = '';
  final _dateOfJoining = TextEditingController();
  String _employmentStatus = 'ACTIVE';
  final _department = TextEditingController();
  final _designation = TextEditingController();
  String _employmentType = 'FTE';
  final _workLocation = TextEditingController();
  final _gradeLevel = TextEditingController();

  // Step 3: Address
  final _street = TextEditingController();
  final _city = TextEditingController();
  final _addrState = TextEditingController();
  final _country = TextEditingController();
  final _zipCode = TextEditingController();

  // Step 4: Other
  final _contactName = TextEditingController();
  final _relationship = TextEditingController();
  final _contactPhone = TextEditingController();
  final _contactEmail = TextEditingController();
  final _bankName = TextEditingController();
  final _accountNumber = TextEditingController();
  final _ifscCode = TextEditingController();
  final _branchName = TextEditingController();
  final _taxIdPan = TextEditingController();

  bool get isEditMode => widget.userId != null;

  @override
  void initState() {
    super.initState();
    _loadRoles();
    if (isEditMode) _loadUser();
  }

  @override
  void dispose() {
    for (final c in [
      _employeeCode,
      _username,
      _firstName,
      _lastName,
      _email,
      _phone,
      _dob,
      _dateOfJoining,
      _department,
      _designation,
      _workLocation,
      _gradeLevel,
      _street,
      _city,
      _addrState,
      _country,
      _zipCode,
      _contactName,
      _relationship,
      _contactPhone,
      _contactEmail,
      _bankName,
      _accountNumber,
      _ifscCode,
      _branchName,
      _taxIdPan,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _loadRoles() async {
    try {
      final api = ref.read(apiServiceProvider);
      final result = await api.get<List<dynamic>>('/roles');
      if (mounted && result != null) {
        setState(
          () => _roles = result.map((r) => r as Map<String, dynamic>).toList(),
        );
      }
    } catch (_) {}
  }

  Future<void> _loadUser() async {
    setState(() => _loading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final userService = UserService(api);
      final data = await userService.getUser(widget.userId!);
      if (!mounted || data == null) return;
      setState(() {
        _employeeCode.text = data['employeeCode'] ?? '';
        _username.text = data['username'] ?? '';
        _firstName.text = data['firstName'] ?? '';
        _lastName.text = data['lastName'] ?? '';
        _email.text = data['email'] ?? '';
        _phone.text = data['phone'] ?? '';
        _roleId = data['role']?['id'] ?? '';
        _dob.text = data['dateOfBirth'] ?? '';
        _gender = data['gender'] ?? '';
        _dateOfJoining.text = data['dateOfJoining'] ?? '';
        _employmentStatus = data['employmentStatus'] ?? 'ACTIVE';
        _department.text = data['department'] ?? '';
        _designation.text = data['designation'] ?? '';
        _employmentType = data['employmentType'] ?? 'FTE';
        _workLocation.text = data['workLocation'] ?? '';
        _gradeLevel.text = data['gradeLevel'] ?? '';
        final addr = data['address'];
        if (addr != null) {
          _street.text = addr['street'] ?? '';
          _city.text = addr['city'] ?? '';
          _addrState.text = addr['state'] ?? '';
          _country.text = addr['country'] ?? '';
          _zipCode.text = addr['zipCode'] ?? '';
        }
        final ec = data['emergencyContact'];
        if (ec != null) {
          _contactName.text = ec['contactName'] ?? '';
          _relationship.text = ec['relationship'] ?? '';
          _contactPhone.text = ec['contactPhone'] ?? '';
          _contactEmail.text = ec['contactEmail'] ?? '';
        }
        final bd = data['bankDetails'];
        if (bd != null) {
          _bankName.text = bd['bankName'] ?? '';
          _accountNumber.text = bd['accountNumber'] ?? '';
          _ifscCode.text = bd['ifscCode'] ?? '';
          _branchName.text = bd['branchName'] ?? '';
        }
        _taxIdPan.text = data['taxIdPan'] ?? '';
        _loading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Map<String, dynamic> _buildPayload() {
    return {
      'firstName': _firstName.text,
      'lastName': _lastName.text,
      'email': _email.text,
      'phone': _phone.text.isNotEmpty ? _phone.text : null,
      'roleId': _roleId.isNotEmpty ? _roleId : null,
      'employeeCode': _employeeCode.text.isNotEmpty ? _employeeCode.text : null,
      'username': _username.text.isNotEmpty ? _username.text : null,
      'dateOfBirth': _dob.text.isNotEmpty ? _dob.text : null,
      'gender': _gender.isNotEmpty ? _gender : null,
      'dateOfJoining': _dateOfJoining.text.isNotEmpty
          ? _dateOfJoining.text
          : null,
      'employmentStatus': _employmentStatus,
      'department': _department.text.isNotEmpty ? _department.text : null,
      'designation': _designation.text.isNotEmpty ? _designation.text : null,
      'employmentType': _employmentType,
      'workLocation': _workLocation.text.isNotEmpty ? _workLocation.text : null,
      'gradeLevel': _gradeLevel.text.isNotEmpty ? _gradeLevel.text : null,
      'address': _street.text.isNotEmpty
          ? {
              'street': _street.text,
              'city': _city.text,
              'state': _addrState.text,
              'country': _country.text,
              'zipCode': _zipCode.text,
            }
          : null,
      'emergencyContact': _contactName.text.isNotEmpty
          ? {
              'contactName': _contactName.text,
              'relationship': _relationship.text,
              'contactPhone': _contactPhone.text,
              'contactEmail': _contactEmail.text,
            }
          : null,
      'bankDetails': _bankName.text.isNotEmpty
          ? {
              'bankName': _bankName.text,
              'accountNumber': _accountNumber.text,
              'ifscCode': _ifscCode.text,
              'branchName': _branchName.text,
            }
          : null,
      'taxIdPan': _taxIdPan.text.isNotEmpty ? _taxIdPan.text : null,
    };
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final api = ref.read(apiServiceProvider);
      final userService = UserService(api);
      final payload = _buildPayload();
      if (isEditMode) {
        await userService.updateUser(widget.userId!, payload);
      } else {
        await userService.createUser(payload);
      }
      if (mounted) context.go('/admin/employees');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading)
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        title: Text(isEditMode ? 'Edit User' : 'Create User'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.go('/admin/employees'),
        ),
      ),
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            // Stepper bar
            _buildStepperBar(),
            // Form content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: _buildStepContent(),
              ),
            ),
            // Bottom nav
            _buildBottomNav(),
          ],
        ),
      ),
    );
  }

  Widget _buildStepperBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
      ),
      child: Row(
        children: List.generate(_steps.length, (i) {
          final isActive = i == _step;
          final isDone = i < _step;
          return Expanded(
            child: GestureDetector(
              onTap: i <= _step ? () => setState(() => _step = i) : null,
              child: Row(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isDone
                          ? const Color(0xFF10B981)
                          : isActive
                          ? const Color(0xFF6366F1)
                          : Colors.grey.shade200,
                    ),
                    child: Center(
                      child: isDone
                          ? const Icon(
                              Icons.check,
                              size: 16,
                              color: Colors.white,
                            )
                          : Text(
                              '${i + 1}',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: isActive
                                    ? Colors.white
                                    : Colors.grey.shade500,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      _steps[i],
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: isActive
                            ? FontWeight.w700
                            : FontWeight.w500,
                        color: isActive
                            ? const Color(0xFF6366F1)
                            : Colors.grey.shade500,
                      ),
                    ),
                  ),
                  if (i < _steps.length - 1)
                    Expanded(
                      child: Container(
                        height: 1,
                        margin: const EdgeInsets.symmetric(horizontal: 8),
                        color: isDone
                            ? const Color(0xFF10B981)
                            : Colors.grey.shade200,
                      ),
                    ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildStepContent() {
    switch (_step) {
      case 0:
        return _buildAccountStep();
      case 1:
        return _buildEmploymentStep();
      case 2:
        return _buildAddressStep();
      case 3:
        return _buildOtherStep();
      default:
        return const SizedBox();
    }
  }

  Widget _field(
    String label,
    TextEditingController ctrl, {
    bool required = false,
    TextInputType? keyboardType,
    int maxLines = 1,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: ctrl,
        keyboardType: keyboardType,
        maxLines: maxLines,
        validator: required
            ? (v) => (v == null || v.isEmpty) ? '$label is required' : null
            : null,
        decoration: InputDecoration(
          labelText: label + (required ? ' *' : ''),
          labelStyle: TextStyle(fontSize: 14, color: Colors.grey.shade600),
          filled: true,
          fillColor: Colors.white,
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
            borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2),
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 14,
            vertical: 14,
          ),
        ),
      ),
    );
  }

  Widget _buildAccountStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Account Information',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 4),
        Text(
          'Basic account details for the user.',
          style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: _field('Employee Code', _employeeCode, required: true),
            ),
            const SizedBox(width: 12),
            Expanded(child: _field('Username', _username, required: true)),
          ],
        ),
        Row(
          children: [
            Expanded(child: _field('First Name', _firstName, required: true)),
            const SizedBox(width: 12),
            Expanded(child: _field('Last Name', _lastName, required: true)),
          ],
        ),
        _field(
          'Email',
          _email,
          required: true,
          keyboardType: TextInputType.emailAddress,
        ),
        _field(
          'Phone',
          _phone,
          required: true,
          keyboardType: TextInputType.phone,
        ),
        // Role dropdown
        Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: DropdownButtonFormField<String>(
            value: _roleId.isNotEmpty ? _roleId : null,
            validator: (v) =>
                (v == null || v.isEmpty) ? 'Role is required' : null,
            decoration: InputDecoration(
              labelText: 'Role *',
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 14,
                vertical: 14,
              ),
            ),
            items: _roles
                .map(
                  (r) => DropdownMenuItem(
                    value: r['id'] as String?,
                    child: Text(
                      r['name'] ?? '',
                      style: const TextStyle(fontSize: 14),
                    ),
                  ),
                )
                .toList(),
            onChanged: (v) => setState(() => _roleId = v ?? ''),
          ),
        ),
      ],
    );
  }

  Widget _buildEmploymentStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Employment Details',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(child: _field('Date of Birth', _dob, required: true)),
            const SizedBox(width: 12),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: DropdownButtonFormField<String>(
                  value: _gender.isNotEmpty ? _gender : null,
                  validator: (v) =>
                      (v == null || v.isEmpty) ? 'Gender is required' : null,
                  decoration: InputDecoration(
                    labelText: 'Gender *',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 14,
                    ),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'MALE', child: Text('Male')),
                    DropdownMenuItem(value: 'FEMALE', child: Text('Female')),
                    DropdownMenuItem(value: 'OTHER', child: Text('Other')),
                  ],
                  onChanged: (v) => setState(() => _gender = v ?? ''),
                ),
              ),
            ),
          ],
        ),
        Row(
          children: [
            Expanded(
              child: _field('Date of Joining', _dateOfJoining, required: true),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: DropdownButtonFormField<String>(
                  value: _employmentStatus,
                  decoration: InputDecoration(
                    labelText: 'Status *',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 14,
                    ),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'ACTIVE', child: Text('Active')),
                    DropdownMenuItem(
                      value: 'INACTIVE',
                      child: Text('Inactive'),
                    ),
                    DropdownMenuItem(
                      value: 'TERMINATED',
                      child: Text('Terminated'),
                    ),
                    DropdownMenuItem(
                      value: 'ON_LEAVE',
                      child: Text('On Leave'),
                    ),
                  ],
                  onChanged: (v) =>
                      setState(() => _employmentStatus = v ?? 'ACTIVE'),
                ),
              ),
            ),
          ],
        ),
        Row(
          children: [
            Expanded(child: _field('Department', _department)),
            const SizedBox(width: 12),
            Expanded(child: _field('Designation', _designation)),
          ],
        ),
        Row(
          children: [
            Expanded(child: _field('Work Location', _workLocation)),
            const SizedBox(width: 12),
            Expanded(child: _field('Grade Level', _gradeLevel)),
          ],
        ),
      ],
    );
  }

  Widget _buildAddressStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Address',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 20),
        _field('Street', _street, required: true),
        Row(
          children: [
            Expanded(child: _field('City', _city, required: true)),
            const SizedBox(width: 12),
            Expanded(child: _field('State', _addrState, required: true)),
          ],
        ),
        Row(
          children: [
            Expanded(child: _field('Country', _country, required: true)),
            const SizedBox(width: 12),
            Expanded(child: _field('Zip Code', _zipCode, required: true)),
          ],
        ),
      ],
    );
  }

  Widget _buildOtherStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Emergency Contact',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: _field('Contact Name', _contactName, required: true),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _field('Relationship', _relationship, required: true),
            ),
          ],
        ),
        Row(
          children: [
            Expanded(
              child: _field(
                'Phone',
                _contactPhone,
                required: true,
                keyboardType: TextInputType.phone,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _field(
                'Email',
                _contactEmail,
                keyboardType: TextInputType.emailAddress,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        const Text(
          'Bank Details',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: _field('Bank Name', _bankName, required: true)),
            const SizedBox(width: 12),
            Expanded(
              child: _field('Account Number', _accountNumber, required: true),
            ),
          ],
        ),
        Row(
          children: [
            Expanded(child: _field('IFSC Code', _ifscCode, required: true)),
            const SizedBox(width: 12),
            Expanded(child: _field('Branch Name', _branchName, required: true)),
          ],
        ),
        const SizedBox(height: 16),
        _field('Tax ID / PAN', _taxIdPan),
      ],
    );
  }

  Widget _buildBottomNav() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if (_step > 0)
            OutlinedButton.icon(
              onPressed: () => setState(() => _step--),
              icon: const Icon(Icons.arrow_back, size: 16),
              label: const Text('Back'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            )
          else
            const SizedBox(),
          if (_step < _steps.length - 1)
            ElevatedButton.icon(
              onPressed: () => setState(() => _step++),
              icon: const Text('Next'),
              label: const Icon(Icons.arrow_forward, size: 16),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF6366F1),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                elevation: 0,
              ),
            )
          else
            ElevatedButton.icon(
              onPressed: _saving ? null : _submit,
              icon: _saving
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.check, size: 16),
              label: Text(
                _saving
                    ? 'Saving...'
                    : (isEditMode ? 'Update User' : 'Create User'),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                elevation: 0,
              ),
            ),
        ],
      ),
    );
  }
}
