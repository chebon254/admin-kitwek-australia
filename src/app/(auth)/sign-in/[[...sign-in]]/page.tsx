"use client";

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message');
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {message === 'restricted' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 max-w-md">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Only allowed users/admin can access the admin. Contact info@kitwekvictoria.org to get access.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <SignIn />
    </div>
  );
}