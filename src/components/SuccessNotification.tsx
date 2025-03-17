import { X } from 'lucide-react';
import { useEffect } from 'react';

interface SuccessNotificationProps {
  message: string;
  onClose: () => void;
}

export function SuccessNotification({ message, onClose }: SuccessNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-2/4 flex items-center gap-2 bg-green-500 text-white px-10 py-5 rounded-lg shadow-lg animate-slide-up">
      <span className='text-lg text-white font-normal'>{message}</span>
      <button
        onClick={onClose}
        className="p-1 hover:bg-green-600 rounded-full transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}