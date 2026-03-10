import { Tag } from "antd";
import type { ReactNode } from "react";
import type { Priority, Risk, Stage } from "./types";

type Option<T> = { value: T; label: ReactNode };

export const priorityOptions: Option<Priority>[] = [
  { value: "critical", label: <Tag color="red">緊急</Tag> },
  { value: "high", label: <Tag color="volcano">高</Tag> },
  { value: "medium", label: <Tag color="gold">中</Tag> },
  { value: "low", label: <Tag>低</Tag> },
];

export const riskOptions: Option<Risk>[] = [
  { value: "high", label: <Tag color="red">高</Tag> },
  { value: "medium", label: <Tag color="orange">中</Tag> },
  { value: "low", label: <Tag color="green">低</Tag> },
];

export const stageOptions: Option<Stage>[] = [
  { value: "todo", label: <Tag>待辦</Tag> },
  { value: "in_progress", label: <Tag color="processing">進行中</Tag> },
  { value: "done", label: <Tag color="green">已完成</Tag> },
  { value: "release", label: <Tag color="warning">待上線</Tag> },
  { value: "archived", label: <Tag color="default">結案</Tag> },
];
