import React, { useState } from 'react';

const DEFAULTS = {
  companyName: '',
  agentName: 'Alex',
  primaryColor: '#2563eb', // Tailwind blue-600
  voiceStyle: 'Friendly',
  widgetType: 'both',
};

const VOICE_STYLES = [
  { label: 'Friendly', value: 'Friendly' },
  { label: 'Professional', value: 'Professional' },
  { label: 'Energetic', value: 'Energetic' },
];

const WIDGET_TYPES = [
  { label: 'Chat only', value: 'chat' },
  { label: 'Voice only', value: 'voice' },
  { label: 'Both', value: 'both' },
];

function generateSnippet({ companyName, agentName, primaryColor, voiceStyle, widgetType }: any) {
  // This is a placeholder for the actual Vapi embed code
  return `<script src="https://cdn.vapi.ai/widget.js"></script>\n<script>\n  VapiWidget.init({\n    company: "${companyName}",\n    agent: "${agentName}",\n    color: "${primaryColor}",\n    voiceStyle: "${voiceStyle}",\n    type: "${widgetType}"\n  });\n</script>`;
}

export default function WidgetGeneratorPage() {
  const [form, setForm] = useState(DEFAULTS);
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(f => ({ ...f, [name]: type === 'color' ? value : value }));
  };

  const handleRadio = (value: string) => {
    setForm(f => ({ ...f, widgetType: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTouched(t => ({ ...t, [e.target.name]: true }));
  };

  const validate = () => {
    return {
      companyName: !form.companyName ? 'Company name is required' : '',
      agentName: !form.agentName ? 'Agent name is required' : '',
    };
  };
  const errors = validate();
  const isValid = !errors.companyName && !errors.agentName;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ companyName: true, agentName: true });
    setSubmitted(true);
  };

  const snippet = isValid && submitted ? generateSnippet(form) : '';

  const handleCopy = async () => {
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-2">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-blue-900 mb-6">Generate Your AI Assistant Embed Code</h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Name */}
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Company Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="companyName"
              value={form.companyName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`border rounded px-3 py-2 ${touched.companyName && errors.companyName ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Acme Inc."
              required
            />
            {touched.companyName && errors.companyName && (
              <span className="text-xs text-red-500 mt-1">{errors.companyName}</span>
            )}
          </div>
          {/* Agent Name */}
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Agent Name <span className="text-gray-400">(default: Alex)</span></label>
            <input
              type="text"
              name="agentName"
              value={form.agentName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`border rounded px-3 py-2 ${touched.agentName && errors.agentName ? 'border-red-400' : 'border-gray-300'}`}
              placeholder="Alex"
              required
            />
            {touched.agentName && errors.agentName && (
              <span className="text-xs text-red-500 mt-1">{errors.agentName}</span>
            )}
          </div>
          {/* Primary Color */}
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Primary Color</label>
            <input
              type="color"
              name="primaryColor"
              value={form.primaryColor}
              onChange={handleChange}
              className="w-12 h-10 p-0 border-0 bg-transparent"
              aria-label="Primary Color"
            />
          </div>
          {/* Voice Style */}
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Voice Style</label>
            <select
              name="voiceStyle"
              value={form.voiceStyle}
              onChange={handleChange}
              className="border rounded px-3 py-2 border-gray-300"
            >
              {VOICE_STYLES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {/* Widget Type */}
          <div className="flex flex-col md:col-span-2">
            <label className="font-semibold mb-1">Widget Type</label>
            <div className="flex gap-6 mt-1">
              {WIDGET_TYPES.map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="widgetType"
                    checked={form.widgetType === opt.value}
                    onChange={() => handleRadio(opt.value)}
                    className="accent-blue-600"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Submit Button */}
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition"
            >
              Generate Code
            </button>
          </div>
        </form>
        {/* Code Snippet */}
        {snippet && (
          <div className="mt-8 bg-gray-100 rounded-lg p-4 border border-gray-200 relative">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-blue-800">Embed Code</span>
              <button
                onClick={handleCopy}
                className="ml-2 px-3 py-1 rounded bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600"
              >
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
            <pre className="overflow-x-auto text-xs bg-transparent p-0 m-0"><code>{snippet}</code></pre>
          </div>
        )}
      </div>
    </div>
  );
} 