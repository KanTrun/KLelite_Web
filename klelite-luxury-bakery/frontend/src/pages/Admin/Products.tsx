import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiEye,
  FiStar,
  FiChevronLeft,
  FiChevronRight,
  FiImage,
} from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { fetchProducts, fetchCategories } from '@/store/slices/productSlice';
import { formatCurrency } from '@/utils/formatters';
import AdminLayout from './AdminLayout';
import { productService } from '@/services/productService';
import { toast } from 'react-hot-toast';
import styles from './Admin.module.scss';

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  comparePrice: number;
  category: string;
  sku: string;
  stock: number;
  isFeatured: boolean;
  isAvailable: boolean;
  images: { url: string; isMain: boolean }[];
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  comparePrice: 0,
  category: '',
  sku: '',
  stock: 0,
  isFeatured: false,
  isAvailable: true,
  images: [],
};

const AdminProducts: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { products, categories, pagination, isLoading } = useSelector(
    (state: RootState) => state.product
  );

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts({ page: currentPage, limit: 10 }));
    dispatch(fetchCategories());
  }, [dispatch, currentPage]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' ||
      (typeof product.category === 'object' && product.category.slug === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const handleOpenModal = (mode: 'create' | 'edit' | 'view', product?: any) => {
    setModalMode(mode);
    if (product) {
      setSelectedProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        comparePrice: product.comparePrice || 0,
        category: typeof product.category === 'object' ? product.category._id : product.category,
        sku: product.sku,
        stock: product.stock,
        isFeatured: product.isFeatured || false,
        isAvailable: product.isAvailable !== false,
        images: product.images || [],
      });
    } else {
      setSelectedProduct(null);
      setFormData(initialFormData);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setFormData(initialFormData);
    setImageUrl('');
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, { url: imageUrl.trim(), isMain: prev.images.length === 0 }],
      }));
      setImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSetMainImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({ ...img, isMain: i === index })),
    }));
  };

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      for (const file of Array.from(files)) {
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
          const filename = data.data?.filename || imgUrl.split('/').pop() || '';
          if (imgUrl) {
            setFormData((prev) => ({
              ...prev,
              images: [...prev.images, { 
                url: imgUrl, 
                publicId: filename,
                isMain: prev.images.length === 0 
              }],
            }));
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.message || 'Upload ảnh thất bại');
        }
      }
      toast.success('Upload ảnh thành công!');
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
        await productService.createProduct(formData);
        toast.success('Tạo sản phẩm thành công!');
      } else {
        await productService.updateProduct(selectedProduct._id, formData);
        toast.success('Cập nhật sản phẩm thành công!');
      }
      handleCloseModal();
      dispatch(fetchProducts({ page: currentPage, limit: 10 }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (productToDelete) {
      try {
        await productService.deleteProduct(productToDelete);
        toast.success('Xóa sản phẩm thành công!');
        setShowDeleteConfirm(false);
        setProductToDelete(null);
        dispatch(fetchProducts({ page: currentPage, limit: 10 }));
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Không thể xóa sản phẩm');
      }
    }
  };

  return (
    <AdminLayout>
      <div className={styles.pageContent}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1>Quản lý sản phẩm</h1>
            <p>Thêm, sửa, xóa sản phẩm trong cửa hàng ({products.length} sản phẩm)</p>
          </div>
          <button className={styles.primaryBtn} onClick={() => handleOpenModal('create')}>
            <FiPlus /> Thêm sản phẩm
          </button>
        </div>

      {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <FiSearch />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Products Table */}
        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Tồn kho</th>
                <th>Đánh giá</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className={styles.loadingCell}>
                    <div className={styles.spinner}></div>
                    Đang tải...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyCell}>
                    Không có sản phẩm nào
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className={styles.productCell}>
                        <img
                          src={product.mainImage || product.images?.[0]?.url || '/placeholder.png'}
                          alt={product.name}
                        />
                        <div>
                          <span className={styles.productName}>{product.name}</span>
                          <span className={styles.productSku}>SKU: {product.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {typeof product.category === 'object' ? product.category.name : 'N/A'}
                    </td>
                    <td>
                      <div className={styles.priceCell}>
                        <span className={styles.currentPrice}>{formatCurrency(product.price)}</span>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <span className={styles.oldPrice}>
                            {formatCurrency(product.comparePrice)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.stockBadge} ${
                          product.stock === 0
                            ? styles.outOfStock
                            : product.stock <= 10
                            ? styles.lowStock
                            : ''
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <div className={styles.ratingCell}>
                        <FiStar className={styles.starIcon} />
                        <span>{product.rating?.toFixed(1) || '0.0'}</span>
                        <span className={styles.reviewCount}>({product.numReviews || 0})</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          product.isAvailable !== false ? styles.active : styles.inactive
                        }`}
                      >
                        {product.isAvailable !== false ? 'Đang bán' : 'Tạm ẩn'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.viewBtn}
                          onClick={() => handleOpenModal('view', product)}
                          title="Xem"
                        >
                          <FiEye />
                        </button>
                        <button
                          className={styles.editBtn}
                          onClick={() => handleOpenModal('edit', product)}
                          title="Sửa"
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteClick(product._id)}
                          title="Xóa"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <FiChevronLeft /> Trước
            </button>
            <span>
              Trang {currentPage} / {pagination.totalPages}
            </span>
            <button
              disabled={currentPage === pagination.totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Sau <FiChevronRight />
            </button>
          </div>
        )}

        {/* Product Modal */}
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
                className={`${styles.modal} ${styles.largeModal}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.modalHeader}>
                  <h2>
                    {modalMode === 'create'
                      ? 'Thêm sản phẩm mới'
                      : modalMode === 'edit'
                      ? 'Chỉnh sửa sản phẩm'
                      : 'Chi tiết sản phẩm'}
                  </h2>
                  <button className={styles.closeBtn} onClick={handleCloseModal}>
                    <FiX />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.modalBody}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Tên sản phẩm *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        disabled={modalMode === 'view'}
                        placeholder="Nhập tên sản phẩm"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Mã SKU *</label>
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleInputChange}
                        required
                        disabled={modalMode === 'view'}
                        placeholder="VD: BSNCL001"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Danh mục *</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        disabled={modalMode === 'view'}
                      >
                        <option value="">Chọn danh mục</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Tồn kho *</label>
                      <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleInputChange}
                        required
                        min={0}
                        disabled={modalMode === 'view'}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Giá bán *</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                        min={0}
                        disabled={modalMode === 'view'}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Giá gốc (nếu có giảm giá)</label>
                      <input
                        type="number"
                        name="comparePrice"
                        value={formData.comparePrice}
                        onChange={handleInputChange}
                        min={0}
                        disabled={modalMode === 'view'}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Mô tả sản phẩm *</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      disabled={modalMode === 'view'}
                      placeholder="Mô tả chi tiết về sản phẩm..."
                    />
                  </div>

                  {/* Images Section */}
                  <div className={styles.formGroup}>
                    <label>Hình ảnh sản phẩm</label>
                    {modalMode !== 'view' && (
                      <div className={styles.imageUploadSection}>
                        {/* File Upload */}
                        <div className={styles.fileUpload}>
                          <input
                            type="file"
                            id="adminProductImageUpload"
                            accept="image/*"
                            multiple
                            onChange={handleFileUpload}
                            className={styles.fileInput}
                          />
                          <label htmlFor="adminProductImageUpload" className={styles.fileLabel}>
                            <FiImage />
                            {uploadingImage ? 'Đang upload...' : 'Tải ảnh từ máy'}
                          </label>
                        </div>
                        {/* URL Input */}
                        <div className={styles.urlUpload}>
                          <span className={styles.orText}>hoặc</span>
                          <div className={styles.imageInput}>
                            <input
                              type="text"
                              value={imageUrl}
                              onChange={(e) => setImageUrl(e.target.value)}
                              placeholder="Nhập URL hình ảnh..."
                            />
                            <button type="button" onClick={handleAddImage}>
                              <FiPlus /> Thêm
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className={styles.imageGrid}>
                      {formData.images.map((img, index) => (
                        <div
                          key={index}
                          className={`${styles.imageItem} ${img.isMain ? styles.mainImage : ''}`}
                        >
                          <img src={img.url} alt={`Product ${index + 1}`} />
                          {modalMode !== 'view' && (
                            <div className={styles.imageActions}>
                              <button
                                type="button"
                                onClick={() => handleSetMainImage(index)}
                                title="Đặt làm ảnh chính"
                              >
                                <FiStar />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                title="Xóa ảnh"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          )}
                          {img.isMain && <span className={styles.mainBadge}>Ảnh chính</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkbox}>
                      <input
                        type="checkbox"
                        name="isFeatured"
                        checked={formData.isFeatured}
                        onChange={handleCheckboxChange}
                        disabled={modalMode === 'view'}
                      />
                      <span>Sản phẩm nổi bật</span>
                    </label>
                    <label className={styles.checkbox}>
                      <input
                        type="checkbox"
                        name="isAvailable"
                        checked={formData.isAvailable}
                        onChange={handleCheckboxChange}
                        disabled={modalMode === 'view'}
                      />
                      <span>Đang bán</span>
                    </label>
                  </div>

                  {/* Actions */}
                  {modalMode !== 'view' && (
                    <div className={styles.modalActions}>
                      <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>
                        Hủy
                      </button>
                      <button type="submit" className={styles.primaryBtn}>
                        {modalMode === 'create' ? 'Tạo sản phẩm' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  )}
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
                  <p>Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác.</p>
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

export default AdminProducts;
