import Image from "next/image";
import styles from "./page.module.css";
import Link from 'next/link';

export default function Home() {
  return (    
    <div className={`${styles.mainDiv}`}>
      <h1 className={styles.title}>Let's Go Out!</h1>
      <section className={`${styles.buttonsGrid}`}>
        <Link href="/newDate" className={styles.button}>New Date</Link>
        <Link href="/editPlans" className={styles.button}>Edit Current Plans</Link>
        <Link href="/viewCalendar" className={styles.button}>View Full Calendar</Link>
      </section>
    </div>
  );
}
