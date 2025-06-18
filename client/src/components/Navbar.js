"use client"

import { useState, useEffect } from "react"
import { Navbar, Nav, Container, Button, Dropdown, Badge } from "react-bootstrap"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useSocket } from "../contexts/SocketContext" // <-- Thêm hook socket
import { toast } from 'react-toastify';             // <-- Thêm toast
import { FaBell } from "react-icons/fa"; 

const NavigationBar = () => {
  const { user, logout } = useAuth()
  const socket = useSocket();
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

<Dropdown as={Nav.Item} align="end" onToggle={(isOpen) => {
                  // Khi người dùng mở dropdown, reset số thông báo chưa đọc
                  if (isOpen) {
                    setUnreadCount(0);
                  }
                }}>
                  <Dropdown.Toggle as={Nav.Link} id="notification-dropdown" className="position-relative">
                    <FaBell size={20} />
                    {unreadCount > 0 && (
                      <Badge 
                        pill 
                        bg="danger" 
                        className="position-absolute top-0 start-100 translate-middle"
                        style={{ fontSize: '0.6em', padding: '0.4em' }}
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Dropdown.Toggle>

                  <Dropdown.Menu style={{ minWidth: '300px' }}>
                    <Dropdown.Header>Thông báo</Dropdown.Header>
                    {notifications.length > 0 ? (
                      notifications.slice(0, 5).map((notif, index) => (
                        <Dropdown.ItemText key={index} className="px-3 py-2 text-wrap">
                          <small>
                            {notif.status === 'confirmed' ? '✅' : '❌'} {notif.message}
                          </small>
                        </Dropdown.ItemText>
                      ))
                    ) : (
                      <Dropdown.ItemText className="text-muted text-center py-2">Không có thông báo mới.</Dropdown.ItemText>
                    )}
                    <Dropdown.Divider />
                    <Dropdown.Item as={Link} to="/bookings" className="text-center">
                      Xem tất cả lịch sử
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>

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
