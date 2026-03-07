import { Segmented, Switch, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import dayOfYear from "dayjs/plugin/dayOfYear";
import { useMemo, useState } from "react";

dayjs.extend(dayOfYear);
import type { Priority, Request } from "../types";

const { Text } = Typography;

const priorityColors: Record<Priority, string> = {
  critical: "#ff4d4f",
  high: "#fa541c",
  medium: "#faad14",
  low: "#bfbfbf",
};

type Granularity = "day" | "week";
const DAY_PX = 36;
const WEEK_PX = 120;
const ROW_HEIGHT = 40;
const LABEL_WIDTH = 260;

interface Props {
  requests: Request[];
  onClickRequest?: (id: number) => void;
}

export default function GanttView({ requests, onClickRequest }: Props) {
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [showUndated, setShowUndated] = useState(false);
  const pxPerDay = granularity === "day" ? DAY_PX : WEEK_PX / 7;

  const items = useMemo(
    () =>
      showUndated
        ? requests
        : requests.filter((r) => r.start_date && r.due_date),
    [requests, showUndated]
  );

  const { minDate, totalDays, months } = useMemo(() => {
    let min = dayjs().subtract(3, "day");
    const max = dayjs().add(1, "month");

    if (granularity === "week") {
      const dow = min.day();
      min = min.subtract(dow === 0 ? 6 : dow - 1, "day");
    }

    const offset = (d: dayjs.Dayjs) => d.diff(min, "day");
    const span = (a: dayjs.Dayjs, b: dayjs.Dayjs) => b.diff(a, "day") + 1;

    let total = span(min, max);
    if (granularity === "week") {
      total = Math.ceil(total / 7) * 7;
    }

    const months: { label: string; offset: number; span: number }[] = [];
    let cursor = min.startOf("month");
    while (cursor.isBefore(max) || cursor.isSame(max, "month")) {
      const monthStart = cursor.isBefore(min) ? min : cursor;
      const monthEnd = cursor.endOf("month").isAfter(max) ? max : cursor.endOf("month");
      months.push({ label: cursor.format("YYYY-MM"), offset: offset(monthStart), span: span(monthStart, monthEnd) });
      cursor = cursor.add(1, "month").startOf("month");
    }

    return { minDate: min, totalDays: total, months };
  }, [granularity]);

  const dayOffset = (d: dayjs.Dayjs) => d.diff(minDate, "day");
  const daySpan = (a: dayjs.Dayjs, b: dayjs.Dayjs) => b.diff(a, "day") + 1;

  const todayOffset = dayOffset(dayjs());

  const hasDate = (r: Request) => !!(r.start_date && r.due_date);

  const getBar = (r: Request) => {
    const start = r.start_date ? dayjs(r.start_date) : dayjs();
    const end = r.due_date ? dayjs(r.due_date) : dayjs().add(5, "day");
    return { left: dayOffset(start), width: daySpan(start, end) };
  };

  if (items.length === 0) {
    return <Text type="secondary">沒有設定日期的需求，請在編輯中設定開始日與截止日。</Text>;
  }

  const totalWeeks = granularity === "week" ? totalDays / 7 : 0;

  return (
    <>
      <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 16 }}>
        <Segmented
          value={granularity}
          onChange={(val) => setGranularity(val as Granularity)}
          options={[
            { value: "day", label: "天" },
            { value: "week", label: "週" },
          ]}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <Switch size="small" checked={showUndated} onChange={setShowUndated} />
          <Text style={{ fontSize: 13 }}>顯示未排期</Text>
        </label>
      </div>
      <div style={{ overflow: "auto", border: "1px solid #f0f0f0", borderRadius: 8 }}>
        <div style={{ display: "flex", minWidth: LABEL_WIDTH + totalDays * pxPerDay }}>
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
                    left: m.offset * pxPerDay,
                    width: m.span * pxPerDay,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#595959",
                    borderRight: "1px solid #e8e8e8",
                  }}
                >
                  {m.label}
                </div>
              ))}
            </div>

            {/* Day / Week headers */}
            <div style={{ display: "flex", height: 24, borderBottom: "1px solid #e8e8e8" }}>
              {granularity === "day"
                ? Array.from({ length: totalDays }, (_, i) => {
                    const d = minDate.add(i, "day");
                    const isWeekend = d.day() === 0 || d.day() === 6;
                    return (
                      <div
                        key={i}
                        style={{
                          width: DAY_PX,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          color: isWeekend ? "#bfbfbf" : "#8c8c8c",
                          borderRight: "1px solid #e8e8e8",
                        }}
                      >
                        {d.format("DD")}
                      </div>
                    );
                  })
                : Array.from({ length: totalWeeks }, (_, i) => {
                    const weekStart = minDate.add(i * 7, "day");
                    return (
                      <div
                        key={i}
                        style={{
                          width: WEEK_PX,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          color: "#8c8c8c",
                          borderRight: "1px solid #e8e8e8",
                        }}
                      >
                        W{Math.ceil(weekStart.dayOfYear() / 7)}
                      </div>
                    );
                  })}
            </div>

            {/* Today line */}
            {todayOffset >= 0 && todayOffset <= totalDays && (
              <div
                style={{
                  position: "absolute",
                  left: todayOffset * pxPerDay + pxPerDay / 2,
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
              const dated = hasDate(r);
              return (
                <div
                  key={r.id}
                  style={{
                    position: "relative",
                    height: ROW_HEIGHT,
                    borderBottom: "1px solid #f5f5f5",
                    backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent ${(granularity === "day" ? DAY_PX : WEEK_PX) - 1}px, #e8e8e8 ${(granularity === "day" ? DAY_PX : WEEK_PX) - 1}px, #e8e8e8 ${granularity === "day" ? DAY_PX : WEEK_PX}px)`,
                  }}
                >
                  {granularity === "day" &&
                    Array.from({ length: totalDays }, (_, i) => {
                      const d = minDate.add(i, "day");
                      if (d.day() !== 0 && d.day() !== 6) return null;
                      return (
                        <div
                          key={i}
                          style={{
                            position: "absolute",
                            left: i * pxPerDay,
                            width: pxPerDay,
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
                        <div>{dated ? `${r.start_date} ~ ${r.due_date}` : "未排期"}</div>
                        <div>{r.requester} | {r.module}</div>
                      </div>
                    }
                  >
                    <div
                      onClick={() => onClickRequest?.(r.id)}
                      style={{
                        position: "absolute",
                        left: left * pxPerDay + 2,
                        top: 8,
                        width: Math.max(width * pxPerDay - 4, 4),
                        height: ROW_HEIGHT - 16,
                        background: dated ? priorityColors[r.priority] : "transparent",
                        border: dated ? "none" : `2px dashed ${priorityColors[r.priority]}`,
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
                          color: dated ? "#fff" : priorityColors[r.priority],
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
    </>
  );
}
