import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MedAILockr Healthcare API',
      version: '1.0.0',
      description:
        'Production-ready backend API for a doctor-first healthcare platform. Supports JWT auth, RBAC, appointment management, medical records, and notifications.',
      contact: {
        name: 'MedAILockr Support',
        email: 'support@medailockr.com',
      },
    },
    servers: [
      { url: 'https://heathcare-booking-platform.up.railway.app/api', description: 'Production' },
      { url: 'http://localhost:5001/api', description: 'Local development' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        // ── Generic ──────────────────────────────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },

        // ── Auth ─────────────────────────────────────────────────────────────
        RegisterRequest: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'role'],
          properties: {
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', example: 'Password123' },
            confirmPassword: { type: 'string', example: 'Password123' },
            role: { type: 'string', enum: ['patient', 'doctor'] },
            phone: { type: 'string', example: '+91 9876543210' },
            specialization: { type: 'string', example: 'Cardiology', description: 'Required for doctor' },
            consultationFee: { type: 'number', example: 500, description: 'Required for doctor' },
            qualifications: { type: 'array', items: { type: 'string' }, example: ['MBBS', 'MD'] },
            experienceYears: { type: 'number', example: 10 },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
              },
            },
          },
        },

        // ── User ─────────────────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['patient', 'doctor', 'admin'] },
            phone: { type: 'string' },
            isActive: { type: 'boolean' },
            patientProfile: { $ref: '#/components/schemas/PatientProfile' },
            doctorProfile: { $ref: '#/components/schemas/DoctorProfile' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        PatientProfile: {
          type: 'object',
          properties: {
            dateOfBirth: { type: 'string', format: 'date' },
            bloodGroup: { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
            allergies: { type: 'array', items: { type: 'string' } },
            emergencyContact: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phone: { type: 'string' },
                relation: { type: 'string' },
              },
            },
          },
        },
        DoctorProfile: {
          type: 'object',
          properties: {
            specialization: { type: 'string', example: 'Cardiology' },
            qualifications: { type: 'array', items: { type: 'string' } },
            consultationFee: { type: 'number', example: 500 },
            experienceYears: { type: 'number', example: 10 },
            bio: { type: 'string' },
          },
        },

        // ── Appointment ───────────────────────────────────────────────────────
        BookAppointmentRequest: {
          type: 'object',
          required: ['doctorId', 'scheduledDate', 'scheduledTime', 'reasonForVisit'],
          properties: {
            doctorId: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d1' },
            scheduledDate: { type: 'string', format: 'date', example: '2026-04-15' },
            scheduledTime: { type: 'string', example: '09:00' },
            reasonForVisit: { type: 'string', example: 'Chest pain and shortness of breath' },
            symptoms: { type: 'array', items: { type: 'string' }, example: ['chest pain', 'fatigue'] },
          },
        },
        Appointment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            patientId: { type: 'object' },
            doctorId: { type: 'object' },
            scheduledDate: { type: 'string', format: 'date' },
            scheduledTime: { type: 'string' },
            status: { type: 'string', enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'] },
            reasonForVisit: { type: 'string' },
            consultationFee: { type: 'number' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // ── Medical Record ────────────────────────────────────────────────────
        MedicalRecord: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            patientId: { type: 'object' },
            uploadedBy: { type: 'object' },
            title: { type: 'string' },
            description: { type: 'string' },
            recordType: {
              type: 'string',
              enum: ['lab_report', 'prescription', 'imaging', 'discharge_summary', 'consultation_note', 'other'],
            },
            file: {
              type: 'object',
              properties: {
                originalName: { type: 'string' },
                mimeType: { type: 'string' },
                size: { type: 'number' },
                storageType: { type: 'string' },
              },
            },
            tags: { type: 'array', items: { type: 'string' } },
            isDeleted: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // ── Notification ──────────────────────────────────────────────────────
        SendNotificationRequest: {
          type: 'object',
          required: ['userId', 'type', 'template', 'body', 'recipient'],
          properties: {
            userId: { type: 'string' },
            type: { type: 'string', enum: ['email', 'sms', 'push'] },
            template: { type: 'string', example: 'appointment_booked' },
            subject: { type: 'string' },
            body: { type: 'string' },
            recipient: { type: 'string', example: 'patient@example.com' },
            scheduledAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            type: { type: 'string' },
            template: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'sent', 'failed', 'retrying'] },
            retryCount: { type: 'integer' },
            sentAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication & token management' },
      { name: 'Users', description: 'User profile management' },
      { name: 'Doctors', description: 'Doctor availability' },
      { name: 'Appointments', description: 'Appointment booking and management' },
      { name: 'Medical Records', description: 'Patient document management' },
      { name: 'Notifications', description: 'Notification queue system' },
      { name: 'Admin', description: 'Admin-only operations' },
      { name: 'Health', description: 'Server health checks' },
    ],
    paths: {
      // ── Health ──────────────────────────────────────────────────────────────
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Liveness check',
          security: [],
          responses: { '200': { description: 'Server is running' } },
        },
      },
      '/ready': {
        get: {
          tags: ['Health'],
          summary: 'Readiness check (DB connected?)',
          security: [],
          responses: {
            '200': { description: 'Ready' },
            '503': { description: 'Not ready' },
          },
        },
      },

      // ── Auth ────────────────────────────────────────────────────────────────
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user (patient or doctor)',
          security: [],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
          },
          responses: {
            '201': { description: 'Registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            '409': { description: 'Email already exists' },
            '422': { description: 'Validation error' },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login and receive JWT tokens',
          security: [],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
          },
          responses: {
            '200': { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
            '401': { description: 'Invalid credentials' },
          },
        },
      },
      '/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Issue new access token using refresh token',
          security: [],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } } },
          },
          responses: {
            '200': { description: 'New tokens issued' },
            '401': { description: 'Invalid or expired refresh token' },
          },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Invalidate refresh token (logout)',
          responses: { '200': { description: 'Logged out' }, '401': { description: 'Unauthorized' } },
        },
      },
      '/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Request a password reset token',
          security: [],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } } } },
          },
          responses: { '200': { description: 'Reset token sent (if email exists)' } },
        },
      },
      '/auth/reset-password/{token}': {
        post: {
          tags: ['Auth'],
          summary: 'Reset password with token',
          security: [],
          parameters: [{ in: 'path', name: 'token', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['password', 'confirmPassword'], properties: { password: { type: 'string' }, confirmPassword: { type: 'string' } } } } },
          },
          responses: { '200': { description: 'Password reset successful' }, '400': { description: 'Invalid or expired token' } },
        },
      },

      // ── Users ───────────────────────────────────────────────────────────────
      '/users/profile': {
        get: {
          tags: ['Users'],
          summary: 'Get current user profile',
          responses: { '200': { description: 'Profile data' }, '401': { description: 'Unauthorized' } },
        },
        put: {
          tags: ['Users'],
          summary: 'Update profile fields',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object' } } },
          },
          responses: { '200': { description: 'Profile updated' } },
        },
      },
      '/users/doctors': {
        get: {
          tags: ['Users'],
          summary: 'List all doctors (with filters)',
          parameters: [
            { in: 'query', name: 'specialization', schema: { type: 'string' } },
            { in: 'query', name: 'minFee', schema: { type: 'number' } },
            { in: 'query', name: 'maxFee', schema: { type: 'number' } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
          ],
          responses: { '200': { description: 'List of doctors' } },
        },
      },
      '/users/doctors/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Get doctor details',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Doctor data' }, '404': { description: 'Not found' } },
        },
      },

      // ── Appointments ─────────────────────────────────────────────────────────
      '/appointments': {
        get: {
          tags: ['Appointments'],
          summary: "Get user's appointments (paginated, filterable)",
          parameters: [
            { in: 'query', name: 'status', schema: { type: 'string', enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'] } },
            { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
          ],
          responses: { '200': { description: 'Appointment list' } },
        },
        post: {
          tags: ['Appointments'],
          summary: 'Book new appointment (patient only)',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/BookAppointmentRequest' } } },
          },
          responses: {
            '201': { description: 'Appointment booked' },
            '409': { description: 'Slot not available or conflict detected' },
          },
        },
      },
      '/appointments/{id}': {
        get: {
          tags: ['Appointments'],
          summary: 'Get appointment details',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Appointment data' }, '403': { description: 'Forbidden' }, '404': { description: 'Not found' } },
        },
      },
      '/appointments/{id}/reschedule': {
        put: {
          tags: ['Appointments'],
          summary: 'Reschedule appointment',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['scheduledDate', 'scheduledTime'], properties: { scheduledDate: { type: 'string', format: 'date' }, scheduledTime: { type: 'string' }, reason: { type: 'string' } } } } },
          },
          responses: { '200': { description: 'Rescheduled' }, '409': { description: 'Slot unavailable' } },
        },
      },
      '/appointments/{id}/cancel': {
        put: {
          tags: ['Appointments'],
          summary: 'Cancel appointment with reason',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['reason'], properties: { reason: { type: 'string' } } } } },
          },
          responses: { '200': { description: 'Cancelled' } },
        },
      },
      '/appointments/{id}/complete': {
        put: {
          tags: ['Appointments'],
          summary: 'Mark appointment as completed (doctor only)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Completed' }, '403': { description: 'Forbidden' } },
        },
      },

      // ── Medical Records ──────────────────────────────────────────────────────
      '/records/upload': {
        post: {
          tags: ['Medical Records'],
          summary: 'Upload medical document (multipart, max 10MB)',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file', 'title', 'recordType'],
                  properties: {
                    file: { type: 'string', format: 'binary' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    recordType: { type: 'string', enum: ['lab_report', 'prescription', 'imaging', 'discharge_summary', 'consultation_note', 'other'] },
                    tags: { type: 'string', description: 'Comma-separated' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Record uploaded' }, '400': { description: 'Invalid file type or size' } },
        },
      },
      '/records': {
        get: {
          tags: ['Medical Records'],
          summary: "Get patient's records (filtered)",
          parameters: [
            { in: 'query', name: 'recordType', schema: { type: 'string' } },
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
          ],
          responses: { '200': { description: 'Record list' } },
        },
      },
      '/records/{id}': {
        get: {
          tags: ['Medical Records'],
          summary: 'Get record metadata',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Record data' }, '404': { description: 'Not found' } },
        },
        delete: {
          tags: ['Medical Records'],
          summary: 'Soft delete record',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Deleted' } },
        },
      },
      '/records/{id}/download': {
        get: {
          tags: ['Medical Records'],
          summary: 'Generate temporary signed download URL',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Signed URL' } },
        },
      },

      // ── Notifications ────────────────────────────────────────────────────────
      '/notifications/send': {
        post: {
          tags: ['Notifications'],
          summary: 'Trigger notification (doctor/admin)',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SendNotificationRequest' } } },
          },
          responses: { '201': { description: 'Notification queued' } },
        },
      },
      '/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'List my notifications',
          parameters: [
            { in: 'query', name: 'status', schema: { type: 'string', enum: ['pending', 'sent', 'failed', 'retrying'] } },
            { in: 'query', name: 'type', schema: { type: 'string', enum: ['email', 'sms', 'push'] } },
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          ],
          responses: { '200': { description: 'Notification list' } },
        },
      },
      '/notifications/{id}/retry': {
        post: {
          tags: ['Notifications'],
          summary: 'Retry a failed notification',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Retry triggered' }, '400': { description: 'Not in failed state' } },
        },
      },

      // ── Admin ────────────────────────────────────────────────────────────────
      '/admin/users': {
        get: {
          tags: ['Admin'],
          summary: 'List all users with filters',
          parameters: [
            { in: 'query', name: 'role', schema: { type: 'string', enum: ['patient', 'doctor', 'admin'] } },
            { in: 'query', name: 'isActive', schema: { type: 'boolean' } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          ],
          responses: { '200': { description: 'User list' }, '403': { description: 'Admin only' } },
        },
      },
      '/admin/users/{id}/toggle': {
        patch: {
          tags: ['Admin'],
          summary: 'Activate or deactivate a user',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['isActive'], properties: { isActive: { type: 'boolean' } } } } },
          },
          responses: { '200': { description: 'User updated' } },
        },
      },
      '/admin/analytics/appointments': {
        get: {
          tags: ['Admin'],
          summary: 'Appointment stats by status, doctor, date range',
          parameters: [
            { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'doctorId', schema: { type: 'string' } },
          ],
          responses: { '200': { description: 'Analytics data' } },
        },
      },
      '/admin/audit-logs': {
        get: {
          tags: ['Admin'],
          summary: 'Access logs for sensitive operations',
          parameters: [
            { in: 'query', name: 'userId', schema: { type: 'string' } },
            { in: 'query', name: 'action', schema: { type: 'string' } },
            { in: 'query', name: 'resource', schema: { type: 'string' } },
            { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          ],
          responses: { '200': { description: 'Audit log list' } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);