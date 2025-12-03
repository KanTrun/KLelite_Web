import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiMapPin,
  FiPhone,
  FiMail,
  FiClock,
  FiSend,
  FiUser,
  FiMessageSquare,
  FiCheckCircle,
} from 'react-icons/fi';
import { FaFacebook, FaInstagram, FaTiktok, FaYoutube } from 'react-icons/fa';
import styles from './Contact.module.scss';

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);

    // Reset after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    }, 3000);
  };

  const contactInfo = [
    {
      icon: <FiMapPin />,
      title: 'Địa chỉ',
      content: '123 Đường Lê Lợi, Phường Bến Nghé',
      subContent: 'Quận 1, TP. Hồ Chí Minh',
    },
    {
      icon: <FiPhone />,
      title: 'Điện thoại',
      content: '1900 1234 56',
      subContent: 'Hotline đặt bánh',
    },
    {
      icon: <FiMail />,
      title: 'Email',
      content: 'contact@klelite.vn',
      subContent: 'Phản hồi trong 24h',
    },
    {
      icon: <FiClock />,
      title: 'Giờ mở cửa',
      content: '7:00 - 22:00',
      subContent: 'Tất cả các ngày trong tuần',
    },
  ];

  const branches = [
    {
      name: 'Chi nhánh Quận 1',
      address: '123 Đường Lê Lợi, Phường Bến Nghé, Quận 1',
      phone: '028 1234 5678',
      hours: '7:00 - 22:00',
    },
    {
      name: 'Chi nhánh Quận 3',
      address: '456 Võ Văn Tần, Phường 5, Quận 3',
      phone: '028 2345 6789',
      hours: '7:00 - 22:00',
    },
    {
      name: 'Chi nhánh Quận 7',
      address: '789 Nguyễn Thị Thập, Tân Phú, Quận 7',
      phone: '028 3456 7890',
      hours: '7:30 - 21:30',
    },
    {
      name: 'Chi nhánh Thủ Đức',
      address: '321 Võ Văn Ngân, Linh Chiểu, TP. Thủ Đức',
      phone: '028 4567 8901',
      hours: '7:00 - 21:00',
    },
  ];

  return (
    <div className={styles.contactPage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Liên Hệ Với Chúng Tôi
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Chúng tôi luôn sẵn sàng lắng nghe và phục vụ bạn
          </motion.p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className={styles.contactInfo}>
        <div className={styles.container}>
          <div className={styles.infoGrid}>
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.title}
                className={styles.infoCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={styles.infoIcon}>{info.icon}</div>
                <h3>{info.title}</h3>
                <p className={styles.infoContent}>{info.content}</p>
                <p className={styles.infoSubContent}>{info.subContent}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className={styles.contactMain}>
        <div className={styles.container}>
          <div className={styles.contactGrid}>
            {/* Contact Form */}
            <motion.div
              className={styles.formSection}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2>Gửi Tin Nhắn</h2>
              <p>Điền thông tin bên dưới, chúng tôi sẽ phản hồi trong thời gian sớm nhất</p>

              {isSubmitted ? (
                <motion.div
                  className={styles.successMessage}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <FiCheckCircle />
                  <h3>Gửi thành công!</h3>
                  <p>Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất có thể.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className={styles.contactForm}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>
                        <FiUser />
                        Họ và tên *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Nhập họ và tên"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>
                        <FiPhone />
                        Số điện thoại *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Nhập số điện thoại"
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <FiMail />
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Nhập email của bạn"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Chủ đề</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                    >
                      <option value="">-- Chọn chủ đề --</option>
                      <option value="order">Đặt bánh</option>
                      <option value="custom">Bánh theo yêu cầu</option>
                      <option value="wholesale">Hợp tác kinh doanh</option>
                      <option value="feedback">Phản hồi dịch vụ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      <FiMessageSquare />
                      Nội dung tin nhắn *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Nhập nội dung tin nhắn của bạn..."
                      rows={5}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      'Đang gửi...'
                    ) : (
                      <>
                        <FiSend />
                        Gửi tin nhắn
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>

            {/* Map */}
            <motion.div
              className={styles.mapSection}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className={styles.mapWrapper}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4194844764397!2d106.69815731533432!3d10.77932899232828!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f38f9ed887b%3A0x14aded5703768989!2zTMOqIEzhu6NpLCBCw6puIE5naMOpLCBRdeG6rW4gMSwgVGjDoG5oIHBo4buRIEjhu5MgQ2jDrSBNaW5oLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1622345678901!5m2!1svi!2s"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="KL'élite Location"
                />
              </div>

              {/* Social Links */}
              <div className={styles.socialLinks}>
                <h4>Kết nối với chúng tôi</h4>
                <div className={styles.socialIcons}>
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                    <FaFacebook />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                    <FaInstagram />
                  </a>
                  <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer">
                    <FaTiktok />
                  </a>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                    <FaYoutube />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Branches Section */}
      <section className={styles.branches}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.subtitle}>Hệ thống cửa hàng</span>
            <h2>Các Chi Nhánh</h2>
          </div>

          <div className={styles.branchGrid}>
            {branches.map((branch, index) => (
              <motion.div
                key={branch.name}
                className={styles.branchCard}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <h3>{branch.name}</h3>
                <div className={styles.branchInfo}>
                  <p>
                    <FiMapPin />
                    {branch.address}
                  </p>
                  <p>
                    <FiPhone />
                    {branch.phone}
                  </p>
                  <p>
                    <FiClock />
                    {branch.hours}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.directionsBtn}
                >
                  Chỉ đường
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faq}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.subtitle}>Câu hỏi thường gặp</span>
            <h2>FAQ</h2>
          </div>

          <div className={styles.faqList}>
            <div className={styles.faqItem}>
              <h4>Tôi có thể đặt bánh trước bao lâu?</h4>
              <p>Đối với bánh sinh nhật và các loại bánh theo yêu cầu, vui lòng đặt trước ít nhất 24-48 giờ. Bánh cưới cần đặt trước ít nhất 1 tuần.</p>
            </div>
            <div className={styles.faqItem}>
              <h4>Chính sách giao hàng như thế nào?</h4>
              <p>Miễn phí giao hàng cho đơn từ 500.000đ trong nội thành TP.HCM. Đơn hàng dưới 500.000đ phí ship 30.000đ.</p>
            </div>
            <div className={styles.faqItem}>
              <h4>Bánh có thể bảo quản được bao lâu?</h4>
              <p>Tùy loại bánh, thường từ 2-5 ngày trong ngăn mát tủ lạnh. Bánh tươi nên dùng trong ngày để có hương vị tốt nhất.</p>
            </div>
            <div className={styles.faqItem}>
              <h4>Có thể custom bánh theo yêu cầu không?</h4>
              <p>Có! Chúng tôi nhận làm bánh theo yêu cầu riêng của khách hàng. Vui lòng liên hệ để được tư vấn chi tiết.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
