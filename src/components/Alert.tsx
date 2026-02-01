import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

export default function Alert({ type, message, onClose }: AlertProps) {
  const config = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5" />,
      classes: 'bg-green-50 text-green-800 border-green-200',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5" />,
      classes: 'bg-red-50 text-red-800 border-red-200',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5" />,
      classes: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    info: {
      icon: <Info className="w-5 h-5" />,
      classes: 'bg-blue-50 text-blue-800 border-blue-200',
    },
  };

  const { icon, classes } = config[type];

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 ${classes}`}>
      <span className="flex-shrink-0 mt-0.5">{icon}</span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Close alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
