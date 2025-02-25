"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  },
  exit: { opacity: 0, scale: 0.9 },
};

const imageVariants = {
  hover: {
    scale: 1.1,
    rotate: 0.5,
    transition: {
      duration: 0.8,
      ease: [0.6, 0.05, -0.01, 0.9],
    },
  },
};

const buttonVariants = {
  hover: {
    scale: 1.02,
    backgroundPosition: ["100% 50%", "0% 50%"],
    transition: {
      duration: 0.8,
      ease: "easeInOut",
    },
  },
  tap: { scale: 0.98 },
};

interface SpaceCardProps {
  space: {
    id: string;
    name: string;
  };
  handleDeleteSpace: (id: string) => void;
  imageIndex: number;
}

export default function SpacesCard({
  space,
  handleDeleteSpace,
  imageIndex,
}: SpaceCardProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [spaceToDelete, setSpaceToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setSpaceToDelete(id);
    setIsDialogOpen(true);
  };

  const confirmDelete = () => {
    if (spaceToDelete) {
      handleDeleteSpace(spaceToDelete);
      setSpaceToDelete(null);
      setIsDialogOpen(false);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      className="group relative w-full max-w-3xl overflow-hidden rounded-3xl border border-opacity-20 border-purple-300/30 bg-gradient-to-br from-gray-900/95 to-gray-800 backdrop-blur-xl"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent opacity-0"
        animate={{ opacity: 0.3 }}
        transition={{ repeat: Infinity, duration: 3, repeatType: "mirror" }}
      />

      <CardContent className="p-0">
        <motion.div
          className="relative h-56 w-full overflow-hidden sm:h-64"
          variants={imageVariants}
        >
          <Image
            src={`/party-${imageIndex + 1}.webp`}
            alt={`${space.name} space image`}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-6"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-black text-white drop-shadow-[0_2px_12px_rgba(128,90,213,0.8)] sm:text-5xl">
              {space.name}
            </h2>
          </motion.div>
        </motion.div>
      </CardContent>

      <CardFooter className="flex flex-col space-y-3 p-6 sm:flex-row sm:justify-between sm:space-x-4 sm:space-y-0">
        <motion.div whileHover="hover" whileTap="tap" className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            size="sm"
            className="relative w-full transform-gpu overflow-hidden rounded-xl border-2 border-purple-400/30 bg-purple-900/40 bg-[length:200%_auto] bg-[position:100%_50%] py-7 text-md font-semibold text-white shadow-purple-500/20 sm:w-auto"
            onClick={() => router.push(`/dashboard/${space.id}`)}
          >
            <span className="relative z-10">Explore Space</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-transparent to-transparent"
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="relative w-full transform-gpu overflow-hidden rounded-xl border-2 border-red-400/20 bg-red-900/30 px-8 py-7 text-md font-medium text-red-100 backdrop-blur-sm hover:border-red-400/40 hover:bg-red-900/50 hover:shadow-[0_4px_30px_-8px_rgba(239,68,68,0.5)] sm:w-auto"
            onClick={() => handleDeleteClick(space.id)}
          >
            <Trash2 className="mr-3 h-6 w-6 transform transition-transform duration-300 group-hover/delete:scale-125 group-hover/delete:fill-red-400/20" />
            <span className="bg-gradient-to-r from-red-100 to-red-300 bg-clip-text text-transparent">
              Delete Galaxy
            </span>
          </Button>
        </motion.div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="border-0 bg-gradient-to-br from-gray-900 to-gray-800 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-purple-200/90 text-center">
                🚀 Celestial Deletion
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="mt-3 text-lg text-gray-300/80">
              This action will collapse the space-time continuum of{" "}
              <span className="font-medium text-purple-300">{space.name}</span>.
              All contained matter will be permanently erased from the cosmos.
            </DialogDescription>
            <DialogFooter className="mt-6 flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-xl border-2 border-gray-600/30 bg-gray-800/40 px-8 py-6 text-lg font-medium text-gray-200 hover:border-gray-500/50 hover:bg-gray-700/50 hover:text-white"
                >
                  Abort Mission
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  type="submit"
                  className="rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-red-600/90 to-red-700/90 px-8 py-6 text-lg font-semibold text-white shadow-[0_4px_30px_-8px_rgba(239,68,68,0.6)]"
                  onClick={confirmDelete}
                >
                  Engage Singularity
                </Button>
              </motion.div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>

      <motion.div
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent"
        animate={{
          opacity: [0, 0.2, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 6, repeat: Infinity }}
      />
    </motion.div>
  );
}
