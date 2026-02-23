// ===== Organization Types =====
enum OrganizationType { SOLVENTEK, VENDOR }

enum OrganizationStatus {
  PENDING_VERIFICATION,
  APPROVED,
  REJECTED,
  ACTIVE,
  INACTIVE,
}

class Organization {
  final String id;
  final String name;
  final String? legalName;
  final OrganizationType type;
  final OrganizationStatus status;
  final String? logoUrl;
  final String? primaryContact;
  final String? email;
  final String? phone;
  final String? address;
  final String? website;
  final String? taxId;
  final String? industry;
  final String? description;
  final int? employeeCount;
  final int? yearsInBusiness;
  final String? registrationNumber;
  final String? serviceOfferings;
  final String? keyClients;
  final String? contactPersonName;
  final String? contactPersonDesignation;
  final String? contactPersonEmail;
  final String? contactPersonPhone;
  final String? addressLine1;
  final String? addressLine2;
  final String? city;
  final String? state;
  final String? country;
  final String? postalCode;
  final String? referralSource;
  final String createdAt;
  final String updatedAt;

  Organization({
    required this.id,
    required this.name,
    this.legalName,
    required this.type,
    required this.status,
    this.logoUrl,
    this.primaryContact,
    this.email,
    this.phone,
    this.address,
    this.website,
    this.taxId,
    this.industry,
    this.description,
    this.employeeCount,
    this.yearsInBusiness,
    this.registrationNumber,
    this.serviceOfferings,
    this.keyClients,
    this.contactPersonName,
    this.contactPersonDesignation,
    this.contactPersonEmail,
    this.contactPersonPhone,
    this.addressLine1,
    this.addressLine2,
    this.city,
    this.state,
    this.country,
    this.postalCode,
    this.referralSource,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Organization.fromJson(Map<String, dynamic> json) {
    return Organization(
      id: json['id'] as String,
      name: json['name'] as String,
      legalName: json['legalName'] as String?,
      type: OrganizationType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => OrganizationType.SOLVENTEK,
      ),
      status: OrganizationStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => OrganizationStatus.ACTIVE,
      ),
      logoUrl: json['logoUrl'] as String?,
      primaryContact: json['primaryContact'] as String?,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      address: json['address'] as String?,
      website: json['website'] as String?,
      taxId: json['taxId'] as String?,
      industry: json['industry'] as String?,
      description: json['description'] as String?,
      employeeCount: json['employeeCount'] as int?,
      yearsInBusiness: json['yearsInBusiness'] as int?,
      registrationNumber: json['registrationNumber'] as String?,
      serviceOfferings: json['serviceOfferings'] as String?,
      keyClients: json['keyClients'] as String?,
      contactPersonName: json['contactPersonName'] as String?,
      contactPersonDesignation: json['contactPersonDesignation'] as String?,
      contactPersonEmail: json['contactPersonEmail'] as String?,
      contactPersonPhone: json['contactPersonPhone'] as String?,
      addressLine1: json['addressLine1'] as String?,
      addressLine2: json['addressLine2'] as String?,
      city: json['city'] as String?,
      state: json['state'] as String?,
      country: json['country'] as String?,
      postalCode: json['postalCode'] as String?,
      referralSource: json['referralSource'] as String?,
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'legalName': legalName,
    'type': type.name,
    'status': status.name,
    'logoUrl': logoUrl,
    'primaryContact': primaryContact,
    'email': email,
    'phone': phone,
    'address': address,
    'website': website,
    'taxId': taxId,
    'industry': industry,
    'description': description,
    'employeeCount': employeeCount,
    'yearsInBusiness': yearsInBusiness,
    'registrationNumber': registrationNumber,
    'serviceOfferings': serviceOfferings,
    'keyClients': keyClients,
    'contactPersonName': contactPersonName,
    'contactPersonDesignation': contactPersonDesignation,
    'contactPersonEmail': contactPersonEmail,
    'contactPersonPhone': contactPersonPhone,
    'addressLine1': addressLine1,
    'addressLine2': addressLine2,
    'city': city,
    'state': state,
    'country': country,
    'postalCode': postalCode,
    'referralSource': referralSource,
    'createdAt': createdAt,
    'updatedAt': updatedAt,
  };
}

// ===== Roles =====
enum UserRole { SUPER_ADMIN, HR_ADMIN, ADMIN, TA, EMPLOYEE, VENDOR }

class Permission {
  final String code;
  final String? description;

  Permission({required this.code, this.description});

  factory Permission.fromJson(Map<String, dynamic> json) => Permission(
    code: json['code'] as String,
    description: json['description'] as String?,
  );
}

class Role {
  final String id;
  final String name;
  final String? description;
  final List<Permission>? permissions;
  final Organization? organization;

  Role({
    required this.id,
    required this.name,
    this.description,
    this.permissions,
    this.organization,
  });

