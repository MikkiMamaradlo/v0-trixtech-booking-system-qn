'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, BarChart3 } from 'lucide-react';

interface ExportToolsProps {
  onExport: (type: string, format: string) => Promise<void>;
}

export default function ExportTools({ onExport }: ExportToolsProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (type: string, format: string) => {
    setExporting(`${type}-${format}`);
    try {
      await onExport(type, format);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(null);
    }
  };

  const exportOptions = [
    {
      type: 'services',
      title: 'Services',
      icon: FileText,
      formats: ['csv'],
      description: 'Export all services data'
    },
    {
      type: 'bookings',
      title: 'Bookings',
      icon: FileSpreadsheet,
      formats: ['csv'],
      description: 'Export booking records'
    },
    {
      type: 'customers',
      title: 'Customers',
      icon: BarChart3,
      formats: ['csv'],
      description: 'Export customer insights'
    },
    {
      type: 'analytics',
      title: 'Analytics',
      icon: BarChart3,
      formats: ['pdf'],
      description: 'Export analytics report'
    }
  ];

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Download className="w-5 h-5" />
        Export Data
      </h3>

      <div className="grid md:grid-cols-2 gap-4">
        {exportOptions.map((option) => {
          const Icon = option.icon;
          return (
            <div key={option.type} className="border border-[var(--border)] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon className="w-8 h-8 text-[var(--primary)] mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-[var(--foreground)]">{option.title}</h4>
                  <p className="text-sm text-[var(--muted)] mb-3">{option.description}</p>

                  <div className="flex gap-2">
                    {option.formats.map((format) => (
                      <button
                        key={format}
                        onClick={() => handleExport(option.type, format)}
                        disabled={exporting === `${option.type}-${format}`}
                        className="btn-secondary text-sm px-3 py-1"
                      >
                        {exporting === `${option.type}-${format}` ? (
                          <div className="flex items-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-t border-b border-current"></div>
                            Exporting...
                          </div>
                        ) : (
                          `Export ${format.toUpperCase()}`
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Exports include data from the last 30 days by default.
          Use the analytics dashboard for custom date ranges.
        </p>
      </div>
    </div>
  );
}