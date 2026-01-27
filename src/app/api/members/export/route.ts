import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv'; // csv or excel
    const status = searchParams.get('status') || 'all';
    const subscription = searchParams.get('subscription') || 'all';
    const revokeStatus = searchParams.get('revokeStatus') || 'all';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause
    const whereClause: Prisma.UserWhereInput = {};

    if (status !== 'all') {
      whereClause.membershipStatus = status.toUpperCase();
    }

    if (subscription !== 'all') {
      whereClause.subscription = subscription;
    }

    if (revokeStatus === 'revoked') {
      whereClause.revokeStatus = true;
    } else if (revokeStatus === 'not_revoked') {
      whereClause.revokeStatus = false;
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) {
        whereClause.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        whereClause.createdAt.lte = new Date(dateTo);
      }
    }

    // Fetch members
    const members = await prisma.user.findMany({
      where: whereClause,
      select: {
        memberNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        proffession: true,
        membershipStatus: true,
        subscription: true,
        revokeStatus: true,
        revokeReason: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data for export
    const exportData = members.map(member => ({
      'Member Number': member.memberNumber || 'N/A',
      'First Name': member.firstName || '',
      'Last Name': member.lastName || '',
      'Email': member.email,
      'Phone': member.phone || '',
      'Profession': member.proffession || '',
      'Membership Status': member.membershipStatus,
      'Subscription': member.subscription,
      'Revoked': member.revokeStatus ? 'Yes' : 'No',
      'Revoke Reason': member.revokeReason || '',
      'Registration Date': new Date(member.createdAt).toLocaleDateString(),
    }));

    // Log the export action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: 'EXPORT_MEMBERS',
        details: `Exported ${exportData.length} members as ${format.toUpperCase()} with filters: status=${status}, subscription=${subscription}, revokeStatus=${revokeStatus}`,
      },
    });

    if (format === 'excel') {
      // Generate Excel file
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');

      // Auto-size columns
      const maxWidth = 50;
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.min(
          Math.max(
            key.length,
            ...exportData.map(row => String(row[key as keyof typeof row] || '').length)
          ),
          maxWidth
        ),
      }));
      worksheet['!cols'] = colWidths;

      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="kitwek-members-${Date.now()}.xlsx"`,
        },
      });
    } else {
      // Generate CSV
      const headers = Object.keys(exportData[0] || {}).join(',');
      const rows = exportData.map(row =>
        Object.values(row)
          .map(value => {
            // Escape commas and quotes in CSV
            const stringValue = String(value || '');
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(',')
      );
      const csvContent = [headers, ...rows].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="kitwek-members-${Date.now()}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error('[EXPORT_MEMBERS]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
