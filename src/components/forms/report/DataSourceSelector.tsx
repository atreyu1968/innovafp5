import React, { useState, useRef } from 'react';
import { Form, FormResponse } from '../../../types/form';
import { useNotifications } from '../../notifications/NotificationProvider';
import { Upload, Plus, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DataSourceSelectorProps {
  form: Form;
  initialResponses: FormResponse[];
  availableForms: Form[];
  onDataSelected: (data: {
    responses: FormResponse[];
    reportType: 'individual' | 'general';
    additionalSources: Array<{
      name: string;
      data: any[];
      headers: string[];
    }>;
  }) => void;
}

const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({
  form,
  initialResponses,
  availableForms,
  onDataSelected,
}) => {
  const { showNotification } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [selectedResponses] = useState<FormResponse[]>(initialResponses);
  const [reportType, setReportType] = useState<'individual' | 'general'>('general');
  const [additionalSources, setAdditionalSources] = useState<Array<{
    name: string;
    data: any[];
    headers: string[];
  }>>([]);

  const handleFormToggle = (formId: string) => {
    setSelectedForms(prev => 
      prev.includes(formId) 
        ? prev.filter(id => id !== formId)
        : [...prev, formId]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        const headers = Object.keys(jsonData[0] || {});

        setAdditionalSources(prev => [...prev, {
          name: file.name,
          data: jsonData,
          headers
        }]);

        showNotification('success', 'Fuente de datos importada correctamente');
      } catch (error) {
        showNotification('error', 'Error al procesar el archivo');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleRemoveSource = (index: number) => {
    setAdditionalSources(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (selectedResponses.length === 0) {
      showNotification('error', 'Debes seleccionar al menos una respuesta');
      return;
    }

    const responses = reportType === 'individual' 
      ? selectedResponses.map(response => ({
          ...response,
          individualReport: true
        }))
      : selectedResponses;

    onDataSelected({
      responses,
      reportType,
      additionalSources
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900">Tipo de Informe</h4>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <button
            onClick={() => setReportType('individual')}
            className={`p-4 border rounded-lg text-left ${
              reportType === 'individual'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <h5 className="font-medium text-gray-900">Informe Individual</h5>
            <p className="mt-1 text-sm text-gray-500">
              Genera un informe separado para cada respuesta seleccionada
            </p>
          </button>

          <button
            onClick={() => setReportType('general')}
            className={`p-4 border rounded-lg text-left ${
              reportType === 'general'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <h5 className="font-medium text-gray-900">Informe General</h5>
            <p className="mt-1 text-sm text-gray-500">
              Genera un único informe que incluye todas las respuestas seleccionadas
            </p>
          </button>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-medium text-gray-900">Fuentes de Datos Adicionales</h4>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Añadir Fuente
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <div className="space-y-4">
          {additionalSources.map((source, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{source.name}</p>
                  <p className="text-xs text-gray-500">{source.headers.length} columnas, {source.data.length} filas</p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveSource(index)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-lg font-medium text-gray-900">Formularios Adicionales</h4>
        <div className="mt-4 space-y-4">
          {availableForms
            .filter(f => f.id !== form.id)
            .map((otherForm) => (
              <label key={otherForm.id} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={selectedForms.includes(otherForm.id)}
                  onChange={() => handleFormToggle(otherForm.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{otherForm.title}</p>
                  {otherForm.description && (
                    <p className="text-sm text-gray-500">{otherForm.description}</p>
                  )}
                </div>
              </label>
            ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default DataSourceSelector;