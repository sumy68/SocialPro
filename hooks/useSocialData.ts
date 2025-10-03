import { useState, useEffect } from "react";
import { Platform, Post } from "@/types/social";

export function useSocialData() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const loadData = async () => {
      setIsLoading(true);
      
      // Mock data - in real app, this would come from API
      const mockPlatforms: Platform[] = [
        { name: "Instagram", followers: "12.4K", engagement: "5.2%", reach: "89.2K", color: "#E4405F", change: "+15%" },
        { name: "TikTok", followers: "8.2K", engagement: "7.8%", reach: "45.1K", color: "#000000", change: "+32%" },
        { name: "LinkedIn", followers: "3.1K", engagement: "2.4%", reach: "18.7K", color: "#0077B5", change: "+8%" },
        { name: "YouTube", followers: "1.1K", engagement: "3.6%", reach: "3.2K", color: "#FF0000", change: "+22%" },
      ];

      const mockPosts: Post[] = [
        {
          id: 1,
          platform: "TikTok",
          content: "5 productivity hacks that changed my life",
          engagement: "12.4K",
          reach: "89.2K",
          date: "2 days ago",
          performance: "exceptional",
        },
        {
          id: 2,
          platform: "Instagram",
          content: "Behind the scenes of my morning routine",
          engagement: "8.7K",
          reach: "45.1K",
          date: "5 days ago",
          performance: "good",
        },
      ];

      setPlatforms(mockPlatforms);
      setPosts(mockPosts);
      setIsLoading(false);
    };

    loadData();
  }, []);

  return {
    platforms,
    posts,
    isLoading,
  };
}