"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Alert } from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"

const Dashboard = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const response = await api.get("/bookings/my-bookings")
      setBookings(response.data)
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setAlert({
        show: true,
        message: "Không thể tải lịch sử đặt tour",
        variant: "danger",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN")
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: "Chờ xác nhận", variant: "warning" },
      confirmed: { text: "Đã xác nhận", variant: "info" },
      paid: { text: "Đã thanh toán", variant: "success" },
      cancelled: { text: "Đã hủy", variant: "danger" },
    }

    const statusInfo = statusMap[status] || { text: status, variant: "secondary" }
    return <span className={`badge bg-${statusInfo.variant}`}>{statusInfo.text}</span>
  }

  return (
    <Container>
      <Row>
        <Col>
          <h1 className="mb-4">Dashboard - Xin chào {user?.fullName}</h1>

          {alert.show && (
            <Alert variant={alert.variant} onClose={() => setAlert({ show: false })} dismissible>
              {alert.message}
            </Alert>
          )}

          {/* User Info */}
          <Card className="mb-4">
            <Card.Header>
              <h4>Thông tin cá nhân</h4>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p>
                    <strong>Họ tên:</strong> {user?.fullName}
                  </p>
                  <p>
                    <strong>Email:</strong> {user?.email}
                  </p>
                </Col>
                <Col md={6}>
                  <p>
                    <strong>Số điện thoại:</strong> {user?.phoneNumber}
                  </p>
                  <p>
                    <strong>Địa chỉ:</strong> {user?.address}
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Recent Bookings */}
          <Card>
            <Card.Header>
              <h4>Đặt tour gần đây</h4>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : bookings.length > 0 ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Tour</th>
                        <th>Ngày đặt</th>
                        <th>Số người</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.slice(0, 5).map((booking) => (
                        <tr key={booking._id}>
                          <td>{booking.bookingId}</td>
                          <td>{booking.tourId?.tourName}</td>
                          <td>{formatDate(booking.bookingDate)}</td>
                          <td>{booking.numberOfPeople}</td>
                          <td>{formatPrice(booking.totalAmount)}</td>
                          <td>{getStatusBadge(booking.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">Bạn chưa có đơn đặt tour nào.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Dashboard