  factory Role.fromJson(Map<String, dynamic> json) => Role(
    id: json['id'] as String,
    name: json['name'] as String,
    description: json['description'] as String?,
    permissions: (json['permissions'] as List<dynamic>?)
        ?.map((e) => Permission.fromJson(e as Map<String, dynamic>))
        .toList(),
    organization: json['organization'] != null
        ? Organization.fromJson(json['organization'] as Map<String, dynamic>)
        : null,
  );
}

// ===== Manager Summary =====
class ManagerSummary {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String? profilePhotoUrl;

  ManagerSummary({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.profilePhotoUrl,
  });

  factory ManagerSummary.fromJson(Map<String, dynamic> json) => ManagerSummary(
    id: json['id'] as String,
    firstName: json['firstName'] as String,
    lastName: json['lastName'] as String,
    email: json['email'] as String,
    profilePhotoUrl: json['profilePhotoUrl'] as String?,
  );
}

// ===== Bank Details =====
class BankDetails {
  final String? bankName;
  final String? accountNumber;
  final String? accountNumberMasked;
  final String? ifscCode;
  final String? branchName;

  BankDetails({
    this.bankName,
    this.accountNumber,
    this.accountNumberMasked,
    this.ifscCode,
    this.branchName,
  });

  factory BankDetails.fromJson(Map<String, dynamic> json) => BankDetails(
    bankName: json['bankName'] as String?,
    accountNumber: json['accountNumber'] as String?,
    accountNumberMasked: json['accountNumberMasked'] as String?,
    ifscCode: json['ifscCode'] as String?,
    branchName: json['branchName'] as String?,
  );

  Map<String, dynamic> toJson() => {
    'bankName': bankName,
    'accountNumber': accountNumber,
    'ifscCode': ifscCode,
    'branchName': branchName,
  };
}

// ===== Address =====
class Address {
  final String? street;
  final String? city;
  final String? state;
  final String? country;
  final String? zipCode;

  Address({this.street, this.city, this.state, this.country, this.zipCode});

  factory Address.fromJson(Map<String, dynamic> json) => Address(
    street: json['street'] as String?,
    city: json['city'] as String?,
    state: json['state'] as String?,
    country: json['country'] as String?,
    zipCode: json['zipCode'] as String?,
  );

  Map<String, dynamic> toJson() => {
    'street': street,
    'city': city,
    'state': state,
    'country': country,
    'zipCode': zipCode,
  };
}

// ===== Emergency Contact =====
class EmergencyContact {
  final String? contactName;
  final String? relationship;
  final String? contactPhone;
  final String? contactEmail;

  EmergencyContact({
    this.contactName,
    this.relationship,
    this.contactPhone,
    this.contactEmail,
  });

  factory EmergencyContact.fromJson(Map<String, dynamic> json) =>
      EmergencyContact(
        contactName: json['contactName'] as String?,
        relationship: json['relationship'] as String?,
        contactPhone: json['contactPhone'] as String?,
        contactEmail: json['contactEmail'] as String?,
      );

  Map<String, dynamic> toJson() => {
    'contactName': contactName,
    'relationship': relationship,
    'contactPhone': contactPhone,
    'contactEmail': contactEmail,
  };
}

// ===== User =====
class User {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String orgId;
  final String orgType;
  final Role role;
  final Organization? organization;
  final String? createdAt;
  final String? updatedAt;
  final String? phone;
  final String? dateOfBirth;
  final String? gender;
  final String? profilePhotoUrl;
  final String? employeeCode;
  final String? username;
  final String? dateOfJoining;
  final String? employmentStatus;
  final String? department;
  final String? designation;
  final String? employmentType;
  final String? workLocation;
  final String? gradeLevel;
  final ManagerSummary? manager;
  final String? managerId;
  final bool? enabled;
  final bool? accountLocked;
  final int? failedLoginAttempts;
  final String? lockUntil;
  final String? lastLoginAt;
  final String? passwordUpdatedAt;
  final Address? address;
  final EmergencyContact? emergencyContact;
  final BankDetails? bankDetails;
  final String? taxIdPan;

