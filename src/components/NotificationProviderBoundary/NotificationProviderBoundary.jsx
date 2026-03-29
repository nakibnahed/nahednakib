"use client";

import React from "react";
import { NotificationProvider } from "@/context/NotificationContext";

class NotificationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {}

  render() {
    if (this.state.hasError) {
      return this.props.fallbackChildren;
    }
    return this.props.children;
  }
}

export default function NotificationProviderBoundary({ children }) {
  return (
    <NotificationErrorBoundary fallbackChildren={children}>
      <NotificationProvider>{children}</NotificationProvider>
    </NotificationErrorBoundary>
  );
}
