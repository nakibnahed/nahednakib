export function getNotificationUrl(notification) {
  const type = notification?.type;
  const relatedType = notification?.related_content_type;
  const relatedId = notification?.related_content_id;

  switch (type) {
    case "new_blog_post":
      return relatedId ? `/blog/${relatedId}` : "/blog";
    case "new_portfolio_post":
      return relatedId ? `/portfolio/${relatedId}` : "/portfolio";
    case "newsletter_subscription":
      return "/blog";
    case "contact_form":
      return "/admin/messages";
    case "admin_message":
      return "/notifications";
    case "user_registration":
      return "/admin/users";
    case "user_login":
      return "/notifications";
    case "comment_approved":
    case "comment_reply":
      if (relatedType && relatedId) {
        return `/${relatedType}/${relatedId}`;
      }
      return "/notifications";
    case "practice_request":
      return "/conversation-practice?tab=requests#incoming-requests";
    case "practice_cancelled":
      return "/conversation-practice?tab=requests";
    default:
      return "/notifications";
  }
}

export function shouldOpenInNewTab(notification) {
  return false;
}
