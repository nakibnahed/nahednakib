import { logoFont } from "@/lib/fonts/fonts";
import Link from "next/link";
import styles from "./logo.module.css";

export default function Logo() {
  return (
    <Link href="/" className={`${logoFont.className} ${styles.logo}`}>
      Nahed
    </Link>
  );
}
