import prisma from '@/lib/prisma';

export interface CreateAuditLogParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
}

export async function logAuditEvent({
  userId,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
}: CreateAuditLogParams) {
  try {
    // Sanitization: Ensure secrets are never logged
    let sanitizedDetails = details;
    if (sanitizedDetails) {
      sanitizedDetails = sanitizedDetails
        .replace(/"password":\s*"[^"]*"/gi, '"password":"[REDACTED]"')
        .replace(/"passwordHash":\s*"[^"]*"/gi, '"passwordHash":"[REDACTED]"')
        .replace(/"token":\s*"[^"]*"/gi, '"token":"[REDACTED]"');
    }

    return await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId: entityId || null,
        details: sanitizedDetails || null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error('Failed to record audit log event:', err);
    return null;
  }
}
