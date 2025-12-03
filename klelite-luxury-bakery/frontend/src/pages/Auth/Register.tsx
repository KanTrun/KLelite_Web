import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiPhone, FiEye, FiEyeOff, FiArrowRight, FiCheck } from 'react-icons/fi';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { register, googleLogin, clearError } from '@/store/slices/authSlice';
import { AppDispatch, RootState } from '@/store';
import styles from './Auth.module.scss';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptTerms, setAcceptTerms] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Handle Google Login Success
  const handleGoogleSuccess = (response: CredentialResponse) => {
    if (response.credential) {
      dispatch(googleLogin(response.credential));
    }
  };

  // Handle Google Login Error
  const handleGoogleError = () => {
    console.error('Google login failed');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Vui lòng nhập tên';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Vui lòng nhập họ';
    }

    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (formData.phone && !/^(0|\+84)[0-9]{9}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    if (!acceptTerms) {
      newErrors.terms = 'Vui lòng đồng ý với điều khoản sử dụng';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const { confirmPassword, ...registerData } = formData;
    dispatch(register(registerData));
  };

  const passwordStrength = () => {
    const password = formData.password;
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getStrengthColor = () => {
    const strength = passwordStrength();
    if (strength <= 2) return '#dc3545';
    if (strength <= 3) return '#ffc107';
    return '#28a745';
  };

  const getStrengthLabel = () => {
    const strength = passwordStrength();
    if (strength <= 2) return 'Yếu';
    if (strength <= 3) return 'Trung bình';
    return 'Mạnh';
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authContainer}>
        {/* Left Side - Image/Branding */}
        <div className={styles.authBranding}>
          <div className={styles.brandingOverlay} />
          <img
            src="https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=1200"
            alt="KL'élite Bakery"
            className={styles.brandingImage}
          />
          <div className={styles.brandingContent}>
            <h2>Gia nhập KL'élite Club!</h2>
            <p>
              Đăng ký để trở thành thành viên và nhận ngay ưu đãi 
              giảm 15% cho đơn hàng đầu tiên.
            </p>
            <div className={styles.brandingFeatures}>
              <div className={styles.feature}>
                <FiCheck />
                <span>Tích điểm đổi quà</span>
              </div>
              <div className={styles.feature}>
                <FiCheck />
                <span>Ưu đãi sinh nhật đặc biệt</span>
              </div>
              <div className={styles.feature}>
                <FiCheck />
                <span>Truy cập sản phẩm độc quyền</span>
              </div>
              <div className={styles.feature}>
                <FiCheck />
                <span>Thông báo khuyến mãi sớm nhất</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <motion.div 
          className={styles.authForm}
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: { staggerChildren: 0.08 },
            },
          }}
        >
          <motion.div className={styles.formHeader} variants={fadeInUp}>
            <Link to="/" className={styles.logo}>
              KL'<span>élite</span>
            </Link>
            <h1>Tạo tài khoản</h1>
            <p>Chỉ mất 2 phút để đăng ký</p>
          </motion.div>

          {error && (
            <motion.div 
              className={styles.errorAlert}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <motion.form onSubmit={handleSubmit} variants={fadeInUp}>
            <div className={styles.inputRow}>
              <div className={`${styles.inputGroup} ${errors.lastName ? styles.hasError : ''}`}>
                <label htmlFor="lastName">Họ</label>
                <div className={styles.inputWrapper}>
                  <FiUser className={styles.inputIcon} />
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Nguyễn"
                    autoComplete="family-name"
                  />
                </div>
                {errors.lastName && <span className={styles.errorText}>{errors.lastName}</span>}
              </div>

              <div className={`${styles.inputGroup} ${errors.firstName ? styles.hasError : ''}`}>
                <label htmlFor="firstName">Tên</label>
                <div className={styles.inputWrapper}>
                  <FiUser className={styles.inputIcon} />
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Văn A"
                    autoComplete="given-name"
                  />
                </div>
                {errors.firstName && <span className={styles.errorText}>{errors.firstName}</span>}
              </div>
            </div>

            <div className={`${styles.inputGroup} ${errors.email ? styles.hasError : ''}`}>
              <label htmlFor="email">Email</label>
              <div className={styles.inputWrapper}>
                <FiMail className={styles.inputIcon} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className={styles.errorText}>{errors.email}</span>}
            </div>

            <div className={`${styles.inputGroup} ${errors.phone ? styles.hasError : ''}`}>
              <label htmlFor="phone">Số điện thoại (tùy chọn)</label>
              <div className={styles.inputWrapper}>
                <FiPhone className={styles.inputIcon} />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0912 345 678"
                  autoComplete="tel"
                />
              </div>
              {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
            </div>

            <div className={`${styles.inputGroup} ${errors.password ? styles.hasError : ''}`}>
              <label htmlFor="password">Mật khẩu</label>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Tối thiểu 6 ký tự"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {formData.password && (
                <div className={styles.passwordStrength}>
                  <div 
                    className={styles.strengthBar} 
                    style={{ 
                      width: `${(passwordStrength() / 5) * 100}%`,
                      backgroundColor: getStrengthColor()
                    }}
                  />
                  <span style={{ color: getStrengthColor() }}>{getStrengthLabel()}</span>
                </div>
              )}
              {errors.password && <span className={styles.errorText}>{errors.password}</span>}
            </div>

            <div className={`${styles.inputGroup} ${errors.confirmPassword ? styles.hasError : ''}`}>
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.inputIcon} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
            </div>

            <div className={`${styles.termsGroup} ${errors.terms ? styles.hasError : ''}`}>
              <label className={styles.checkbox}>
                <input 
                  type="checkbox" 
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }));
                  }}
                />
                <span>
                  Tôi đồng ý với{' '}
                  <Link to="/terms" target="_blank">Điều khoản sử dụng</Link>
                  {' '}và{' '}
                  <Link to="/privacy" target="_blank">Chính sách bảo mật</Link>
                </span>
              </label>
              {errors.terms && <span className={styles.errorText}>{errors.terms}</span>}
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className={styles.loadingSpinner} />
              ) : (
                <>
                  Đăng ký
                  <FiArrowRight />
                </>
              )}
            </button>
          </motion.form>

          <motion.div className={styles.formDivider} variants={fadeInUp}>
            <span>hoặc</span>
          </motion.div>

          <motion.div className={styles.socialLogin} variants={fadeInUp}>
            <div className={styles.googleLoginWrapper}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="outline"
                size="large"
                text="signup_with"
                shape="rectangular"
                width="100%"
              />
            </div>
          </motion.div>

          <motion.p className={styles.formFooter} variants={fadeInUp}>
            Đã có tài khoản?{' '}
            <Link to="/login">Đăng nhập</Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
