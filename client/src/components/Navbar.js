"use client"

import { Navbar, Nav, Container, Button } from "react-bootstrap"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const NavigationBar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <Navbar bg="primary" variant="dark" expand="lg" className="mb-4 fixed-top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          Tour Management
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
