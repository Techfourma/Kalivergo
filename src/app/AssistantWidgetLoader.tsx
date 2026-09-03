"use client";

import dynamic from "next/dynamic";

const AssistantWidget = dynamic(
  () => import("@/features/ai-assistant").then((mod) => ({ default: mod.AssistantWidget })),
  { ssr: false, loading: () => null }
);

export default function AssistantWidgetLoader() {
  return <AssistantWidget />;
}