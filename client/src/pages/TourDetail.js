"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Container, Row, Col, Card, Button, Form, Alert,
  Badge, Carousel, Modal
} from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import { CreditCard, Check, Copy, X } from "lucide-react"
import api from "../services/api"

function PaymentModal({ isOpen, onClose, paymentInfo }) {
  const [copied, setCopied] = useState({ accountNumber: false, amount: false, content: false, all: false })

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(prev => ({ ...prev, [field]: true }))
      setTimeout(() => setCopied(prev => ({ ...prev, [field]: false })), 2000)
    } catch (err) { console.error("Failed to copy: ", err) }
  }

  const copyAllToClipboard = async () => {
    const allText = `Ngân hàng: MBBank\nChủ tài khoản: NGUYEN PHUOC THIEN\nSố tài khoản: 6923042004\nSố tiền: ${paymentInfo.amount}\nNội dung: ${paymentInfo.content}`
    try {
      await navigator.clipboard.writeText(allText)
      setCopied(prev => ({ ...prev, all: true }))
      setTimeout(() => setCopied(prev => ({ ...prev, all: false })), 2000)
    } catch (err) { console.error("Failed to copy: ", err) }
  }

  return (
    <Modal show={isOpen} onHide={onClose} centered size="md" scrollable>
      <Modal.Header className="d-flex align-items-center">
        <div className="d-flex align-items-center gap-2">
          <CreditCard className="text-primary" size={24} />
          <Modal.Title>Thông tin thanh toán</Modal.Title>
        </div>
        <Button variant="link" className="p-0" onClick={onClose}><X size={20} /></Button>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="primary" className="text-center">
          <p className="mb-1 fw-medium">Vui lòng chuyển khoản theo thông tin dưới đây</p>
          <p className="mb-0 small">Sau khi chuyển khoản, tour sẽ được xác nhận trong 15 phút</p>
        </Alert>
        <div className="d-flex flex-column gap-3">
          <Card className="p-3"><p className="text-muted small mb-1">Ngân hàng</p><p className="fw-bold text-primary fs-5 mb-0">MBBank</p></Card>
          <Card className="p-3"><p className="text-muted small mb-1">Chủ tài khoản</p><p className="fw-bold fs-5 mb-0">NGUYEN PHUOC THIEN</p></Card>
          <Card className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <p className="text-muted small mb-0">Số tài khoản</p>
              <Button variant="link" className="d-flex align-items-center gap-1 p-0 text-decoration-none text-primary small fw-medium" onClick={() => copyToClipboard("6923042004", "accountNumber")}>{copied.accountNumber ? (<><Check size={16} /> Đã sao chép</>) : (<><Copy size={16} /> Sao chép</>)}</Button>
            </div>
            <p className="fw-bold fs-5 font-monospace mb-0">6923042004</p>
          </Card>
          <Card className="p-3 border-danger-subtle bg-danger-subtle">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <p className="text-danger small fw-medium mb-0">Số tiền cần chuyển</p>
              <Button variant="link" className="d-flex align-items-center gap-1 p-0 text-decoration-none text-danger small fw-medium" onClick={() => copyToClipboard(paymentInfo.amount.replace(/[^\d]/g, ""), "amount")}>{copied.amount ? (<><Check size={16} /> Đã sao chép</>) : (<><Copy size={16} /> Sao chép</>)}</Button>
            </div>
            <p className="fw-bold fs-4 text-danger mb-0">{paymentInfo.amount}</p>
          </Card>
          <Card className="p-3 border-warning-subtle bg-warning-subtle">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <p className="text-warning small fw-medium mb-0">Nội dung chuyển khoản</p>
              <Button variant="link" className="d-flex align-items-center gap-1 p-0 text-decoration-none text-warning small fw-medium" onClick={() => copyToClipboard(paymentInfo.content, "content")}>{copied.content ? (<><Check size={16} /> Đã sao chép</>) : (<><Copy size={16} /> Sao chép</>)}</Button>
            </div>
            <p className="fw-bold fs-5 mb-0 text-break">{paymentInfo.content}</p>
          </Card>
        </div>
        <Button variant="primary" className="w-100 mt-4 d-flex align-items-center justify-content-center gap-2" onClick={copyAllToClipboard}>{copied.all ? (<><Check size={20} /> Đã sao chép tất cả</>) : (<><Copy size={20} /> Sao chép tất cả thông tin</>)}</Button>
        <Card className="mt-3 p-3 text-center">
          <p className="text-muted small mb-1">💡 <strong>Lưu ý:</strong> Vui lòng chuyển khoản đúng số tiền và nội dung để được xử lý nhanh chóng</p>
          <p className="text-muted small mb-0">📞 Hotline hỗ trợ: <span className="fw-medium">1900-1234</span></p>
        </Card>
      </Modal.Body>
    </Modal>
  )
}
const TourDetail = () => {
  const backendUrl = process.env.REACT_APP_API_URL || "http://localhost:5000"
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tour, setTour] = useState(null)
  const [reviews, setReviews] = useState([])
  const [canReview, setCanReview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  
  const [bookingData, setBookingData] = useState({
    numberOfPeople: 1,
    notes: "",
  })
  const [paymentInfo, setPaymentInfo] = useState({ amount: "", content: "" })

  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: "",
    images: [],
    reviewerName: user?.fullName || "",
    reviewerPhone: user?.phoneNumber || "",
  })
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  useEffect(() => {
    fetchTourDetail()
    fetchReviews()
    if (user) {
      checkCanReview()
    }
  }, [id, user])

  useEffect(() => {
    if (user) {
      setReviewData((prev) => ({
        ...prev,
        reviewerName: user.fullName || "",
        reviewerPhone: user.phoneNumber || "",
      }))
    }
  }, [user])

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

  const checkCanReview = async () => {
    try {
      const response = await api.get(`/reviews/can-review/${id}`)
      setCanReview(response.data.canReview)
    } catch (error) {
      console.error("Error checking review permission:", error)
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
      const accuratePaymentInfo = {
  amount: formatPrice(tour.price * bookingData.numberOfPeople),
  content: tour.tourName, 
}
setPaymentInfo(accuratePaymentInfo)
setShowPayment(true)

    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || "Có lỗi xảy ra khi đặt tour",
        variant: "danger",
      })
    }
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + reviewData.images.length > 3) {
      setAlert({
        show: true,
        message: "Chỉ được tải lên tối đa 3 ảnh",
        variant: "warning",
      })
      return
    }

    // Convert files to base64 for preview (in real app, upload to server)
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setReviewData((prev) => ({
          ...prev,
          images: [...prev.images, e.target.result],
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index) => {
    setReviewData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const submitReview = async (e) => {
    e.preventDefault()

    try {
      await api.post("/reviews", {
        tourId: id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        images: reviewData.images,
        reviewerName: reviewData.reviewerName,
        reviewerPhone: reviewData.reviewerPhone,
      })

      setAlert({
        show: true,
        message: "Đánh giá của bạn đã được gửi và đang chờ admin duyệt",
        variant: "success",
      })

      setShowReviewModal(false)
      setReviewData({
        rating: 5,
        comment: "",
        images: [],
        reviewerName: user?.fullName || "",
        reviewerPhone: user?.phoneNumber || "",
      })
      setCanReview(false)
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

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <i key={index} className={`bi bi-star${index < rating ? "-fill" : ""} text-warning`}></i>
    ))
  }

  const getRatingText = (rating) => {
    const ratingTexts = {
      1: "Rất tệ",
      2: "Tệ",
      3: "Tạm ổn",
      4: "Tốt",
      5: "Rất tốt",
    }
    return ratingTexts[rating] || ""
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
    <Container style={{marginTop:"82px"}}>
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
                    src={`http://localhost:5000${image}` || "/placeholder.svg"}
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
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Đánh giá từ khách hàng</h4>
              {user && canReview && (
                <Button variant="primary" size="sm" onClick={() => setShowReviewModal(true)}>
                  Viết đánh giá
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review._id} className="mb-4 pb-3 border-bottom">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <strong>{review.reviewerName}</strong>
                        <div className="mb-2">{renderStars(review.rating)}</div>
                      </div>
                      <small className="text-muted">{formatDate(review.reviewDate)}</small>
                    </div>
                    <p className="mb-2">{review.comment}</p>
                    {review.images && review.images.length > 0 && (
                      <div className="d-flex gap-2 mb-2">
                        {review.images.map((image, index) => (
                          <img
                            key={index}
                            src={image || "/placeholder.svg"}
                            alt={`Review ${index + 1}`}
                            style={{ width: "100px", height: "100px", objectFit: "cover" }}
                            className="rounded"
                          />
                        ))}
                      </div>
                    )}
                    <small className="text-muted">Liên hệ: {review.reviewerPhone}</small>
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
          <Card className="sticky-top" style={{ top: "82px" }}>
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

      {/* Payment Modal */}
      <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} paymentInfo={paymentInfo} />

      {/* Review Modal */}
      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Đánh giá tour: {tour.tourName}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={submitReview}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Đánh giá của bạn *</Form.Label>
                  <div className="d-flex align-items-center gap-3">
                    <Form.Select
                      value={reviewData.rating}
                      onChange={(e) =>
                        setReviewData({
                          ...reviewData,
                          rating: Number.parseInt(e.target.value),
                        })
                      }
                      style={{ width: "auto" }}
                    >
                      <option value={5}>5 sao</option>
                      <option value={4}>4 sao</option>
                      <option value={3}>3 sao</option>
                      <option value={2}>2 sao</option>
                      <option value={1}>1 sao</option>
                    </Form.Select>
                    <div className="d-flex align-items-center gap-2">
                      {renderStars(reviewData.rating)}
                      <span className="text-muted">({getRatingText(reviewData.rating)})</span>
                    </div>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Họ tên *</Form.Label>
                  <Form.Control
                    type="text"
                    value={reviewData.reviewerName}
                    onChange={(e) =>
                      setReviewData({
                        ...reviewData,
                        reviewerName: e.target.value,
                      })
                    }
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Số điện thoại *</Form.Label>
                  <Form.Control
                    type="tel"
                    value={reviewData.reviewerPhone}
                    onChange={(e) =>
                      setReviewData({
                        ...reviewData,
                        reviewerPhone: e.target.value,
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ảnh thực tế (tối đa 3 ảnh)</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={reviewData.images.length >= 3}
                  />
                  {reviewData.images.length > 0 && (
                    <div className="mt-2">
                      <div className="d-flex flex-wrap gap-2">
                        {reviewData.images.map((image, index) => (
                          <div key={index} className="position-relative">
                            <img
                              src={image || "/placeholder.svg"}
                              alt={`Preview ${index + 1}`}
                              style={{ width: "80px", height: "80px", objectFit: "cover" }}
                              className="rounded"
                            />
                            <Button
                              variant="danger"
                              size="sm"
                              className="position-absolute top-0 end-0"
                              style={{ padding: "2px 6px", fontSize: "12px" }}
                              onClick={() => removeImage(index)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Nhận xét của bạn *</Form.Label>
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

            <Alert variant="info">
              <small>
                <i className="bi bi-info-circle me-2"></i>
                Đánh giá của bạn sẽ được admin xem xét và duyệt trước khi hiển thị công khai.
              </small>
            </Alert>
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

export default TourDetail