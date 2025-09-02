import { API_ENDPOINTS } from "@/config/api";
import { TopicsResponse } from "./types";

export async function getTopics(): Promise<TopicsResponse> {
  const response = await fetch(API_ENDPOINTS.sessions.topics, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch topics");
  }

  return response.json();
} 