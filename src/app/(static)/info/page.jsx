"use client";

import { useState } from "react";
import styles from "./info.module.css";
import Banner from "../../../components/Banner/Banner";
import Sidebar from "../../../components/Sidebar/Sidebar";
import WebContent from "../../../components/WebContent/WebContent";
import RunningContent from "../../../components/RunningContent/RunningContent";

export default function InfoPage() {
  const [activeTab, setActiveTab] = useState("running");
  return (
    <div className={styles.infoContainer}>
      <Banner setActiveTab={setActiveTab} activeTab={activeTab} />

      <div className={styles.mainContent}>
        <div className={styles.contentArea}>
          {activeTab === "web" ? <WebContent /> : <RunningContent />}
        </div>

        <div className={styles.sidebar}>
          <Sidebar activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}
