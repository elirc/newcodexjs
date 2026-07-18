import styles from './Button.module.css';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' };

/** Renders a small reusable button with recipe-app styling. */
export function Button({ variant = 'primary', className = '', ...props }: Props) {
  return <button className={`${styles.button} ${styles[variant]} ${className}`} {...props} />;
}
