"use client";

import Link from "next/link";
import "./global.css";
import { Button } from "./ui/button";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { useState } from "react";

export default function Appbar() {
  const { data: session } = useSession();
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);

  return (
    <header className="w-full bg-transparent z-50">
      <div className="container mx-auto px-4 md:px-12 py-4 md:py-6 flex  md:flex-row items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0">
          <a
            href={session ? "/home" : "/"}
            className="text-decoration-none font-bold text-xl md:text-3xl text-white"
          >
            V i b e V a u l t
          </a>
        </div>

        {/* User Info and Auth Controls */}
        <div className="flex items-center gap-4">
          {session && (
            <div className="hidden md:block text-sm md:text-base">
              Welcome, {session.user?.name?.split(" ")[0]}
            </div>
          )}

          <div className="flex items-center">
            {session ? (
                <div>

              <Button
                onClick={() => setIsSignOutOpen(true)}
                className="w-full md:w-auto text-sm md:text-base px-4 md:px-8 py-2"
                >
                Sign Out
              </Button>
              <Dialog
                  open={isSignOutOpen}
                  onOpenChange={setIsSignOutOpen}
                >
                  <DialogContent className="border-0 rounded-md bg-gradient-to-br from-gray-900 to-gray-800 backdrop-blur-xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl mb-6 font-bold text-purple-200/90 ">
                        Are you sure You want to sign out?
                      </DialogTitle>
                    </DialogHeader>
                   
                    <DialogFooter className="flex flex-col space-y-4 sm:flex-row sm:space-x-3 sm:space-y-0">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant="outline"
                          onClick={() => setIsSignOutOpen(false)}
                          className="rounded-xl border-2 border-gray-600/30 bg-gray-800/40 px-8 py-6 text-lg font-medium text-gray-200 hover:border-gray-500/50 hover:bg-gray-700/50"
                        >
                          Cancel
                        </Button>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          onClick={() => signOut()}
                          className="rounded-xl border-2 border-red-500/30 bg-gradient-to-br from-red-600/90 to-red-700/90 px-8 py-6 text-lg font-semibold text-white shadow-[0_4px_30px_-8px_rgba(239,68,68,0.6)]"
                          >
                          Sign Out
                        </Button>
                      </motion.div>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                  </div>
              
            ) : (
              <div className="flex gap-4">
                <Button className="bg-slate-100 text-black rounded-xl hover:bg-slate-300  text-sm md:text-base px-4 md:px-8 py-2">
                  <Link href="/about" className="hover:text-black">
                    About
                  </Link>
                </Button>
                <Button
                  asChild
                  className="bg-slate-100 text-black rounded-xl hover:bg-slate-300 text-sm md:text-base px-4 md:px-8 py-2"
                >
                  <Link href="/signin" className="hover:text-black">
                    Sign In
                  </Link>
                </Button>

                
              </div>
            )}
          </div>

          {session && (
            <div className="md:hidden text-sm">
              Hi, {session.user?.name?.split(" ")[0]}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
