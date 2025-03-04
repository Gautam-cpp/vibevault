"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronUp, ChevronDown, Share2, Play, Trash2, X, MessageCircle, Instagram, Twitter, Music } from "lucide-react";

import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import YouTubePlayer from "youtube-player";
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import Appbar from "./Appbar";
import { useToast } from "@/hooks/use-toast";
import YouTubeSearch from "./YoutubeSearch";
import SearchBar from "./YoutubeSearch";

// Regex patterns for YouTube and Spotify URLs
const YT_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const SPOTIFY_REGEX = /^(https?:\/\/)?open\.spotify\.com\/track\/([a-zA-Z0-9]{22})/;

interface Video {
  id: string;
  type: string;
  url: string;
  extractedId: string;
  title: string;
  smallImg: string;
  bigImg: string;
  active: boolean;
  userId: string;
  upvotes: number;
  haveUpvoted: boolean;
  spaceId: string;
}

interface CustomSession extends Omit<Session, "user"> {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const REFRESH_INTERVAL_MS = 10 * 1000;

export default function StreamView({
  creatorId,
  playVideo = false,
  spaceId
}: {
  creatorId: string;
  playVideo: boolean;
  spaceId: string;
}) {
  const {toast} = useToast();
  const [inputLink, setInputLink] = useState("");
  const [queue, setQueue] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(false);
  const [playNextLoader, setPlayNextLoader] = useState(false);
  const videoPlayerRef = useRef<HTMLDivElement>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [isEmptyQueueDialogOpen, setIsEmptyQueueDialogOpen] = useState(false);
  const [spaceName, setSpaceName] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSearchResultSelect = async (videoId: string) => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    setLoading(true);
    try {
      const res = await fetch("/api/stream/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creatorId,
          url: youtubeUrl,
          spaceId: spaceId,
          type: 'youtube'
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add song");
      
      setQueue([...queue, data]);
      toast({
        title: "Success",
        description: "Song added to queue",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add song",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  async function refreshStreams() {
    try {
      const res = await fetch(`/api/stream/?spaceId=${spaceId}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (json.streams && Array.isArray(json.streams)) {
        setQueue(
          json.streams.length > 0
            ? json.streams.sort((a: any, b: any) => b.upvotes - a.upvotes)
            : [],
        );
      } else {
        setQueue([]);
      }

      setCurrentVideo((video) => {
        if (video?.id === json.activeStream?.stream?.id) {
          return video;
        }
        return json.activeStream?.stream || null;
      });

      setIsCreator(json.isHost);
      setSpaceName(json.spaceName)
    } catch (error) {
      console.error("Error refreshing streams:", error);
      setQueue([]);
      setCurrentVideo(null);
    }
  }

  useEffect(() => {
    refreshStreams();
    const interval = setInterval(refreshStreams, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [spaceId]);

  useEffect(() => {
    if (!videoPlayerRef.current || !currentVideo) return;

    const player = YouTubePlayer(videoPlayerRef.current);
    player.loadVideoById(currentVideo.extractedId);
    player.playVideo();

    const eventHandler = (event: { data: number }) => {
      if (event.data === 0) {
        playNext();
      }
    };
    player.on("stateChange", eventHandler);

    return () => {
      player.destroy();
    };
  }, [currentVideo, videoPlayerRef]);

  useEffect(() => {
    if (playVideo && currentVideo) {
      const player = YouTubePlayer(videoPlayerRef.current || "");
      player.loadVideoById(currentVideo.extractedId);
      player.playVideo();
    }
  }, [playVideo, currentVideo, videoPlayerRef]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputLink.trim()) {
      return toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      })
    }

    // Check URL against both regex patterns
    const isYouTube = YT_REGEX.test(inputLink);
    const isSpotify = SPOTIFY_REGEX.test(inputLink);
    
    if (!isYouTube && !isSpotify) {
      return toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      })
    }

    setLoading(true);
    try {
      const res = await fetch("/api/stream/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creatorId,
          url: inputLink,
          spaceId: spaceId,
          type: isYouTube ? 'youtube' : 'spotify'
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "An error occurred");
      }
      setQueue([...queue, data]);
      setInputLink("");
      toast({
        title: "Success",
        description: "Song added to queue",
        variant: "default",
      })
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: "An error occurred",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (id: string, isUpvote: boolean) => {
    setQueue(
      queue
        .map((video) =>
          video.id === id
            ? {
                ...video,
                upvotes: isUpvote ? video.upvotes + 1 : video.upvotes - 1,
                haveUpvoted: !video.haveUpvoted,
              }
            : video,
        )
        .sort((a, b) => b.upvotes - a.upvotes),
    );

    fetch(`/api/stream/${isUpvote ? "upvote" : "downvote"}`, {
      method: "POST",
      body: JSON.stringify({
        streamId: id,
        spaceId: spaceId
      }),
    });
  };

  const playNext = async () => {
    if (queue.length > 0) {
      try {
        setPlayNextLoader(true);
        const data = await fetch(`/api/stream/next?spaceId=${spaceId}`, {
          method: "GET",
        });
        const json = await data.json();
        setCurrentVideo(json.stream);
        setQueue((q) => q.filter((x) => x.id !== json.stream?.id));
      } catch (e) {
        console.error("Error playing next song:", e);
      } finally {
        setPlayNextLoader(false);
      }
    }
  };

  const handleShare = async (platform: 'whatsapp' | 'twitter' | 'instagram' | 'clipboard') => {
    const response = await fetch(`/api/spaces/join-space/?originalId=${spaceId}`, {
      method: 'GET'
    })
    const data = await response.json()
    const shareableLink = `${window.location.hostname}/spaces/${data.sharableId}`

    if (platform === 'clipboard') {
      navigator.clipboard.writeText(shareableLink).then(() => {
        return toast({
          title: 'Success',
          description: 'Link copied to clipboard',
          variant: 'default'
        })
      }).catch((err) => {
        console.error('Could not copy text: ', err)
        return toast({
          title: 'Error',
          description: 'Could not copy link to clipboard',
          variant: 'destructive'
        })
      })
    } else {
      let url
      switch (platform) {
        case 'whatsapp':
          url = `https://wa.me/?text=${encodeURIComponent(shareableLink)}`
          break
        case 'twitter':
          url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareableLink)}`
          break
        case 'instagram':
          // Instagram doesn't allow direct URL sharing, so we copy the link instead
          navigator.clipboard.writeText(shareableLink)
          return toast({
            title: 'Success',
            description: 'Link copied to clipboard',
            variant: 'default'
          })
        default:
          return
      }
      window.open(url, '_blank')
    }
  }

  const emptyQueue = async () => {
    try {
      const res = await fetch(`/api/stream/empty-queue?spaceId=${spaceId}`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Success",
          description: data.message,
          variant: "default",
        })
        refreshStreams();
        setIsEmptyQueueDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error emptying queue:", error);
      toast({
        title: "Error",
        description: "An error occurred while emptying the queue",
        variant: "destructive",
      })
    }
  };

  const removeSong = async (streamId: string) => {
    try {
      const res = await fetch(`/api/stream/removeStream?streamId=${streamId}&spaceId=${spaceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({
          title: "Success",
          description: "Song removed from queue",
          variant: "default",
        })
        refreshStreams();
      } else {
        toast({
          title: "Error",
          description: "An error occurred while removing the song",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while removing the song",
        variant: "destructive",
      })
    }
  };

  const renderPreview = () => {
    if (!inputLink) return null;

    // Handle YouTube preview
    if (YT_REGEX.test(inputLink)) {
      const match = inputLink.match(YT_REGEX);
      const videoId = match ? match[4] : '';
      return (
        <div className="mt-4">
          <LiteYouTubeEmbed
            title="YouTube Preview"
            id={videoId}
            wrapperClass="yt-lite rounded-lg"
          />
        </div>
      );
    }

    // Handle Spotify preview
    if (SPOTIFY_REGEX.test(inputLink)) {
      const match = inputLink.match(SPOTIFY_REGEX);
      const trackId = match ? match[2] : '';
      return (
        <div className="mt-4">
          <iframe
            src={`https://open.spotify.com/embed/track/${trackId}`}
            width="100%"
            height="80"
            frameBorder="0"
            allow="encrypted-media"
            className="rounded-lg"
            title="Spotify Preview"
          />
        </div>
      );
    }

    return null;
  };

  interface YouTubeSearchResult {
    id: {
      videoId: string;
    };
    snippet: {
      title: string;
      description: string;
      thumbnails: {
        default: {
          url: string;
        };
      };
      channelTitle: string;
    };
  }
  const handleSearchResults = (results: YouTubeSearchResult[]) => {
    console.log(results);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 via-space-900 to-black text-gray-200 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/star-pattern.svg')] opacity-20 animate-pulse-slow" />
      
      <Appbar />
      
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto text-center text-xl sm:text-2xl mt-2 mb-4 px-4 bg-gradient-to-r from-indigo-400 to-violet-300 bg-clip-text font-bold text-transparent"
      >
        <span className="drop-shadow-[0_4px_24px_rgba(129,140,248,0.4)]">
          {spaceName}
        </span>
      </motion.div>

      {/* Search Bar with proper mobile spacing */}
      <div className="px-4 sm:px-6 md:px-8 mb-4">
        <SearchBar 
          onResultSelect={handleSearchResultSelect}
          onSearchResults={handleSearchResults} 
        />
      </div>

      <div className="flex justify-center px-4 sm:px-6 md:px-10 xl:px-20 relative z-10">
        <div className="w-full grid grid-cols-1 gap-6 lg:grid-cols-12 py-4 lg:py-8">
      
          <div className="lg:col-span-5 xl:col-span-4 order-1 lg:order-2 space-y-6">
            {/* Add Song Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gray-800/40 border-2 border-purple-500/20 shadow-xl">
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Add Cosmic Tune
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <motion.div whileHover={{ scale: 1.02 }}>
                      <Input
                        type="text"
                        placeholder="Paste YouTube or Spotify link here"
                        value={inputLink}
                        onChange={(e) => setInputLink(e.target.value)}
                        className="rounded-xl bg-gray-900/30 border-2 border-purple-500/30 text-white placeholder-purple-300/50 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50"
                      />
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        disabled={loading}
                        type="submit"
                        className="w-full rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 py-4 sm:py-6 text-base sm:text-lg font-bold text-white shadow-[0_4px_30px_-8px_rgba(129,140,248,0.6)]"
                      >
                        {loading ? (
                          <motion.span
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            Warping Song...
                          </motion.span>
                        ) : (
                          "Add to Cosmic Queue"
                        )}
                      </Button>
                    </motion.div>
                    
                    {renderPreview()}
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Now Playing Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gray-800/40 border-2 border-purple-500/20 shadow-xl">
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    Now Warping Through
                  </h2>
                  
                  {currentVideo ? (
                    <motion.div
                      key={currentVideo.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {playVideo ? (
                        <div
                          ref={videoPlayerRef}
                          className="w-full aspect-video rounded-xl overflow-hidden border-2 border-purple-500/20"
                        />
                      ) : (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="relative overflow-hidden rounded-xl"
                        >
                          <Image
                            src={currentVideo.bigImg}
                            className="w-full aspect-video object-cover"
                            alt={currentVideo.title}
                            width={640}
                            height={360}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
                          <p className="absolute bottom-4 left-4 right-4 text-lg sm:text-xl font-bold text-white drop-shadow-lg">
                            {currentVideo.title}
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-6 sm:py-8 text-gray-400"
                    >
                      Space is silent...
                    </motion.p>
                  )}

                  {playVideo && (
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        disabled={playNextLoader}
                        onClick={playNext}
                        className="w-full rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 py-4 sm:py-6 text-base sm:text-lg font-bold text-white shadow-[0_4px_30px_-8px_rgba(129,140,248,0.6)]"
                      >
                        {playNextLoader ? (
                          <motion.span
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            Engaging Hyperdrive...
                          </motion.span>
                        ) : (
                          <>
                            <Play className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                            Next Cosmic Jump
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Queue Column - Appears second on mobile, first on desktop */}
          <div className="lg:col-span-7 xl:col-span-8 order-2 lg:order-1">
            <div className="flex flex-col sm:flex-row justify-between mb-4 gap-3 sm:gap-0">
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl sm:text-2xl font-bold text-white"
              >
                Upcoming Songs
              </motion.h2>
              
              <motion.div
                className="flex flex-wrap sm:flex-nowrap gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-grow sm:flex-grow-0">
                      <Button className="w-full sm:w-auto rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 px-4 sm:px-6 py-2 sm:py-3 text-white shadow-[0_0_40px_-10px_rgba(129,140,248,0.5)] hover:shadow-[0_0_60px_-15px_rgba(129,140,248,0.6)]">
                        <Share2 className="mr-2 h-4 w-4" /> Share
                      </Button>
                    </motion.div>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="border-0 bg-gray-900/95 backdrop-blur-2xl">
                    <DropdownMenuLabel className="text-purple-200/90">
                      Share to Space
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-700/50" />
                    {['whatsapp', 'twitter', 'instagram', 'clipboard'].map((platform) => (
                      <DropdownMenuItem
                        key={platform}
                        onClick={() => handleShare(platform as any)}
                        className="hover:bg-gray-800/40 focus:bg-gray-800/40"
                      >
                        <motion.div whileHover={{ x: 5 }} className="flex items-center space-x-3">
                          {platform === 'whatsapp' && <MessageCircle className="h-5 w-5 text-green-400" />}
                          {platform === 'twitter' && <Twitter className="h-5 w-5 text-blue-400" />}
                          {platform === 'instagram' && <Instagram className="h-5 w-5 text-pink-400" />}
                          {platform === 'clipboard' && <Share2 className="h-5 w-5 text-purple-400" />}
                          <span className="capitalize">{platform}</span>
                        </motion.div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {isCreator && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-grow sm:flex-grow-0">
                    <Button
                      onClick={() => setIsEmptyQueueDialogOpen(true)}
                      className="w-full sm:w-auto rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 px-4 sm:px-6 py-2 sm:py-3 text-white shadow-[0_0_40px_-10px_rgba(156,163,175,0.3)]"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Empty
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </div>

            <AnimatePresence mode="popLayout">
              {queue.length === 0 ? (
                <motion.div
                  key="empty-queue"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="bg-gray-800/40 border-2 border-purple-500/20 shadow-xl">
                    <CardContent className="p-6">
                      <p className="text-center py-8 text-gray-400">
                        The cosmic queue is empty
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {queue.map((video, index) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      layout
                    >
                      <Card className="bg-gray-800/40 border-2 border-purple-500/20 hover:border-purple-400/40 shadow-xl hover:shadow-2xl transition-all">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
                            <motion.div
                              className="relative overflow-hidden rounded-lg mx-auto sm:mx-0"
                              whileHover={{ scale: 1.05 }}
                            >
                              <Image
                                width={120}
                                height={120}
                                src={video.smallImg}
                                alt={`Thumbnail for ${video.title}`}
                                className="w-full sm:w-32 h-32 object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent" />
                            </motion.div>
                            
                            <div className="flex-grow space-y-2 sm:space-y-3">
                              <h3 className="font-semibold text-white text-base sm:text-lg text-center sm:text-left line-clamp-2">
                                {video.title}
                              </h3>
                              <div className="flex items-center justify-center sm:justify-start space-x-3">
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleVote(video.id, !video.haveUpvoted)}
                                    className="rounded-lg bg-gray-800/60 border-purple-500/30 text-white"
                                  >
                                    {video.haveUpvoted ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronUp className="h-4 w-4" />
                                    )}
                                    <span className="ml-2">{video.upvotes}</span>
                                  </Button>
                                </motion.div>
                                
                                {isCreator && (
                                  <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeSong(video.id)}
                                      className="rounded-lg bg-red-800/40 border-red-500/30 text-red-200"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Empty Queue Dialog */}
      <Dialog open={isEmptyQueueDialogOpen} onOpenChange={setIsEmptyQueueDialogOpen}>
  <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-0 bg-gradient-to-br from-gray-900 to-gray-800 backdrop-blur-xl w-[90%] sm:w-[95%] max-w-sm sm:max-w-md p-4 sm:p-6 rounded-xl shadow-2xl">
    <DialogHeader>
      <DialogTitle className="text-2xl font-bold text-purple-200/90 text-center">
        🛑 Cosmic Purge
      </DialogTitle>
      <DialogDescription className="mt-2 text-center text-gray-300/80">
        This will erase all songs from the space-time queue continuum.
        <span className="block mt-2 text-red-400/80 font-medium">
          Warning: This action cannot be undone!
        </span>
      </DialogDescription>
    </DialogHeader>
    
    <DialogFooter className="mt-6 flex gap-3 flex-row ">
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          variant="outline"
          onClick={() => setIsEmptyQueueDialogOpen(false)}
          className="w-full rounded-lg border border-gray-600/40 bg-gray-800/50 py-3 font-medium text-gray-200 hover:bg-gray-700/60 transition"
        >
          Abort Sequence
        </Button>
      </motion.div>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={emptyQueue}
          className="w-full rounded-lg bg-gradient-to-r from-red-600 to-pink-700 py-3 font-medium text-white shadow-lg shadow-red-600/30"
        >
          Initiate Purge
        </Button>
      </motion.div>
    </DialogFooter>
  </DialogContent>
</Dialog>
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent opacity-20 animate-pulse-slow" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-900/10 to-transparent opacity-30" />
      </div>
    </div>
  );
}


