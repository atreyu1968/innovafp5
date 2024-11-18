import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useAcademicYearStore } from '../stores/academicYearStore';
import { Report } from '../types/report';
import ReportList from '../components/reports/ReportList';
import ReportViewer from '../components/reports/ReportViewer';
import { useReportStore } from '../stores/reportStore';
import { useNotifications } from '../components/notifications/NotificationProvider';

const Reports = () => {
  const [showViewer, setShowViewer] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const { user, activeRole } = useAuthStore();
  const { activeYear } = useAcademicYearStore();
  const { reports, deleteReport } = useReportStore();
  const { showNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = user?.role === 'coordinador_general' && activeRole === 'admin';

  if (!activeYear && !isAdmin) {
    return (
      <div className="bg-yellow-50 p-4 rounded-md">
        <p className="text-yellow-700">
          No hay un curso académico activo. Contacta con el coordinador general.
        </p>
      </div>
    );
  }

  const handleDelete = (reportId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este informe?')) {
      deleteReport(reportId);
      showNotification('success', 'Informe eliminado correctamente');
    }
  };

  const handleDownload = (report: Report) => {
    // Crear un enlace temporal y simular clic para descargar
    const link = document.createElement('a');
    link.href = report.output.url;
    link.download = `${report.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const hasPermission = isAdmin ||
                         report.permissions.users.includes(user?.id || '') ||
                         report.permissions.roles.includes(user?.role || '') ||
                         (user?.subred && report.permissions.subnets.includes(user.subred));
    
    return matchesSearch && hasPermission;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Informes</h2>
          <p className="mt-1 text-sm text-gray-500">
            {activeYear ? `Curso académico: ${activeYear.year}` : 'Todos los cursos'}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-lg">
          <input
            type="text"
            placeholder="Buscar informes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {showViewer && selectedReport ? (
        <ReportViewer
          report={selectedReport}
          onClose={() => {
            setShowViewer(false);
            setSelectedReport(null);
          }}
        />
      ) : (
        <ReportList
          reports={filteredReports}
          onReportClick={(report) => {
            setSelectedReport(report);
            setShowViewer(true);
          }}
          onDelete={handleDelete}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};

export default Reports;