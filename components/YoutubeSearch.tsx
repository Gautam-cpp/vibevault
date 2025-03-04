'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useToast } from '@/hooks/use-toast';

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

interface SearchBarProps {
  onSearchResults?: (results: YouTubeSearchResult[]) => void;
  onResultSelect?: (videoId: string) => void;
}

const SearchBar = ({ onSearchResults, onResultSelect }: SearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeSearchResult | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const {toast} = useToast()


  const getSearchCount = () => {
    const searchData = localStorage.getItem('youtubeSearchData');
    return searchData ? JSON.parse(searchData) : { count: 0, firstSearch: null };
  };

  const updateSearchCount = () => {
    const now = Date.now();
    const searchData = getSearchCount();
    
    if (!searchData.firstSearch) {
      localStorage.setItem('youtubeSearchData', JSON.stringify({
        count: 1,
        firstSearch: now
      }));
    } else {
      const newCount = searchData.count + 1;
      localStorage.setItem('youtubeSearchData', JSON.stringify({
        count: newCount,
        firstSearch: searchData.firstSearch
      }));
      
      if (newCount >=5  && (now - searchData.firstSearch < 600000)) {
        setIsRateLimited(true);
        const timeLeft = Math.ceil((600000 - (now - searchData.firstSearch)) / 1000 / 60);
        return toast({
          title: "Error",
          description: `You can search again in ${timeLeft} minutes.`,
          variant: 'destructive'
        })
      }
    }
  };

  const checkRateLimit = () => {
    const searchData = getSearchCount();
    if (searchData.firstSearch && (Date.now() - searchData.firstSearch > 600000)) {
      localStorage.removeItem('youtubeSearchData');
      setIsRateLimited(false);
    } else if (searchData.count >= 5) {
      setIsRateLimited(true);
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // YouTube search function
  const searchYouTube = useCallback(async (query: string) => {
    if (!query.trim() || isRateLimited) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=5&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('Failed to fetch results');
      const data = await response.json();
      
      setResults(data.items);
      onSearchResults?.(data.items);
    } catch (error) {
      console.error('YouTube API Error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [onSearchResults, isRateLimited]);

  // Debounce effect
  useEffect(() => {
    if (isRateLimited) return;
    
    const debounceTimer = setTimeout(() => {
      searchYouTube(searchQuery);
    }, 1000);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, searchYouTube, isRateLimited]);

  useEffect(() => {
    checkRateLimit();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleResultClick = (video: YouTubeSearchResult) => {
    setSelectedVideo(video);
    setIsDialogOpen(true);
  };

  const handleConfirmAdd = () => {
    if (selectedVideo) {
      onResultSelect?.(selectedVideo.id.videoId);
      setResults([]);
      setSearchQuery('');
      setIsDialogOpen(false);
      updateSearchCount();
    }
  };

  const handleRateLimitedClick = () => {
    if (isRateLimited) {
      const searchData = getSearchCount();
      const timeLeft = Math.ceil((600000 - (Date.now() - searchData.firstSearch)) / 1000 / 60);
      return toast({
        title: "Error",
        description: `You can search again in ${timeLeft} minutes.`,
        variant: 'destructive'
      })
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto z-50">
      <form 
        onSubmit={(e) => e.preventDefault()} 
        className={`flex items-center border-2 ${
          isRateLimited ? 'border-red-500/30' : 'border-purple-500/20'
        } rounded-xl overflow-hidden w-full bg-gray-800/40 backdrop-blur-sm`}
      >
        <input
          type="text"
          placeholder={isRateLimited ? "Search limit reached" : "Search YouTube songs..."}
          value={searchQuery}
          onChange={handleInputChange}
          className="flex-1 px-6 py-4 text-base focus:outline-none bg-transparent text-white placeholder-purple-300/50"
          disabled={isRateLimited}
          onClick={handleRateLimitedClick}
        />
        <button
          type="submit"
          className={`${
            isRateLimited 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500'
          } px-8 py-4 transition-all duration-300`}
          disabled={isRateLimited}
        >
          <svg 
            className="w-6 h-6 text-white"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </button>
      </form>

      {(results.length > 0 || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800/95 rounded-xl shadow-2xl border-2 border-purple-500/20 overflow-hidden backdrop-blur-xl">
          {isLoading ? (
            <div className="p-4 text-purple-300/80 animate-pulse">
              Searching the cosmos...
            </div>
          ) : (
            results.map((result) => (
              <div
                key={result.id.videoId}
                onClick={() => handleResultClick(result)}
                className="flex items-center p-4 hover:bg-gray-700/40 cursor-pointer transition-all duration-200 group"
              >
                <img
                  src={result.snippet.thumbnails.default.url}
                  alt={result.snippet.title}
                  className="w-16 h-16 rounded-lg mr-4 object-cover border-2 border-purple-500/20 group-hover:border-purple-400/40 transition-colors"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold truncate text-white">
                    {result.snippet.title}
                  </h3>
                  <p className="text-sm text-purple-300/60 truncate">
                    {result.snippet.channelTitle}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="border-0 bg-gradient-to-br from-gray-900 to-gray-800 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-purple-200/90 text-center">
              🎵 Confirm Song Addition
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            {selectedVideo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center space-x-4"
              >
                <img
                  src={selectedVideo.snippet.thumbnails.default.url}
                  alt={selectedVideo.snippet.title}
                  className="w-20 h-20 rounded-lg object-cover border-2 border-purple-500/20"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold truncate text-white">
                    {selectedVideo.snippet.title.slice(0, 40)}...
                  </h3>
                  <p className="text-sm text-purple-300/60 truncate">
                    {selectedVideo.snippet.channelTitle}
                  </p>
                </div>
              </motion.div>
            )}
            
            <p className="text-center text-purple-200/80">
              Add this song to the cosmic queue?
            </p>
          </div>

          <DialogFooter className="flex flex-col space-y-3 sm:flex-row sm:space-x-3 sm:space-y-0">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl border-2 border-gray-600/30 bg-gray-800/40 px-8 py-6 text-lg font-medium text-gray-200 hover:border-gray-500/50 hover:bg-gray-700/50"
              >
                Cancel
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleConfirmAdd}
                className="rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 px-8 py-6 text-lg font-bold text-white shadow-[0_4px_30px_-8px_rgba(129,140,248,0.6)] hover:shadow-[0_6px_40px_-6px_rgba(129,140,248,0.8)]"
              >
                Add to Queue
              </Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SearchBar;