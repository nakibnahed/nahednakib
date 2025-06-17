"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/services/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export default function Post(props) {
  const { id } = use(props.params);

  const router = useRouter();

  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function fetchPortfolio() {
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        setErrorMsg(error.message);
      } else if (!data) {
        router.push("/404");
      } else {
        setPortfolio(data);
      }
      setLoading(false);
    }

    fetchPortfolio();
  }, [id, router]);

  if (errorMsg) return <p>Error: {errorMsg}</p>;
  if (!portfolio && !loading) return null;

  return (
    <div className={styles.container}>
      <header>
        <div className={styles.imgContainer}>
          {loading ? (
            <div className={styles.skeleton}>
              <div className={styles.skeletonBar} />
            </div>
          ) : (
            <>
              <Image
                className={styles.image}
                src={portfolio.image || "/images/portfolio.jpg"}
                alt={portfolio.title}
                fill
                priority
                sizes="100vw"
                style={{ objectFit: "cover" }}
              />
              <div className={styles.info}>
                <h1 className={styles.title}>{portfolio.title}</h1>
                <nav className={styles.breadcrumb}>
                  <Link href="/" className={styles.link}>
                    Home
                  </Link>
                  <span className={styles.separator}> / </span>
                  <Link href="/portfolio" className={styles.link}>
                    Portfolio
                  </Link>
                  <span className={styles.separator}> / </span>
                  <span className={styles.current}>{portfolio.category}</span>
                </nav>
              </div>
            </>
          )}
        </div>
      </header>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.skeletonContent} />
        ) : (
          <div
            className={styles.text}
            dangerouslySetInnerHTML={{ __html: portfolio.content }}
          />
        )}
      </div>
    </div>
  );
}
