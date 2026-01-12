import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiPlus, FiEdit2, FiCheck, FiTrash2, FiArrowRight,
  FiUploadCloud, FiImage, FiX, FiLayout, FiMonitor,
  FiSmartphone, FiEye, FiSave, FiAlertCircle, FiChevronRight
} from 'react-icons/fi';
import { AppDispatch, RootState } from '@/store';
import {
  fetchAllThemes,
  createTheme,
  updateTheme,
  activateTheme,
  deleteTheme,
} from '@/store/slices/themeSlice';
import AdminLayout from './AdminLayout';
import BannerGallery from './components/BannerGallery';
import styles from './Admin.module.scss';
import { IThemeConfig } from '@/types/theme.types';
import axiosClient from '@/services/axiosClient';
import { toast } from 'react-hot-toast';

// Theme type labels
const THEME_TYPES = {
  default: { label: 'Mặc định', color: '#3b82f6' },
  christmas: { label: 'Giáng sinh', color: '#ef4444' },
  tet: { label: 'Tết Nguyên Đán', color: '#f97316' },
  valentine: { label: 'Valentine', color: '#ec4899' },
};

const ThemeManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { themes, loading } = useSelector((state: RootState) => state.theme);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<Partial<IThemeConfig>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isDragging, setIsDragging] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bannerTab, setBannerTab] = useState<'upload' | 'library'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchAllThemes());
  }, [dispatch]);

  const handleEdit = (theme: IThemeConfig) => {
    setCurrentEdit(theme);
    setIsEditing(true);
  };

  const handleCreate = () => {
    setCurrentEdit({
      name: 'Giao diện mới',
      type: 'default',
      header: { variant: 'transparent' },
      hero: {
        title: "KL'élite Luxury Bakery",
        subtitle: "Experience the Taste of Elegance",
        ctaText: "Mua ngay",
        ctaLink: "/products",
        backgroundImage: "",
        overlayOpacity: 0.4
      }
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteTheme(id));
      toast.success('Đã xóa giao diện thành công!');
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('Xóa giao diện thất bại!');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await dispatch(activateTheme(id));
      toast.success('Đã kích hoạt giao diện!');
    } catch (error) {
      toast.error('Kích hoạt thất bại!');
    }
  };

  // Enhanced file upload with drag & drop
  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 10MB');
      return;
    }

    const formData = new FormData();
    formData.append('images', file);

    setUploading(true);
    setUploadProgress(0);

    try {
      const response = await axiosClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(percent);
        }
      });

      if (response.data && response.data[0]) {
        setCurrentEdit(prev => ({
          ...prev,
          hero: { ...prev.hero!, backgroundImage: response.data[0].url }
        }));
        toast.success('Tải ảnh lên thành công!');
      }
    } catch (error) {
      console.error('Upload failed', error);
      toast.error('Tải ảnh lên thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Drag & Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (currentEdit.id) {
        await dispatch(updateTheme({ id: currentEdit.id, data: currentEdit }));
        toast.success('Cập nhật giao diện thành công!');
      } else {
        await dispatch(createTheme(currentEdit));
        toast.success('Tạo giao diện mới thành công!');
      }
      setIsEditing(false);
    } catch (error) {
      toast.error('Lưu giao diện thất bại!');
    } finally {
      setSaving(false);
    }
  };

  const clearImage = () => {
    setCurrentEdit(prev => ({
      ...prev,
      hero: { ...prev.hero!, backgroundImage: '' }
    }));
  };

  // ===== EDITOR VIEW =====
  if (isEditing) {
    return (
      <AdminLayout title={currentEdit.id ? "Chỉnh sửa giao diện" : "Tạo giao diện mới"}>
        <div className={styles.editorContainer}>
          {/* Editor Header */}
          <div className={styles.editorHeader}>
            <div className={styles.editorHeaderLeft}>
              <button 
                type="button" 
                className={styles.btnBack}
                onClick={() => setIsEditing(false)}
              >
                <FiX /> Đóng
              </button>
              <div className={styles.editorTitle}>
                <FiLayout />
                <span>{currentEdit.id ? 'Chỉnh sửa' : 'Tạo mới'}: {currentEdit.name || 'Giao diện'}</span>
              </div>
            </div>
            <div className={styles.editorHeaderRight}>
              <div className={styles.previewToggle}>
                <button 
                  className={previewMode === 'desktop' ? styles.active : ''} 
                  onClick={() => setPreviewMode('desktop')}
                  title="Xem trên Desktop"
                >
                  <FiMonitor />
                </button>
                <button 
                  className={previewMode === 'mobile' ? styles.active : ''} 
                  onClick={() => setPreviewMode('mobile')}
                  title="Xem trên Mobile"
                >
                  <FiSmartphone />
                </button>
              </div>
              <button 
                type="button" 
                className={styles.btnSaveMain}
                onClick={handleSave}
                disabled={uploading || saving}
              >
                {saving ? 'Đang lưu...' : <><FiSave /> Lưu giao diện</>}
              </button>
            </div>
          </div>

          <div className={styles.editorBody}>
            {/* Left Panel - Form */}
            <div className={styles.editorPanel}>
              <form onSubmit={handleSave}>
                {/* Basic Info Section */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>1</span>
                    Thông tin cơ bản
                  </h3>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="themeName">Tên giao diện</label>
                    <input
                      id="themeName"
                      value={currentEdit.name || ''}
                      onChange={e => setCurrentEdit({ ...currentEdit, name: e.target.value })}
                      required
                      placeholder="VD: Spring Collection 2026"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="themeType">Loại giao diện</label>
                    <div className={styles.themeTypeGrid}>
                      {Object.entries(THEME_TYPES).map(([key, { label, color }]) => (
                        <button
                          key={key}
                          type="button"
                          className={`${styles.themeTypeOption} ${currentEdit.type === key ? styles.selected : ''}`}
                          onClick={() => setCurrentEdit({ ...currentEdit, type: key as IThemeConfig['type'] })}
                          style={{ '--theme-color': color } as React.CSSProperties}
                        >
                          <span className={styles.typeDot} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hero Content Section */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>2</span>
                    Nội dung Hero Banner
                  </h3>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="heroTitle">Tiêu đề chính</label>
                    <input
                      id="heroTitle"
                      value={currentEdit.hero?.title || ''}
                      onChange={e => setCurrentEdit({ 
                        ...currentEdit, 
                        hero: { ...currentEdit.hero!, title: e.target.value } 
                      })}
                      placeholder="VD: KL'élite Luxury Bakery"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="heroSubtitle">Phụ đề</label>
                    <input
                      id="heroSubtitle"
                      value={currentEdit.hero?.subtitle || ''}
                      onChange={e => setCurrentEdit({ 
                        ...currentEdit, 
                        hero: { ...currentEdit.hero!, subtitle: e.target.value } 
                      })}
                      placeholder="VD: Experience the Taste of Elegance"
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="ctaText">Nút CTA</label>
                      <input
                        id="ctaText"
                        value={currentEdit.hero?.ctaText || ''}
                        onChange={e => setCurrentEdit({ 
                          ...currentEdit, 
                          hero: { ...currentEdit.hero!, ctaText: e.target.value } 
                        })}
                        placeholder="VD: Mua ngay"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="ctaLink">Đường dẫn CTA</label>
                      <input
                        id="ctaLink"
                        value={currentEdit.hero?.ctaLink || ''}
                        onChange={e => setCurrentEdit({ 
                          ...currentEdit, 
                          hero: { ...currentEdit.hero!, ctaLink: e.target.value } 
                        })}
                        placeholder="VD: /products"
                      />
                    </div>
                  </div>
                </div>

                {/* Background Section */}
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>3</span>
                    Hình nền & Hiệu ứng
                  </h3>

                  {/* Banner Tabs */}
                  <div className={styles.formGroup}>
                    <label>Hình nền Banner</label>
                    <div className={styles.bannerTabs}>
                      <button
                        type="button"
                        className={`${styles.tabBtn} ${bannerTab === 'upload' ? styles.active : ''}`}
                        onClick={() => setBannerTab('upload')}
                      >
                        <FiUploadCloud /> Upload Mới
                      </button>
                      <button
                        type="button"
                        className={`${styles.tabBtn} ${bannerTab === 'library' ? styles.active : ''}`}
                        onClick={() => setBannerTab('library')}
                      >
                        <FiImage /> Thư viện
                      </button>
                    </div>

                    {/* Tab Content */}
                    {bannerTab === 'upload' ? (
                      <div
                        className={`${styles.uploadZone} ${isDragging ? styles.dragging : ''} ${currentEdit.hero?.backgroundImage ? styles.hasImage : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploading ? (
                          <div className={styles.uploadProgress}>
                            <div className={styles.progressBar}>
                              <div
                                className={styles.progressFill}
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <span>Đang tải lên... {uploadProgress}%</span>
                          </div>
                        ) : currentEdit.hero?.backgroundImage ? (
                          <div className={styles.uploadPreview}>
                            <img
                              src={currentEdit.hero.backgroundImage}
                              alt="Background preview"
                            />
                            <div className={styles.uploadOverlay}>
                              <button
                                type="button"
                                className={styles.btnChangeImage}
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                              >
                                <FiImage /> Đổi ảnh
                              </button>
                              <button
                                type="button"
                                className={styles.btnRemoveImage}
                                onClick={(e) => { e.stopPropagation(); clearImage(); }}
                              >
                                <FiTrash2 /> Xóa
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.uploadPlaceholder}>
                            <FiUploadCloud />
                            <span>Kéo thả ảnh vào đây hoặc click để chọn</span>
                            <small>PNG, JPG, WEBP (tối đa 10MB)</small>
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleImageUpload}
                          accept="image/*"
                          disabled={uploading}
                          hidden
                        />
                      </div>
                    ) : (
                      <BannerGallery
                        selectedImageUrl={currentEdit.hero?.backgroundImage || ''}
                        onSelectImage={(url) => {
                          setCurrentEdit(prev => ({
                            ...prev,
                            hero: { ...prev.hero!, backgroundImage: url }
                          }));
                        }}
                      />
                    )}
                  </div>

                  {/* Overlay Opacity Slider */}
                  <div className={styles.formGroup}>
                    <label htmlFor="overlayOpacity">
                      Độ tối nền: <strong>{Math.round((currentEdit.hero?.overlayOpacity ?? 0.4) * 100)}%</strong>
                    </label>
                    <input
                      id="overlayOpacity"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={currentEdit.hero?.overlayOpacity ?? 0.4}
                      onChange={e => setCurrentEdit({ 
                        ...currentEdit, 
                        hero: { ...currentEdit.hero!, overlayOpacity: Number(e.target.value) } 
                      })}
                      className={styles.rangeSlider}
                    />
                    <div className={styles.rangeLabels}>
                      <span>Sáng</span>
                      <span>Tối</span>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Panel - Preview */}
            <div className={styles.previewPanel}>
              <div className={styles.previewHeader}>
                <FiEye />
                <span>Xem trước trực tiếp</span>
              </div>
              <div className={`${styles.previewFrame} ${styles[previewMode]}`}>
                <div className={styles.heroPreview}>
                  <div className={styles.heroBg}>
                    <div 
                      className={styles.heroOverlay} 
                      style={{ opacity: currentEdit.hero?.overlayOpacity ?? 0.4 }} 
                    />
                    <img
                      src={currentEdit.hero?.backgroundImage || "https://images.unsplash.com/photo-1579306194872-64d3b7bac4c2?q=80&w=2057&auto=format&fit=crop"}
                      alt="Hero Background Preview"
                    />
                  </div>
                  <div className={styles.heroContent}>
                    <div className={styles.tagline}>
                      <div className={styles.line} />
                      <span>
                        {currentEdit.type === 'christmas' ? 'Merry Christmas' : 
                         currentEdit.type === 'tet' ? 'Chúc Mừng Năm Mới' :
                         currentEdit.type === 'valentine' ? "Happy Valentine's" :
                         'The Art of Luxury Pastry'}
                      </span>
                      <div className={styles.line} />
                    </div>
                    <h1>
                      <span className={styles.titleMain}>
                        {currentEdit.hero?.title || "KL'élite Luxury Bakery"}
                      </span>
                      <span className={styles.titleSub}>
                        {currentEdit.hero?.subtitle || "Experience the Taste of Elegance"}
                      </span>
                    </h1>
                    <button className={styles.ctaButton}>
                      {currentEdit.hero?.ctaText || "Mua ngay"} <FiArrowRight />
                    </button>
                  </div>
                </div>
              </div>
              <p className={styles.previewNote}>
                * Bản xem trước có thể khác đôi chút so với giao diện thực tế
              </p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ===== LIST VIEW =====
  return (
    <AdminLayout
      title="Quản lý Giao diện"
      subtitle="Tùy chỉnh Hero Banner và chủ đề theo mùa cho cửa hàng"
      actions={
        <button className={styles.btnPrimary} onClick={handleCreate}>
          <FiPlus /> Tạo giao diện mới
        </button>
      }
    >
      {/* Loading State */}
      {loading && themes.length === 0 && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Đang tải danh sách giao diện...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && themes.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <FiLayout />
          </div>
          <h3>Chưa có giao diện nào</h3>
          <p>Tạo giao diện đầu tiên để tùy chỉnh Hero Banner và chủ đề cho cửa hàng của bạn.</p>
          <button className={styles.btnPrimary} onClick={handleCreate}>
            <FiPlus /> Tạo giao diện đầu tiên
          </button>
        </div>
      )}

      {/* Theme Grid */}
      {themes.length > 0 && (
        <>
          {/* Stats Bar */}
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{themes.length}</span>
              <span className={styles.statLabel}>Tổng giao diện</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={`${styles.statNumber} ${styles.active}`}>
                {themes.filter(t => t.isActive).length}
              </span>
              <span className={styles.statLabel}>Đang hoạt động</span>
            </div>
          </div>

          {/* Theme Cards Grid */}
          <div className={styles.themeGrid}>
            {themes.map(theme => (
              <div 
                key={theme.id} 
                className={`${styles.themeCard} ${theme.isActive ? styles.active : ''}`}
              >
                {/* Card Preview */}
                <div 
                  className={styles.cardPreview} 
                  style={{ backgroundImage: `url(${theme.hero.backgroundImage || 'https://images.unsplash.com/photo-1579306194872-64d3b7bac4c2?q=80&w=2057&auto=format&fit=crop'})` }}
                >
                  {theme.isActive && (
                    <span className={styles.activeBadge}>
                      <FiCheck /> Đang sử dụng
                    </span>
                  )}
                  <div className={styles.cardOverlay}>
                    <div className={styles.previewContent}>
                      <span className={styles.previewTitle}>{theme.hero.title}</span>
                      <span className={styles.previewSubtitle}>{theme.hero.subtitle}</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className={styles.cardBody}>
                  <div className={styles.cardHeader}>
                    <h4>{theme.name}</h4>
                    <span 
                      className={styles.typeBadge}
                      style={{ 
                        '--badge-color': THEME_TYPES[theme.type]?.color || '#6b7280' 
                      } as React.CSSProperties}
                    >
                      {THEME_TYPES[theme.type]?.label || theme.type}
                    </span>
                  </div>
                  
                  <div className={styles.cardMeta}>
                    <span>Cập nhật: {new Date(theme.updatedAt).toLocaleDateString('vi-VN')}</span>
                  </div>

                  {/* Card Actions */}
                  <div className={styles.cardActions}>
                    {!theme.isActive && (
                      <button 
                        className={styles.btnActivate} 
                        onClick={() => handleActivate(theme.id)}
                      >
                        <FiCheck /> Kích hoạt
                      </button>
                    )}
                    <button 
                      className={styles.btnIconAction} 
                      onClick={() => handleEdit(theme)}
                      title="Chỉnh sửa"
                    >
                      <FiEdit2 />
                    </button>
                    {!theme.isActive && (
                      <>
                        {deleteConfirm === theme.id ? (
                          <div className={styles.deleteConfirm}>
                            <span>Xóa?</span>
                            <button 
                              className={styles.btnConfirmYes}
                              onClick={() => handleDelete(theme.id)}
                            >
                              Có
                            </button>
                            <button 
                              className={styles.btnConfirmNo}
                              onClick={() => setDeleteConfirm(null)}
                            >
                              Không
                            </button>
                          </div>
                        ) : (
                          <button 
                            className={`${styles.btnIconAction} ${styles.danger}`}
                            onClick={() => setDeleteConfirm(theme.id)}
                            title="Xóa"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default ThemeManager;
