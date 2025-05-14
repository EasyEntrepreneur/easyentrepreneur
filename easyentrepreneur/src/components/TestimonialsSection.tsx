'use client'

import styles from './TestimonialsSection.module.css'
import { FaQuoteLeft } from 'react-icons/fa'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

const testimonials = [
  {
    name: 'Sophie M.',
    role: 'Graphiste freelance',
    comment:
      'EasyEntrepreneur a simplifié toute ma gestion. Je peux enfin me concentrer sur mes projets.',
  },
  {
    name: 'Yann D.',
    role: 'Développeur web',
    comment:
      'Le suivi de mes revenus est clair, l’interface est top et les rappels m’ont évité plusieurs oublis !',
  },
  {
    name: 'Claire R.',
    role: 'Coach indépendante',
    comment:
      'Enfin une solution pensée pour les micro-entrepreneurs. Facile à utiliser et un vrai gain de temps.',
  },
  {
    name: 'Thomas B.',
    role: 'Développeur web',
    comment:
      'j’étais perdu avec toute cette paperasse administrative et EasyEntrepreneur m’a !',
  },
  {
    name: 'Lailo B.',
    role: 'Développeur web',
    comment:
      'j’ai réussi a mettre en ordre mon auto-entreprise grâce à EasyEntrepreneur.',
  }
]

export default function TestimonialsSection() {
  return (
    <section className={styles.wrapper}>
      <h2 className={styles.title}>
        Ils utilisent <span>EasyEntrepreneur</span>
      </h2>
      <p className={styles.subtitle}>
        Des micro-entrepreneurs partagent leur expérience
      </p>

      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        spaceBetween={32}
        slidesPerView={1}
        breakpoints={{
          768: {
            slidesPerView: 2,
          },
          1024: {
            slidesPerView: 3,
          },
        }}
      >
        {testimonials.map((t, index) => (
          <SwiperSlide key={index}>
            <div className={styles.card}>
              <FaQuoteLeft className={styles.quoteIcon} />
              <p className={styles.comment}>{t.comment}</p>
              <div className={styles.meta}>
                <strong>{t.name}</strong>
                <span>{t.role}</span>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}
