'use client';

import { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { CreateReimbursementModal } from './CreateReimbursementModal';
import { useRouter } from 'next/navigation';

export function CreateReimbursementButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    // Refresh the page data
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors"
      >
        <DollarSign className="h-4 w-4" />
        Create Reimbursements
      </button>

      <CreateReimbursementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
