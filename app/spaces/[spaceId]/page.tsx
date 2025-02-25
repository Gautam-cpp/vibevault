"use client";
import { use, useEffect, useState } from "react";
import StreamView from "@/components/StreamView";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function Component({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = use(params);
  const { data: session } = useSession();
  
  const [creatorId, setCreatorId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch space details only when session is available
  useEffect(() => {
    if (!session?.user?.id) return; // guard inside the effect
    const fetchHostId = async () => {
      try {
        const response = await fetch(`/api/spaces/?spaceId=${spaceId}`, { method: "GET" });
        if (!response.ok) throw new Error('Failed to fetch space details');
        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Invalid space data');
        setCreatorId(data.hostId);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load space');
      } finally {
        setLoading(false);
      }
    };
    fetchHostId();
  }, [spaceId, session?.user?.id]);

  // Redirect if the logged-in user is the creator
  useEffect(() => {
    if (creatorId && session?.user?.id && creatorId === session.user.id) {
      router.push(`/dashboard/${spaceId}`);
    }
  }, [creatorId, session?.user?.id, router, spaceId]);


  if (!session?.user?.id) {
    return <h1>Please Log in....</h1>;
  }

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (error) {
    return <h1>Error: {error}</h1>;
  }

  return <StreamView creatorId={creatorId as string} playVideo={false} spaceId={spaceId} />;
}
