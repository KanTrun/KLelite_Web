import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FiAward,
  FiHeart,
  FiUsers,
  FiCoffee,
  FiStar,
  FiMapPin,
  FiPhone,
  FiMail,
} from 'react-icons/fi';
import styles from './About.module.scss';

const About: React.FC = () => {
  const milestones = [
    { year: '2018', title: 'Khởi đầu', description: 'Mở cửa hàng đầu tiên tại Quận 1, TP.HCM với chỉ 5 loại bánh' },
    { year: '2019', title: 'Mở rộng', description: 'Khai trương chi nhánh thứ 2 và bắt đầu dịch vụ đặt bánh online' },
    { year: '2020', title: 'Chuyển đổi', description: 'Phát triển mạnh mẽ dịch vụ giao hàng trong thời kỳ đại dịch' },
    { year: '2021', title: 'Vinh danh', description: 'Đạt giải "Tiệm bánh xuất sắc nhất" từ Vietnam Food Awards' },
    { year: '2022', title: 'Đổi mới', description: 'Ra mắt dòng bánh thuần chay và không gluten' },
    { year: '2023', title: 'Hiện tại', description: '5 chi nhánh, hơn 100 loại bánh và đội ngũ 50+ nhân viên' },
  ];

  const values = [
    {
      icon: <FiAward />,
      title: 'Chất lượng hàng đầu',
      description: 'Sử dụng nguyên liệu cao cấp nhập khẩu từ Pháp, Bỉ, Nhật Bản',
    },
    {
      icon: <FiHeart />,
      title: 'Làm từ tâm',
      description: 'Mỗi chiếc bánh được làm thủ công với tình yêu và sự tận tâm',
    },
    {
      icon: <FiUsers />,
      title: 'Đội ngũ chuyên nghiệp',
      description: 'Các đầu bếp được đào tạo tại Le Cordon Bleu và các trường danh tiếng',
    },
    {
      icon: <FiCoffee />,
      title: 'Tươi mỗi ngày',
      description: 'Tất cả sản phẩm được làm tươi mới mỗi ngày, không sử dụng chất bảo quản',
    },
  ];

  const team = [
    {
      name: 'Chef Marie Nguyen',
      role: 'Head Pastry Chef',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
      description: 'Tốt nghiệp Le Cordon Bleu Paris, 15 năm kinh nghiệm',
    },
    {
      name: 'Chef David Tran',
      role: 'Executive Chef',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      description: 'Chuyên gia về chocolate và bánh cưới cao cấp',
    },
    {
      name: 'Chef Lisa Pham',
      role: 'Creative Director',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      description: 'Thiết kế và phát triển các sản phẩm mới độc đáo',
    },
  ];

  return (
    <div className={styles.aboutPage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Câu Chuyện Của Chúng Tôi
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Từ niềm đam mê với nghệ thuật làm bánh đến tiệm bánh cao cấp hàng đầu Việt Nam
          </motion.p>
        </div>
      </section>

      {/* Story Section */}
      <section className={styles.story}>
        <div className={styles.container}>
          <div className={styles.storyGrid}>
            <motion.div
              className={styles.storyImage}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <img
                src="https://images.unsplash.com/photo-1556217477-d325251ece38?w=800"
                alt="Tiệm bánh KL'élite"
              />
              <div className={styles.experienceBadge}>
                <span className={styles.years}>6+</span>
                <span className={styles.text}>Năm kinh nghiệm</span>
              </div>
            </motion.div>
            
            <motion.div
              className={styles.storyContent}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className={styles.subtitle}>Về KL'élite</span>
              <h2>Nơi Đam Mê Gặp Gỡ Nghệ Thuật</h2>
              <p>
                KL'élite Luxury Bakery được thành lập năm 2018 bởi đội ngũ những người yêu bánh với 
                ước mơ mang đến cho người Việt Nam những sản phẩm bánh ngọt cao cấp đẳng cấp quốc tế.
              </p>
              <p>
                Tên gọi "KL'élite" được ghép từ chữ cái đầu của những người sáng lập kết hợp với 
                "élite" - nghĩa là tinh hoa, xuất sắc trong tiếng Pháp. Chúng tôi tin rằng mỗi chiếc 
                bánh không chỉ là món ăn mà còn là tác phẩm nghệ thuật, mang đến niềm vui và hạnh phúc.
              </p>
              <p>
                Với triết lý "Chất lượng không thỏa hiệp", chúng tôi chỉ sử dụng những nguyên liệu 
                tốt nhất: bơ Isigny AOP từ Normandy, chocolate Valrhona từ Pháp, matcha Uji từ Kyoto, 
                và nhiều nguyên liệu cao cấp khác được nhập khẩu trực tiếp.
              </p>
              <div className={styles.signature}>
                <img src="https://i.imgur.com/signature.png" alt="Signature" />
                <span>Founder & CEO</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className={styles.values}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.subtitle}>Giá trị cốt lõi</span>
            <h2>Điều Làm Nên Sự Khác Biệt</h2>
          </div>
          
          <div className={styles.valuesGrid}>
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                className={styles.valueCard}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={styles.valueIcon}>{value.icon}</div>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones Section */}
      <section className={styles.milestones}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.subtitle}>Hành trình phát triển</span>
            <h2>Những Cột Mốc Đáng Nhớ</h2>
          </div>
          
          <div className={styles.timeline}>
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.year}
                className={styles.timelineItem}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className={styles.timelineYear}>{milestone.year}</div>
                <div className={styles.timelineContent}>
                  <h3>{milestone.title}</h3>
                  <p>{milestone.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className={styles.team}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.subtitle}>Đội ngũ chuyên gia</span>
            <h2>Những Nghệ Nhân Đằng Sau Mỗi Chiếc Bánh</h2>
          </div>
          
          <div className={styles.teamGrid}>
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                className={styles.teamCard}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={styles.teamImage}>
                  <img src={member.image} alt={member.name} />
                </div>
                <div className={styles.teamInfo}>
                  <h3>{member.name}</h3>
                  <span className={styles.teamRole}>{member.role}</span>
                  <p>{member.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <motion.div
              className={styles.statItem}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <span className={styles.statNumber}>50,000+</span>
              <span className={styles.statLabel}>Khách hàng hài lòng</span>
            </motion.div>
            <motion.div
              className={styles.statItem}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <span className={styles.statNumber}>100+</span>
              <span className={styles.statLabel}>Loại bánh đa dạng</span>
            </motion.div>
            <motion.div
              className={styles.statItem}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <span className={styles.statNumber}>5</span>
              <span className={styles.statLabel}>Chi nhánh toàn quốc</span>
            </motion.div>
            <motion.div
              className={styles.statItem}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <span className={styles.statNumber}>4.9</span>
              <span className={styles.statLabel}>Đánh giá trung bình</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <motion.div
            className={styles.ctaContent}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Sẵn Sàng Trải Nghiệm?</h2>
            <p>Khám phá bộ sưu tập bánh cao cấp của chúng tôi ngay hôm nay</p>
            <div className={styles.ctaButtons}>
              <Link to="/products" className={styles.primaryBtn}>
                Xem Sản Phẩm
              </Link>
              <Link to="/contact" className={styles.secondaryBtn}>
                Liên Hệ Đặt Bánh
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
