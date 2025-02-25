"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import StreamView from "@/components/StreamView";
// import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { use } from "react";
import { redirect } from "next/navigation";


export default function SpacePage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = use(params); // Unwrapping the params promise
  const { data: session, status } = useSession();
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHostId = async () => {
      try {
        const response = await fetch(`/api/spaces/?spaceId=${spaceId}`,{
          method:"GET"
        });
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
  }, [spaceId]);

  if (status === "loading") return <div>Authenticating...</div>; ;
  if (!session?.user) return redirect('/signin');
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!creatorId) return <div className="p-4 text-red-500">Space not found</div>;

  return <StreamView creatorId={creatorId} playVideo={true} spaceId={spaceId} />;
}