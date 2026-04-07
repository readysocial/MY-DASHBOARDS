interface TopicDetails {
  _id: string;
  topic: string;
  count: number;
  createdAt: string;
  updatedAt: string;
}

interface ListenerTopic {
  _id: string;
  listener: string;
  topic: TopicDetails;
  createdAt: string;
  updatedAt: string;
}

export interface GetListenerTopicsResponse {
  topics: ListenerTopic[];
}

export interface DeleteTopicsRequest {
  topics: string[]; // Array of topic IDs to delete
}

export interface DeleteTopicsResponse {
  message: string;
} 