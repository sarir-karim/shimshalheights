import { formatCurrency } from "@/lib/utils";
import { monthLabel } from "@/lib/format";

interface Point { month: string; value: number }
const niceMax = (v: number) => { if (v <= 0) return 4; const p = 10 ** Math.floor(Math.log10(v)); return Math.ceil(v / p) * p; };

/** Dependency-free SVG charts. Each has a text summary (role=img + aria-label) and a hidden data table for screen readers. */
function Frame({ title, points, format, children }: { title: string; points: Point[]; format: (n: number) => string; children: React.ReactNode }) {
  const total = points.reduce((s, p) => s + p.value, 0);
  return (
    <figure>
      <svg viewBox="0 0 520 220" className="w-full" role="img" aria-label={`${title}. Total ${format(total)} over ${points.length} months.`}>{children}</svg>
      <table className="sr-only"><caption>{title}</caption><thead><tr><th>Month</th><th>Value</th></tr></thead><tbody>{points.map((p) => <tr key={p.month}><td>{p.month}</td><td>{format(p.value)}</td></tr>)}</tbody></table>
    </figure>
  );
}

function Axes({ max, format }: { max: number; format: (n: number) => string }) {
  return (
    <>
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1="52" x2="510" y1={180 - f * 150} y2={180 - f * 150} stroke="#DDD7C8" strokeWidth="1" strokeDasharray={f === 0 ? "0" : "3 4"} />
          <text x="46" y={184 - f * 150} textAnchor="end" fontSize="11" fill="#6E7572">{format(Math.round(max * f))}</text>
        </g>
      ))}
    </>
  );
}

export function BarChart({ title, points }: { title: string; points: Point[] }) {
  const fmt = (n: number) => String(n);
  const max = niceMax(Math.max(0, ...points.map((p) => p.value)));
  const slot = 458 / Math.max(points.length, 1);
  return (
    <Frame title={title} points={points} format={fmt}>
      <Axes max={max} format={fmt} />
      {points.map((p, i) => {
        const h = (p.value / max) * 150;
        const x = 52 + i * slot + slot * 0.2;
        return (
          <g key={p.month}>
            <rect x={x} y={180 - h} width={slot * 0.6} height={Math.max(h, p.value > 0 ? 2 : 0)} rx="6" fill="#1F3B2D"><title>{`${monthLabel(p.month)}: ${p.value}`}</title></rect>
            {p.value > 0 && <text x={x + slot * 0.3} y={174 - h} textAnchor="middle" fontSize="11" fontWeight="600" fill="#1F3B2D">{p.value}</text>}
            <text x={x + slot * 0.3} y="200" textAnchor="middle" fontSize="11" fill="#4A504E">{monthLabel(p.month)}</text>
          </g>
        );
      })}
    </Frame>
  );
}

export function LineChart({ title, points }: { title: string; points: Point[] }) {
  const compact = (n: number) => (n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));
  const max = niceMax(Math.max(0, ...points.map((p) => p.value)));
  const slot = 458 / Math.max(points.length, 1);
  const xy = points.map((p, i) => [52 + i * slot + slot / 2, 180 - (p.value / max) * 150] as const);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return (
    <Frame title={title} points={points} format={(n) => formatCurrency(n)}>
      <Axes max={max} format={compact} />
      {xy.length > 0 && <path d={`${line} L${xy.at(-1)![0]} 180 L${xy[0][0]} 180 Z`} fill="#C9AE7C" opacity="0.25" />}
      <path d={line} fill="none" stroke="#A98B55" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {xy.map(([x, y], i) => (
        <g key={points[i].month}>
          <circle cx={x} cy={y} r="4.5" fill="#fff" stroke="#A98B55" strokeWidth="2.5"><title>{`${monthLabel(points[i].month)}: ${formatCurrency(points[i].value)}`}</title></circle>
          <text x={x} y="200" textAnchor="middle" fontSize="11" fill="#4A504E">{monthLabel(points[i].month)}</text>
        </g>
      ))}
    </Frame>
  );
}
