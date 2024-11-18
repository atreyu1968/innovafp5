import React, { useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { FormResponse } from '../../../types/form';
import { useNotifications } from '../../notifications/NotificationProvider';

interface TemplateSelectorProps {
  data: {
    responses: FormResponse[];
    reportType: 'individual' | 'general';
    additionalSources: Array<{
      name: string;
      data: any[];
      headers: string[];
    }>;
    calculatedFields: Record<string, string>;
  };
  onTemplateSelected: (template: {
    file: File;
    fields: string[];
    mappings: Record<string, string>;
  }) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  data,
  onTemplateSelected
}) => {
  const [template, setTemplate] = useState<File | null>(null);
  const [fields, setFields] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useNotifications();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      showNotification('error', 'Por favor, selecciona un archivo Word (.docx)');
      return;
    }

    try {
      // Aquí iría la lógica para extraer los campos de la plantilla
      // Por ahora, simularemos encontrar campos entre << >>
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        const fieldRegex = /<<([^>>]+)>>/g;
        const matches = content.matchAll(fieldRegex);
        const extractedFields = Array.from(matches, m => m[1]);
        
        setTemplate(file);
        setFields(extractedFields);
        setMappings({});
      };
      reader.readAsText(file);
    } catch (error) {
      showNotification('error', 'Error al procesar la plantilla');
    }
  };

  const handleFieldDrop = (fieldId: string, templateField: string) => {
    setMappings(prev => ({
      ...prev,
      [templateField]: fieldId
    }));
  };

  const handleContinue = () => {
    if (!template) {
      showNotification('error', 'Debes seleccionar una plantilla');
      return;
    }

    if (fields.some(field => !mappings[field])) {
      showNotification('error', 'Debes mapear todos los campos de la plantilla');
      return;
    }

    onTemplateSelected({
      file: template,
      fields,
      mappings
    });
  };

  const getAvailableFields = () => {
    const fields: { id: string; label: string }[] = [];

    // Add response fields
    if (data.responses[0]) {
      Object.keys(data.responses[0].responses).forEach(fieldId => {
        fields.push({
          id: fieldId,
          label: `Campo de formulario: ${fieldId}`
        });
      });
    }

    // Add calculated fields
    Object.keys(data.calculatedFields).forEach(fieldName => {
      fields.push({
        id: `calc_${fieldName}`,
        label: `Campo calculado: ${fieldName}`
      });
    });

    // Add additional source fields
    data.additionalSources.forEach(source => {
      source.headers.forEach(header => {
        fields.push({
          id: `${source.name}_${header}`,
          label: `${source.name}: ${header}`
        });
      });
    });

    return fields;
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900">Plantilla del Informe</h4>
        <p className="mt-1 text-sm text-gray-500">
          Selecciona una plantilla Word y mapea los campos
        </p>

        <div className="mt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            Seleccionar Plantilla
          </button>
        </div>

        {template && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">{template.name}</span>
              </div>
              <button
                onClick={() => {
                  setTemplate(null);
                  setFields([]);
                  setMappings({});
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {fields.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Mapeo de Campos</h4>
          <div className="space-y-4">
            {fields.map(field => (
              <div key={field} className="flex items-center space-x-4">
                <div className="flex-1 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium text-gray-900">
                    Campo en plantilla: <code className="text-blue-600">&lt;&lt;{field}&gt;&gt;</code>
                  </p>
                </div>
                <div className="flex-1">
                  <select
                    value={mappings[field] || ''}
                    onChange={(e) => handleFieldDrop(e.target.value, field)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar campo...</option>
                    {getAvailableFields().map(({ id, label }) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          disabled={!template || fields.some(field => !mappings[field])}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default TemplateSelector;