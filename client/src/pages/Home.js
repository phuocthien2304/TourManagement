"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Carousel } from "react-bootstrap"
import { Link } from "react-router-dom"
import api from "../services/api"

const Home = () => {
  const [featuredTours, setFeaturedTours] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedTours()
  }, [])

  const fetchFeaturedTours = async () => {
    try {
      const response = await api.get("/tours?limit=6")
      setFeaturedTours(response.data.tours)
    } catch (error) {
      console.error("Error fetching tours:", error)
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

  return (
    <div>
      {/* Hero Section */}
      <Carousel className="mb-5">
        <Carousel.Item>
          <div
            className="d-block w-100"
            style={{
              height: "400px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div className="text-center text-white">
              <h1 className="display-4 fw-bold mb-3">Khám phá thế giới cùng chúng tôi</h1>
              <p className="lead mb-4">Những chuyến du lịch tuyệt vời đang chờ đón bạn</p>
              <Link to="/tours">
                <Button variant="light" size="lg">
                  Xem Tours
                </Button>
              </Link>
            </div>
          </div>
        </Carousel.Item>
        <Carousel.Item>
          <div
            className="d-block w-100"
            style={{
              height: "400px",
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div className="text-center text-white">
              <h1 className="display-4 fw-bold mb-3">Trải nghiệm độc đáo</h1>
              <p className="lead mb-4">Tạo nên những kỷ niệm không thể quên</p>
              <Link to="/tours">
                <Button variant="light" size="lg">
                  Đặt Tour Ngay
                </Button>
              </Link>
            </div>
          </div>
        </Carousel.Item>
      </Carousel>

      <Container>
        {/* Featured Tours Section */}
        <Row className="mb-5">
          <Col>
            <h2 className="text-center mb-4">Tours Nổi Bật</h2>
            {loading ? (
              <div className="text-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <Row>
                {featuredTours.map((tour) => (
                  <Col md={4} key={tour._id} className="mb-4">
                    <Card className="h-100 shadow-sm">
                      <Card.Img
                        variant="top"
                        src={tour.images?.[0] || "/placeholder.svg?height=200&width=300"}
                        style={{ height: "200px", objectFit: "cover" }}
                      />
                      <Card.Body className="d-flex flex-column">
                        <Card.Title>{tour.tourName}</Card.Title>
                        <Card.Text className="text-muted">
                          <small>
                            <i className="bi bi-geo-alt"></i> {tour.departure} → {tour.destination}
                          </small>
                        </Card.Text>
                        <Card.Text className="flex-grow-1">{tour.itinerary.substring(0, 100)}...</Card.Text>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="h5 text-primary mb-0">{formatPrice(tour.price)}</span>
                          <Link to={`/tours/${tour._id}`}>
                            <Button variant="primary" size="sm">
                              Xem chi tiết
                            </Button>
                          </Link>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Col>
        </Row>

        {/* Features Section */}
        <Row className="mb-5">
          <Col>
            <h2 className="text-center mb-4">Tại sao chọn chúng tôi?</h2>
            <Row>
              <Col md={4} className="text-center mb-4">
                <div className="mb-3">
                  <i className="bi bi-shield-check text-primary" style={{ fontSize: "3rem" }}></i>
                </div>
                <h4>Uy tín & Chất lượng</h4>
                <p>Đội ngũ chuyên nghiệp với nhiều năm kinh nghiệm trong lĩnh vực du lịch</p>
              </Col>
              <Col md={4} className="text-center mb-4">
                <div className="mb-3">
                  <i className="bi bi-currency-dollar text-primary" style={{ fontSize: "3rem" }}></i>
                </div>
                <h4>Giá cả hợp lý</h4>
                <p>Cam kết mang đến những tour du lịch chất lượng với mức giá tốt nhất</p>
              </Col>
              <Col md={4} className="text-center mb-4">
                <div className="mb-3">
                  <i className="bi bi-headset text-primary" style={{ fontSize: "3rem" }}></i>
                </div>
                <h4>Hỗ trợ 24/7</h4>
                <p>Đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ bạn mọi lúc mọi nơi</p>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default Home
