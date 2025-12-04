import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiGrid,
  FiImage,
  FiUpload,
} from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import { categoryService } from '@/services/productService';
import { toast } from 'react-hot-toast';
import styles from './Admin.module.scss';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parentCategory?: string;
  isActive: boolean;
  productCount?: number;
  createdAt: string;
}

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    icon: '',
    isActive: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Không thể tải danh sách danh mục');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (mode: 'create' | 'edit', category?: Category) => {
    setModalMode(mode);
    if (category) {
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        image: category.image || '',
        icon: category.icon || '',
        isActive: category.isActive,
      });
    } else {
      setSelectedCategory(null);
      setFormData({
        name: '',
        description: '',
        image: '',
        icon: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
    setFormData({
      name: '',
      description: '',
      image: '',
      icon: '',
      isActive: true,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // File upload handler for category image
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Vui lòng đăng nhập lại');
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formDataUpload,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const imgUrl = data.data?.url || data.url;
        if (imgUrl) {
          setFormData((prev) => ({
            ...prev,
            image: imgUrl,
          }));
          toast.success('Upload ảnh thành công!');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Upload ảnh thất bại');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Có lỗi khi upload ảnh');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await categoryService.createCategory(formData);
        toast.success('Tạo danh mục thành công!');
      } else if (selectedCategory) {
        await categoryService.updateCategory(selectedCategory._id, formData);
        toast.success('Cập nhật danh mục thành công!');
      }
      handleCloseModal();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteClick = (categoryId: string) => {
    setCategoryToDelete(categoryId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (categoryToDelete) {
      try {
        await categoryService.deleteCategory(categoryToDelete);
        toast.success('Xóa danh mục thành công!');
        setShowDeleteConfirm(false);
        setCategoryToDelete(null);
        fetchCategories();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Không thể xóa danh mục');
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <AdminLayout>
      <div className={styles.pageContent}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1>Quản lý danh mục</h1>
            <p>Thêm, sửa, xóa danh mục sản phẩm ({categories.length} danh mục)</p>
          </div>
          <button className={styles.primaryBtn} onClick={() => handleOpenModal('create')}>
            <FiPlus /> Thêm danh mục
          </button>
        </div>

        {/* Search */}
        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <FiSearch />
            <input
              type="text"
              placeholder="Tìm kiếm danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div className={styles.categoriesGrid}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              Đang tải...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className={styles.emptyState}>
              <FiGrid size={48} />
              <p>Không có danh mục nào</p>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <motion.div
                key={category._id}
                className={styles.categoryCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className={styles.categoryImage}>
                  {category.image ? (
                    <img src={category.image} alt={category.name} />
                  ) : (
                    <div className={styles.placeholderImage}>
                      <FiImage />
                    </div>
                  )}
                </div>
                <div className={styles.categoryInfo}>
                  <h3>{category.name}</h3>
                  {category.description && (
                    <p className={styles.categoryDesc}>{category.description}</p>
                  )}
                  <div className={styles.categoryMeta}>
                    <span className={styles.productCount}>
                      {category.productCount || 0} sản phẩm
                    </span>
                    <span className={`${styles.statusBadge} ${category.isActive ? styles.active : styles.inactive}`}>
                      {category.isActive ? 'Hiển thị' : 'Ẩn'}
                    </span>
                  </div>
                </div>
                <div className={styles.categoryActions}>
                  <button
                    className={styles.editBtn}
                    onClick={() => handleOpenModal('edit', category)}
                    title="Sửa"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteClick(category._id)}
                    title="Xóa"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Category Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              className={styles.modalOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
            >
              <motion.div
                className={styles.modal}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.modalHeader}>
                  <h2>{modalMode === 'create' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}</h2>
                  <button className={styles.closeBtn} onClick={handleCloseModal}>
                    <FiX />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalBody}>
                  <div className={styles.formGroup}>
                    <label>Tên danh mục *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="VD: Bánh kem"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Mô tả</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Mô tả ngắn về danh mục..."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Hình ảnh danh mục</label>
                    <div className={styles.imageUploadSection}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        className={styles.uploadBtn}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                      >
                        <FiUpload /> {uploadingImage ? 'Đang tải...' : 'Tải ảnh từ máy'}
                      </button>
                      <span className={styles.orText}>hoặc</span>
                      <input
                        type="text"
                        name="image"
                        value={formData.image}
                        onChange={handleInputChange}
                        placeholder="Nhập URL hình ảnh..."
                        className={styles.urlInput}
                      />
                    </div>
                    {formData.image && (
                      <div className={styles.imagePreviewContainer}>
                        <img src={formData.image} alt="Preview" className={styles.imagePreview} />
                        <button 
                          type="button" 
                          className={styles.removeImageBtn}
                          onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                        >
                          <FiX />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label>Icon (emoji hoặc tên icon)</label>
                    <input
                      type="text"
                      name="icon"
                      value={formData.icon}
                      onChange={handleInputChange}
                      placeholder="🎂 hoặc cake"
                    />
                  </div>

                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkbox}>
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                      />
                      <span>Hiển thị danh mục</span>
                    </label>
                  </div>

                  <div className={styles.modalActions}>
                    <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>
                      Hủy
                    </button>
                    <button type="submit" className={styles.primaryBtn}>
                      {modalMode === 'create' ? 'Tạo danh mục' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              className={styles.modalOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
            >
              <motion.div
                className={`${styles.modal} ${styles.confirmModal}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.confirmContent}>
                  <FiTrash2 className={styles.confirmIcon} />
                  <h3>Xác nhận xóa</h3>
                  <p>
                    Bạn có chắc chắn muốn xóa danh mục này? Tất cả sản phẩm trong danh mục sẽ không còn thuộc danh mục nào.
                  </p>
                  <div className={styles.confirmActions}>
                    <button
                      className={styles.cancelBtn}
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Hủy
                    </button>
                    <button className={styles.deleteConfirmBtn} onClick={handleConfirmDelete}>
                      Xóa
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default AdminCategories;
