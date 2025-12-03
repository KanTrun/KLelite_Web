import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiX,
  FiUserPlus,
  FiLock,
  FiUnlock,
} from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import { adminUserService } from '../../services/userService';
import styles from './Admin.module.scss';
import { toast } from 'react-hot-toast';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'user' | 'manager' | 'admin';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  totalOrders?: number;
  totalSpent?: number;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'user' as 'user' | 'manager' | 'admin',
  });

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminUserService.getUsers(currentPage, 10);
      if (data.success) {
        setUsers(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        await adminUserService.deleteUser(userToDelete);
        toast.success('Xóa người dùng thành công!');
        setShowDeleteConfirm(false);
        setUserToDelete(null);
        fetchUsers();
      } catch (error) {
        toast.error('Không thể xóa người dùng');
      }
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await adminUserService.updateUser(userId, { role: newRole });
      toast.success('Cập nhật quyền thành công!');
      fetchUsers();
    } catch (error) {
      toast.error('Không thể cập nhật quyền');
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      await adminUserService.updateUser(userId, { isActive: !isActive });
      toast.success(isActive ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
      fetchUsers();
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái');
    }
  };

  const handleAddUser = async () => {
    try {
      await adminUserService.createUser(newUser);
      toast.success('Tạo người dùng thành công!');
      setShowAddModal(false);
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'user',
      });
      fetchUsers();
    } catch (error) {
      toast.error('Không thể tạo người dùng');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
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
            <h1>Quản lý người dùng</h1>
            <p>Xem và quản lý thông tin người dùng ({users.length} người dùng)</p>
          </div>
          <button className={styles.primaryBtn} onClick={() => setShowAddModal(true)}>
            <FiUserPlus /> Thêm người dùng
          </button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <FiSearch />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Tất cả vai trò</option>
            <option value="user">Khách hàng</option>
            <option value="manager">Quản lý</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Users Table */}
        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Điện thoại</th>
                <th>Vai trò</th>
                <th>Đơn hàng</th>
                <th>Tổng chi tiêu</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className={styles.loadingCell}>
                    <div className={styles.spinner}></div>
                    Đang tải...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.emptyCell}>
                    Không có người dùng nào
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.userAvatar}>
                          {user.firstName.charAt(0)}
                        </div>
                        <div>
                          <span className={styles.userName}>
                            {user.firstName} {user.lastName}
                          </span>
                          <span className={styles.userEmail}>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{user.phone || 'Chưa cập nhật'}</td>
                    <td>
                      <span className={`${styles.roleBadge} ${styles[user.role]}`}>
                        {user.role === 'admin'
                          ? 'Admin'
                          : user.role === 'manager'
                          ? 'Quản lý'
                          : 'Khách hàng'}
                      </span>
                    </td>
                    <td>{user.totalOrders || 0}</td>
                    <td>{formatCurrency(user.totalSpent || 0)}</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          user.isActive ? styles.active : styles.inactive
                        }`}
                      >
                        {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.viewBtn}
                          onClick={() => handleViewUser(user)}
                          title="Xem chi tiết"
                        >
                          <FiEye />
                        </button>
                        <button
                          className={styles.editBtn}
                          onClick={() => handleToggleStatus(user._id, user.isActive)}
                          title={user.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                        >
                          {user.isActive ? <FiLock /> : <FiUnlock />}
                        </button>
                        {user.role !== 'admin' && (
                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteClick(user._id)}
                            title="Xóa"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Trước
            </button>
            <span>Trang {currentPage} / {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Sau
            </button>
          </div>
        )}

        {/* User Detail Modal */}
        <AnimatePresence>
          {showModal && selectedUser && (
            <motion.div
              className={styles.modalOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            >
              <motion.div
                className={styles.modal}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.modalHeader}>
                  <h2>Thông tin người dùng</h2>
                  <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                    <FiX />
                  </button>
                </div>

                <div className={styles.modalBody}>
                  <div className={styles.orderDetail}>
                    <div className={styles.orderSection}>
                      <h3>Thông tin cá nhân</h3>
                      <div className={styles.orderInfo}>
                        <div className={styles.infoItem}>
                          <label>Họ tên</label>
                          <span>
                            {selectedUser.firstName} {selectedUser.lastName}
                          </span>
                        </div>
                        <div className={styles.infoItem}>
                          <label>Email</label>
                          <span>{selectedUser.email}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <label>Điện thoại</label>
                          <span>{selectedUser.phone || 'Chưa cập nhật'}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <label>Ngày đăng ký</label>
                          <span>{formatDate(selectedUser.createdAt)}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <label>Trạng thái</label>
                          <span className={`${styles.statusBadge} ${selectedUser.isActive ? styles.active : styles.inactive}`}>
                            {selectedUser.isActive ? 'Hoạt động' : 'Bị khóa'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.orderSection}>
                      <h3>Thống kê</h3>
                      <div className={styles.orderInfo}>
                        <div className={styles.infoItem}>
                          <label>Tổng đơn hàng</label>
                          <span>{selectedUser.totalOrders || 0}</span>
                        </div>
                        <div className={styles.infoItem}>
                          <label>Tổng chi tiêu</label>
                          <span>{formatCurrency(selectedUser.totalSpent || 0)}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.orderSection}>
                      <h3>Quyền truy cập</h3>
                      <div className={styles.formGroup}>
                        <label>Vai trò</label>
                        <select
                          className={styles.statusSelect}
                          value={selectedUser.role}
                          onChange={(e) => handleUpdateRole(selectedUser._id, e.target.value)}
                          disabled={selectedUser.role === 'admin'}
                        >
                          <option value="user">Khách hàng</option>
                          <option value="manager">Quản lý</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add User Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              className={styles.modalOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                className={styles.modal}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.modalHeader}>
                  <h2>Thêm người dùng mới</h2>
                  <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                    <FiX />
                  </button>
                </div>

                <div className={styles.modalBody}>
                  <div className={styles.formGroup}>
                    <label>Họ</label>
                    <input
                      type="text"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                      placeholder="Nhập họ..."
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Tên</label>
                    <input
                      type="text"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                      placeholder="Nhập tên..."
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="Nhập email..."
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Điện thoại</label>
                    <input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                      placeholder="Nhập số điện thoại..."
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Mật khẩu</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Nhập mật khẩu..."
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Vai trò</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'user' | 'manager' | 'admin' })}
                    >
                      <option value="user">Khách hàng</option>
                      <option value="manager">Quản lý</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className={styles.modalActions}>
                    <button className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>
                      Hủy
                    </button>
                    <button className={styles.primaryBtn} onClick={handleAddUser}>
                      Tạo người dùng
                    </button>
                  </div>
                </div>
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
                    Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.
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

export default AdminUsers;
