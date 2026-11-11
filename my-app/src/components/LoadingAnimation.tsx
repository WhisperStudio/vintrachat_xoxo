import styles from './LoadingAnimation.module.css'

export default function LoadingAnimation({ label = 'Laster…', compact = false }: { label?: string; compact?: boolean }) {
  return (
    <span className={`${styles.loader} ${compact ? styles.compact : ''}`} role="status" aria-label={label}>
      <span className={styles.scene} aria-hidden="true">
        <span className={styles.halo} />
        <span className={styles.orbit}><span /></span>
        <span className={styles.secondOrbit}><span /></span>
        <span className={styles.core} />
      </span>
    </span>
  )
}
