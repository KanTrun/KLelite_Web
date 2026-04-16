import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield, FiGift, FiHeart } from 'react-icons/fi';
import { GoogleLogin, GoogleOAuthProvider, CredentialResponse } from '@react-oauth/google';
import { login, googleLogin, clearError } from '@/store/slices/authSlice';
import { AppDispatch, RootState } from '@/store';
import { config } from '@/config/config';
import styles from './Auth.module.scss';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.5, 
      ease: [0.25, 0.46, 0.45, 0.94] 
    },
  },
};

const floatVariants = {
  initial: { y: 0 },
  animate: {
    y: [-8, 8, -8],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

const shimmerVariants = {
  animate: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

// Floating particles component
const FloatingParticles = React.memo(() => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 15 + 10,
    delay: Math.random() * 5,
    left: Math.random() * 100,
    opacity: Math.random() * 0.5 + 0.1,
  }));

  return (
    <div className={styles.particlesContainer}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={styles.particle}
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.left}%`,
            opacity: particle.opacity,
          }}
          animate={{
            y: [0, -1000],
            opacity: [particle.opacity, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
});

FloatingParticles.displayName = 'FloatingParticles';

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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  const validateForm = useCallback((): boolean => {
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
  }, [formData]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name === 'klelite-email' ? 'email' : name === 'klelite-pass' ? 'password' : name;
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: '' }));
    }
  }, [errors]);

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
    setErrors((prev) => ({ ...prev, general: 'Đăng nhập Google thất bại. Vui lòng thử lại.' }));
  };

  const handleGooglePopupError = () => {
    setErrors((prev) => ({
      ...prev,
      general: 'Không thể mở cửa sổ Google. Vui lòng tắt chặn popup và thử lại.',
    }));
  };

  const features = [
    { icon: FiShield, text: 'Bảo mật tối đa' },
    { icon: FiGift, text: 'Ưu đãi độc quyền' },
    { icon: FiHeart, text: 'Lưu sản phẩm yêu thích' },
  ];

  return (
    <div className={styles.authPage}>
      {/* Animated background */}
      <div className={styles.animatedBackground}>
        <div className={styles.gradientOrb1} />
        <div className={styles.gradientOrb2} />
        <div className={styles.gradientOrb3} />
      </div>

      <div className={styles.authContainer}>
        {/* Left Side - Premium Branding */}
        <motion.div 
          className={styles.authBranding}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <FloatingParticles />
          
          <div className={styles.brandingOverlay} />
          
          <motion.img
            src="https://images.unsplash.com/photo-1517433670267-30f41c09c0a0?w=1200&q=90"
            alt="KL'élite Bakery"
            className={styles.brandingImage}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          <div className={styles.brandingContent}>
            <motion.div 
              className={styles.royalBadge}
              variants={floatVariants}
              initial="initial"
              animate="animate"
            >
              <span className={styles.crownIcon}>👑</span>
              <span>Royal Collection</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Chào mừng trở lại!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Đăng nhập để khám phá những chiếc bánh thủ công cao cấp 
              và trải nghiệm dịch vụ hoàng gia dành riêng cho bạn.
            </motion.p>

            <motion.div 
              className={styles.brandingFeatures}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  className={styles.feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <div className={styles.featureIcon}>
                    <feature.icon />
                  </div>
                  <span>{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>

            <motion.div 
              className={styles.trustBadges}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <span>✓ SSL Bảo mật</span>
              <span>✓ Thanh toán an toàn</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div 
          className={styles.authForm}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className={styles.formGlassCard}>
            <motion.div className={styles.formHeader} variants={itemVariants}>
              <Link to="/" className={styles.logo}>
                <motion.span 
                  className={styles.logoText}
                  variants={shimmerVariants}
                  animate="animate"
                >
                  KL'<span className={styles.logoAccent}>élite</span>
                </motion.span>
              </Link>
              <h1>Đăng nhập</h1>
              <p>Vui lòng nhập thông tin tài khoản của bạn</p>
            </motion.div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  className={styles.errorAlert}
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className={styles.errorIcon}>⚠</span>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.form onSubmit={handleSubmit} variants={itemVariants} autoComplete="off">
              <motion.div 
                className={`${styles.inputGroup} ${errors.email ? styles.hasError : ''} ${focusedField === 'email' ? styles.focused : ''}`}
                variants={itemVariants}
              >
                <label htmlFor="klelite-email">Email</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <FiMail />
                  </span>
                  <input
                    type="text"
                    id="klelite-email"
                    name="klelite-email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Nhập email của bạn"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    data-lpignore="true"
                    data-form-type="other"
                  />
                  <div className={styles.inputGlow} />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.span 
                      className={styles.errorText}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      {errors.email}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div 
                className={`${styles.inputGroup} ${errors.password ? styles.hasError : ''} ${focusedField === 'password' ? styles.focused : ''}`}
                variants={itemVariants}
              >
                <label htmlFor="klelite-pass">Mật khẩu</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <FiLock />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="klelite-pass"
                    name="klelite-pass"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
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
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                  <div className={styles.inputGlow} />
                </div>
                <AnimatePresence>
                  {errors.password && (
                    <motion.span 
                      className={styles.errorText}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      {errors.password}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div className={styles.formOptions} variants={itemVariants}>
                <label className={styles.checkbox}>
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className={styles.checkboxCustom} />
                  <span className={styles.checkboxLabel}>Ghi nhớ đăng nhập</span>
                </label>
                <Link to="/forgot-password" className={styles.forgotLink}>
                  Quên mật khẩu?
                </Link>
              </motion.div>

              <motion.button
                type="submit"
                className={styles.submitBtn}
                disabled={isLoading}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <span className={styles.loadingSpinner} />
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <FiArrowRight className={styles.btnIcon} />
                  </>
                )}
                <div className={styles.btnShine} />
              </motion.button>
            </motion.form>

            <motion.div className={styles.formDivider} variants={itemVariants}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerText}>hoặc</span>
              <span className={styles.dividerLine} />
            </motion.div>

            <motion.div className={styles.socialLogin} variants={itemVariants}>
              <div className={styles.googleLoginWrapper}>
                <GoogleOAuthProvider clientId={config.googleClientId}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    onNonOAuthError={handleGooglePopupError}
                    theme="outline"
                    size="large"
                    text="signin_with"
                    shape="rectangular"
                    logo_alignment="left"
                    width="350"
                  />
                </GoogleOAuthProvider>
              </div>
            </motion.div>

            <motion.p className={styles.formFooter} variants={itemVariants}>
              Chưa có tài khoản?{' '}
              <Link to="/register" className={styles.footerLink}>
                Đăng ký ngay
                <span className={styles.linkArrow}>→</span>
              </Link>
            </motion.p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
