import { useState, useEffect } from 'react'

function App() {
  // 1. Tạo biến để hứng dữ liệu từ Backend
  const [dataBackend, setDataBackend] = useState("Đang tải...");

  // 2. Dùng useEffect để gọi API ngay khi web vừa mở lên
  useEffect(() => {
    // Gọi đến địa chỉ của Node.js (cổng 5000)
    fetch('http://localhost:51232/')
      .then(response => response.json()) // Chuyển kết quả về dạng JSON
      .then(data => {
        // Cập nhật dữ liệu vào biến
        setDataBackend(data.message);
        console.log("Đã nhận dữ liệu:", data);
      })
      .catch(error => console.error("Lỗi rồi:", error));
  }, []); // Dấu [] rỗng nghĩa là chỉ chạy 1 lần khi load trang

  // 3. Hiển thị ra màn hình
  return (
    <div style={{ padding: "50px", fontFamily: "Arial" }}>
      <h1>React + Node.js Demo</h1>
      <hr />
      <h3>Lời nhắn từ Backend:</h3>
      
      {/* Hiển thị dòng chữ lấy được từ server */}
      <h2 style={{ color: "blue" }}>{dataBackend}</h2>
    </div>
  )
}

export default App