declare module "@rork/toolkit-sdk" {
    export const useRorkAgent: (config: any) => {
      messages: any[];
      sendMessage: (message: any) => void;
    };
  
    export const createRorkTool: (tool: any) => any;
  }