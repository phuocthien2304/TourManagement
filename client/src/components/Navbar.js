"use client"

import React, { useContext, useState, useEffect, useRef } from 'react';
import { Navbar, Nav, Container, Button, Dropdown, Badge } from "react-bootstrap"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useSocket } from "../contexts/SocketContext" // <-- Thêm hook socket
import { toast } from 'react-toastify';             // <-- Thêm toast
import { FaBell } from "react-icons/fa"; 
import { getNotifications, markNotificationAsRead } from '../services/api';
import './Navbar.css';

const NavigationBar = () => {
  const { user, logout } = useAuth()
  const socket = useSocket();
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (user) {
        const fetchNotifications = async () => {
            try {
                const data = await getNotifications();
                setNotifications(data);
            } catch (error) {
                console.error("Không thể tải thông báo.");
            }
        };
        fetchNotifications();
    } else {
        setNotifications([]); // Clear notifications on logout
    }
}, [user]);


  useEffect(() => {
    // Chỉ lắng nghe nếu có socket, có user và user đó không phải admin
    if (socket && user && user.role !== 'admin') {
      const handleNotification = (notification) => {
        // Chỉ xử lý các thông báo về cập nhật trạng thái booking
        console.log("Received a notification:", notification);

        if (notification.type === 'booking_status_update') {
          // Hiển thị toast cho người dùng
          toast.info(notification.data.message);
          
          // Thêm thông báo mới vào đầu danh sách
          setNotifications(prev => [notification.data, ...prev]);
          
          // Tăng số lượng thông báo chưa đọc
          setUnreadCount(prev => prev + 1);
        }
      };

      socket.on('getNotification', handleNotification);

      // Hủy lắng nghe khi component unmount
      return () => {
        socket.off('getNotification', handleNotification);
      };
    }
  }, [socket, user]);

  useEffect(() => {
    function handleClickOutside(event) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setShowDropdown(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
}, [dropdownRef]);

const handleNotificationClick = async (notification) => {
  try {
      if (!notification.read) {
          await markNotificationAsRead(notification._id);
          setNotifications(prev =>
              prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
          );
      }
      setShowDropdown(false);
      navigate(notification.link || '/');
  } catch (error) {
      console.error("Lỗi khi xử lý thông báo:", error);
  }
};

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <Navbar bg="primary" variant="dark" expand="lg" className="mb-4 fixed-top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          TVMTravel
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">
              Trang chủ
            </Nav.Link>
            <Nav.Link as={Link} to="/tours">
              Tours
            </Nav.Link>
          </Nav>

          <Nav>
            {user ? (
              <>

{user.role === 'customer' ? (
                            <Link to="/bookings">Lịch sử Booking</Link>
                        ) : (
                            <Link to="/dashboard">Dashboard</Link>
                        )}
                        
                        {/* Notification Bell */}
                        <div className="notification-wrapper" ref={dropdownRef}>
                            <button onClick={() => setShowDropdown(!showDropdown)} className="notification-bell">
                                🔔
                                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                            </button>
                            {showDropdown && (
                                <div className="notification-dropdown">
                                    {notifications.length > 0 ? (
                                        notifications.map(n => (
                                            <div 
                                                key={n._id} 
                                                className={`notification-item ${n.read ? 'read' : 'unread'}`}
                                                onClick={() => handleNotificationClick(n)}
                                            >
                                                <p>{n.message}</p>
                                                <small>{new Date(n.createdAt).toLocaleString()}</small>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="notification-item">Không có thông báo.</div>
                                    )}
                                </div>
                            )}
                        </div>

                {user.role === "admin" && (
                  <Nav.Link as={Link} to="/admin">
                    Quản trị
                  </Nav.Link>
                )}
                <Nav.Link as={Link} to="/bookings">
                  Lịch sử đặt tour
                </Nav.Link>
                <Nav.Link as={Link} to="/dashboard">Xin chào, {user.fullName}</Nav.Link>
                <Button variant="outline-light" size="sm" onClick={handleLogout}>
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  Đăng nhập
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
                  Đăng ký
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

export default NavigationBar
