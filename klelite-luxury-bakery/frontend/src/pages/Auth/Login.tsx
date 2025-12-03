import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { login, googleLogin, clearError } from '@/store/slices/authSlice';
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

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
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

    dispatch(login(formData));
  };

  const handleGoogleSuccess = (response: CredentialResponse) => {
    if (response.credential) {
      dispatch(googleLogin(response.credential));
    }
  };

  const handleGoogleError = () => {
    setErrors({ ...errors, general: 'Đăng nhập Google thất bại. Vui lòng thử lại.' });
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authContainer}>
        {/* Left Side - Image/Branding */}
        <div className={styles.authBranding}>
          <div className={styles.brandingOverlay} />
          <img
            src="https://images.unsplash.com/photo-1517433670267-30f41c09c0a0?w=1200"
            alt="KL'élite Bakery"
            className={styles.brandingImage}
          />
          <div className={styles.brandingContent}>
            <h2>Chào mừng trở lại!</h2>
            <p>
              Đăng nhập để khám phá những chiếc bánh thủ công cao cấp 
              và trải nghiệm dịch vụ đặc biệt dành riêng cho bạn.
            </p>
            <div className={styles.brandingFeatures}>
              <div className={styles.feature}>
                <span>✨</span>
                <span>Ưu đãi thành viên độc quyền</span>
              </div>
              <div className={styles.feature}>
                <span>🎂</span>
                <span>Theo dõi đơn hàng dễ dàng</span>
              </div>
              <div className={styles.feature}>
                <span>💝</span>
                <span>Lưu sản phẩm yêu thích</span>
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
              transition: { staggerChildren: 0.1 },
            },
          }}
        >
          <motion.div className={styles.formHeader} variants={fadeInUp}>
            <Link to="/" className={styles.logo}>
              KL'<span>élite</span>
            </Link>
            <h1>Đăng nhập</h1>
            <p>Vui lòng nhập thông tin tài khoản của bạn</p>
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

          <motion.form onSubmit={handleSubmit} variants={fadeInUp} autoComplete="off">
            <div className={`${styles.inputGroup} ${errors.email ? styles.hasError : ''}`}>
              <label htmlFor="klelite-email">Email</label>
              <div className={styles.inputWrapper}>
                <FiMail className={styles.inputIcon} />
                <input
                  type="text"
                  id="klelite-email"
                  name="klelite-email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Nhập email của bạn"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  data-lpignore="true"
                  data-form-type="other"
                />
              </div>
              {errors.email && <span className={styles.errorText}>{errors.email}</span>}
            </div>

            <div className={`${styles.inputGroup} ${errors.password ? styles.hasError : ''}`}>
              <label htmlFor="klelite-pass">Mật khẩu</label>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="klelite-pass"
                  name="klelite-pass"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Nhập mật khẩu"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
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
              {errors.password && <span className={styles.errorText}>{errors.password}</span>}
            </div>

            <div className={styles.formOptions}>
              <label className={styles.checkbox}>
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/forgot-password" className={styles.forgotLink}>
                Quên mật khẩu?
              </Link>
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
                  Đăng nhập
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
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                logo_alignment="left"
                width="100%"
              />
            </div>
          </motion.div>

          <motion.p className={styles.formFooter} variants={fadeInUp}>
            Chưa có tài khoản?{' '}
            <Link to="/register">Đăng ký ngay</Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
