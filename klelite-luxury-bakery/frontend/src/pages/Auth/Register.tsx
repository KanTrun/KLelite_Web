import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiPhone, FiEye, FiEyeOff, FiArrowRight, FiCheck, FiAward, FiStar, FiTrendingUp } from 'react-icons/fi';
import { register, clearError } from '@/store/slices/authSlice';
import { AppDispatch, RootState } from '@/store';
import styles from './Auth.module.scss';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
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
  const [focusedField, setFocusedField] = useState<string | null>(null);

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

  const validateForm = useCallback((): boolean => {
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
  }, [formData, acceptTerms]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Map custom field names back to state keys
    let fieldName = name;
    if (name === 'klelite-email') fieldName = 'email';
    else if (name === 'klelite-pass') fieldName = 'password';
    else if (name === 'klelite-confirm-pass') fieldName = 'confirmPassword';

    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: '' }));
    }
  }, [errors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    dispatch(register(formData));
  };

  const passwordStrength = useCallback(() => {
    const password = formData.password;
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  }, [formData.password]);

  const getStrengthColor = useCallback(() => {
    const strength = passwordStrength();
    if (strength <= 2) return '#ef4444';
    if (strength <= 3) return '#f59e0b';
    return '#22c55e';
  }, [passwordStrength]);

  const getStrengthLabel = useCallback(() => {
    const strength = passwordStrength();
    if (strength <= 2) return 'Yếu';
    if (strength <= 3) return 'Trung bình';
    return 'Mạnh';
  }, [passwordStrength]);

  const features = [
    { icon: FiAward, text: 'Tích điểm đổi quà' },
    { icon: FiStar, text: 'Ưu đãi sinh nhật đặc biệt' },
    { icon: FiTrendingUp, text: 'Truy cập sản phẩm độc quyền' },
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
            src="https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=1200&q=90"
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
              Gia nhập KL'élite Club!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Đăng ký để trở thành thành viên và nhận ngay ưu đãi 
              giảm 15% cho đơn hàng đầu tiên.
            </motion.p>

            <motion.div 
              className={styles.welcomeOffer}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <span className={styles.offerTag}>WELCOME GIFT</span>
              <span className={styles.offerValue}>15% OFF</span>
              <span className={styles.offerText}>Đơn hàng đầu tiên</span>
            </motion.div>

            <motion.div
              className={styles.brandingFeatures}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className={styles.feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
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

        {/* Right Side - Register Form */}
        <motion.div 
          className={`${styles.authForm} ${styles.registerForm}`}
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
              <h1>Tạo tài khoản</h1>
              <p>Chỉ mất 2 phút để đăng ký</p>
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

            <motion.form onSubmit={handleSubmit} variants={itemVariants}>
              <div className={styles.inputRow}>
                <motion.div 
                  className={`${styles.inputGroup} ${errors.lastName ? styles.hasError : ''} ${focusedField === 'lastName' ? styles.focused : ''}`}
                  variants={itemVariants}
                >
                  <label htmlFor="lastName">Họ</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputIcon}>
                      <FiUser />
                    </span>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('lastName')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Nguyễn"
                      autoComplete="family-name"
                    />
                    <div className={styles.inputGlow} />
                  </div>
                  <AnimatePresence>
                    {errors.lastName && (
                      <motion.span 
                        className={styles.errorText}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                      >
                        {errors.lastName}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div 
                  className={`${styles.inputGroup} ${errors.firstName ? styles.hasError : ''} ${focusedField === 'firstName' ? styles.focused : ''}`}
                  variants={itemVariants}
                >
                  <label htmlFor="firstName">Tên</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.inputIcon}>
                      <FiUser />
                    </span>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('firstName')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Văn A"
                      autoComplete="given-name"
                    />
                    <div className={styles.inputGlow} />
                  </div>
                  <AnimatePresence>
                    {errors.firstName && (
                      <motion.span 
                        className={styles.errorText}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                      >
                        {errors.firstName}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>

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
                    placeholder="email@example.com"
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
                className={`${styles.inputGroup} ${errors.phone ? styles.hasError : ''} ${focusedField === 'phone' ? styles.focused : ''}`}
                variants={itemVariants}
              >
                <label htmlFor="phone">Số điện thoại (tùy chọn)</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <FiPhone />
                  </span>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="0912 345 678"
                    autoComplete="tel"
                  />
                  <div className={styles.inputGlow} />
                </div>
                <AnimatePresence>
                  {errors.phone && (
                    <motion.span 
                      className={styles.errorText}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      {errors.phone}
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
                    placeholder="Tối thiểu 6 ký tự"
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
                {formData.password && (
                  <motion.div 
                    className={styles.passwordStrength}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className={styles.strengthBarContainer}>
                      <motion.div 
                        className={styles.strengthBar} 
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${(passwordStrength() / 5) * 100}%`,
                          backgroundColor: getStrengthColor()
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <span className={styles.strengthLabel} style={{ color: getStrengthColor() }}>
                      {getStrengthLabel()}
                    </span>
                  </motion.div>
                )}
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

              <motion.div
                className={`${styles.inputGroup} ${errors.confirmPassword ? styles.hasError : ''} ${focusedField === 'confirmPassword' ? styles.focused : ''}`}
                variants={itemVariants}
              >
                <label htmlFor="klelite-confirm-pass">Xác nhận mật khẩu</label>
                <div className={styles.inputWrapper}>
                  <span className={styles.inputIcon}>
                    <FiLock />
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="klelite-confirm-pass"
                    name="klelite-confirm-pass"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                  <div className={styles.inputGlow} />
                </div>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <motion.div 
                    className={styles.passwordMatch}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <FiCheck /> Mật khẩu khớp
                  </motion.div>
                )}
                <AnimatePresence>
                  {errors.confirmPassword && (
                    <motion.span 
                      className={styles.errorText}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      {errors.confirmPassword}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div 
                className={`${styles.termsGroup} ${errors.terms ? styles.hasError : ''}`}
                variants={itemVariants}
              >
                <label className={styles.checkbox}>
                  <input 
                    type="checkbox" 
                    checked={acceptTerms}
                    onChange={(e) => {
                      setAcceptTerms(e.target.checked);
                      if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }));
                    }}
                  />
                  <span className={styles.checkboxCustom}>
                    {acceptTerms && <FiCheck />}
                  </span>
                  <span className={styles.checkboxLabel}>
                    Tôi đồng ý với{' '}
                    <Link to="/terms" target="_blank">Điều khoản sử dụng</Link>
                    {' '}và{' '}
                    <Link to="/privacy" target="_blank">Chính sách bảo mật</Link>
                  </span>
                </label>
                <AnimatePresence>
                  {errors.terms && (
                    <motion.span 
                      className={styles.errorText}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      {errors.terms}
                    </motion.span>
                  )}
                </AnimatePresence>
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
                    <span>Đăng ký</span>
                    <FiArrowRight className={styles.btnIcon} />
                  </>
                )}
                <div className={styles.btnShine} />
              </motion.button>
            </motion.form>

            <motion.p className={styles.formFooter} variants={itemVariants}>
              Đã có tài khoản?{' '}
              <Link to="/login" className={styles.footerLink}>
                Đăng nhập
                <span className={styles.linkArrow}>→</span>
              </Link>
            </motion.p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
