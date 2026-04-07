export interface Topic {
  _id: string;
  topic: string;
  count: number;
  createdAt: string;
  updatedAt: string;
}

export interface TopicsResponse {
  topics: Topic[];
} 