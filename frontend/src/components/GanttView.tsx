import { Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { useMemo } from "react";
import type { Priority, Request } from "../types";

const { Text } = Typography;

const priorityColors: Record<Priority, string> = {
  critical: "#ff4d4f",
  high: "#fa541c",
  medium: "#faad14",
  low: "#bfbfbf",
};

const DAY_WIDTH = 36;
const ROW_HEIGHT = 40;
const LABEL_WIDTH = 260;

interface Props {
  requests: Request[];
}

export default function GanttView({ requests }: Props) {
  const items = useMemo(
    () => requests.filter((r) => r.start_date && r.due_date),
    [requests]
  );

  const { minDate, totalDays, months } = useMemo(() => {
    if (items.length === 0) {
      const today = dayjs();
      return {
        minDate: today,
        totalDays: 30,
        months: [] as { label: string; offset: number; span: number }[],
      };
    }

    let min = dayjs(items[0].start_date!);
    let max = dayjs(items[0].due_date!);
    for (const r of items) {
      const s = dayjs(r.start_date!);
      const e = dayjs(r.due_date!);
      if (s.isBefore(min)) min = s;
      if (e.isAfter(max)) max = e;
    }
    min = min.subtract(2, "day");
    max = max.add(2, "day");
    const total = max.diff(min, "day") + 1;

    const ms: { label: string; offset: number; span: number }[] = [];
    let cursor = min.startOf("month");
    while (cursor.isBefore(max) || cursor.isSame(max, "month")) {
      const monthStart = cursor.isBefore(min) ? min : cursor;
      const monthEnd = cursor.endOf("month").isAfter(max) ? max : cursor.endOf("month");
      const offset = monthStart.diff(min, "day");
      const span = monthEnd.diff(monthStart, "day") + 1;
      ms.push({ label: cursor.format("YYYY-MM"), offset, span });
      cursor = cursor.add(1, "month").startOf("month");
    }

    return { minDate: min, totalDays: total, months: ms };
  }, [items]);

  const todayOffset = dayjs().diff(minDate, "day");

  const getBar = (r: Request) => {
    const start = dayjs(r.start_date!);
    const end = dayjs(r.due_date!);
    const left = start.diff(minDate, "day");
    const width = end.diff(start, "day") + 1;
    return { left, width };
  };

  if (items.length === 0) {
    return <Text type="secondary">沒有設定日期的需求，請在編輯中設定開始日與截止日。</Text>;
  }

  return (
    <div style={{ overflow: "auto", border: "1px solid #f0f0f0", borderRadius: 8 }}>
      <div style={{ display: "flex", minWidth: LABEL_WIDTH + totalDays * DAY_WIDTH }}>
        {/* Left: labels */}
        <div style={{ width: LABEL_WIDTH, flexShrink: 0, borderRight: "1px solid #e8e8e8" }}>
          <div style={{ height: 28, borderBottom: "1px solid #e8e8e8" }} />
          <div style={{ height: 24, borderBottom: "1px solid #e8e8e8" }} />
          {items.map((r) => (
            <div
              key={r.id}
              style={{
                height: ROW_HEIGHT,
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 8px",
                borderBottom: "1px solid #f5f5f5",
                overflow: "hidden",
              }}
            >
              <Text
                style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}
              >
                #{r.id} {r.title}
              </Text>
            </div>
          ))}
        </div>

        {/* Right: timeline */}
        <div style={{ position: "relative", flex: 1 }}>
          {/* Month headers */}
          <div style={{ display: "flex", height: 28, borderBottom: "1px solid #e8e8e8" }}>
            {months.map((m) => (
              <div
                key={m.label}
                style={{
                  position: "absolute",
                  left: m.offset * DAY_WIDTH,
                  width: m.span * DAY_WIDTH,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#595959",
                  borderRight: "1px solid #e8e8e8",
                }}
              >
                {m.label}
              </div>
            ))}
          </div>

          {/* Day headers */}
          <div style={{ display: "flex", height: 24, borderBottom: "1px solid #e8e8e8" }}>
            {Array.from({ length: totalDays }, (_, i) => {
              const d = minDate.add(i, "day");
              const isWeekend = d.day() === 0 || d.day() === 6;
              return (
                <div
                  key={i}
                  style={{
                    width: DAY_WIDTH,
                    flexShrink: 0,
                    textAlign: "center",
                    fontSize: 11,
                    color: isWeekend ? "#bfbfbf" : "#8c8c8c",
                    borderRight: "1px solid #f5f5f5",
                  }}
                >
                  {d.format("DD")}
                </div>
              );
            })}
          </div>

          {/* Today line */}
          {todayOffset >= 0 && todayOffset <= totalDays && (
            <div
              style={{
                position: "absolute",
                left: todayOffset * DAY_WIDTH + DAY_WIDTH / 2,
                top: 0,
                bottom: 0,
                width: 2,
                background: "#1677ff",
                zIndex: 10,
                opacity: 0.6,
              }}
            />
          )}

          {/* Bars */}
          {items.map((r) => {
            const { left, width } = getBar(r);
            return (
              <div
                key={r.id}
                style={{
                  position: "relative",
                  height: ROW_HEIGHT,
                  borderBottom: "1px solid #f5f5f5",
                }}
              >
                {Array.from({ length: totalDays }, (_, i) => {
                  const d = minDate.add(i, "day");
                  if (d.day() !== 0 && d.day() !== 6) return null;
                  return (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        left: i * DAY_WIDTH,
                        width: DAY_WIDTH,
                        height: ROW_HEIGHT,
                        background: "rgba(0,0,0,0.02)",
                      }}
                    />
                  );
                })}
                <Tooltip
                  title={
                    <div>
                      <div>#{r.id} {r.title}</div>
                      <div>{r.start_date} ~ {r.due_date}</div>
                      <div>{r.requester} | {r.module}</div>
                    </div>
                  }
                >
                  <div
                    style={{
                      position: "absolute",
                      left: left * DAY_WIDTH + 2,
                      top: 8,
                      width: width * DAY_WIDTH - 4,
                      height: ROW_HEIGHT - 16,
                      background: priorityColors[r.priority],
                      borderRadius: 4,
                      opacity: 0.85,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: 6,
                      overflow: "hidden",
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 12,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {r.title}
                    </Text>
                  </div>
                </Tooltip>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
