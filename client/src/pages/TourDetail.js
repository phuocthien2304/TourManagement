"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Container, Row, Col, Card, Button, Form, Alert, Badge, Carousel } from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"

const TourDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tour, setTour] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingData, setBookingData] = useState({
    numberOfPeople: 1,
    notes: "",
  })
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  useEffect(() => {
    fetchTourDetail()
    fetchReviews()
  }, [id])

  const fetchTourDetail = async () => {
    try {
      const response = await api.get(`/tours/${id}`)
      setTour(response.data)
    } catch (error) {
      console.error("Error fetching tour detail:", error)
      setAlert({
        show: true,
        message: "Không thể tải thông tin tour",
        variant: "danger",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/reviews/tour/${id}`)
      setReviews(response.data)
    } catch (error) {
      console.error("Error fetching reviews:", error)
    }
  }

  const handleBooking = async (e) => {
    e.preventDefault()

    if (!user) {
      navigate("/login")
      return
    }

    try {
      const response = await api.post("/bookings", {
        tourId: id,
        numberOfPeople: bookingData.numberOfPeople,
        notes: bookingData.notes,
      })

      setAlert({
        show: true,
        message: "Đặt tour thành công! Vui lòng kiểm tra lịch sử đặt tour.",
        variant: "success",
      })

      // Update available slots
      setTour((prev) => ({
        ...prev,
        availableSlots: prev.availableSlots - bookingData.numberOfPeople,
      }))

      // Reset form
      setBookingData({ numberOfPeople: 1, notes: "" })
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || "Có lỗi xảy ra khi đặt tour",
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

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <i key={index} className={`bi bi-star${index < rating ? "-fill" : ""} text-warning`}></i>
    ))
  }

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    )
  }

  if (!tour) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">Tour không tồn tại</Alert>
      </Container>
    )
  }

  return (
    <Container>
      {alert.show && (
        <Alert variant={alert.variant} onClose={() => setAlert({ show: false })} dismissible>
          {alert.message}
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          {/* Tour Images */}
          {tour.images && tour.images.length > 0 ? (
            <Carousel className="mb-4">
              {tour.images.map((image, index) => (
                <Carousel.Item key={index}>
                  <img
                    className="d-block w-100"
                    src={image || "/placeholder.svg"}
                    alt={`${tour.tourName} ${index + 1}`}
                    style={{ height: "400px", objectFit: "cover" }}
                  />
                </Carousel.Item>
              ))}
            </Carousel>
          ) : (
            <img
              src="/placeholder.svg?height=400&width=600"
              alt={tour.tourName}
              className="img-fluid mb-4 rounded"
              style={{ height: "400px", width: "100%", objectFit: "cover" }}
            />
          )}

          {/* Tour Information */}
          <Card className="mb-4">
            <Card.Body>
              <h1 className="mb-3">{tour.tourName}</h1>

              <Row className="mb-3">
                <Col md={6}>
                  <p>
                    <strong>Điểm khởi hành:</strong> {tour.departure}
                  </p>
                  <p>
                    <strong>Điểm đến:</strong> {tour.destination}
                  </p>
                  <p>
                    <strong>Phương tiện:</strong> {tour.transportation}
                  </p>
                </Col>
                <Col md={6}>
                  <p>
                    <strong>Ngày bắt đầu:</strong> {formatDate(tour.startDate)}
                  </p>
                  <p>
                    <strong>Ngày kết thúc:</strong> {formatDate(tour.endDate)}
                  </p>
                  <p>
                    <strong>Còn lại:</strong> <Badge bg="info">{tour.availableSlots} chỗ</Badge>
                  </p>
                </Col>
              </Row>

              <h4>Lịch trình</h4>
              <p className="mb-3">{tour.itinerary}</p>

              {tour.services && tour.services.length > 0 && (
                <>
                  <h4>Dịch vụ bao gồm</h4>
                  <ul>
                    {tour.services.map((service, index) => (
                      <li key={index}>{service}</li>
                    ))}
                  </ul>
                </>
              )}
            </Card.Body>
          </Card>

          {/* Reviews */}
          <Card>
            <Card.Header>
              <h4>Đánh giá từ khách hàng</h4>
            </Card.Header>
            <Card.Body>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review._id} className="mb-3 pb-3 border-bottom">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <strong>{review.customerId.fullName}</strong>
                        <div className="mb-2">{renderStars(review.rating)}</div>
                      </div>
                      <small className="text-muted">{formatDate(review.reviewDate)}</small>
                    </div>
                    <p className="mb-0">{review.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-muted">Chưa có đánh giá nào cho tour này.</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Booking Form */}
          <Card className="sticky-top" style={{ top: "20px" }}>
            <Card.Header>
              <h4 className="mb-0">Đặt Tour</h4>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-3">
                <h3 className="text-primary">{formatPrice(tour.price)}</h3>
                <small className="text-muted">/ người</small>
              </div>

              {tour.availableSlots > 0 ? (
                <Form onSubmit={handleBooking}>
                  <Form.Group className="mb-3">
                    <Form.Label>Số lượng người</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      max={tour.availableSlots}
                      value={bookingData.numberOfPeople}
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          numberOfPeople: Number.parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Ghi chú</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={bookingData.notes}
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Yêu cầu đặc biệt..."
                    />
                  </Form.Group>

                  <div className="mb-3">
                    <strong>Tổng tiền: {formatPrice(tour.price * bookingData.numberOfPeople)}</strong>
                  </div>

                  <Button type="submit" variant="primary" size="lg" className="w-100" disabled={!user}>
                    {user ? "Đặt Tour Ngay" : "Đăng nhập để đặt tour"}
                  </Button>
                </Form>
              ) : (
                <Alert variant="warning">Tour này đã hết chỗ</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default TourDetail
