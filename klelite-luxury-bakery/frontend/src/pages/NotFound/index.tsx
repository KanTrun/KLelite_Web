import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="container section" style={{ textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <h1 style={{ fontSize: '6rem', marginBottom: '1rem', color: '#D4AF37' }}>404</h1>
      <h2>Không tìm thấy trang</h2>
      <p style={{ marginBottom: '2rem' }}>Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>
      <Link to="/" className="btn btn-primary">Về trang chủ</Link>
    </div>
  );
};

export default NotFound;
