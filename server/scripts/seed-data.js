const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const path = require("path")
require("dotenv").config({ path: path.join(__dirname, "../.env") })

// Import models
const Customer = require("../models/Customer")
const Employee = require("../models/Employee")
const Tour = require("../models/Tour")
const Booking = require("../models/Booking")
const Review = require("../models/Review")
const Notification = require('../models/Notification');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/tour_management", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error("❌ Database connection error:", error)
    process.exit(1)
  }
}

// Generate unique IDs
const generateId = (prefix) => {
  return prefix + Date.now() + Math.floor(Math.random() * 1000)
}

async function seedData() {
  try {
    await connectDB()

    console.log("🧹 Clearing existing data...")
    // Clear existing data
    await Customer.deleteMany({})
    await Employee.deleteMany({})
    await Tour.deleteMany({})
    await Booking.deleteMany({})
    await Review.deleteMany({})
    await Notification.deleteMany({});

    console.log("👤 Creating admin user...")
    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10)
    const admin = new Employee({
      employeeId: generateId("EMP"),
      fullName: "Quản trị viên hệ thống",
      dateOfBirth: new Date("1990-01-01"),
      address: "123 Đường Nguyễn Huệ, Quận 1, TP.HCM",
      phoneNumber: "0901234567",
      email: "admin@tourmanagement.com",
      password: hashedPassword,
      role: "admin",
    })
    await admin.save()

    console.log("👥 Creating sample customers...")
    // Create sample customers
    const customers = []
    const customerData = [
      {
        fullName: "Nguyễn Văn An",
        email: "nguyenvanan@gmail.com",
        phoneNumber: "0987654321",
        address: "456 Đường Lê Lợi, Quận 3, TP.HCM",
        dateOfBirth: new Date("1995-05-15"),
      },
      {
        fullName: "Trần Thị Bình",
        email: "tranthibinh@gmail.com",
        phoneNumber: "0976543210",
        address: "789 Đường Trần Hưng Đạo, Quận 5, TP.HCM",
        dateOfBirth: new Date("1988-08-20"),
      },
      {
        fullName: "Lê Minh Cường",
        email: "leminhcuong@gmail.com",
        phoneNumber: "0965432109",
        address: "321 Đường Võ Văn Tần, Quận 3, TP.HCM",
        dateOfBirth: new Date("1992-12-10"),
      },
    ]

    for (const customerInfo of customerData) {
      const hashedCustomerPassword = await bcrypt.hash("123456", 10)
      const customer = new Customer({
        customerId: generateId("CUST"),
        ...customerInfo,
        password: hashedCustomerPassword,
      })
      const savedCustomer = await customer.save()
      customers.push(savedCustomer)
    }

    console.log("🏖️ Creating sample tours...")
    // Create sample tours
    const tours = []
    const tourData = [
  {
    tourName: "Du lịch Hạ Long - Sapa 4N3Đ",
    departure: "Hà Nội",
    destination: "Hạ Long - Sapa",
    category: "domestic",
    region: "mien-bac",
    country: "Việt Nam",
    itinerary:
      "Ngày 1: Hà Nội - Hạ Long, tham quan vịnh Hạ Long, du thuyền qua đêm. Ngày 2: Hạ Long - Sapa, tham quan thị trấn Sapa, bản Cát Cát. Ngày 3: Chinh phục Fansipan bằng cáp treo. Ngày 4: Sapa - Hà Nội.",
    startDate: new Date("2024-04-15"),
    endDate: new Date("2024-04-18"),
    duration: 4,
    transportation: "Xe khách limousine, cáp treo Fansipan",
    price: 3500000,
    availableSlots: 20,
    totalSlots: 20,
    services: [
      "Khách sạn 3 sao view đẹp",
      "Ăn 3 bữa/ngày",
      "Hướng dẫn viên",
      "Vé tham quan",
      "Bảo hiểm",
    ],
    images: ["/placeholder.svg?height=300&width=400"],
    highlights: ["Vịnh Hạ Long", "Sapa", "Fansipan"],
    included: ["Khách sạn", "Ăn uống", "Vé tham quan", "HDV", "Bảo hiểm"],
    excluded: ["Chi tiêu cá nhân", "VAT"],
    difficulty: "moderate",
    tourType: "adventure",
    status: "active",
    featured: true,
  },

  {
    tourName: "Phú Quốc - Thiên đường biển đảo 3N2Đ",
    departure: "TP.HCM",
    destination: "Phú Quốc",
    category: "domestic",
    region: "mien-nam",
    country: "Việt Nam",
    itinerary:
      "Ngày 1: TP.HCM - Phú Quốc, check-in resort, tắm biển. Ngày 2: Tour 4 đảo Nam, lặn ngắm san hô, BBQ trên biển. Ngày 3: Làng chài Hàm Ninh, chợ đêm Dinh Cậu.",
    startDate: new Date("2024-04-20"),
    endDate: new Date("2024-04-22"),
    duration: 3,
    transportation: "Máy bay Vietnam Airlines, tàu cao tốc",
    price: 4200000,
    availableSlots: 15,
    totalSlots: 15,
    services: [
      "Resort 4 sao",
      "Ăn sáng buffet",
      "Tour lặn biển",
      "Vé máy bay khứ hồi",
      "Xe đưa đón",
    ],
    images: ["/placeholder.svg?height=300&width=400"],
    highlights: ["Bãi Sao", "Tour 4 đảo", "San hô Phú Quốc"],
    included: ["Resort", "Vé máy bay", "Tour đảo", "Ăn sáng"],
    excluded: ["Chi tiêu cá nhân"],
    difficulty: "easy",
    tourType: "beach",
    status: "active",
    featured: true,
  },

  {
    tourName: "Đà Lạt - Thành phố ngàn hoa 2N1Đ",
    departure: "TP.HCM",
    destination: "Đà Lạt",
    category: "domestic",
    region: "mien-nam",
    country: "Việt Nam",
    itinerary:
      "Ngày 1: Tham quan hồ Xuân Hương, dinh Bảo Đại, chợ đêm Đà Lạt. Ngày 2: Thác Elephant, làng hoa Vạn Thành, đồi chè Cầu Đất.",
    startDate: new Date("2024-04-25"),
    endDate: new Date("2024-04-26"),
    duration: 2,
    transportation: "Xe giường nằm VIP",
    price: 1800000,
    availableSlots: 25,
    totalSlots: 25,
    services: [
      "Khách sạn 3 sao",
      "Ăn 2 bữa/ngày",
      "Hướng dẫn viên",
      "Vé tham quan",
    ],
    images: ["/placeholder.svg?height=300&width=400"],
    highlights: ["Hồ Xuân Hương", "Đồi chè Cầu Đất", "Thác Elephant"],
    included: ["Khách sạn", "Ăn uống", "Vé tham quan", "HDV"],
    excluded: ["Chi tiêu cá nhân"],
    difficulty: "easy",
    tourType: "nature",
    status: "active",
    featured: false,
  },

  {
    tourName: "Nha Trang - Biển xanh cát trắng 3N2Đ",
    departure: "TP.HCM",
    destination: "Nha Trang",
    category: "domestic",
    region: "mien-trung",
    country: "Việt Nam",
    itinerary:
      "Ngày 1: Tắm biển, hải sản. Ngày 2: Tour 4 đảo, lặn ngắm san hô, tắm bùn khoáng. Ngày 3: Vinpearl Land, cáp treo vượt biển.",
    startDate: new Date("2024-05-01"),
    endDate: new Date("2024-05-03"),
    duration: 3,
    transportation: "Tàu hỏa SE, tàu cao tốc ra đảo",
    price: 2800000,
    availableSlots: 18,
    totalSlots: 18,
    services: [
      "Khách sạn 4 sao",
      "Ăn 3 bữa/ngày",
      "Vé Vinpearl Land",
      "Tour 4 đảo",
      "Tắm bùn khoáng",
    ],
    images: ["/placeholder.svg?height=300&width=400"],
    highlights: ["Vinpearl Land", "Tour 4 đảo", "Tắm bùn"],
    included: ["Khách sạn", "Vé Vinpearl", "Ăn uống", "HDV"],
    excluded: ["Chi tiêu cá nhân"],
    difficulty: "easy",
    tourType: "beach",
    status: "active",
    featured: false,
  },

  {
    tourName: "Hội An - Huế - Di sản văn hóa 4N3Đ",
    departure: "Đà Nẵng",
    destination: "Hội An - Huế",
    category: "domestic",
    region: "mien-trung",
    country: "Việt Nam",
    itinerary:
      "Ngày 1: Hội An, chùa Cầu. Ngày 2: Thanh Hà, rừng dừa Bảy Mẫu. Ngày 3: Huế, Đại Nội, lăng Tự Đức. Ngày 4: Chùa Thiên Mụ, lăng Khải Định.",
    startDate: new Date("2024-05-05"),
    endDate: new Date("2024-05-08"),
    duration: 4,
    transportation: "Xe khách, thuyền sông Hương",
    price: 3200000,
    availableSlots: 22,
    totalSlots: 22,
    services: [
      "Khách sạn 3 sao",
      "Ăn đặc sản địa phương",
      "HDV lịch sử",
      "Vé tham quan",
      "Thuyền sông Hương",
    ],
    images: ["/placeholder.svg?height=300&width=400"],
    highlights: ["Hội An", "Huế", "Lăng Tự Đức"],
    included: ["Khách sạn", "Ăn uống", "Vé tham quan", "HDV"],
    excluded: ["Chi tiêu cá nhân"],
    difficulty: "moderate",
    tourType: "cultural",
    status: "active",
    featured: true,
  },

  {
    tourName: "Mũi Né - Sa mạc thu nhỏ 2N1Đ",
    departure: "TP.HCM",
    destination: "Mũi Né - Phan Thiết",
    category: "domestic",
    region: "mien-nam",
    country: "Việt Nam",
    itinerary:
      "Ngày 1: Đồi cát bay, suối Tiên. Ngày 2: Bình minh đồi cát vàng, làng chài Mũi Né.",
    startDate: new Date("2024-05-10"),
    endDate: new Date("2024-05-11"),
    duration: 2,
    transportation: "Xe khách giường nằm",
    price: 1500000,
    availableSlots: 30,
    totalSlots: 30,
    services: [
      "Resort 3 sao gần biển",
      "Ăn sáng buffet",
      "Xe jeep tham quan đồi cát",
      "HDV địa phương",
    ],
    images: ["/placeholder.svg?height=300&width=400"],
    highlights: ["Đồi cát bay", "Suối Tiên", "Bình minh Mũi Né"],
    included: ["Resort", "Ăn sáng", "Xe jeep", "HDV"],
    excluded: ["Chi tiêu cá nhân"],
    difficulty: "easy",
    tourType: "nature",
    status: "active",
    featured: false,
  },
]


    for (const tourInfo of tourData) {
      const tour = new Tour({
        tourId: generateId("TOUR"),
        ...tourInfo,
      })
      const savedTour = await tour.save()
      tours.push(savedTour)
    }

    console.log("📝 Creating sample bookings...")
    // Create sample bookings
    const bookings = []
    const bookingData = [
      {
        customerId: customers[0]._id,
        tourId: tours[0]._id,
        numberOfPeople: 2,
        status: "paid",
        notes: "Yêu cầu phòng đôi, không hút thuốc",
      },
      {
        customerId: customers[1]._id,
        tourId: tours[1]._id,
        numberOfPeople: 4,
        status: "confirmed",
        notes: "Có trẻ em 8 tuổi, cần ghế ngồi trẻ em",
      },
      {
        customerId: customers[2]._id,
        tourId: tours[2]._id,
        numberOfPeople: 1,
        status: "pending",
        notes: "Đi một mình, mong được sắp xếp phòng đơn",
      },
      {
        customerId: customers[0]._id,
        tourId: tours[3]._id,
        numberOfPeople: 3,
        status: "paid",
        notes: "Gia đình có người cao tuổi, cần hỗ trợ di chuyển",
      },
    ]

    for (const bookingInfo of bookingData) {
      const tour = tours.find((t) => t._id.equals(bookingInfo.tourId))
      const booking = new Booking({
        bookingId: generateId("BOOK"),
        ...bookingInfo,
        totalAmount: tour.price * bookingInfo.numberOfPeople,
        bookingDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
      })
      const savedBooking = await booking.save()
      bookings.push(savedBooking)

      // Update tour available slots
      tour.availableSlots -= bookingInfo.numberOfPeople
      await tour.save()
    }

    console.log("⭐ Creating sample reviews...")
    // Create sample reviews for paid bookings
    const reviewData = [
  {
    customer: customers[0],
    tour: tours[0],
    rating: 5,
    comment:
      "Tour rất tuyệt vời! Hướng dẫn viên nhiệt tình, lịch trình hợp lý. Đặc biệt ấn tượng với cảnh đẹp Hạ Long và không khí trong lành ở Sapa. Sẽ giới thiệu cho bạn bè.",
    status: "approved",
  },
  {
    customer: customers[0],
    tour: tours[3],
    rating: 4,
    comment:
      "Tour Nha Trang rất vui, biển đẹp, hải sản ngon. Tuy nhiên lịch trình hơi gấp, mong có thêm thời gian nghỉ ngơi. Nhìn chung rất hài lòng với chuyến đi.",
    status: "approved",
  },
]

console.log('--- Bắt đầu tạo dữ liệu cho Notification ---');
    const sampleCustomer = customers[0];
    // FIX 1: Dùng `findOne` và `await` để lấy admin một cách chính xác.
    // Employee.find() trả về một query, không phải là một object.
    const sampleAdmin = await Employee.findOne({ role: 'admin' });

    if (sampleCustomer && sampleAdmin) {
      const notifications = [
        {
          recipient: sampleAdmin._id,
          recipientModel: 'Employee',
          sender: sampleCustomer._id,
          senderModel: 'Customer',
          type: 'new_booking',
          message: `${sampleCustomer.fullName} vừa đặt một tour mới.`,
          link: `/admin`
        },
        {
          recipient: sampleCustomer._id,
          recipientModel: 'Customer',
          sender: sampleAdmin._id,
          senderModel: 'Employee',
          type: 'booking_confirmation',
          message: 'Booking của bạn đã được quản trị viên xác nhận.',
          link: '/bookings'
        },
        {
          recipient: sampleAdmin._id,
          recipientModel: 'Employee',
          sender: sampleCustomer._id,
          senderModel: 'Customer',
          type: 'new_review',
          message: `${sampleCustomer.fullName} đã để lại một đánh giá mới.`,
          link: '/admin?tab=reviews'
        }
      ];

      await Notification.insertMany(notifications);
      console.log(`✅ ${notifications.length} thông báo mẫu đã được tạo.`);
    } else {
      console.log('⚠️ Không tìm thấy customer hoặc admin mẫu để tạo thông báo.');
    }

    for (const reviewInfo of reviewData) {
  const review = new Review({
    reviewId: generateId("REV"),
    customerId: reviewInfo.customer._id,
    tourId: reviewInfo.tour._id,
    rating: reviewInfo.rating,
    comment: reviewInfo.comment,
    images: [], // Có thể thêm image url ở đây nếu bạn muốn demo
    reviewerName: reviewInfo.customer.fullName,
    reviewerPhone: reviewInfo.customer.phoneNumber,
    reviewDate: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
    status: reviewInfo.status,
  })

  await review.save()
    }

    console.log("✅ Seed data created successfully!")
    console.log("📊 Summary:")
    console.log(`   - Admin account: admin@tourmanagement.com / admin123`)
    console.log(`   - Sample customers: ${customers.length}`)
    console.log(`   - Sample tours: ${tours.length}`)
    console.log(`   - Sample bookings: ${bookings.length}`)
    console.log(`   - Sample reviews: ${reviewData.length}`)
    console.log("")
    console.log("🔐 Test accounts:")
    console.log("   Admin: admin@tourmanagement.com / admin123")
    console.log("   Customer 1: nguyenvanan@gmail.com / 123456")
    console.log("   Customer 2: tranthibinh@gmail.com / 123456")
    console.log("   Customer 3: leminhcuong@gmail.com / 123456")
  } catch (error) {
    console.error("❌ Error seeding data:", error)
  } finally {
    mongoose.connection.close()
    console.log("🔌 Database connection closed")
  }
}

// Run the seed function
seedData()
