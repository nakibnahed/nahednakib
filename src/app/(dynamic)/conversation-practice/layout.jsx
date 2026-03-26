import { metadata as siteMetadata } from "@/constants/metadata";

export const metadata = {
  title: `Conversation Practice | ${siteMetadata.author}`,
  description:
    "Browse available classmates, set availability, and send meeting requests (Google Meet).",
};

export default function ConversationPracticeLayout({ children }) {
  return children;
}
