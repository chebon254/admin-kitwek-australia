"use client";

import { useRouter, useSearchParams } from "next/navigation";
import MembersList from "@/components/members/MemberList";

export default function MembersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const updateSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    router.push(`/members?${params.toString()}`);
  };

  const updateStatus = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    router.push(`/members?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Members Management</h1>
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search members..."
          className="px-4 py-2 border rounded-lg border-slate-300"
          defaultValue={search}
          onChange={(e) => updateSearch(e.target.value)}
        />
        <select
          className="px-4 py-2 pr-10 border rounded-lg border-slate-300"
          defaultValue={status}
          onChange={(e) => updateStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <MembersList />
    </div>
  );
}