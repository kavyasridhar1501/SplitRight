'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { groups as groupsApi } from '@/lib/api';
import { Group } from '@/lib/types';
import { GroupCard } from '@/components/GroupCard';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonList } from '@/components/LoadingSkeleton';

export default function GroupsPage() {
  const [groupsList, setGroupsList] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await groupsApi.list() as { success: boolean; data?: { groups: Group[] } };
        if (res.success && res.data) {
          setGroupsList(res.data.groups);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="px-4 pt-12 pb-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-text-primary text-2xl font-bold">Groups</h1>
        <div className="flex gap-2">
          <Link
            href="/groups/join"
            className="btn-secondary px-4 py-2 text-sm"
          >
            Join
          </Link>
          <Link
            href="/groups/new"
            className="btn-primary px-4 py-2 text-sm"
          >
            + New
          </Link>
        </div>
      </div>

      {loading ? (
        <SkeletonList count={4} />
      ) : groupsList.length === 0 ? (
        <EmptyState
          icon={<GroupsIcon />}
          title="No groups yet"
          description="Create a group with your roommates or join an existing one"
          action={
            <div className="flex gap-3">
              <Link href="/groups/new" className="btn-primary px-5 py-2.5 text-sm">
                Create Group
              </Link>
              <Link href="/groups/join" className="btn-secondary px-5 py-2.5 text-sm">
                Join Group
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-3">
          {groupsList.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupsIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6b9e78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
