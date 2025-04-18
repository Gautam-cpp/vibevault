"use client";

import Link from "next/link";
import "./global.css";
import { Button } from "./ui/button";
import Image from "next/image";

export default function Dashboard() {
    return (
        <main className="flex-grow main-content">
            <div className="pt-[1px]">
               
                <div className="header-wrapper flex flex-col md:flex-row relative overflow-hidden navigation-spacing min-h-screen items-center justify-between">
                    
                    <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-8 p-6 md:pl-[10rem] flex-1 order-2 md:order-1">
                        <h1 className="font-extrabold text-3xl md:text-5xl text-white leading-tight max-w-[900px]">
                            Collaborate. Vote. Stream Together.
                        </h1>
                        <p className="text-lg md:text-2xl text-white max-w-[900px]">
                            Stream, share, and let everyone vote for the next track.
                        </p>
                        
                    </div>

                   
                    <div className="flex-1 flex items-center justify-center p-6 order-1 md:order-2 mt-8 md:mt-0 w-full md:w-auto">
                        <div className="relative w-full max-w-[300px] md:max-w-[600px]">
                            <Image 
                                src="/hero-phones.ede7bd6.png" 
                                alt="Hero Phones" 
                                width={600} 
                                height={600}
                                priority
                                className="object-contain"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}