  User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.orgId,
    required this.orgType,
    required this.role,
    this.organization,
    this.createdAt,
    this.updatedAt,
    this.phone,
    this.dateOfBirth,
    this.gender,
    this.profilePhotoUrl,
    this.employeeCode,
    this.username,
    this.dateOfJoining,
    this.employmentStatus,
    this.department,
    this.designation,
    this.employmentType,
    this.workLocation,
    this.gradeLevel,
    this.manager,
    this.managerId,
    this.enabled,
    this.accountLocked,
    this.failedLoginAttempts,
    this.lockUntil,
    this.lastLoginAt,
    this.passwordUpdatedAt,
    this.address,
    this.emergencyContact,
    this.bankDetails,
    this.taxIdPan,
  });

  String get fullName => '$firstName $lastName';
  String get initials =>
      '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'
          .toUpperCase();

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      orgId: json['orgId'] as String,
      orgType: json['orgType'] as String,
      role: Role.fromJson(json['role'] as Map<String, dynamic>),
      organization: json['organization'] != null
          ? Organization.fromJson(json['organization'] as Map<String, dynamic>)
          : null,
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
      phone: json['phone'] as String?,
      dateOfBirth: json['dateOfBirth'] as String?,
      gender: json['gender'] as String?,
      profilePhotoUrl: json['profilePhotoUrl'] as String?,
      employeeCode: json['employeeCode'] as String?,
      username: json['username'] as String?,
      dateOfJoining: json['dateOfJoining'] as String?,
      employmentStatus: json['employmentStatus'] as String?,
      department: json['department'] as String?,
      designation: json['designation'] as String?,
      employmentType: json['employmentType'] as String?,
      workLocation: json['workLocation'] as String?,
      gradeLevel: json['gradeLevel'] as String?,
      manager: json['manager'] != null
          ? ManagerSummary.fromJson(json['manager'] as Map<String, dynamic>)
          : null,
      managerId: json['managerId'] as String?,
      enabled: json['enabled'] as bool?,
      accountLocked: json['accountLocked'] as bool?,
      failedLoginAttempts: json['failedLoginAttempts'] as int?,
      lockUntil: json['lockUntil'] as String?,
      lastLoginAt: json['lastLoginAt'] as String?,
      passwordUpdatedAt: json['passwordUpdatedAt'] as String?,
      address: json['address'] != null
          ? Address.fromJson(json['address'] as Map<String, dynamic>)
          : null,
      emergencyContact: json['emergencyContact'] != null
          ? EmergencyContact.fromJson(
              json['emergencyContact'] as Map<String, dynamic>,
            )
          : null,
      bankDetails: json['bankDetails'] != null
          ? BankDetails.fromJson(json['bankDetails'] as Map<String, dynamic>)
          : null,
      taxIdPan: json['taxIdPan'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'firstName': firstName,
    'lastName': lastName,
    'orgId': orgId,
    'orgType': orgType,
    'role': {'id': role.id, 'name': role.name},
    'phone': phone,
    'dateOfBirth': dateOfBirth,
    'gender': gender,
    'profilePhotoUrl': profilePhotoUrl,
    'employeeCode': employeeCode,
    'username': username,
    'dateOfJoining': dateOfJoining,
    'employmentStatus': employmentStatus,
    'department': department,
    'designation': designation,
    'employmentType': employmentType,
    'workLocation': workLocation,
    'gradeLevel': gradeLevel,
    'managerId': managerId,
    'enabled': enabled,
    'accountLocked': accountLocked,
    'taxIdPan': taxIdPan,
  };
}

// ===== Auth Response =====
class AuthResponse {
  final String accessToken;
  final String refreshToken;
  final User user;

  AuthResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) => AuthResponse(
    accessToken: json['accessToken'] as String,
    refreshToken: json['refreshToken'] as String,
    user: User.fromJson(json['user'] as Map<String, dynamic>),
  );
}

// ===== Request DTOs matching Angular models =====
class CreateEmployeeRequest {
  final String firstName;
  final String lastName;
  final String email;
  final String? roleId;
  final String? phone;
  final String? dateOfBirth;
  final String? gender;
  final String? employeeCode;
  final String? dateOfJoining;
  final String? department;
  final String? designation;
  final String? employmentType;
  final String? workLocation;
  final String? gradeLevel;
  final Address? address;
  final EmergencyContact? emergencyContact;
  final BankDetails? bankDetails;
  final String? taxIdPan;

  CreateEmployeeRequest({
    required this.firstName,
    required this.lastName,
    required this.email,
    this.roleId,
    this.phone,
    this.dateOfBirth,
    this.gender,
    this.employeeCode,
    this.dateOfJoining,
    this.department,
    this.designation,
    this.employmentType,
    this.workLocation,
    this.gradeLevel,
    this.address,
    this.emergencyContact,
    this.bankDetails,
    this.taxIdPan,
  });

  Map<String, dynamic> toJson() => {
    'firstName': firstName,
    'lastName': lastName,
    'email': email,
    'roleId': roleId,
    'phone': phone,
    'dateOfBirth': dateOfBirth,
    'gender': gender,
    'employeeCode': employeeCode,
    'dateOfJoining': dateOfJoining,
    'department': department,
    'designation': designation,
    'employmentType': employmentType,
    'workLocation': workLocation,
    'gradeLevel': gradeLevel,
    'address': address?.toJson(),
    'emergencyContact': emergencyContact?.toJson(),
    'bankDetails': bankDetails?.toJson(),
    'taxIdPan': taxIdPan,
  };
}

class ChangePasswordRequest {
  final String newPassword;
  ChangePasswordRequest({required this.newPassword});
  Map<String, dynamic> toJson() => {'newPassword': newPassword};
}
