import User, { IUserDocument } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { createAuditLog, AuditActions } from '../utils/auditLog';
import { UpdateProfileInput, ListDoctorsQuery } from '../validators/user.validator';
import { IPaginatedResponse } from '../types';

// ─── Get Profile ──────────────────────────────────────────────────────────────

export const getUserProfile = async (
  userId: string,
  requesterId: string,
  ipAddress?: string
): Promise<IUserDocument> => {
  const user = await User.findById(userId);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  if (!user.isActive) {
    throw ApiError.notFound('User not found');
  }

  await createAuditLog({
    userId: requesterId,
    action: AuditActions.PROFILE_VIEW,
    resource: 'User',
    resourceId: userId,
    ipAddress,
  });

  return user;
};

// ─── Update Profile ───────────────────────────────────────────────────────────

export const updateUserProfile = async (
  userId: string,
  input: UpdateProfileInput,
  ipAddress?: string
): Promise<IUserDocument> => {
  const user = await User.findById(userId);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Update base fields
  if (input.firstName) user.firstName = input.firstName;
  if (input.lastName) user.lastName = input.lastName;
  if (input.phone !== undefined) user.phone = input.phone ?? undefined;

  // Update role-specific profile
  if (input.patientProfile && user.role === 'patient') {
    const pp = input.patientProfile;

    if (!user.patientProfile) user.patientProfile = {};

    if (pp.dateOfBirth !== undefined) {
      user.patientProfile.dateOfBirth = pp.dateOfBirth
        ? new Date(pp.dateOfBirth)
        : undefined;
    }
    if (pp.bloodGroup !== undefined) {
      user.patientProfile.bloodGroup = pp.bloodGroup ?? undefined;
    }
    if (pp.allergies !== undefined) {
      user.patientProfile.allergies = pp.allergies;
    }
    if (pp.emergencyContact !== undefined) {
      user.patientProfile.emergencyContact = pp.emergencyContact ?? undefined;
    }
  }

  if (input.doctorProfile && user.role === 'doctor') {
    const dp = input.doctorProfile;

    if (!user.doctorProfile) {
      throw ApiError.badRequest('Doctor profile not initialized');
    }

    if (dp.specialization) user.doctorProfile.specialization = dp.specialization;
    if (dp.qualifications) user.doctorProfile.qualifications = dp.qualifications;
    if (dp.consultationFee !== undefined) user.doctorProfile.consultationFee = dp.consultationFee;
    if (dp.experienceYears !== undefined) user.doctorProfile.experienceYears = dp.experienceYears;
    if (dp.bio !== undefined) user.doctorProfile.bio = dp.bio ?? undefined;
    if (dp.licenseNumber !== undefined) user.doctorProfile.licenseNumber = dp.licenseNumber ?? undefined;
  }

  const updated = await user.save();

  await createAuditLog({
    userId,
    action: AuditActions.PROFILE_UPDATE,
    resource: 'User',
    resourceId: userId,
    details: { updatedFields: Object.keys(input) },
    ipAddress,
  });

  return updated;
};

// ─── List Doctors ─────────────────────────────────────────────────────────────

export const listDoctors = async (
  query: ListDoctorsQuery
): Promise<IPaginatedResponse<IUserDocument>> => {
  const {
    specialization,
    minFee,
    maxFee,
    search,
    page,
    limit,
    sortBy,
    sortOrder,
  } = query;

  const filter: Record<string, unknown> = {
    role: 'doctor',
    isActive: true,
  };

  if (specialization) {
    filter['doctorProfile.specialization'] = {
      $regex: specialization,
      $options: 'i',
    };
  }

  if (minFee !== undefined || maxFee !== undefined) {
    filter['doctorProfile.consultationFee'] = {};
    if (minFee !== undefined) {
      (filter['doctorProfile.consultationFee'] as Record<string, number>).$gte = minFee;
    }
    if (maxFee !== undefined) {
      (filter['doctorProfile.consultationFee'] as Record<string, number>).$lte = maxFee;
    }
  }

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { 'doctorProfile.specialization': { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const sortField =
    sortBy === 'consultationFee'
      ? 'doctorProfile.consultationFee'
      : sortBy === 'experienceYears'
      ? 'doctorProfile.experienceYears'
      : 'createdAt';

  const [doctors, total] = await Promise.all([
    User.find(filter)
      .sort({ [sortField]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: doctors as unknown as IUserDocument[],
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

// ─── Get Doctor By ID ─────────────────────────────────────────────────────────

export const getDoctorById = async (
  doctorId: string
): Promise<IUserDocument> => {
  const doctor = await User.findOne({
    _id: doctorId,
    role: 'doctor',
    isActive: true,
  });

  if (!doctor) {
    throw ApiError.notFound('Doctor not found');
  }

  return doctor;
};