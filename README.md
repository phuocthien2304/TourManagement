# Hệ thống Quản lý Tour Du lịch

Một ứng dụng web hoàn chỉnh để quản lý tour du lịch được xây dựng với ReactJS, NodeJS, ExpressJS và MongoDB.

## Cấu trúc dự án

\`\`\`
tour-management-system/
├── server/                 # Backend API
│   ├── config/            # Cấu hình database
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Authentication middleware
│   ├── scripts/           # Database seeding scripts
│   ├── .env              # Environment variables
│   ├── package.json      # Backend dependencies
│   └── server.js         # Main server file
├── client/                # Frontend React app
│   ├── public/           # Static files
│   ├── src/              # React source code
│   │   ├── components/   # Reusable components
│   │   ├── contexts/     # React contexts
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   └── App.js        # Main App component
│   ├── .env              # Frontend environment variables
│   └── package.json      # Frontend dependencies
└── README.md             # Documentation
\`\`\`

## Tính năng chính

### Dành cho Khách hàng:
- ✅ Đăng ký và đăng nhập tài khoản
- ✅ Tìm kiếm và lọc tour theo điểm đến, giá cả, thời gian
- ✅ Xem chi tiết tour và đặt tour trực tuyến
- ✅ Theo dõi lịch sử đặt tour và trạng thái thanh toán
- ✅ Đánh giá tour sau khi hoàn thành

### Dành cho Quản trị viên:
- ✅ Quản lý danh sách tour (thêm, sửa, xóa, xem)
- ✅ Quản lý thông tin khách hàng
- ✅ Xác nhận hoặc hủy đơn đặt tour
- ✅ Thống kê số lượng tour đã được đặt
- ✅ Tính doanh thu theo tour hoặc theo tháng
- ✅ Kiểm duyệt đánh giá từ khách hàng

## Cài đặt và chạy dự án

### 1. Yêu cầu hệ thống
- Node.js (v16 trở lên)
- MongoDB
- Git

### 2. Cài đặt Backend
\`\`\`bash
cd server
npm install
\`\`\`

### 3. Cài đặt Frontend
\`\`\`bash
cd client
npm install
\`\`\`

### 4. Cấu hình môi trường
Tạo file `.env` trong thư mục `server`:
\`\`\`env
MONGODB_URI=mongodb://localhost:27017/tour_management
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
NODE_ENV=development
\`\`\`

Tạo file `.env` trong thư mục `client`:
\`\`\`env
REACT_APP_API_URL=http://localhost:5000/api
\`\`\`

### 5. Khởi động MongoDB
\`\`\`bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
\`\`\`

### 6. Tạo dữ liệu mẫu
\`\`\`bash
cd server
npm run seed
\`\`\`

### 7. Chạy ứng dụng
\`\`\`bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm start
\`\`\`

### 8. Truy cập ứng dụng
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Admin login**: admin@tourmanagement.com / admin123

## Công nghệ sử dụng

### Backend:
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend:
- **React.js** - UI library
- **React Router** - Client-side routing
- **Bootstrap** - CSS framework
- **React Bootstrap** - Bootstrap components for React
- **Axios** - HTTP client

## API Endpoints

### Authentication
- `POST /api/auth/register` -
