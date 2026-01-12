import React from 'react';
import styles from '../Admin.module.scss';
import { FiImage } from 'react-icons/fi';

interface BannerGalleryProps {
  selectedImageUrl?: string;
  onSelectImage?: (url: string) => void;
}

const BannerGallery: React.FC<BannerGalleryProps> = ({ selectedImageUrl, onSelectImage }) => {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3>Thư viện Banner</h3>
        <p>Quản lý các banner hiển thị trên trang chủ và các trang danh mục</p>
      </div>
      <div className={styles.emptyState}>
        <FiImage />
        <p>Chưa có banner nào được tải lên</p>
        <button className={styles.secondaryBtn}>Tải banner lên</button>
      </div>
    </div>
  );
};

export default BannerGallery;
