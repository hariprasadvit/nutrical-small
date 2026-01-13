import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { templatesApi } from '../services/api';
import { Plus, Copy, Trash2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const TEMPLATE_TYPES = {
  vertical: 'Vertical',
  tabular: 'Tabular',
  'dual-column': 'Dual Column',
  linear: 'Linear',
  aggregate: 'Aggregate',
  simplified: 'Simplified',
};

export default function TemplatesPage() {
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.list({ include_presets: true }),
  });

  const duplicateMutation = useMutation({
    mutationFn: templatesApi.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template duplicated!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: templatesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template deleted');
    },
  });

  const presets = templates?.filter((t) => t.is_preset) || [];
  const userTemplates = templates?.filter((t) => !t.is_preset) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Label Templates</h1>
        <Link
          to="/label-builder"
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Create Template
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <>
          {/* User Templates */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              My Templates
            </h2>
            {userTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onDuplicate={() => duplicateMutation.mutate(template.id)}
                    onDelete={() => {
                      if (confirm('Delete this template?')) {
                        deleteMutation.mutate(template.id);
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-500 mb-4">
                  You haven't created any templates yet
                </p>
                <Link
                  to="/label-builder"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Create your first template
                </Link>
              </div>
            )}
          </section>

          {/* Preset Templates */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Preset Templates
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              FDA-compliant templates ready to use. Duplicate to customize.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {presets.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isPreset
                  onDuplicate={() => duplicateMutation.mutate(template.id)}
                />
              ))}
              {presets.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  No preset templates available
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  isPreset,
  onDuplicate,
  onDelete,
}: {
  template: any;
  isPreset?: boolean;
  onDuplicate: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Preview area */}
      <div className="h-40 bg-gray-100 flex items-center justify-center">
        <div className="w-20 h-28 bg-white border border-gray-300 rounded shadow-sm flex items-center justify-center">
          <span className="text-[6px] font-black text-gray-400">
            Nutrition Facts
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-medium text-gray-900">{template.name}</h3>
            <p className="text-sm text-gray-500">
              {TEMPLATE_TYPES[template.type as keyof typeof TEMPLATE_TYPES] ||
                template.type}
            </p>
          </div>
          {isPreset && (
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
              Preset
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Link
            to={`/label-builder/${template.id}`}
            className="flex-1 py-2 text-center text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            {isPreset ? 'Preview' : 'Edit'}
          </Link>
          <button
            onClick={onDuplicate}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Duplicate"
          >
            <Copy size={18} className="text-gray-500" />
          </button>
          {!isPreset && onDelete && (
            <button
              onClick={onDelete}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size={18} className="text-red-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
