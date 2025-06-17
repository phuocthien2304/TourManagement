"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Badge, Tabs, Tab, Image } from "react-bootstrap"
import api from "../services/api"

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview")
  const [tours, setTours] = useState([])
  const [bookings, setBookings] = useState([])
  const [reviews, setReviews] = useState([])
  const [statistics, setStatistics] = useState({})
  const [loading, setLoading] = useState(true)
  const [showTourModal, setShowTourModal] = useState(false)
  const [editingTour, setEditingTour] = useState(null)
  const [tourData, setTourData] = useState({
    tourName: "",
    departure: "",
    destination: "",
    itinerary: "",
    startDate: "",
    endDate: "",
    transportation: "",
    price: "",
    availableSlots: "",
    totalSlots: "",
    services: [],
    images: [],
    imagesToRemove: [],
    category: "domestic",
    region: "",
    country: "Việt Nam",
    difficulty: "easy",
    tourType: "group",
    status: "active",
    featured: false,
    highlights: [],
    included: [],
    excluded: [],
  })
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    try {
      setLoading(true)

      if (activeTab === "overview") {
        const [bookingStats, tourStats, reviewStats] = await Promise.all([
          api.get("/statistics/bookings"),
          api.get("/statistics/tours"),
          api.get("/statistics/reviews"),
        ])

        setStatistics({
          bookings: bookingStats.data,
          tours: tourStats.data,
          reviews: reviewStats.data,
        })
      } else if (activeTab === "tours") {
        const response = await api.get("/tours")
        setTours(response.data.tours)
      } else if (activeTab === "bookings") {
        const response = await api.get("/bookings")
        setBookings(response.data.bookings)
      } else if (activeTab === "reviews") {
        const response = await api.get("/reviews")
        setReviews(response.data.reviews)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setAlert({
        show: true,
        message: "Có lỗi xảy ra khi tải dữ liệu",
        variant: "danger",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTourSubmit = async (e) => {
  e.preventDefault()

  try {
    const formData = new FormData()

    // Append các field thông thường
    for (const key in tourData) {
      if (key === "services" || key === "highlights" || key === "included" || key === "excluded") {
        tourData[key].forEach(item => formData.append(key, item))
      } else if (key === "images" || key === "imagesToRemove") {
        // Xử lý riêng ở dưới
      } else {
        formData.append(key, tourData[key])
      }
    }

    // Append images mới
    tourData.images.forEach(file => {
      formData.append("images", file)
    })

    // Append imagesToRemove (nếu có)
    tourData.imagesToRemove.forEach(filePath => {
      formData.append("imagesToRemove", filePath)
    })

    const url = editingTour ? `/tours/${editingTour._id}` : "/tours"
    const method = editingTour ? "put" : "post"

    await api[method](url, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    })

    setAlert({
      show: true,
      message: `Tour đã được ${editingTour ? "cập nhật" : "tạo"} thành công`,
      variant: "success",
    })

    setShowTourModal(false)
    resetTourForm()
    fetchData()
  } catch (error) {
    setAlert({
      show: true,
      message: error.response?.data?.message || "Có lỗi xảy ra",
      variant: "danger",
    })
  }
}


  const handleEditTour = (tour) => {
    setEditingTour(tour)
    setTourData({
      tourName: tour.tourName,
      departure: tour.departure,
      destination: tour.destination,
      itinerary: tour.itinerary,
      startDate: tour.startDate.split("T")[0],
      endDate: tour.endDate.split("T")[0],
      transportation: tour.transportation,
      price: tour.price.toString(),
      availableSlots: tour.availableSlots.toString(),
      totalSlots: tour.totalSlots?.toString() || tour.availableSlots.toString(),
      services: tour.services || [],
      images: [],
      imagesToRemove: [],
      category: tour.category || "domestic",
      region: tour.region || "",
      country: tour.country || "Việt Nam",
      difficulty: tour.difficulty || "easy",
      tourType: tour.tourType || "group",
      status: tour.status || "active",
      featured: tour.featured || false,
      highlights: tour.highlights || [],
      included: tour.included || [],
      excluded: tour.excluded || [],
    })
    setShowTourModal(true)
  }

  const handleDeleteTour = async (tourId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tour này?")) {
      try {
        await api.delete(`/tours/${tourId}`)
        setAlert({
          show: true,
          message: "Tour đã được xóa thành công",
          variant: "success",
        })
        fetchData()
      } catch (error) {
        setAlert({
          show: true,
          message: "Có lỗi xảy ra khi xóa tour",
          variant: "danger",
        })
      }
    }
  }

  const handleBookingStatusUpdate = async (bookingId, status) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status })
      setAlert({
        show: true,
        message: "Trạng thái đơn đặt tour đã được cập nhật",
        variant: "success",
      })
      fetchData()
    } catch (error) {
      setAlert({
        show: true,
        message: "Có lỗi xảy ra khi cập nhật trạng thái",
        variant: "danger",
      })
    }
  }

  const handleReviewStatusUpdate = async (reviewId, status) => {
    try {
      await api.put(`/reviews/${reviewId}/status`, { status })
      setAlert({
        show: true,
        message: "Trạng thái đánh giá đã được cập nhật",
        variant: "success",
      })
      fetchData()
    } catch (error) {
      setAlert({
        show: true,
        message: "Có lỗi xảy ra khi cập nhật trạng thái",
        variant: "danger",
      })
    }
  }

  const resetTourForm = () => {
    setEditingTour(null)
    setTourData({
      tourName: "",
      departure: "",
      destination: "",
      itinerary: "",
      startDate: "",
      endDate: "",
      transportation: "",
      price: "",
      availableSlots: "",
      totalSlots: "",
      services: [],
      images: [],
      imagesToRemove: [],
      category: "domestic",
      region: "",
      country: "Việt Nam",
      difficulty: "easy",
      tourType: "group",
      status: "active",
      featured: false,
      highlights: [],
      included: [],
      excluded: [],
    })
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

  const getStatusBadge = (status, type = "booking") => {
    let statusMap = {}

    if (type === "booking") {
      statusMap = {
        pending: { text: "Chờ xác nhận", variant: "warning" },
        confirmed: { text: "Đã xác nhận", variant: "info" },
        paid: { text: "Đã thanh toán", variant: "success" },
        cancelled: { text: "Đã hủy", variant: "danger" },
      }
    } else if (type === "review") {
      statusMap = {
        pending: { text: "Chờ duyệt", variant: "warning" },
        approved: { text: "Đã duyệt", variant: "success" },
        rejected: { text: "Từ chối", variant: "danger" },
      }
    }

    const statusInfo = statusMap[status] || { text: status, variant: "secondary" }
    return <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <i key={index} className={`bi bi-star${index < rating ? "-fill" : ""} text-warning`}></i>
    ))
  }

  const getRegionOptions = () => {
    if (tourData.category === "domestic") {
      return [
        { value: "mien-bac", label: "Miền Bắc" },
        { value: "mien-trung", label: "Miền Trung" },
        { value: "mien-nam", label: "Miền Nam" },
      ]
    } else {
      return [
        { value: "dong-nam-a", label: "Đông Nam Á" },
        { value: "dong-a", label: "Đông Á" },
        { value: "chau-au", label: "Châu Âu" },
        { value: "chau-my", label: "Châu Mỹ" },
        { value: "chau-uc", label: "Châu Úc" },
        { value: "chau-phi", label: "Châu Phi" },
      ]
    }
  }

  return (
    <Container>
      <Row>
        <Col>
          <h1 className="mb-4">Quản trị hệ thống</h1>

          <h1 className="mb-4" style={{marginTop:"82px"}}>Quản trị hệ thống</h1>
          {alert.show && (
            <Alert variant={alert.variant} onClose={() => setAlert({ show: false })} dismissible>
              {alert.message}
            </Alert>
          )}

          <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
            <Tab eventKey="overview" title="Tổng quan">
              {loading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <Row>
                  <Col md={4}>
                    <Card className="mb-4">
                      <Card.Body>
                        <h5>Thống kê đặt tour</h5>
                        <p>
                          <strong>Tổng đơn đặt:</strong> {statistics.bookings?.totalBookings || 0}
                        </p>
                        <p>
                          <strong>Doanh thu:</strong> {formatPrice(statistics.bookings?.totalRevenue || 0)}
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="mb-4">
                      <Card.Body>
                        <h5>Thống kê đánh giá</h5>
                        <p>
                          <strong>Tổng đánh giá:</strong> {statistics.reviews?.totalReviews || 0}
                        </p>
                        <p>
                          <strong>Chờ duyệt:</strong> {statistics.reviews?.pendingReviews || 0}
                        </p>
                        <p>
                          <strong>Đã duyệt:</strong> {statistics.reviews?.approvedReviews || 0}
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="mb-4">
                      <Card.Body>
                        <h5>Tours phổ biến</h5>
                        {statistics.tours?.popularTours?.slice(0, 3).map((tour, index) => (
                          <p key={index}>
                            <strong>{index + 1}.</strong> {tour.tour.tourName} ({tour.bookingCount} lượt đặt)
                          </p>
                        ))}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              )}
            </Tab>

            <Tab eventKey="tours" title="Quản lý Tours">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Danh sách Tours</h4>
                <Button
                  variant="primary"
                  onClick={() => {
                    resetTourForm()
                    setShowTourModal(true)
                  }}
                >
                  Thêm Tour Mới
                </Button>
              </div>

              {loading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <Table responsive striped>
                  <thead>
                    <tr>
                      <th>Tên Tour</th>
                      <th>Danh mục</th>
                      <th>Điểm đến</th>
                      <th>Giá</th>
                      <th>Chỗ trống/Tổng</th>
                      <th>Ngày bắt đầu</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tours.map((tour) => (
                      <tr key={tour._id}>
                        <td>
                          {tour.tourName}
                          {tour.featured && (
                            <Badge bg="warning" className="ms-1">
                              Nổi bật
                            </Badge>
                          )}
                        </td>
                        <td>
                          <Badge bg={tour.category === "domestic" ? "success" : "info"}>
                            {tour.category === "domestic" ? "Trong nước" : "Nước ngoài"}
                          </Badge>
                        </td>
                        <td>{tour.destination}</td>
                        <td>{formatPrice(tour.price)}</td>
                        <td>
                          {tour.availableSlots}/{tour.totalSlots || tour.availableSlots}
                        </td>
                        <td>{formatDate(tour.startDate)}</td>
                        <td>
                          <Badge bg={tour.status === "active" ? "success" : "secondary"}>
                            {tour.status === "active" ? "Hoạt động" : "Không hoạt động"}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEditTour(tour)}
                          >
                            Sửa
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDeleteTour(tour._id)}>
                            Xóa
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Tab>

            <Tab eventKey="bookings" title="Quản lý Đặt Tour">
              <h4 className="mb-3">Danh sách Đặt Tour</h4>

              {loading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <Table responsive striped>
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Khách hàng</th>
                      <th>Tour</th>
                      <th>Số người</th>
                      <th>Tổng tiền</th>
                      <th>Ngày đặt</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking._id}>
                        <td>{booking.bookingId}</td>
                        <td>{booking.customerId?.fullName}</td>
                        <td>{booking.tourId?.tourName}</td>
                        <td>{booking.numberOfPeople}</td>
                        <td>{formatPrice(booking.totalAmount)}</td>
                        <td>{formatDate(booking.bookingDate)}</td>
                        <td>{getStatusBadge(booking.status, "booking")}</td>
                        <td>
                          {booking.status === "pending" && (
                            <>
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="me-2"
                                onClick={() => handleBookingStatusUpdate(booking._id, "confirmed")}
                              >
                                Xác nhận
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleBookingStatusUpdate(booking._id, "cancelled")}
                              >
                                Hủy
                              </Button>
                            </>
                          )}
                          {booking.status === "confirmed" && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleBookingStatusUpdate(booking._id, "paid")}
                            >
                              Đánh dấu đã thanh toán
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Tab>

            <Tab eventKey="reviews" title="Quản lý Đánh giá">
              <h4 className="mb-3">Danh sách Đánh giá</h4>

              {loading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <Table responsive striped>
                  <thead>
                    <tr>
                      <th>Khách hàng</th>
                      <th>Tour</th>
                      <th>Đánh giá</th>
                      <th>Nội dung</th>
                      <th>Ngày đánh giá</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((review) => (
                      <tr key={review._id}>
                        <td>{review.customerId?.fullName}</td>
                        <td>{review.tourId?.tourName}</td>
                        <td>{renderStars(review.rating)}</td>
                        <td>{review.comment.substring(0, 100)}...</td>
                        <td>{formatDate(review.reviewDate)}</td>
                        <td>{getStatusBadge(review.status, "review")}</td>
                        <td>
                          {review.status === "pending" && (
                            <>
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="me-2"
                                onClick={() => handleReviewStatusUpdate(review._id, "approved")}
                              >
                                Duyệt
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleReviewStatusUpdate(review._id, "rejected")}
                              >
                                Từ chối
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Tab>
          </Tabs>
        </Col>
      </Row>

      {/* Tour Modal */}
      <Modal show={showTourModal} onHide={() => setShowTourModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingTour ? "Sửa Tour" : "Thêm Tour Mới"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleTourSubmit}>
          <Modal.Body>
            <Tabs defaultActiveKey="basic" className="mb-3">
              <Tab eventKey="basic" title="Thông tin cơ bản">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tên Tour *</Form.Label>
                      <Form.Control
                        type="text"
                        value={tourData.tourName}
                        onChange={(e) => setTourData({ ...tourData, tourName: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Điểm khởi hành *</Form.Label>
                      <Form.Control
                        type="text"
                        value={tourData.departure}
                        onChange={(e) => setTourData({ ...tourData, departure: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Điểm đến *</Form.Label>
                      <Form.Control
                        type="text"
                        value={tourData.destination}
                        onChange={(e) => setTourData({ ...tourData, destination: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phương tiện *</Form.Label>
                      <Form.Control
                        type="text"
                        value={tourData.transportation}
                        onChange={(e) => setTourData({ ...tourData, transportation: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Danh mục Tour *</Form.Label>
                      <Form.Select
                        value={tourData.category}
                        onChange={(e) => setTourData({ ...tourData, category: e.target.value, region: "" })}
                        required
                      >
                        <option value="domestic">Trong nước</option>
                        <option value="international">Nước ngoài</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Vùng miền *</Form.Label>
                      <Form.Select
                        value={tourData.region}
                        onChange={(e) => setTourData({ ...tourData, region: e.target.value })}
                        required
                      >
                        <option value="">Chọn vùng miền</option>
                        {getRegionOptions().map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Quốc gia</Form.Label>
                      <Form.Control
                        type="text"
                        value={tourData.country}
                        onChange={(e) => setTourData({ ...tourData, country: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Loại tour</Form.Label>
                      <Form.Select
                        value={tourData.tourType}
                        onChange={(e) => setTourData({ ...tourData, tourType: e.target.value })}
                      >
                        <option value="group">Theo đoàn</option>
                        <option value="private">Riêng tư</option>
                        <option value="adventure">Phiêu lưu</option>
                        <option value="cultural">Văn hóa</option>
                        <option value="beach">Biển đảo</option>
                        <option value="mountain">Núi rừng</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Độ khó</Form.Label>
                      <Form.Select
                        value={tourData.difficulty}
                        onChange={(e) => setTourData({ ...tourData, difficulty: e.target.value })}
                      >
                        <option value="easy">Dễ</option>
                        <option value="moderate">Trung bình</option>
                        <option value="challenging">Khó</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Trạng thái</Form.Label>
                      <Form.Select
                        value={tourData.status}
                        onChange={(e) => setTourData({ ...tourData, status: e.target.value })}
                      >
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Không hoạt động</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3 d-flex align-items-end">
                      <Form.Check
                        type="checkbox"
                        label="Tour nổi bật"
                        checked={tourData.featured}
                        onChange={(e) => setTourData({ ...tourData, featured: e.target.checked })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Ngày bắt đầu *</Form.Label>
                      <Form.Control
                        type="date"
                        value={tourData.startDate}
                        onChange={(e) => setTourData({ ...tourData, startDate: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Ngày kết thúc *</Form.Label>
                      <Form.Control
                        type="date"
                        value={tourData.endDate}
                        onChange={(e) => setTourData({ ...tourData, endDate: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Giá (VND) *</Form.Label>
                      <Form.Control
                        type="number"
                        value={tourData.price}
                        onChange={(e) => setTourData({ ...tourData, price: e.target.value })}
                        required
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tổng số chỗ *</Form.Label>
                      <Form.Control
                        type="number"
                        value={tourData.totalSlots}
                        onChange={(e) =>
                          setTourData({
                            ...tourData,
                            totalSlots: e.target.value,
                            availableSlots:
                              tourData.availableSlots > e.target.value ? e.target.value : tourData.availableSlots,
                          })
                        }
                        required
                        min="1"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Chỗ còn lại *</Form.Label>
                      <Form.Control
                        type="number"
                        value={tourData.availableSlots}
                        onChange={(e) => setTourData({ ...tourData, availableSlots: e.target.value })}
                        required
                        min="0"
                        max={tourData.totalSlots}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Tab>

              <Tab eventKey="details" title="Chi tiết">
                <Form.Group className="mb-3">
                  <Form.Label>Lịch trình *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={tourData.itinerary}
                    onChange={(e) => setTourData({ ...tourData, itinerary: e.target.value })}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Điểm nổi bật (mỗi điểm một dòng)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={tourData.highlights.join("\n")}
                    onChange={(e) =>
                      setTourData({
                        ...tourData,
                        highlights: e.target.value.split("\n").filter((s) => s.trim() !== ""),
                      })
                    }
                    placeholder="Ví dụ:&#10;Khám phá vịnh Hạ Long&#10;Thăm động Thiên Cung&#10;Trải nghiệm kayak"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Dịch vụ bao gồm (mỗi dịch vụ một dòng)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={tourData.included.join("\n")}
                    onChange={(e) =>
                      setTourData({
                        ...tourData,
                        included: e.target.value.split("\n").filter((s) => s.trim() !== ""),
                      })
                    }
                    placeholder="Ví dụ:&#10;Khách sạn 4 sao&#10;Ăn 3 bữa/ngày&#10;Hướng dẫn viên"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Dịch vụ không bao gồm (mỗi dịch vụ một dòng)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={tourData.excluded.join("\n")}
                    onChange={(e) =>
                      setTourData({
                        ...tourData,
                        excluded: e.target.value.split("\n").filter((s) => s.trim() !== ""),
                      })
                    }
                    placeholder="Ví dụ:&#10;Vé máy bay quốc tế&#10;Chi phí cá nhân&#10;Bảo hiểm du lịch"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Dịch vụ khác (mỗi dịch vụ một dòng)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={tourData.services.join("\n")}
                    onChange={(e) =>
                      setTourData({
                        ...tourData,
                        services: e.target.value.split("\n").filter((s) => s.trim() !== ""),
                      })
                    }
                    placeholder="Ví dụ:&#10;Xe đưa đón sân bay&#10;Nước suối miễn phí&#10;WiFi trên xe"
                  />
                </Form.Group>
              </Tab>

              <Tab eventKey="images" title="Hình ảnh">
                <Form.Group className="mb-3">
                  <Form.Label>Hình ảnh (tối đa 5 ảnh, định dạng .jpg, .jpeg, .png, tối đa 5MB mỗi ảnh)</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) => {
                      const maxImages =
                        5 - (editingTour ? editingTour.images?.length - tourData.imagesToRemove.length : 0)
                      const newImages = Array.from(e.target.files).slice(0, maxImages)
                      if (newImages.length !== e.target.files.length) {
                        setAlert({
                          show: true,
                          message: `Bạn chỉ có thể thêm tối đa ${maxImages} ảnh mới`,
                          variant: "warning",
                        })
                      }
                      setTourData({ ...tourData, images: newImages })
                    }}
                  />
                  <Form.Text className="text-muted">
                    {editingTour
                      ? `Còn ${5 - ((editingTour.images?.length || 0) - tourData.imagesToRemove.length)} slot ảnh`
                      : "Chọn tối đa 5 ảnh (mỗi ảnh tối đa 5MB)"}
                  </Form.Text>
                </Form.Group>

                {tourData.images.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label>Hình ảnh mới chọn</Form.Label>
                    <Row>
                      {tourData.images.map((image, index) => (
                        <Col md={4} key={index} className="mb-2">
                          <div className="position-relative">
                            <Image
                              src={URL.createObjectURL(image) || "/placeholder.svg"}
                              alt={`New image ${index + 1}`}
                              thumbnail
                              style={{ maxHeight: "100px", objectFit: "cover", width: "100%" }}
                            />
                            <Button
                              variant="danger"
                              size="sm"
                              className="position-absolute top-0 end-0"
                              onClick={() =>
                                setTourData({
                                  ...tourData,
                                  images: tourData.images.filter((_, i) => i !== index),
                                })
                              }
                            >
                              ×
                            </Button>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Form.Group>
                )}

                {editingTour && editingTour.images && editingTour.images.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label>Hình ảnh hiện tại</Form.Label>
                    <Row>
                      {editingTour.images
                        .filter((image) => !tourData.imagesToRemove.includes(image))
                        .map((image, index) => (
                          <Col md={4} key={index} className="mb-2">
                            <div className="position-relative">
                              <Image
                                src={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}${image}`}
                                alt={`Tour image ${index + 1}`}
                                thumbnail
                                style={{ maxHeight: "100px", objectFit: "cover", width: "100%" }}
                              />
                              <Button
                                variant="danger"
                                size="sm"
                                className="position-absolute top-0 end-0"
                                onClick={() =>
                                  setTourData({
                                    ...tourData,
                                    imagesToRemove: [...tourData.imagesToRemove, image],
                                  })
                                }
                              >
                                ×
                              </Button>
                            </div>
                          </Col>
                        ))}
                    </Row>
                  </Form.Group>
                )}
              </Tab>
            </Tabs>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowTourModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              {editingTour ? "Cập nhật" : "Tạo Tour"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

export default AdminDashboard
