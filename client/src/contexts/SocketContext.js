"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth(); // Lấy thông tin người dùng từ AuthContext

    useEffect(() => {
        // Chỉ tạo kết nối mới khi có đối tượng user (tức là đã đăng nhập)
        if (user) {
            // Kết nối tới server backend
            const newSocket = io("http://localhost:5000");

            // Lắng nghe sự kiện 'connect' để đảm bảo kết nối thành công
            newSocket.on('connect', () => {
                // Chỉ emit MỘT LẦN ở đây sau khi đã kết nối
                newSocket.emit("addUser", { userId: user.id, role: user.role });
            });

            setSocket(newSocket);

            // Cleanup khi component unmount hoặc user thay đổi (logout)
            return () => {
                console.log("[CLIENT LOG]: Disconnecting socket.");
                newSocket.disconnect();
            };
        } else {
            // Nếu không có user (đã logout), đảm bảo socket cũ bị ngắt kết nối
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [user]); // Effect này chỉ chạy lại khi user thay đổi (login/logout)

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};