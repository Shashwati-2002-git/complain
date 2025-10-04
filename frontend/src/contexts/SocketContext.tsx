import React, { createContext, useContext, useEffect, useRef } from "react";
import io from "socket.io-client";
// Infer the socket type from the io() function
type Socket = ReturnType<typeof io>;

// Define type for our socket context
interface SocketContextType {
  socket: Socket | null;
}

// Create the context
const SocketContext = createContext<SocketContextType>({ socket: null });

// Hook to use socket easily in components
export const useSocket = () => useContext(SocketContext);

// Provider component
export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // ✅ Initialize socket connection
    const socket = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🟢 Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected");
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};
