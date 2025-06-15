"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Badge } from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"

const BookingHistory = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: "",
  })
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

  const handleReview = (booking) => {
    setSelectedBooking(booking)
    setShowReviewModal(true)
  }

  const submitReview = async (e) => {
    e.preventDefault()

    try {
      await api.post("/reviews", {
        tourId: selectedBooking.tourId._id,
        rating: reviewData.rating,
        comment: reviewData.comment,
      })

      setAlert({
        show: true,
        message: "Đánh giá của bạn đã được gửi và đang chờ duyệt",
        variant: "success",
      })

      setShowReviewModal(false)
      setReviewData({ rating: 5, comment: "" })
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || "Có lỗi xảy ra khi gửi đánh giá",
        variant: "danger",
      })
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
    return <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>
  }

  return (
    <Container>
      <Row>
        <Col>
          <h1 className="mb-4">Lịch sử đặt tour</h1>

          {alert.show && (
            <Alert variant={alert.variant} onClose={() => setAlert({ show: false })} dismissible>
              {alert.message}
            </Alert>
          )}

          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : bookings.length > 0 ? (
            <Row>
              {bookings.map((booking) => (
                <Col md={6} lg={4} key={booking._id} className="mb-4">
                  <Card className="h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title">{booking.tourId?.tourName}</h5>
                        {getStatusBadge(booking.status)}
                      </div>

                      <p className="text-muted mb-2">
                        <small>Mã đơn: {booking.bookingId}</small>
                      </p>

                      <p className="mb-1">
                        <strong>Điểm đến:</strong> {booking.tourId?.destination}
                      </p>
                      <p className="mb-1">
                        <strong>Ngày đặt:</strong> {formatDate(booking.bookingDate)}
                      </p>
                      <p className="mb-1">
                        <strong>Số người:</strong> {booking.numberOfPeople}
                      </p>
                      <p className="mb-3">
                        <strong>Tổng tiền:</strong> {formatPrice(booking.totalAmount)}
                      </p>

                      {booking.notes && (
                        <p className="mb-3">
                          <strong>Ghi chú:</strong> {booking.notes}
                        </p>
                      )}

                      {booking.status === "paid" && (
                        <Button variant="outline-primary" size="sm" onClick={() => handleReview(booking)}>
                          Đánh giá tour
                        </Button>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Card>
              <Card.Body className="text-center">
                <p className="text-muted">Bạn chưa có đơn đặt tour nào.</p>
                <Button variant="primary" href="/tours">
                  Khám phá tours
                </Button>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Review Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Đánh giá tour</Modal.Title>
        </Modal.Header>
        <Form onSubmit={submitReview}>
          <Modal.Body>
            <h6>{selectedBooking?.tourId?.tourName}</h6>

            <Form.Group className="mb-3">
              <Form.Label>Đánh giá (1-5 sao)</Form.Label>
              <Form.Select
                value={reviewData.rating}
                onChange={(e) =>
                  setReviewData({
                    ...reviewData,
                    rating: Number.parseInt(e.target.value),
                  })
                }
              >
                <option value={5}>5 sao - Tuyệt vời</option>
                <option value={4}>4 sao - Tốt</option>
                <option value={3}>3 sao - Bình thường</option>
                <option value={2}>2 sao - Kém</option>
                <option value={1}>1 sao - Rất kém</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Nhận xét</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={reviewData.comment}
                onChange={(e) =>
                  setReviewData({
                    ...reviewData,
                    comment: e.target.value,
                  })
                }
                placeholder="Chia sẻ trải nghiệm của bạn về tour này..."
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Gửi đánh giá
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

export default BookingHistory
