export interface ActivateDeactivateListenerRequest {
    active: boolean;
  }
  
  export interface ActivateDeactivateListenerResponse {
    message: string;
  }
  
  export interface ListenerErrorResponse {
    message: string;
  }
  
  export interface Listener {
    _id: string;
    name: string;
    description: string;
    gender: 'male' | 'female' | 'other';
    availability: {
      dayOfWeek: string;
      times: {
        startTime: string;
        endTime: string;
        isAvailable: boolean;
        _id?: string;
      }[];
      _id?: string;
    }[];
    email: string;
    phoneNumber: string;
    active?: boolean;
  }