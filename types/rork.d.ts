<<<<<<< HEAD
=======
declare module "@rork-ai/toolkit-sdk" {
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
    export const useRorkAgent: (config: any) => {
      messages: any[];
      sendMessage: (message: any) => void;
    };
  
    export const createRorkTool: (tool: any) => any;
  }