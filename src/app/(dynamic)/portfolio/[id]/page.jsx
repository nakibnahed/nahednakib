"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { FaHeart, FaThumbsUp } from "react-icons/fa";
import { FiShare2 } from "react-icons/fi";

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
      <div className={styles.header}>
        <div className={styles.imageCard}>
          {loading ? (
            <div className={styles.skeleton}>
              <div className={styles.skeletonBar} />
            </div>
          ) : (
            <Image
              className={styles.image}
              src={portfolio.image || "/images/portfolio.jpg"}
              alt={portfolio.title}
              fill
              sizes="220px"
              priority
              style={{ objectFit: "cover" }}
            />
          )}
        </div>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>
            {loading ? (
              <div
                className={styles.skeletonBar}
                style={{ height: 28, width: "70%", background: "#292929" }}
              />
            ) : (
              portfolio.title
            )}
          </h1>
          {!loading && portfolio.created_at && (
            <span className={styles.publishDate}>
              {new Date(portfolio.created_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          {!loading && (
            <>
              <span className={styles.category}>{portfolio.category}</span>
              <nav className={styles.breadcrumb}>
                <Link href="/" className={styles.link}>
                  Home
                </Link>
                <span className={styles.separator}>/</span>
                <Link href="/portfolio" className={styles.link}>
                  Portfolio
                </Link>
                <span className={styles.separator}>/</span>
                <span className={styles.current}>{portfolio.category}</span>
              </nav>
              <div className={styles.iconRow}>
                <button className={styles.iconBtn} title="Like">
                  <FaThumbsUp />
                </button>
                <button className={styles.iconBtn} title="Favorite">
                  <FaHeart />
                </button>
                <button
                  className={styles.iconBtn}
                  title="Share"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: portfolio?.title,
                        url: window.location.href,
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Link copied!");
                    }
                  }}
                >
                  <FiShare2 />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
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
