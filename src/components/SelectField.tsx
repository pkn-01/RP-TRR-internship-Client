interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = '-- เลือก --',
  required = false,
  disabled = false,
}: SelectFieldProps) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={`w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 font-medium transition-all duration-200 outline-none appearance-none cursor-pointer
          ${disabled 
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' 
            : 'hover:border-slate-300 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500'
          }
        `}
      >
        <option value="" className="text-slate-500">
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="text-slate-900">
            {opt.label}
          </option>
        ))}
      </select>
      {/* Custom Arrow Icon */}
      <style>{`
        select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231e293b' d='M1 4l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          padding-right: 2.5rem;
        }
      `}</style>
    </div>
  );
}
