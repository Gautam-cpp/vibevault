import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "../auth/[...nextauth]/option";
import { prisma } from "@/src/lib/prisma";
import axios from "axios";

const streamSchema = z.object({
    creatorId: z.string(),
    url: z.string(),
    spaceId: z.string(),
    type: z.string()
})



const isMusicVideo = async (videoId: string): Promise<string> => {
    try {
        // console.log(process.env.YOUTUBE_API_KEY);
      const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet&key=${process.env.YOUTUBE_API_KEY}`;
      const response = await axios.get(url);
      const video = response.data.items[0];
  
      if (!video) {
        return JSON.stringify({ 
          isMusic: false, 
          response: null 
        });
      }
  
      return JSON.stringify({ 
        isMusic: video.snippet.categoryId === "10", 
        response: response.data 
      });
    } catch (error) {
      console.error("Error fetching YouTube video details:", error);
      return JSON.stringify({ 
        isMusic: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  };



async function fetchSpotifyAccessToken() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    if (!data.access_token) {
        throw new Error('Failed to fetch Spotify access token');
    }

    return data.access_token;
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({
                success: false,
                message: "Unauthorized"
            }, { status: 401 });
        }

        const user = session.user;
        const data = streamSchema.parse(await req.json());

        if (!data.url.trim()) {
            return NextResponse.json({
                success: false,
                message: "Youtube URL is required"
            }, { status: 400 });
        }

        const isYoutube = data.url.startsWith("https://www.youtube.com/");
        const isSpotify = data.url.startsWith("https://open.spotify.com/");

        const videoId = isYoutube ? data.url.split("v=")[1]?.split("&")[0] : null;
        const trackId = isSpotify ? data.url.split("track/")[1]?.split("?")[0] : null;

        const streamType = isYoutube ? "Youtube" : "Spotify";

        if (!videoId && !trackId) {
            return NextResponse.json({
                success: false,
                message: "Invalid URL"
            }, { status: 400 });
        }

        // Fetch title and image based on platform
        let title = "";
        let image = "";

        if (isYoutube) {
            const resYt = await isMusicVideo(videoId || "");
            const parsedRes = JSON.parse(resYt);

            if(!parsedRes.isMusic) {
                return NextResponse.json({
                    success: false,
                    message: "Not a music Video"
                }, { status: 400 });
            }
            
            const dataYt = parsedRes.response;
            title = dataYt.items[0]?.snippet.title || "";
            image = dataYt.items[0]?.snippet.thumbnails.high.url || "";
        } else {

            const token = await fetchSpotifyAccessToken();
            const resSp = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataSp = await resSp.json();
            title = dataSp.name || "";
            image = dataSp.album?.images[0]?.url || "";
        }

        // Check space limit for all users
        const existingStreamCount = await prisma.stream.count({
            where: {
                spaceId: data.spaceId,
                played: false
            }
        });

        if (existingStreamCount >= 20) {
            return NextResponse.json({
                success: false,
                message: "Space is full"
            }, { status: 400 });
        }

            const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

            const duplicateStream = await prisma.stream.findFirst({
                where: {
                    userId: data.creatorId,
                    url: data.url,
                    
                }
            });

            if (duplicateStream) {
                return NextResponse.json({
                    success: false,
                    message: "This song was already added recently"
                }, { status: 400 });
            }

            const streamsLastTwoMinutes = await prisma.stream.count({
                where: {
                    userId: data.creatorId,
                    addedBy: user.id,
                    createAt: { gte: twoMinutesAgo }
                }
            });

        if(data.creatorId !== user.id) {
            if (streamsLastTwoMinutes >= 2) {
                return NextResponse.json({
                    success: false,
                    message: "You can only add 2 songs every 2 minutes"
                }, { status: 400 });
            }
        }
        else{
            if (streamsLastTwoMinutes >= 5) {
                return NextResponse.json({
                    success: false,
                    message: "You can only add 5 songs every 2 minutes"
                }, { status: 400 });
            }
        }

           

            
        
        // Create stream for both creators and other users
        const stream = await prisma.stream.create({
            data: {
                extractedId: isYoutube ? videoId! : trackId!,
                title: title,
                url: data.url,
                type: streamType,
                smallImg: image,
                bigImg: image,
                userId: data.creatorId,
                addedBy: user.id,
                spaceId: data.spaceId
            }
        });

        return NextResponse.json({
            ...stream,
            hasVoted: false,
            upVotes: 0,
            success: true,
            message: "Stream added successfully"
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({
            success: false,
            message: "Internal server error"
        }, { status: 500 });
    }
}





export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const spaceId = req.nextUrl.searchParams.get("spaceId");

    if (!session) {
        return NextResponse.json({
            success: false,
            message: "Unauthorized"
        }, { status: 401 }); // Fixed status code syntax
    }

    const user = session.user;

    if (!spaceId) {
        return NextResponse.json({
            success: false,
            message: "Space ID is required"
        }, { status: 400 }); // Fixed status code syntax
    }

    const [space, activeStream] = await Promise.all([
        prisma.space.findUnique({
            where: {
                id: spaceId,
            },
            include: {
                streams: {
                    include: {
                        _count: {
                            select: {
                                upvotes: true
                            }
                        },
                        upvotes: {
                            where: {
                                userId: session.user.id
                            }
                        }
                    },
                    where: {
                        played: false
                    }
                },
                _count: {
                    select: {
                        streams: true
                    }
                },
            }
        }),
        prisma.currentStream.findFirst({
            where: {
                spaceId: spaceId,
            },
            include: {
                stream: true
            }
        })
    ]);

    const hostId = space?.hostId;
    const isHost = hostId === user.id;

    return NextResponse.json({
        streams: space?.streams.map(({ _count, ...rest }) => ({
            ...rest,
            upvotes: _count.upvotes,
            haveUpvoted: rest.upvotes.length > 0
        })),
        activeStream,
        hostId,
        isHost,
        spaceName: space?.name
    });
}