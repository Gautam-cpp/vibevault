"use client";

import Appbar from "./Appbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";
import CardSkeleton from "../components/ui/cardSkeleton";
import SpacesCard from "./SpacesCard";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { redirect, useRouter } from "next/navigation";

interface Space {
  endTime?: Date | null;
  hostId: string;
  id: string;
  isActive: boolean;
  name: string;
  startTime: Date | null;
}

export default function HomeView() {
  const { toast } = useToast();
  const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState(false);
  const [isJoinSpaceOpen, setIsJoinSpaceOpen] = useState(false);
  const [spaceName, setSpaceName] = useState("");
  const [spaces, setSpaces] = useState<Space[] | null>(null);
  const [loading, setIsLoading] = useState(false);
  const [sharableSpaceId, setSharableSpaceId] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchSpaces = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/spaces", { method: "GET" });
        const data = await response.json();
        console.log(data);

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch spaces");
        }

        const fetchedSpaces: Space[] = data.data;
        setSpaces(fetchedSpaces);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch spaces",
          variant: "destructive", 
        })
      } finally {
        setIsLoading(false);
      }
    };
    fetchSpaces();
  }, []);

  const handleJoinSpace = async () => {
    setIsJoinSpaceOpen(false);
    try {
      const response = await fetch(`/api/spaces/join-space/?sharableSpaceId=${sharableSpaceId}`, {
        method: "POST",
      })
      if (!response.ok) {
        return toast({
          title: "Error",
          description: "Failed to join space",
          variant: "destructive",
        })
      }

      const data = await response.json();
      console.log("Bhai idhar bhi aagaya data ", data.originalId)
      router.push(`/spaces/${data.originalId}`);
      console.log("idhar aaya?")


      
     
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join space",
        variant: "destructive",
      })
    }
  };

  const handleCreateSpace = async () => {
    setIsCreateSpaceOpen(false);
    try {
      const response = await fetch(`/api/spaces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spaceName }),
      });
      console.log("response sent");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to create space");
      }

      const newSpace = data.space;
      setSpaces((prev) => (prev ? [...prev, newSpace] : [newSpace]));
      toast({
        title: "Success",
        description: data.message,
        variant: "default",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error creating space",
        variant: "destructive",
      })
    }
  };

  const handleDeleteSpace = async (spaceId: string) => {
    try {
      const response = await fetch(`/api/spaces/?spaceId=${spaceId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete space");
      }
      setSpaces((prev) =>
        prev ? prev.filter((space) => space.id !== spaceId) : []
      );
      toast({
        title: "Success",
        description: data.message,
        variant: "default",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error deleting space",
        variant: "destructive",
      })
    }
  };

  const renderSpaces = useMemo(() => {
    if (loading) {
      return (
        <>
          <div className="dark mx-auto h-[500px] w-full py-4 sm:w-[450px] lg:w-[500px]">
            <CardSkeleton />
          </div>
          <div className="dark mx-auto h-[500px] w-full py-4 sm:w-[450px] lg:w-[500px]">
            <CardSkeleton />
          </div>
        </>
      );
    }

    if (spaces && spaces.length > 0) {
      return spaces.map((space, index) => (
        <SpacesCard
          key={space.id}
          space={space}
          handleDeleteSpace={handleDeleteSpace}
          imageIndex={index}
        />
      ));
    }
  }, [loading, spaces, handleDeleteSpace]);

  return (
    <div className="flex min-h-screen flex-grow overflow-x-hidden flex-col bg-gradient-to-br from-gray-900 via-space-900 to-black text-gray-200">
      <Appbar />

      <div className="flex flex-grow flex-col items-center px-4 py-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative text-7xl font-bold md:text-8xl lg:text-9xl"
        >
          <span className="bg-gradient-to-r from-indigo-600 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(129,140,248,0.4)]">
            Spaces
          </span>
          <div className="absolute h-[2px] w-full animate-pulse bg-gradient-to-r from-cyan-400/50 to-blue-500/50 blur-lg" />
        </motion.h1>

        <div className="flex flex-row gap-4">

        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-10 "
        > 
          <Button
            onClick={() => setIsCreateSpaceOpen(true)}
            className="rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 px-8 py-6 text-lg font-bold shadow-[0_0_40px_-10px_rgba(129,140,248,0.5)] hover:shadow-[0_0_60px_-15px_rgba(129,140,248,0.6)] relative z-10"
          >
            ✨ Create New Space
          </Button>

          
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-10 "
        > 
          <Button
            onClick={() => setIsJoinSpaceOpen(true)}
            className="rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 px-8 py-6 text-lg font-bold shadow-[0_0_40px_-10px_rgba(129,140,248,0.5)] hover:shadow-[0_0_60px_-15px_rgba(129,140,248,0.6)] relative z-10"
          >
            ⛩️ Join Space
          </Button>

          
        </motion.div>

        </div>

        <div className="mt-20 grid w-full max-w-7xl grid-cols-1 gap-8 p-4 md:grid-cols-2 lg:grid-cols-3">
          {renderSpaces}
        </div>
      </div>

      <Dialog open={isCreateSpaceOpen} onOpenChange={setIsCreateSpaceOpen}>
        <DialogContent className="border-0 bg-gradient-to-br from-gray-900 to-gray-800 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-purple-200/90 text-center">
              🚀 Launch New Space
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="group relative">
                <input
                  className={cn(
                    "w-full bg-gray-800/40 border-2 border-purple-500/30",
                    "rounded-xl px-6 py-4 text-lg text-white placeholder-purple-300/50",
                    "focus:outline-none focus:border-purple-400/60 transition-all"
                  )}
                  placeholder="Enter cosmic name..."
                  onChange={(e) => setSpaceName(e.target.value)}
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-30 transition-opacity rounded-xl" />
              </div>
            </motion.div>
          </div>
          <DialogFooter className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                onClick={() => setIsCreateSpaceOpen(false)}
                className="rounded-xl border-2 border-gray-600/30 bg-gray-800/40 px-8 py-6 text-lg font-medium text-gray-200 hover:border-gray-500/50 hover:bg-gray-700/50"
              >
                Cancel
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleCreateSpace}
                className="rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 px-8 py-6 text-lg font-bold text-white shadow-[0_4px_30px_-8px_rgba(129,140,248,0.6)] hover:shadow-[0_6px_40px_-6px_rgba(129,140,248,0.8)]"
              >
                Create Space
              </Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isJoinSpaceOpen} onOpenChange={setIsJoinSpaceOpen}>
        <DialogContent className="border-0 bg-gradient-to-br from-gray-900 to-gray-800 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-purple-200/90 text-center">
              ⛩️ Join Space
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="group relative">
                <input
                  className={cn(
                    "w-full bg-gray-800/40 border-2 border-purple-500/30",
                    "rounded-xl px-6 py-4 text-lg text-white placeholder-purple-300/50",
                    "focus:outline-none focus:border-purple-400/60 transition-all"
                  )}
                  placeholder="Enter cosmic name..."
                  onChange={(e) => setSharableSpaceId(e.target.value)}
                />
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-30 transition-opacity rounded-xl" />
              </div>
            </motion.div>
          </div>
          <DialogFooter className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                onClick={() => setIsJoinSpaceOpen(false)}
                className="rounded-xl border-2 border-gray-600/30 bg-gray-800/40 px-8 py-6 text-lg font-medium text-gray-200 hover:border-gray-500/50 hover:bg-gray-700/50"
              >
                Cancel
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
              onClick={handleJoinSpace}                 
              className="rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 px-8 py-6 text-lg font-bold text-white shadow-[0_4px_30px_-8px_rgba(129,140,248,0.6)] hover:shadow-[0_6px_40px_-6px_rgba(129,140,248,0.8)]"
              >Join Space</Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      <div className="max-w-full fixed inset-0 -z-20">
        <div className="inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent opacity-20 animate-pulse-slow" />
      </div>
    </div>
  );
}
  
