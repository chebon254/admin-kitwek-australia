"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";
import toast from "react-hot-toast";

interface ExportButtonsProps {
  status?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function ExportButtons({
  status = 'all',
  paymentStatus = 'all',
  dateFrom,
  dateTo,
}: ExportButtonsProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      setExporting(true);
      const params = new URLSearchParams({
        format,
        status,
        paymentStatus,
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });

      const response = await fetch(`/api/welfare/registrations/export?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to export registrations");
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kitwek-welfare-registrations-${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Registrations exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Error exporting registrations:", error);
      toast.error("Failed to export registrations");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleExport('csv')}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50 transition-colors text-sm"
      >
        <FileText className="h-4 w-4" />
        <span>Export CSV</span>
      </button>
      <button
        onClick={() => handleExport('excel')}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
      >
        <FileSpreadsheet className="h-4 w-4" />
        <span>Export Excel</span>
      </button>
    </div>
  );
}
