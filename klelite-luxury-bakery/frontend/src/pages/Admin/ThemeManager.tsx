import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiPlus, FiEdit2, FiCheck, FiTrash2 } from 'react-icons/fi';
import { AppDispatch, RootState } from '@/store';
import {
  fetchAllThemes,
  createTheme,
  updateTheme,
  activateTheme,
  deleteTheme,
} from '@/store/slices/themeSlice';
import AdminLayout from './AdminLayout';
import styles from './ThemeManager.module.scss';
import { IThemeConfig } from '@/types/theme.types';
import axiosClient from '@/services/axiosClient';

const ThemeManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { themes, loading } = useSelector((state: RootState) => state.theme);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEdit, setCurrentEdit] = useState<Partial<IThemeConfig>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    dispatch(fetchAllThemes());
  }, [dispatch]);

  const handleEdit = (theme: IThemeConfig) => {
    setCurrentEdit(theme);
    setIsEditing(true);
  };

  const handleCreate = () => {
    setCurrentEdit({
      name: 'New Theme',
      type: 'default',
      header: { variant: 'transparent' },
      hero: {
        title: "KL'élite Luxury Bakery",
        subtitle: "Experience the Taste of Elegance",
        ctaText: "Shop Now",
        ctaLink: "/products",
        backgroundImage: "",
        overlayOpacity: 0.3
      }
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa giao diện này?')) {
      await dispatch(deleteTheme(id));
    }
  };

  const handleActivate = async (id: string) => {
    await dispatch(activateTheme(id));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('images', file); // API expects 'images' key

    setUploading(true);
    try {
      const response = await axiosClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Assuming response.data[0].url based on uploadService
      if (response.data && response.data[0]) {
        setCurrentEdit(prev => ({
            ...prev,
            hero: { ...prev.hero!, backgroundImage: response.data[0].url }
        }));
      }
    } catch (error) {
      console.error('Upload failed', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentEdit._id) {
      await dispatch(updateTheme({ id: currentEdit._id, data: currentEdit }));
    } else {
      await dispatch(createTheme(currentEdit));
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <AdminLayout title={currentEdit._id ? "Chỉnh sửa giao diện" : "Thêm giao diện mới"}>
        <div className={styles.formContainer}>
          <form onSubmit={handleSave}>
            <div className={styles.formGroup}>
              <label>Tên giao diện</label>
              <input
                value={currentEdit.name}
                onChange={e => setCurrentEdit({ ...currentEdit, name: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Loại giao diện (Theme Type)</label>
              <select
                value={currentEdit.type}
                onChange={e => setCurrentEdit({ ...currentEdit, type: e.target.value as any })}
              >
                <option value="default">Mặc định (Default)</option>
                <option value="christmas">Giáng sinh (Christmas)</option>
                <option value="tet">Tết Nguyên Đán</option>
                <option value="valentine">Valentine</option>
              </select>
            </div>

            <h3>Hero Banner</h3>
            <div className={styles.formGroup}>
              <label>Tiêu đề (Title)</label>
              <input
                value={currentEdit.hero?.title}
                onChange={e => setCurrentEdit({ ...currentEdit, hero: { ...currentEdit.hero!, title: e.target.value } })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Phụ đề (Subtitle)</label>
              <input
                value={currentEdit.hero?.subtitle}
                onChange={e => setCurrentEdit({ ...currentEdit, hero: { ...currentEdit.hero!, subtitle: e.target.value } })}
              />
            </div>
            <div className={styles.formRow}>
                <div className={styles.formGroup}>
                <label>Nút CTA (Text)</label>
                <input
                    value={currentEdit.hero?.ctaText}
                    onChange={e => setCurrentEdit({ ...currentEdit, hero: { ...currentEdit.hero!, ctaText: e.target.value } })}
                />
                </div>
                <div className={styles.formGroup}>
                <label>Liên kết CTA (Link)</label>
                <input
                    value={currentEdit.hero?.ctaLink}
                    onChange={e => setCurrentEdit({ ...currentEdit, hero: { ...currentEdit.hero!, ctaLink: e.target.value } })}
                />
                </div>
            </div>

            <div className={styles.formGroup}>
              <label>Hình nền (Background Image)</label>
              <div className={styles.imagePreview}>
                 {currentEdit.hero?.backgroundImage && (
                    <img src={currentEdit.hero.backgroundImage} alt="Preview" />
                 )}
              </div>
              <input type="file" onChange={handleImageUpload} accept="image/*" />
              {uploading && <p>Đang tải ảnh...</p>}
            </div>

            <div className={styles.formActions}>
                <button type="button" onClick={() => setIsEditing(false)} className={styles.btnCancel}>Hủy</button>
                <button type="submit" className={styles.btnSave} disabled={uploading}>Lưu thay đổi</button>
            </div>
          </form>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Quản lý Giao diện"
      subtitle="Tùy chỉnh Banner và Chủ đề theo mùa"
      actions={
        <button className={styles.btnAdd} onClick={handleCreate}>
          <FiPlus /> Thêm mới
        </button>
      }
    >
      <div className={styles.themeList}>
        {themes.map(theme => (
          <div key={theme._id} className={`${styles.themeCard} ${theme.isActive ? styles.active : ''}`}>
            <div className={styles.themePreview} style={{ backgroundImage: `url(${theme.hero.backgroundImage})` }}>
              {theme.isActive && <span className={styles.activeBadge}><FiCheck /> Đang dùng</span>}
              <div className={styles.themeOverlay}>
                 <h3>{theme.hero.title}</h3>
                 <p>{theme.hero.subtitle}</p>
              </div>
            </div>
            <div className={styles.themeInfo}>
              <div className={styles.themeHeader}>
                 <h4>{theme.name}</h4>
                 <span className={`${styles.themeType} ${styles[theme.type]}`}>{theme.type}</span>
              </div>
              <div className={styles.themeActions}>
                {!theme.isActive && (
                  <button className={styles.btnActivate} onClick={() => handleActivate(theme._id)}>
                    Kích hoạt
                  </button>
                )}
                <button className={styles.btnEdit} onClick={() => handleEdit(theme)}>
                  <FiEdit2 />
                </button>
                {!theme.isActive && (
                    <button className={styles.btnDelete} onClick={() => handleDelete(theme._id)}>
                    <FiTrash2 />
                    </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default ThemeManager;
