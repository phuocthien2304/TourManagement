"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Form, Pagination } from "react-bootstrap"
import { Link } from "react-router-dom"
import api from "../services/api"

const Tours = () => {
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    destination: "",
    minPrice: "",
    maxPrice: "",
    startDate: "",
    endDate: "",
  })

  useEffect(() => {
    fetchTours()
  }, [currentPage, filters])

  const fetchTours = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage,
        limit: 9,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== "")),
      })

      const response = await api.get(`/tours?${params}`)
      setTours(response.data.tours)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      console.error("Error fetching tours:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
    setCurrentPage(1)
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

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <h1 className="text-center mb-4">Danh sách Tours</h1>

          {/* Filters */}
          <Card className="mb-4">
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Điểm đến</Form.Label>
                    <Form.Control
                      type="text"
                      name="destination"
                      value={filters.destination}
                      onChange={handleFilterChange}
                      placeholder="Nhập điểm đến..."
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Giá từ</Form.Label>
                    <Form.Control
                      type="number"
                      name="minPrice"
                      value={filters.minPrice}
                      onChange={handleFilterChange}
                      placeholder="0"
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Giá đến</Form.Label>
                    <Form.Control
                      type="number"
                      name="maxPrice"
                      value={filters.maxPrice}
                      onChange={handleFilterChange}
                      placeholder="10000000"
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Từ ngày</Form.Label>
                    <Form.Control
                      type="date"
                      name="startDate"
                      value={filters.startDate}
                      onChange={handleFilterChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Đến ngày</Form.Label>
                    <Form.Control type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <Row>
            {tours.map((tour) => (
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
                    <Card.Text className="text-muted">
                      <small>
                        <i className="bi bi-calendar"></i> {formatDate(tour.startDate)} - {formatDate(tour.endDate)}
                      </small>
                    </Card.Text>
                    <Card.Text className="flex-grow-1">{tour.itinerary.substring(0, 100)}...</Card.Text>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="h5 text-primary mb-0">{formatPrice(tour.price)}</span>
                        <br />
                        <small className="text-muted">Còn {tour.availableSlots} chỗ</small>
                      </div>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <Row className="mt-4">
              <Col className="d-flex justify-content-center">
                <Pagination>
                  <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} />
                  {[...Array(totalPages)].map((_, index) => (
                    <Pagination.Item
                      key={index + 1}
                      active={index + 1 === currentPage}
                      onClick={() => setCurrentPage(index + 1)}
                    >
                      {index + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  />
                </Pagination>
              </Col>
            </Row>
          )}
        </>
      )}
    </Container>
  )
}

export default Tours
