import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ['images.unsplash.com', "i.scdn.co", "i.ytimg.com"],
    
  },
};

export default nextConfig;

  
// theme: {
//   extend: {
//     keyframes: {
//       "caret-blink": {
//         "0%,70%,100%": { opacity: "1" },
//         "20%,50%": { opacity: "0" },
//       },
//     },
//     animation: {
//       "caret-blink": "caret-blink 1.25s ease-out infinite",
//     },
//   },
// },