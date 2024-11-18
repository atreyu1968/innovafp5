import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Form, FormResponse } from '../types/form';
import { useAuthStore } from './authStore';
import { useAcademicYearStore } from './academicYearStore';

interface FormState {
  forms: Form[];
  responses: FormResponse[];
  templates: Form[];
  addForm: (form: Form) => void;
  updateForm: (form: Form) => void;
  deleteForm: (formId: string) => void;
  addResponse: (response: FormResponse) => void;
  updateResponse: (response: FormResponse) => void;
  getFormsByRole: (role: string) => Form[];
  getResponsesByForm: (formId: string) => FormResponse[];
  getResponsesByUser: (userId: string, formId: string) => FormResponse[];
  getResponseByUserAndForm: (userId: string, formId: string) => FormResponse | undefined;
  canUserRespond: (userId: string, formId: string) => boolean;
  syncResponses: () => void;
  createFromTemplate: (templateId: string) => string | undefined;
  getTemplates: () => Form[];
}

export const useFormStore = create<FormState>()(
  persist(
    (set, get) => ({
      forms: [],
      responses: [],
      templates: [],

      addForm: (form) => {
        const { user } = useAuthStore.getState();
        const formWithUser = {
          ...form,
          createdBy: user?.id,
          createdByName: user?.nombre,
        };
        set((state) => ({
          forms: [...state.forms, formWithUser],
        }));
        get().syncResponses();
      },

      updateForm: (updatedForm) => set((state) => ({
        forms: state.forms.map((form) =>
          form.id === updatedForm.id ? updatedForm : form
        ),
      })),

      deleteForm: (formId) => set((state) => ({
        forms: state.forms.filter((form) => form.id !== formId),
        responses: state.responses.filter((response) => response.formId !== formId),
      })),

      addResponse: (response) => set((state) => ({
        responses: [...state.responses, response],
      })),

      updateResponse: (updatedResponse) => set((state) => ({
        responses: state.responses.map((response) =>
          response.id === updatedResponse.id ? updatedResponse : response
        ),
      })),

      getFormsByRole: (role) => {
        const { forms } = get();
        const { activeYear } = useAcademicYearStore.getState();
        return forms.filter(
          (form) =>
            form.status === 'publicado' && 
            form.assignedRoles.includes(role) &&
            form.academicYearId === activeYear?.id
        );
      },

      getResponsesByForm: (formId) => {
        const { responses } = get();
        return responses.filter((response) => response.formId === formId);
      },

      getResponsesByUser: (userId, formId) => {
        const { responses } = get();
        return responses.filter(
          (response) => response.userId === userId && response.formId === formId
        );
      },

      getResponseByUserAndForm: (userId, formId) => {
        const { responses } = get();
        return responses.find(
          (response) => response.userId === userId && response.formId === formId
        );
      },

      canUserRespond: (userId, formId) => {
        const form = get().forms.find(f => f.id === formId);
        if (!form || form.status !== 'publicado' || !form.acceptingResponses) {
          return false;
        }

        const userResponses = get().getResponsesByUser(userId, formId);
        if (!form.allowMultipleResponses && userResponses.length > 0) {
          return false;
        }

        return true;
      },

      syncResponses: () => {
        const { forms, responses } = get();
        const { user } = useAuthStore.getState();
        const { activeYear } = useAcademicYearStore.getState();

        if (!user || !activeYear) return;

        const userForms = forms.filter(
          form => 
            form.status === 'publicado' &&
            form.assignedRoles.includes(user.role) &&
            form.academicYearId === activeYear.id
        );

        const newResponses = userForms
          .filter(form => !responses.some(r => r.formId === form.id && r.userId === user.id))
          .map(form => ({
            id: crypto.randomUUID(),
            formId: form.id,
            userId: user.id,
            userName: user.nombre,
            userRole: user.role,
            academicYearId: activeYear.id,
            responses: {},
            status: 'borrador',
            responseTimestamp: new Date().toISOString(),
            lastModifiedTimestamp: new Date().toISOString(),
          }));

        if (newResponses.length > 0) {
          set(state => ({
            responses: [...state.responses, ...newResponses]
          }));
        }
      },

      createFromTemplate: (templateId) => {
        const template = get().templates.find(t => t.id === templateId);
        if (!template) return undefined;

        const newForm = {
          ...template,
          id: crypto.randomUUID(),
          status: 'borrador',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        get().addForm(newForm);
        return newForm.id;
      },

      getTemplates: () => get().templates,
    }),
    {
      name: 'form-storage',
    }
  )
);