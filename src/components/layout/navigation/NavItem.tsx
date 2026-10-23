import Link from "next/link";
import styles from "./NavItem.module.scss";

interface NavItemProps {
  item: string;
  onNavItemClick?: () => void;
}

export default function NavItem({ item, onNavItemClick }: NavItemProps) {
  const handleClick = () => {
    if (onNavItemClick) {
      onNavItemClick();
    }
  };

  return (
    <li className={styles.navItemContainer} data-intro-item>
      <div className={styles.svgWrapper}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
          data-intro-line
        >
          <rect className={styles.shape} />
        </svg>
        <Link
          className={styles.navLink}
          href={`/#${item.toLowerCase()}`}
          scroll={false}
          onClick={handleClick}
        >
          <span data-intro-label>{item}</span>
        </Link>
      </div>
    </li>
  );
}
