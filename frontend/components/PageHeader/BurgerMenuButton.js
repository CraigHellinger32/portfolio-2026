import Image from "next/image";
import styles from "./PageHeader.module.css";

export default function BurgerMenuButton({ open, onToggle, controls }) {
	return (
		<button
			type="button"
			className={`${styles.control} ${styles.menuButton}`}
			onClick={onToggle}
			aria-expanded={controls ? open : undefined}
			aria-pressed={controls ? undefined : open}
			aria-controls={controls}
		>
			<Image src={open ? "/header/close.svg" : "/header/menu.svg"} alt="" width={24} height={24} unoptimized />
			<span>{open ? "Close" : "Menu"}</span>
		</button>
	);
}