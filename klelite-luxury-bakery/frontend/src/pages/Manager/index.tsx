import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPackage,
  FiGrid,
  FiPlusCircle,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiImage,
  FiBox,
  FiTrendingUp,
  FiAlertCircle,
  FiX,
  FiStar,
} from 'react-icons/fi';
import { RootState, AppDispatch } from '@/store';
import { fetchProducts, fetchCategories } from '@/store/slices/productSlice';
import { productService, categoryService } from '@/services/productService';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'react-hot-toast';
import styles from './Manager.module.scss';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  productCount?: number;
}

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { products, categories: storeCategories, pagination, isLoading } = useSelector(
    (state: RootState) => state.product
  );
  
  const [activeSection, setActiveSection] = useState<'overview' | 'products' | 'categories'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedCategoryItem, setSelectedCategoryItem] = useState<Category | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'product' | 'category'>('product');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Product form
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    comparePrice: 0,
    category: '',
    sku: '',
    stock: 0,
    isFeatured: false,
    isAvailable: true,
    images: [] as { url: string; isMain: boolean }[],
  });
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);

  // Category form
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    image: '',
    isActive: true,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'MANAGER' && user?.role !== 'ADMIN') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    dispatch(fetchProducts({ page: currentPage, limit: 10 }));
    dispatch(fetchCategories());
    fetchCategoriesData();
  }, [dispatch, currentPage]);

  const fetchCategoriesData = async () => {
    setLoadingCategories(true);
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
    return null;
  }

  const stats = [
    {
      title: 'Tổng sản phẩm',
      value: pagination?.totalItems || products.length,
      icon: <FiPackage />,
      color: '#007bff',
      bgColor: 'rgba(0, 123, 255, 0.1)',
    },
    {
      title: 'Danh mục',
      value: categories.length,
      icon: <FiGrid />,
      color: '#28a745',
      bgColor: 'rgba(40, 167, 69, 0.1)',
    },
    {
      title: 'Sắp hết hàng',
      value: products.filter((p) => p.stock > 0 && p.stock <= 10).length,
      icon: <FiAlertCircle />,
      color: '#ffc107',
      bgColor: 'rgba(255, 193, 7, 0.1)',
    },
    {
      title: 'Hết hàng',
      value: products.filter((p) => p.stock === 0).length,
      icon: <FiBox />,
      color: '#dc3545',
      bgColor: 'rgba(220, 53, 69, 0.1)',
    },
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const categorySlug = typeof product.category === 'object' ? product.category.slug : product.category;
    const matchesCategory = selectedCategory === 'all' || categorySlug === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Product handlers
  const handleOpenProductModal = (mode: 'create' | 'edit' | 'view', product?: any) => {
    setModalMode(mode);
    if (product) {
      setSelectedProduct(product);
      setProductForm({
        name: product.name,
        description: product.description,
        price: product.price,
        comparePrice: product.comparePrice || 0,
        category: typeof product.category === 'object' ? product.category.id : product.category,
        sku: product.sku,
        stock: product.stock,
        isFeatured: product.isFeatured || false,
        isAvailable: product.isAvailable !== false,
        images: product.images || [],
      });
    } else {
      setSelectedProduct(null);
      setProductForm({
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
      });
    }
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await productService.createProduct(productForm);
        toast.success('Tạo sản phẩm thành công!');
      } else {
        await productService.updateProduct(selectedProduct.id, productForm);
        toast.success('Cập nhật sản phẩm thành công!');
      }
      setShowProductModal(false);
      dispatch(fetchProducts({ page: currentPage, limit: 10 }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // Category handlers
  const handleOpenCategoryModal = (mode: 'create' | 'edit', category?: Category) => {
    setModalMode(mode);
    if (category) {
      setSelectedCategoryItem(category);
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        image: category.image || '',
        isActive: category.isActive,
      });
    } else {
      setSelectedCategoryItem(null);
      setCategoryForm({
        name: '',
        description: '',
        image: '',
        isActive: true,
      });
    }
    setShowCategoryModal(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await categoryService.createCategory(categoryForm);
        toast.success('Tạo danh mục thành công!');
      } else if (selectedCategoryItem) {
        await categoryService.updateCategory(selectedCategoryItem.id, categoryForm);
        toast.success('Cập nhật danh mục thành công!');
      }
      setShowCategoryModal(false);
      fetchCategoriesData();
      dispatch(fetchCategories());
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  // Delete handlers
  const handleDeleteClick = (type: 'product' | 'category', id: string) => {
    setDeleteType(type);
    setItemToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (deleteType === 'product') {
        await productService.deleteProduct(itemToDelete);
        toast.success('Xóa sản phẩm thành công!');
        dispatch(fetchProducts({ page: currentPage, limit: 10 }));
      } else {
        await categoryService.deleteCategory(itemToDelete);
        toast.success('Xóa danh mục thành công!');
        fetchCategoriesData();
        dispatch(fetchCategories());
      }
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa');
    }
  };

  // Image handlers
  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setProductForm((prev) => ({
        ...prev,
        images: [...prev.images, { url: imageUrl.trim(), isMain: prev.images.length === 0 }],
      }));
      setImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setProductForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSetMainImage = (index: number) => {
    setProductForm((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({ ...img, isMain: i === index })),
    }));
  };

  // File upload handler for products
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const imageUrl = data.data?.url || data.url;
          if (imageUrl) {
            setProductForm((prev) => ({
              ...prev,
              images: [...prev.images, { url: imageUrl, isMain: prev.images.length === 0 }],
            }));
          }
        } else {
          toast.error('Upload ảnh thất bại');
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

  // File upload handler for categories
  const handleCategoryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCategoryImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.data?.url || data.url;
        if (imageUrl) {
          setCategoryForm((prev) => ({ ...prev, image: imageUrl }));
          toast.success('Upload ảnh thành công!');
        }
      } else {
        toast.error('Upload ảnh thất bại');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Có lỗi khi upload ảnh');
    } finally {
      setUploadingCategoryImage(false);
      e.target.value = '';
    }
  };

  return (
    <div className={styles.managerPage}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <Link to="/">
            KL'<span>élite</span>
          </Link>
          <span className={styles.managerBadge}>Manager</span>
        </div>

        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.navItem} ${activeSection === 'overview' ? styles.active : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            <FiTrendingUp />
            <span>Tổng quan</span>
          </button>
          <button
            className={`${styles.navItem} ${activeSection === 'products' ? styles.active : ''}`}
            onClick={() => setActiveSection('products')}
          >
            <FiPackage />
            <span>Sản phẩm</span>
          </button>
          <button
            className={`${styles.navItem} ${activeSection === 'categories' ? styles.active : ''}`}
            onClick={() => setActiveSection('categories')}
          >
            <FiGrid />
            <span>Danh mục</span>
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <Link to="/" className={styles.backToSite}>
            ← Về trang chủ
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.header}>
          <div>
            <h1>
              {activeSection === 'overview' && 'Tổng quan'}
              {activeSection === 'products' && 'Quản lý sản phẩm'}
              {activeSection === 'categories' && 'Quản lý danh mục'}
            </h1>
            <p>Xin chào, {user.firstName}!</p>
          </div>
          {activeSection === 'products' && (
            <button className={styles.addBtn} onClick={() => handleOpenProductModal('create')}>
              <FiPlusCircle /> Thêm sản phẩm
            </button>
          )}
          {activeSection === 'categories' && (
            <button className={styles.addBtn} onClick={() => handleOpenCategoryModal('create')}>
              <FiPlusCircle /> Thêm danh mục
            </button>
          )}
        </div>

        {/* Overview Section */}
        {activeSection === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Stats Grid */}
            <div className={styles.statsGrid}>
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  className={styles.statCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div
                    className={styles.statIcon}
                    style={{ background: stat.bgColor, color: stat.color }}
                  >
                    {stat.icon}
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statLabel}>{stat.title}</span>
                    <span className={styles.statValue}>{stat.value}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
              <h2>Thao tác nhanh</h2>
              <div className={styles.actionGrid}>
                <button
                  className={styles.actionCard}
                  onClick={() => handleOpenProductModal('create')}
                >
                  <FiPlusCircle />
                  <span>Thêm sản phẩm mới</span>
                </button>
                <button
                  className={styles.actionCard}
                  onClick={() => handleOpenCategoryModal('create')}
                >
                  <FiGrid />
                  <span>Thêm danh mục mới</span>
                </button>
                <button
                  className={styles.actionCard}
                  onClick={() => setActiveSection('products')}
                >
                  <FiPackage />
                  <span>Quản lý sản phẩm</span>
                </button>
                <button
                  className={styles.actionCard}
                  onClick={() => setActiveSection('categories')}
                >
                  <FiGrid />
                  <span>Quản lý danh mục</span>
                </button>
              </div>
            </div>

            {/* Low Stock Alert */}
            <div className={styles.alertSection}>
              <h2>
                <FiAlertCircle /> Cảnh báo tồn kho
              </h2>
              <div className={styles.alertList}>
                {products
                  .filter((p) => p.stock <= 10)
                  .map((product) => (
                    <div key={product.id} className={styles.alertItem}>
                      <img 
                        src={product.mainImage || product.images?.[0]?.url || '/placeholder.png'} 
                        alt={product.name} 
                      />
                      <div className={styles.alertInfo}>
                        <h4>{product.name}</h4>
                        <p>
                          Còn lại:{' '}
                          <span className={product.stock === 0 ? styles.outOfStock : styles.lowStock}>
                            {product.stock} sản phẩm
                          </span>
                        </p>
                      </div>
                      <button 
                        className={styles.updateStockBtn}
                        onClick={() => handleOpenProductModal('edit', product)}
                      >
                        Cập nhật
                      </button>
                    </div>
                  ))}
                {products.filter((p) => p.stock <= 10).length === 0 && (
                  <p className={styles.noAlert}>Không có sản phẩm nào sắp hết hàng</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Products Section */}
        {activeSection === 'products' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
                className={styles.categoryFilter}
              >
                <option value="all">Tất cả danh mục</option>
                {storeCategories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Products Table */}
            <div className={styles.tableWrapper}>
              <table className={styles.productsTable}>
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
                      <td colSpan={7} className={styles.loadingCell}>Đang tải...</td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={styles.emptyCell}>Không có sản phẩm nào</td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td className={styles.productCell}>
                          <img 
                            src={product.mainImage || product.images?.[0]?.url || '/placeholder.png'} 
                            alt={product.name} 
                          />
                          <div>
                            <span className={styles.productName}>{product.name}</span>
                            {product.isFeatured && (
                              <span className={styles.featuredBadge}>Nổi bật</span>
                            )}
                          </div>
                        </td>
                        <td>
                          {typeof product.category === 'object' ? product.category.name : 'N/A'}
                        </td>
                        <td className={styles.price}>{formatCurrency(product.price)}</td>
                        <td>
                          <span
                            className={`${styles.stock} ${
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
                            <span>{product.rating ? Number(product.rating).toFixed(1) : '0.0'}</span>
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
                        <td className={styles.actions}>
                          <button 
                            className={styles.viewBtn} 
                            title="Xem"
                            onClick={() => handleOpenProductModal('view', product)}
                          >
                            <FiEye />
                          </button>
                          <button 
                            className={styles.editBtn} 
                            title="Sửa"
                            onClick={() => handleOpenProductModal('edit', product)}
                          >
                            <FiEdit2 />
                          </button>
                          <button 
                            className={styles.deleteBtn} 
                            title="Xóa"
                            onClick={() => handleDeleteClick('product', product.id)}
                          >
                            <FiTrash2 />
                          </button>
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
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <FiChevronLeft />
                </button>
                <span>
                  Trang {currentPage} / {pagination.totalPages}
                </span>
                <button 
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <FiChevronRight />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Categories Section */}
        {activeSection === 'categories' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {loadingCategories ? (
              <div className={styles.loadingState}>Đang tải danh mục...</div>
            ) : (
              <div className={styles.categoriesGrid}>
                {categories.map((category) => (
                  <div key={category.id} className={styles.categoryCard}>
                    <div className={styles.categoryImage}>
                      {category.image ? (
                        <img src={category.image} alt={category.name} />
                      ) : (
                        <div className={styles.categoryIcon}>
                          <FiGrid />
                        </div>
                      )}
                    </div>
                    <div className={styles.categoryInfo}>
                      <h3>{category.name}</h3>
                      {category.description && <p>{category.description}</p>}
                      <span className={styles.productCount}>{category.productCount || 0} sản phẩm</span>
                    </div>
                    <div className={styles.categoryActions}>
                      <button 
                        className={styles.editBtn}
                        onClick={() => handleOpenCategoryModal('edit', category)}
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteClick('category', category.id)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProductModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>
                  {modalMode === 'create' ? 'Thêm sản phẩm' : modalMode === 'edit' ? 'Sửa sản phẩm' : 'Chi tiết sản phẩm'}
                </h2>
                <button className={styles.closeBtn} onClick={() => setShowProductModal(false)}>
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleProductSubmit} className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Tên sản phẩm *</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                      disabled={modalMode === 'view'}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Mã SKU *</label>
                    <input
                      type="text"
                      value={productForm.sku}
                      onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                      required
                      disabled={modalMode === 'view'}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Danh mục *</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                      required
                      disabled={modalMode === 'view'}
                    >
                      <option value="">Chọn danh mục</option>
                      {storeCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Tồn kho *</label>
                    <input
                      type="number"
                      value={productForm.stock}
                      onChange={(e) => setProductForm(prev => ({ ...prev, stock: Number(e.target.value) }))}
                      required
                      min={0}
                      disabled={modalMode === 'view'}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Giá bán *</label>
                    <input
                      type="number"
                      value={productForm.price}
                      onChange={(e) => setProductForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                      required
                      min={0}
                      disabled={modalMode === 'view'}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Giá gốc</label>
                    <input
                      type="number"
                      value={productForm.comparePrice}
                      onChange={(e) => setProductForm(prev => ({ ...prev, comparePrice: Number(e.target.value) }))}
                      min={0}
                      disabled={modalMode === 'view'}
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Mô tả *</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    required
                    rows={3}
                    disabled={modalMode === 'view'}
                  />
                </div>
                {modalMode !== 'view' && (
                  <div className={styles.formGroup}>
                    <label>Hình ảnh</label>
                    <div className={styles.imageUploadSection}>
                      {/* File Upload */}
                      <div className={styles.fileUpload}>
                        <input
                          type="file"
                          id="productImageUpload"
                          accept="image/*"
                          multiple
                          onChange={handleFileUpload}
                          className={styles.fileInput}
                        />
                        <label htmlFor="productImageUpload" className={styles.fileLabel}>
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
                          <button type="button" onClick={handleAddImage}>Thêm</button>
                        </div>
                      </div>
                    </div>
                    <div className={styles.imageGrid}>
                      {productForm.images.map((img, index) => (
                        <div key={index} className={`${styles.imageItem} ${img.isMain ? styles.mainImage : ''}`}>
                          <img src={img.url} alt="" />
                          <div className={styles.imageActions}>
                            <button type="button" onClick={() => handleSetMainImage(index)}><FiStar /></button>
                            <button type="button" onClick={() => handleRemoveImage(index)}><FiTrash2 /></button>
                          </div>
                          {img.isMain && <span className={styles.mainBadge}>Chính</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={productForm.isFeatured}
                      onChange={(e) => setProductForm(prev => ({ ...prev, isFeatured: e.target.checked }))}
                      disabled={modalMode === 'view'}
                    />
                    <span>Sản phẩm nổi bật</span>
                  </label>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={productForm.isAvailable}
                      onChange={(e) => setProductForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                      disabled={modalMode === 'view'}
                    />
                    <span>Đang bán</span>
                  </label>
                </div>
                {modalMode !== 'view' && (
                  <div className={styles.modalActions}>
                    <button type="button" className={styles.cancelBtn} onClick={() => setShowProductModal(false)}>
                      Hủy
                    </button>
                    <button type="submit" className={styles.submitBtn}>
                      {modalMode === 'create' ? 'Tạo sản phẩm' : 'Lưu thay đổi'}
                    </button>
                  </div>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {showCategoryModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCategoryModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h2>{modalMode === 'create' ? 'Thêm danh mục' : 'Sửa danh mục'}</h2>
                <button className={styles.closeBtn} onClick={() => setShowCategoryModal(false)}>
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleCategorySubmit} className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Tên danh mục *</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Mô tả</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Hình ảnh danh mục</label>
                  <div className={styles.imageUploadSection}>
                    {/* File Upload */}
                    <div className={styles.fileUpload}>
                      <input
                        type="file"
                        id="categoryImageUpload"
                        accept="image/*"
                        onChange={handleCategoryFileUpload}
                        className={styles.fileInput}
                      />
                      <label htmlFor="categoryImageUpload" className={styles.fileLabel}>
                        <FiImage />
                        {uploadingCategoryImage ? 'Đang upload...' : 'Tải ảnh từ máy'}
                      </label>
                    </div>
                    {/* URL Input */}
                    <div className={styles.urlUpload}>
                      <span className={styles.orText}>hoặc</span>
                      <input
                        type="text"
                        value={categoryForm.image}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, image: e.target.value }))}
                        placeholder="Nhập URL hình ảnh..."
                        className={styles.urlInput}
                      />
                    </div>
                  </div>
                  {categoryForm.image && (
                    <div className={styles.categoryImagePreview}>
                      <img src={categoryForm.image} alt="Preview" />
                      <button 
                        type="button" 
                        onClick={() => setCategoryForm(prev => ({ ...prev, image: '' }))}
                        className={styles.removePreview}
                      >
                        <FiX />
                      </button>
                    </div>
                  )}
                </div>
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={categoryForm.isActive}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    <span>Hiển thị danh mục</span>
                  </label>
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setShowCategoryModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className={styles.submitBtn}>
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
                  Bạn có chắc chắn muốn xóa {deleteType === 'product' ? 'sản phẩm' : 'danh mục'} này?
                </p>
                <div className={styles.confirmActions}>
                  <button className={styles.cancelBtn} onClick={() => setShowDeleteConfirm(false)}>
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
  );
};

export default ManagerDashboard;