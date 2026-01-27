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
    const paymentStatus = searchParams.get('paymentStatus') || 'all';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause
    const whereClause: Prisma.WelfareRegistrationWhereInput = {};

    if (status !== 'all') {
      if (status === 'active') {
        whereClause.status = 'ACTIVE';
        whereClause.paymentStatus = 'PAID';
      } else if (status === 'inactive') {
        whereClause.status = 'INACTIVE';
      } else {
        whereClause.status = status.toUpperCase();
      }
    }

    if (paymentStatus !== 'all') {
      whereClause.paymentStatus = paymentStatus.toUpperCase();
    }

    if (dateFrom || dateTo) {
      whereClause.registrationDate = {};
      if (dateFrom) {
        whereClause.registrationDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        whereClause.registrationDate.lte = new Date(dateTo);
      }
    }

    // Fetch welfare registrations with user data
    const registrations = await prisma.welfareRegistration.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            memberNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            membershipStatus: true,
          },
        },
      },
      orderBy: { registrationDate: 'desc' },
    });

    // Transform data for export
    const exportData = registrations.map(reg => ({
      'Member Number': reg.user?.memberNumber || 'N/A',
      'First Name': reg.user?.firstName || '',
      'Last Name': reg.user?.lastName || '',
      'Email': reg.user?.email || '',
      'Phone': reg.user?.phone || '',
      'Membership Status': reg.user?.membershipStatus || '',
      'Welfare Status': reg.status,
      'Payment Status': reg.paymentStatus,
      'Registration Fee': `$${reg.registrationFee.toFixed(2)}`,
      'Registration Date': new Date(reg.registrationDate).toLocaleDateString(),
      'Activated At': reg.activatedAt ? new Date(reg.activatedAt).toLocaleDateString() : 'N/A',
      'Created At': new Date(reg.createdAt).toLocaleDateString(),
    }));

    // Log the export action
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: 'EXPORT_WELFARE_REGISTRATIONS',
        details: `Exported ${exportData.length} welfare registrations as ${format.toUpperCase()} with filters: status=${status}, paymentStatus=${paymentStatus}`,
      },
    });

    if (format === 'excel') {
      // Generate Excel file
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Welfare Registrations');

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
          'Content-Disposition': `attachment; filename="kitwek-welfare-registrations-${Date.now()}.xlsx"`,
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
          'Content-Disposition': `attachment; filename="kitwek-welfare-registrations-${Date.now()}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error('[EXPORT_WELFARE_REGISTRATIONS]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
