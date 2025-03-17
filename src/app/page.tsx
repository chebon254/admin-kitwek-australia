'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (isLoaded) {
      if (!userId) {
        router.push('/sign-in');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isLoaded, userId, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
}