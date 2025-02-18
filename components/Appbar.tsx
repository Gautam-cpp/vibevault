"use client";

import Link from "next/link";
import "./global.css";
import { Button } from "./ui/button";
import { useSession, signOut } from "next-auth/react";

export default function Appbar() {
    const { data: session } = useSession();

    return (
        <header className="w-full bg-transparent">
            <div className="container mx-auto px-4 md:px-12 py-4 md:py-6 flex  md:flex-row items-center justify-between gap-4">
                {/* Logo */}
                <div className="flex items-center flex-shrink-0">
                    <a href="/" className="text-decoration-none font-bold text-xl md:text-3xl text-white">
                        V i b e V a u l t
                    </a>
                </div>

                {/* User Info and Auth Controls */}
                <div className="flex items-center gap-4">
                    {/* User Greeting - hidden on mobile, visible from md up */}
                    {session && (
                        <div className="hidden md:block text-sm md:text-base">
                            Welcome, {session.user?.name?.split(" ")[0]}
                        </div>
                    )}

                    {/* Auth Button */}
                    <div className="flex items-center">
                        {session ? (
                            <Button 
                                onClick={() => signOut()}
                                className="w-full md:w-auto text-sm md:text-base px-4 md:px-8 py-2"
                            >
                                Sign Out
                            </Button>
                        ) : (
                            <Button 
                                asChild
                                className="bg-slate-100 text-black rounded-xl hover:bg-slate-300 text-sm md:text-base px-4 md:px-8 py-2"
                            >
                                <Link href="/signin">
                                    Sign In
                                </Link>
                            </Button>
                        )}
                    </div>

                    {/* Mobile User Greeting */}
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