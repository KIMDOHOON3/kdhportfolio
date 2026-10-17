import styles from "@/app/components/Header/Navigation.module.scss";
import NavItem from "@/app/components/Header/NavItem";

interface NavigationProps {
  isActive: boolean;
  onNavItemClick?: () => void;
}

const MENU_ITEMS = ["HOME", "WORK", "ABOUT"];

export default function Navigation({
  isActive,
  onNavItemClick,
}: NavigationProps) {
  return (
    <nav
      id="main-navigation"
      aria-label="메인 메뉴"
      className={`${styles.navigationContainer} ${isActive ? styles.active : ""}`}
    >
      <ul className={styles.navigationList}>
        {MENU_ITEMS.map((item, index) => (
          <NavItem key={index} item={item} onNavItemClick={onNavItemClick} />
        ))}
      </ul>
    </nav>
  );
}
