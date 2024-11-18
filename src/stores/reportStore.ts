import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Report, ReportTemplate } from '../types/report';
import { useAuthStore } from './authStore';

interface ReportState {
  reports: Report[];
  templates: ReportTemplate[];
  addReport: (report: Report) => void;
  updateReport: (report: Report) => void;
  deleteReport: (id: string) => void;
  getReportsByUser: (userId: string) => Report[];
  getReportsByRole: (role: string) => Report[];
  getReportsBySubnet: (subnetId: string) => Report[];
  addTemplate: (template: ReportTemplate) => void;
  updateTemplate: (template: ReportTemplate) => void;
  deleteTemplate: (id: string) => void;
}

export const useReportStore = create<ReportState>()(
  persist(
    (set, get) => ({
      reports: [],
      templates: [],

      addReport: (report) => {
        const { user } = useAuthStore.getState();
        if (!user) return;

        const newReport = {
          ...report,
          createdBy: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          reports: [...state.reports, newReport],
        }));
      },

      updateReport: (updatedReport) =>
        set((state) => ({
          reports: state.reports.map((report) =>
            report.id === updatedReport.id ? updatedReport : report
          ),
        })),

      deleteReport: (id) =>
        set((state) => ({
          reports: state.reports.filter((report) => report.id !== id),
        })),

      getReportsByUser: (userId) => {
        const { reports } = get();
        return reports.filter(
          (report) =>
            report.createdBy === userId ||
            report.permissions.users.includes(userId)
        );
      },

      getReportsByRole: (role) => {
        const { reports } = get();
        return reports.filter((report) =>
          report.permissions.roles.includes(role)
        );
      },

      getReportsBySubnet: (subnetId) => {
        const { reports } = get();
        return reports.filter((report) =>
          report.permissions.subnets.includes(subnetId)
        );
      },

      addTemplate: (template) =>
        set((state) => ({
          templates: [...state.templates, template],
        })),

      updateTemplate: (updatedTemplate) =>
        set((state) => ({
          templates: state.templates.map((template) =>
            template.id === updatedTemplate.id ? updatedTemplate : template
          ),
        })),

      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((template) => template.id !== id),
        })),
    }),
    {
      name: 'report-storage',
    }
  )
);