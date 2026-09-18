import React, { useState, useRef, useMemo } from "react";
import {
  BarChart3,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Users,
  MapPin,
  DollarSign,
  Loader2,
  Download,
  Award,
  Search,
  Sparkles,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface RegionData {
  region: string;
  total_revenue: number;
  percentage?: number;
  salespeople_count?: number;
  avg_revenue?: number;
}

interface SalespersonData {
  salesperson: string;
  total_revenue: number;
  region?: string;
  percentage?: number;
  rank?: number;
}

interface AnalyticsSummary {
  total_revenue: number;
  total_records: number;
  total_regions: number;
  total_salespeople: number;
  avg_revenue_per_salesperson: number;
  median_revenue_per_salesperson?: number;
  top_region: string;
  top_region_revenue: number;
  top_region_percentage?: number;
  top_salesperson: string;
  top_salesperson_revenue: number;
  top_salesperson_percentage?: number;
  top_salesperson_region?: string;
  revenue_by_region: RegionData[];
  top_salespeople: SalespersonData[];
  all_salespeople?: SalespersonData[];
}

interface AnalyticsResult {
  success: boolean;
  export_format?: "png" | "json";
  charts?: {
    revenue_by_region?: { png: string | null; plotly?: string | null };
    top_salespeople?: { png: string | null; plotly?: string | null };
  };
  summary: AnalyticsSummary;
}

const ANALYTICS_URL = "http://localhost:5001";

// ─────────────────────────────────────────────────────────────────────────────
// Color Palettes & Helpers
// ─────────────────────────────────────────────────────────────────────────────

const REGION_PALETTES: Record<string, { bg: string; fill: string; gradient: string; text: string; lightBg: string; border: string }> = {
  East: {
    bg: "#2563eb",
    fill: "#3b82f6",
    gradient: "linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)",
    text: "#1d4ed8",
    lightBg: "#eff6ff",
    border: "#bfdbfe",
  },
  West: {
    bg: "#059669",
    fill: "#10b981",
    gradient: "linear-gradient(180deg, #10b981 0%, #047857 100%)",
    text: "#065f46",
    lightBg: "#ecfdf5",
    border: "#a7f3d0",
  },
  North: {
    bg: "#7c3aed",
    fill: "#8b5cf6",
    gradient: "linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%)",
    text: "#6d28d9",
    lightBg: "#f5f3ff",
    border: "#ddd6fe",
  },
  South: {
    bg: "#d97706",
    fill: "#f59e0b",
    gradient: "linear-gradient(180deg, #f59e0b 0%, #b45309 100%)",
    text: "#b45309",
    lightBg: "#fffbeb",
    border: "#fde68a",
  },
};

const DEFAULT_COLOR = {
  bg: "#4f46e5",
  fill: "#6366f1",
  gradient: "linear-gradient(180deg, #6366f1 0%, #4338ca 100%)",
  text: "#4338ca",
  lightBg: "#eef2ff",
  border: "#c7d2fe",
};

function getRegionColor(region: string) {
  return REGION_PALETTES[region] || DEFAULT_COLOR;
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function formatFullCurrency(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const DEFAULT_SAMPLE_CSV = `salesperson,revenue,region
Alice Johnson,87400,East
Bob Smith,62300,West
Carol Williams,95750,North
David Brown,43200,South
Emma Davis,112600,East
Frank Miller,38900,West
Grace Wilson,71400,North
Henry Moore,88500,East
Isabella Taylor,55200,South
James Anderson,79800,West
Karen Thomas,91100,North
Liam Jackson,47300,South
Mia White,103700,East
Noah Harris,66400,West
Olivia Martin,84200,North
Paul Thompson,52800,South
Quinn Garcia,73600,East
Rachel Martinez,69900,West
Samuel Robinson,96300,North
Tina Clark,41500,South
Uma Lewis,58700,East
Victor Lee,77200,West
Wendy Walker,89400,North
Xander Hall,34600,South
Yara Allen,61800,East
Zach Young,48900,West
Anna Hernandez,82100,North
Brian King,55400,South
Chloe Wright,94600,East
Daniel Scott,70300,West`;

// ─────────────────────────────────────────────────────────────────────────────
// Interactive Native SVG Column Chart (Revenue by Region)
// ─────────────────────────────────────────────────────────────────────────────

interface RegionChartProps {
  data: RegionData[];
  totalRevenue: number;
}

const InteractiveRegionChart: React.FC<RegionChartProps> = ({ data, totalRevenue }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxRevenue = useMemo(() => {
    return Math.max(...data.map((d) => d.total_revenue), 1000);
  }, [data]);

  // Round maxRevenue up to a nice ceiling for y-axis
  const yCeiling = Math.ceil((maxRevenue * 1.15) / 100000) * 100000 || maxRevenue * 1.2;
  const yTicks = [0, yCeiling * 0.25, yCeiling * 0.5, yCeiling * 0.75, yCeiling];

  const svgHeight = 280;
  const svgWidth = 560;
  const padding = { top: 35, right: 30, bottom: 45, left: 65 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const barWidth = Math.min(68, plotWidth / (data.length * 1.6));
  const spacing = plotWidth / data.length;

  return (
    <div style={{ position: "relative", width: "100%", userSelect: "none" }}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="grad-East" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="grad-West" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="grad-North" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
          <linearGradient id="grad-South" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="grad-Default" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4338ca" />
          </linearGradient>
          <filter id="bar-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Y-Axis Horizontal Grid lines and labels */}
        {yTicks.map((tick, i) => {
          const y = padding.top + plotHeight - (tick / yCeiling) * plotHeight;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={svgWidth - padding.right}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth={i === 0 ? "1.5" : "1"}
                strokeDasharray={i === 0 ? "none" : "3,3"}
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="11"
                fontWeight="500"
                fontFamily="inherit"
              >
                {formatCurrency(tick)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, i) => {
          const barHeight = Math.max(8, (item.total_revenue / yCeiling) * plotHeight);
          const x = padding.left + i * spacing + (spacing - barWidth) / 2;
          const y = padding.top + plotHeight - barHeight;
          const isHovered = hoveredIdx === i;
          const gradId = `grad-${item.region}` in REGION_PALETTES ? `grad-${item.region}` : "grad-Default";
          const pct = totalRevenue > 0 ? ((item.total_revenue / totalRevenue) * 100).toFixed(1) : "0";

          return (
            <g
              key={item.region}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: "pointer", transition: "all 0.2s ease" }}
            >
              {/* Invisible touch/hover hit zone */}
              <rect
                x={padding.left + i * spacing}
                y={padding.top}
                width={spacing}
                height={plotHeight}
                fill="transparent"
              />

              {/* Bar background highlight on hover */}
              {isHovered && (
                <rect
                  x={x - 4}
                  y={padding.top}
                  width={barWidth + 8}
                  height={plotHeight}
                  rx="8"
                  fill="#f8fafc"
                  opacity="0.8"
                />
              )}

              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="6"
                fill={`url(#${gradId})`}
                filter={isHovered ? "url(#bar-glow)" : undefined}
                opacity={hoveredIdx !== null && !isHovered ? 0.6 : 1}
                stroke={isHovered ? "#ffffff" : "transparent"}
                strokeWidth="1.5"
                style={{ transition: "transform 0.2s ease, opacity 0.2s ease" }}
              />

              {/* Value label on top of bar */}
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                fill={isHovered ? "#0f172a" : "#475569"}
                fontSize={isHovered ? "12" : "11"}
                fontWeight="700"
                fontFamily="inherit"
              >
                {formatCurrency(item.total_revenue)}
              </text>

              {/* X-Axis Region Label */}
              <text
                x={x + barWidth / 2}
                y={padding.top + plotHeight + 20}
                textAnchor="middle"
                fill={isHovered ? "#0f172a" : "#334155"}
                fontSize="12"
                fontWeight={isHovered ? "800" : "600"}
                fontFamily="inherit"
              >
                {item.region}
              </text>

              {/* Percentage below region */}
              <text
                x={x + barWidth / 2}
                y={padding.top + plotHeight + 35}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="10"
                fontWeight="600"
                fontFamily="inherit"
              >
                {pct}%
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Detailed Tooltip */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "16px",
            backgroundColor: "#0f172a",
            color: "#ffffff",
            padding: "10px 14px",
            borderRadius: "10px",
            boxShadow: "0 10px 25px -3px rgba(0, 0, 0, 0.25)",
            fontSize: "12px",
            pointerEvents: "none",
            animation: "fadeUp 0.15s ease both",
            zIndex: 10,
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: getRegionColor(data[hoveredIdx].region).fill,
                display: "inline-block",
              }}
            />
            <span style={{ fontWeight: 700, fontSize: "13px" }}>{data[hoveredIdx].region} Region</span>
          </div>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "#38bdf8" }}>
            {formatFullCurrency(data[hoveredIdx].total_revenue)}
          </div>
          <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: "2px" }}>
            {((data[hoveredIdx].total_revenue / totalRevenue) * 100).toFixed(1)}% of company revenue
          </div>
          {data[hoveredIdx].salespeople_count && (
            <div style={{ color: "#cbd5e1", fontSize: "11px", marginTop: "4px" }}>
              👥 {data[hoveredIdx].salespeople_count} Sales Executives
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Interactive Native Horizontal Leaderboard (Top Salespeople)
// ─────────────────────────────────────────────────────────────────────────────

interface TopSalespeopleChartProps {
  data: SalespersonData[];
  totalRevenue: number;
}

const InteractiveTopSalespeople: React.FC<TopSalespeopleChartProps> = ({ data, totalRevenue }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxRevenue = useMemo(() => {
    return data.length > 0 ? Math.max(...data.map((d) => d.total_revenue)) : 100000;
  }, [data]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
      {data.map((item, idx) => {
        const isHovered = hoveredIdx === idx;
        const widthPct = Math.max(8, (item.total_revenue / maxRevenue) * 100);
        const sharePct = totalRevenue > 0 ? ((item.total_revenue / totalRevenue) * 100).toFixed(1) : "0";
        const region = item.region || "General";
        const regionTheme = getRegionColor(region);

        // Rank styling for 1st, 2nd, 3rd, and rest
        let rankBadgeBg = "#f1f5f9";
        let rankBadgeColor = "#475569";
        let rankIcon: React.ReactNode = <span>{idx + 1}</span>;

        if (idx === 0) {
          rankBadgeBg = "#fef3c7";
          rankBadgeColor = "#b45309";
          rankIcon = <span>🥇</span>;
        } else if (idx === 1) {
          rankBadgeBg = "#f1f5f9";
          rankBadgeColor = "#334155";
          rankIcon = <span>🥈</span>;
        } else if (idx === 2) {
          rankBadgeBg = "#ffedd5";
          rankBadgeColor = "#c2410c";
          rankIcon = <span>🥉</span>;
        }

        return (
          <div
            key={item.salesperson}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              backgroundColor: isHovered ? "#f8faff" : "#ffffff",
              border: isHovered ? "1px solid #bfdbfe" : "1px solid #f1f5f9",
              boxShadow: isHovered ? "0 4px 14px rgba(37, 99, 235, 0.08)" : "none",
              transition: "all 0.18s ease",
              cursor: "pointer",
            }}
          >
            {/* Top row: Name, Avatar, Region Tag, Revenue Value */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {/* Rank Badge */}
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "8px",
                    backgroundColor: rankBadgeBg,
                    color: rankBadgeColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: idx < 3 ? "14px" : "11px",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {rankIcon}
                </div>

                {/* Avatar Initials */}
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, hsl(${(idx * 55 + 210) % 360}, 80%, 55%), hsl(${(idx * 55 + 240) % 360}, 85%, 45%))`,
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    flexShrink: 0,
                    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                  }}
                >
                  {getInitials(item.salesperson)}
                </div>

                {/* Salesperson Name & Region Tag */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: isHovered ? "#1d4ed8" : "#0f172a",
                      transition: "color 0.15s ease",
                    }}
                  >
                    {item.salesperson}
                  </span>
                  {item.region && (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        backgroundColor: regionTheme.lightBg,
                        color: regionTheme.text,
                        border: `1px solid ${regionTheme.border}`,
                      }}
                    >
                      {item.region}
                    </span>
                  )}
                </div>
              </div>

              {/* Revenue & Share badge */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#64748b",
                    backgroundColor: "#f1f5f9",
                    padding: "2px 6px",
                    borderRadius: "6px",
                  }}
                >
                  {sharePct}% share
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 800,
                    color: isHovered ? "#2563eb" : "#0f172a",
                    letterSpacing: "-0.2px",
                  }}
                >
                  {formatFullCurrency(item.total_revenue)}
                </span>
              </div>
            </div>

            {/* Interactive Progress Bar */}
            <div
              style={{
                height: "8px",
                backgroundColor: "#f1f5f9",
                borderRadius: "9999px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${widthPct}%`,
                  borderRadius: "9999px",
                  background: isHovered
                    ? "linear-gradient(90deg, #2563eb 0%, #38bdf8 100%)"
                    : "linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)",
                  transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease",
                  boxShadow: isHovered ? "0 0 10px rgba(59, 130, 246, 0.5)" : "none",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Regional Distribution Multi-Segment Bar
// ─────────────────────────────────────────────────────────────────────────────

interface RegionDistributionProps {
  data: RegionData[];
  totalRevenue: number;
}

const RegionDistributionBar: React.FC<RegionDistributionProps> = ({ data, totalRevenue }) => {
  return (
    <div style={{ marginTop: "16px" }}>
      <div
        style={{
          display: "flex",
          height: "12px",
          borderRadius: "9999px",
          overflow: "hidden",
          backgroundColor: "#f1f5f9",
          gap: "2px",
          padding: "2px",
        }}
      >
        {data.map((item) => {
          const pct = totalRevenue > 0 ? (item.total_revenue / totalRevenue) * 100 : 0;
          const theme = getRegionColor(item.region);
          return (
            <div
              key={item.region}
              style={{
                width: `${pct}%`,
                height: "100%",
                borderRadius: "4px",
                backgroundColor: theme.fill,
                transition: "width 0.3s ease",
              }}
              title={`${item.region}: ${formatCurrency(item.total_revenue)} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Legend & Details */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(130px, 1fr))`,
          gap: "12px",
          marginTop: "16px",
        }}
      >
        {data.map((item) => {
          const pct = totalRevenue > 0 ? ((item.total_revenue / totalRevenue) * 100).toFixed(1) : "0";
          const theme = getRegionColor(item.region);
          return (
            <div
              key={item.region}
              style={{
                padding: "10px 12px",
                borderRadius: "10px",
                backgroundColor: theme.lightBg,
                border: `1px solid ${theme.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: theme.text }}>{item.region}</span>
                <span style={{ fontSize: "11px", fontWeight: 800, color: theme.text }}>{pct}%</span>
              </div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                {formatCurrency(item.total_revenue)}
              </div>
              {item.salespeople_count && (
                <div style={{ fontSize: "10px", color: "#64748b", marginTop: "2px" }}>
                  {item.salespeople_count} sales reps
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card Component
// ─────────────────────────────────────────────────────────────────────────────

interface StatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  badge?: string;
  color: string;
}

const StatCard: React.FC<StatProps> = ({ icon, label, value, sub, badge, color }) => (
  <div
    className="glass-card"
    style={{
      padding: "20px",
      display: "flex",
      alignItems: "flex-start",
      gap: "16px",
      backgroundColor: "#ffffff",
      borderRadius: "16px",
      border: "1px solid #E5E7EB",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.02)",
    }}
  >
    <div
      style={{
        width: "46px",
        height: "46px",
        borderRadius: "14px",
        backgroundColor: `${color}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </span>
        {badge && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: "9999px",
              backgroundColor: `${color}18`,
              color: color,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: "22px",
          fontWeight: 800,
          color: "#0f172a",
          marginTop: "4px",
          letterSpacing: "-0.5px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px", fontWeight: 500 }}>{sub}</div>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const AnalyticsView: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalyticsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Table search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>("All");

  const handleFile = (file: File) => {
    const ext = file.name.toLowerCase().split(".").pop();
    if (ext !== "csv" && ext !== "xlsx" && ext !== "xls") {
      setError("Please upload a CSV or Excel (.xlsx, .xls) file.");
      return;
    }
    setSelectedFile(file);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const analyze = async (fileToAnalyze?: File) => {
    const file = fileToAnalyze || selectedFile;
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(`${ANALYTICS_URL}/analyze`, { method: "POST", body: form });
      const data: AnalyticsResult = await res.json();
      if (!data.success) {
        setError((data as any).error ?? "Analysis failed. Please check file format.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Could not reach Analytics Service. Make sure it's running on port 5001.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Quick load with sample data
  const loadSampleData = async () => {
    const blob = new Blob([DEFAULT_SAMPLE_CSV], { type: "text/csv" });
    const file = new File([blob], "sample_sales_data.csv", { type: "text/csv" });
    setSelectedFile(file);
    await analyze(file);
  };

  const downloadSampleCSV = () => {
    const blob = new Blob([DEFAULT_SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_sales_data.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSampleExcel = () => {
    const a = document.createElement("a");
    a.href = `${ANALYTICS_URL}/sample-excel`;
    a.download = "sample_sales_data.xlsx";
    a.click();
  };

  const downloadExportCSV = () => {
    if (!result) return;
    const rows = [
      ["salesperson", "revenue", "region", "rank", "percentage"],
      ...(result.summary.all_salespeople || result.summary.top_salespeople).map((s) => [
        `"${s.salesperson}"`,
        s.total_revenue,
        `"${s.region || ""}"`,
        s.rank || "",
        s.percentage || "",
      ]),
    ];
    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales_analytics_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Optional high-res PNG download if backend Kaleido produced it
  const downloadPngChart = (key: "revenue_by_region" | "top_salespeople") => {
    const chart = result?.charts?.[key];
    if (chart?.png) {
      const a = document.createElement("a");
      a.href = `data:image/png;base64,${chart.png}`;
      a.download = `${key}_high_res.png`;
      a.click();
    }
  };

  // Filtered salespeople list for table
  const filteredSalespeople = useMemo(() => {
    if (!result) return [];
    const list = result.summary.all_salespeople || result.summary.top_salespeople;
    return list.filter((s) => {
      const matchesSearch = s.salesperson.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = selectedRegionFilter === "All" || s.region === selectedRegionFilter;
      return matchesSearch && matchesRegion;
    });
  }, [result, searchQuery, selectedRegionFilter]);

  const uniqueRegions = useMemo(() => {
    if (!result) return ["All"];
    const regions = result.summary.revenue_by_region.map((r) => r.region);
    return ["All", ...regions];
  }, [result]);

  return (
    <div style={{ animation: "fadeUp 0.3s ease both", maxWidth: "1380px", margin: "0 auto", paddingBottom: "48px" }}>
      {/* ── Page Header ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
            }}
          >
            <BarChart3 size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>
              Sales Analytics & Performance
            </h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0 0" }}>
              Native interactive charts, regional revenue distribution, and executive performance metrics
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={loadSampleData}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              borderRadius: "10px",
              border: "1px solid #bfdbfe",
              backgroundColor: "#eff6ff",
              color: "#1d4ed8",
              fontSize: "13px",
              fontWeight: 700,
              fontFamily: "inherit",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#dbeafe";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#eff6ff";
            }}
            title="Immediately test analytics with 30 sample records"
          >
            <Sparkles size={14} /> Quick Demo Data
          </button>

          <button
            onClick={downloadSampleExcel}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 14px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#334155",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f8fafc";
              e.currentTarget.style.borderColor = "#94a3b8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
          >
            <Download size={13} /> Sample Excel (.xlsx)
          </button>

          <button
            onClick={downloadSampleCSV}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 14px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#334155",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f8fafc";
              e.currentTarget.style.borderColor = "#94a3b8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
          >
            <FileText size={13} /> Sample CSV
          </button>
        </div>
      </div>

      {/* ── File Upload Section ────────────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <div
          id="analytics-dropzone"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? "#2563eb" : selectedFile ? "#10b981" : "#cbd5e1"}`,
            borderRadius: "14px",
            padding: "28px 20px",
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: isDragging ? "#eff6ff" : selectedFile ? "#f0fdf4" : "#fafbff",
            transition: "all 0.2s ease",
          }}
        >
          <input
            ref={fileInputRef}
            id="analytics-file-input"
            type="file"
            accept=".csv, .xlsx, .xls"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />

          {selectedFile ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "#dcfce7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "10px",
                }}
              >
                <CheckCircle2 size={26} color="#15803d" />
              </div>
              <div style={{ fontWeight: 800, fontSize: "15px", color: "#166534" }}>{selectedFile.name}</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                {(selectedFile.size / 1024).toFixed(1)} KB · Ready for analysis · Click to replace
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "10px",
                }}
              >
                <Upload size={22} color="#2563eb" />
              </div>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>
                Drop your CSV or Excel file here, or click to browse
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                Supports <code>.csv</code> and <code>.xlsx</code> (e.g. <code>sample_sales_data.xlsx</code>) ·
                Required columns: <code>salesperson, revenue, region</code>
              </div>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              marginTop: "14px",
              padding: "12px 16px",
              borderRadius: "10px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <AlertCircle size={16} color="#dc2626" />
            <span style={{ fontSize: "13px", color: "#991b1b", fontWeight: 500 }}>{error}</span>
          </div>
        )}

        {/* Primary Action Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
          <button
            id="analyze-btn"
            onClick={() => analyze()}
            disabled={!selectedFile || isAnalyzing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "11px 26px",
              borderRadius: "12px",
              border: "none",
              background: !selectedFile || isAnalyzing ? "#e2e8f0" : "linear-gradient(135deg, #2563eb, #4f46e5)",
              color: !selectedFile || isAnalyzing ? "#94a3b8" : "#ffffff",
              fontWeight: 700,
              fontSize: "14px",
              fontFamily: "inherit",
              cursor: !selectedFile || isAnalyzing ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              boxShadow: !selectedFile || isAnalyzing ? "none" : "0 4px 14px rgba(37, 99, 235, 0.35)",
            }}
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} /> Analyzing Data…
              </>
            ) : (
              <>
                <BarChart3 size={16} /> Run Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Results Container ─────────────────────────────────────────────────── */}
      {result && (
        <div style={{ animation: "fadeUp 0.35s ease both" }}>
          {/* Executive KPI Stats Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <StatCard
              icon={<DollarSign size={22} color="#2563eb" />}
              label="Total Revenue"
              value={formatFullCurrency(result.summary.total_revenue)}
              sub={`Analyzed from ${result.summary.total_records} data records`}
              badge={`${result.summary.total_regions} Regions`}
              color="#2563eb"
            />
            <StatCard
              icon={<MapPin size={22} color="#059669" />}
              label="Top Region"
              value={result.summary.top_region}
              sub={`${formatFullCurrency(result.summary.top_region_revenue)} total revenue`}
              badge={`${result.summary.top_region_percentage ?? ((result.summary.top_region_revenue / result.summary.total_revenue) * 100).toFixed(1)}% share`}
              color="#059669"
            />
            <StatCard
              icon={<Award size={22} color="#7c3aed" />}
              label="Top Sales Rep"
              value={result.summary.top_salesperson}
              sub={`${formatFullCurrency(result.summary.top_salesperson_revenue)} generated`}
              badge="Top Performer"
              color="#7c3aed"
            />
            <StatCard
              icon={<Users size={22} color="#d97706" />}
              label="Average / Sales Rep"
              value={formatFullCurrency(result.summary.avg_revenue_per_salesperson)}
              sub={`Across ${result.summary.total_salespeople} sales representatives`}
              color="#d97706"
            />
          </div>

          {/* ── Native Interactive Charts Row (DIRECT UI, NO STATIC IMAGES) ──────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            {/* Chart 1: Revenue by Region */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                      💰 Revenue by Region
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        backgroundColor: "#eff6ff",
                        color: "#2563eb",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                      }}
                    >
                      Interactive UI
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "3px 0 0 0" }}>
                    Hover over bars to inspect regional figures and metrics
                  </p>
                </div>

                {/* Optional high-res PNG download for external presentation */}
                {result.charts?.revenue_by_region?.png && (
                  <button
                    onClick={() => downloadPngChart("revenue_by_region")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "6px 11px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#f8fafc",
                      color: "#334155",
                      fontSize: "11px",
                      fontWeight: 700,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#2563eb";
                      e.currentTarget.style.color = "#ffffff";
                      e.currentTarget.style.borderColor = "#2563eb";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#f8fafc";
                      e.currentTarget.style.color = "#334155";
                      e.currentTarget.style.borderColor = "#cbd5e1";
                    }}
                    title="Export high-resolution PNG for slides"
                  >
                    <Download size={12} /> Export PNG
                  </button>
                )}
              </div>

              {/* Native Vector SVG Bar Chart */}
              <InteractiveRegionChart
                data={result.summary.revenue_by_region}
                totalRevenue={result.summary.total_revenue}
              />

              {/* Regional Share Distribution Segmented Bar */}
              <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#475569" }}>
                    Market Share Distribution
                  </span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>100% of Company Revenue</span>
                </div>
                <RegionDistributionBar
                  data={result.summary.revenue_by_region}
                  totalRevenue={result.summary.total_revenue}
                />
              </div>
            </div>

            {/* Chart 2: Top Salespeople Leaderboard */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                      🏆 Top Sales Performers
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        backgroundColor: "#fef3c7",
                        color: "#b45309",
                        padding: "2px 8px",
                        borderRadius: "9999px",
                      }}
                    >
                      Leaderboard
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "3px 0 0 0" }}>
                    Ranked by total revenue closed with proportional progress bars
                  </p>
                </div>

                {/* Optional high-res PNG download for external presentation */}
                {result.charts?.top_salespeople?.png && (
                  <button
                    onClick={() => downloadPngChart("top_salespeople")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "6px 11px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#f8fafc",
                      color: "#334155",
                      fontSize: "11px",
                      fontWeight: 700,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#2563eb";
                      e.currentTarget.style.color = "#ffffff";
                      e.currentTarget.style.borderColor = "#2563eb";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#f8fafc";
                      e.currentTarget.style.color = "#334155";
                      e.currentTarget.style.borderColor = "#cbd5e1";
                    }}
                    title="Export high-resolution PNG for slides"
                  >
                    <Download size={12} /> Export PNG
                  </button>
                )}
              </div>

              {/* Native UI Comparative Leaderboard */}
              <div style={{ flex: 1, overflowY: "auto", maxHeight: "490px", paddingRight: "4px" }}>
                <InteractiveTopSalespeople
                  data={result.summary.top_salespeople}
                  totalRevenue={result.summary.total_revenue}
                />
              </div>
            </div>
          </div>

          {/* ── Interactive Data Directory & Detailed Table ──────────────────────── */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #E5E7EB",
              boxShadow: "0 1px 4px rgba(0, 0, 0, 0.04)",
              padding: "24px",
            }}
          >
            {/* Table Controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
                flexWrap: "wrap",
                gap: "14px",
              }}
            >
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  📋 Sales Representatives Breakdown
                </h3>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0 0" }}>
                  Showing {filteredSalespeople.length} of {result.summary.total_salespeople} representatives
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                {/* Search input */}
                <div style={{ position: "relative", minWidth: "220px" }}>
                  <Search
                    size={14}
                    color="#94a3b8"
                    style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
                  />
                  <input
                    type="text"
                    placeholder="Search sales rep..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px 8px 32px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      fontFamily: "inherit",
                      outline: "none",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#cbd5e1")}
                  />
                </div>

                {/* Region Filter Buttons */}
                <div style={{ display: "flex", gap: "4px", backgroundColor: "#f1f5f9", padding: "3px", borderRadius: "8px" }}>
                  {uniqueRegions.map((region) => (
                    <button
                      key={region}
                      onClick={() => setSelectedRegionFilter(region)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "11px",
                        fontWeight: 700,
                        fontFamily: "inherit",
                        cursor: "pointer",
                        backgroundColor: selectedRegionFilter === region ? "#ffffff" : "transparent",
                        color: selectedRegionFilter === region ? "#0f172a" : "#64748b",
                        boxShadow: selectedRegionFilter === region ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {region}
                    </button>
                  ))}
                </div>

                {/* Export CSV Button */}
                <button
                  onClick={downloadExportCSV}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    color: "#0f172a",
                    fontSize: "12px",
                    fontWeight: 700,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                    e.currentTarget.style.borderColor = "#2563eb";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffffff";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                  }}
                >
                  <Download size={13} /> Export CSV
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#64748b", padding: "10px 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rank</th>
                    <th style={{ textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#64748b", padding: "10px 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sales Representative</th>
                    <th style={{ textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#64748b", padding: "10px 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Region</th>
                    <th style={{ textAlign: "right", fontSize: "11px", fontWeight: 700, color: "#64748b", padding: "10px 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Revenue Closed</th>
                    <th style={{ textAlign: "right", fontSize: "11px", fontWeight: 700, color: "#64748b", padding: "10px 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>% of Total</th>
                    <th style={{ textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#64748b", padding: "10px 12px", textTransform: "uppercase", letterSpacing: "0.05em", width: "160px" }}>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalespeople.map((rep, index) => {
                    const rank = rep.rank || index + 1;
                    const region = rep.region || "General";
                    const regionTheme = getRegionColor(region);
                    const pct = result.summary.total_revenue > 0 ? (rep.total_revenue / result.summary.total_revenue) * 100 : 0;
                    const isTopThree = rank <= 3;

                    return (
                      <tr
                        key={rep.salesperson}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          transition: "background-color 0.15s ease",
                        }}
                      >
                        {/* Rank */}
                        <td style={{ padding: "12px", fontSize: "13px", fontWeight: 700, color: isTopThree ? "#b45309" : "#64748b" }}>
                          {rank === 1 ? "🥇 1" : rank === 2 ? "🥈 2" : rank === 3 ? "🥉 3" : `#${rank}`}
                        </td>

                        {/* Name & Avatar */}
                        <td style={{ padding: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: "30px",
                                height: "30px",
                                borderRadius: "50%",
                                backgroundColor: regionTheme.lightBg,
                                color: regionTheme.text,
                                border: `1px solid ${regionTheme.border}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "11px",
                                fontWeight: 800,
                                flexShrink: 0,
                              }}
                            >
                              {getInitials(rep.salesperson)}
                            </div>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                              {rep.salesperson}
                            </span>
                          </div>
                        </td>

                        {/* Region */}
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: "6px",
                              backgroundColor: regionTheme.lightBg,
                              color: regionTheme.text,
                              border: `1px solid ${regionTheme.border}`,
                            }}
                          >
                            {region}
                          </span>
                        </td>

                        {/* Revenue */}
                        <td style={{ padding: "12px", textAlign: "right", fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>
                          {formatFullCurrency(rep.total_revenue)}
                        </td>

                        {/* % of Total */}
                        <td style={{ padding: "12px", textAlign: "right", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                          {pct.toFixed(1)}%
                        </td>

                        {/* Mini visual bar */}
                        <td style={{ padding: "12px" }}>
                          <div style={{ height: "6px", backgroundColor: "#f1f5f9", borderRadius: "9999px", overflow: "hidden", width: "100%" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${Math.min(100, pct * 8)}%`,
                                backgroundColor: regionTheme.fill,
                                borderRadius: "9999px",
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredSalespeople.length === 0 && (
                <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                  No sales representatives matched your filter criteria.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;
