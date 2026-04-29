import { useEffect, useMemo, useState } from 'react';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { getSymptomModelMetrics } from '../services/symptomService.js';

const formatPct = (value) => `${(Number(value || 0) * 100).toFixed(2)}%`;
const clamp01 = (n) => Math.max(0, Math.min(1, Number(n || 0)));

const HeatmapGrid = ({ xLabels, yLabels, values }) => (
  <div className="overflow-x-auto">
    <div
      className="grid gap-1 min-w-[680px]"
      style={{ gridTemplateColumns: `180px repeat(${xLabels.length}, minmax(80px, 1fr))` }}
    >
      <div />
      {xLabels.map((x) => (
        <div key={x} className="text-[10px] font-semibold text-[#7b8593] uppercase tracking-wide text-center pb-1">
          {x}
        </div>
      ))}
      {yLabels.map((y, rowIdx) => (
        <FragmentRow key={y} rowLabel={y} rowValues={values[rowIdx] || []} />
      ))}
    </div>
  </div>
);

const FragmentRow = ({ rowLabel, rowValues }) => (
  <>
    <div className="text-xs font-medium text-[#3e4c5b] py-2 truncate">{rowLabel}</div>
    {rowValues.map((v, i) => {
      const c = clamp01(v);
      const bg = `rgba(15, 118, 110, ${0.06 + c * 0.7})`;
      const isLight = c < 0.55;
      return (
        <div
          key={`${rowLabel}-${i}`}
          className={`h-10 rounded-lg border border-[#e6e2d6] text-[10px] font-semibold flex items-center justify-center ${
            isLight ? 'text-[#0f1f2e]' : 'text-white'
          }`}
          style={{ backgroundColor: bg }}
          title={`${rowLabel}: ${Number(v).toFixed(4)}`}
        >
          {(Number(v) * 100).toFixed(1)}
        </div>
      );
    })}
  </>
);

const SimpleLineChart = ({ series, width = 840, height = 300 }) => {
  const padding = 40;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const lines = useMemo(() => {
    return series.map((s, idx) => {
      const points = (s.points || []).map((p) => ({
        x: padding + clamp01(p.fpr) * innerW,
        y: padding + (1 - clamp01(p.tpr)) * innerH
      }));
      const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      const colors = ['#0f766e', '#e76f51', '#6366f1', '#0ea5e9'];
      return { id: s.id, d, color: colors[idx % colors.length] };
    });
  }, [series, innerH, innerW, padding]);

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} className="min-w-[840px] bg-[#f0eee6]/40 rounded-xl border border-[#e6e2d6]">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#d4cfbf" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#d4cfbf" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={padding} stroke="#d4cfbf" strokeDasharray="4 4" opacity="0.6" />
        {lines.map((line) => (
          <path key={line.id} d={line.d} fill="none" stroke={line.color} strokeWidth="2.5" />
        ))}
        <text x={width / 2} y={height - 10} textAnchor="middle" fill="#7b8593" fontSize="11">
          False positive rate
        </text>
        <text
          x={14}
          y={height / 2}
          textAnchor="middle"
          fill="#7b8593"
          fontSize="11"
          transform={`rotate(-90, 14, ${height / 2})`}
        >
          True positive rate
        </text>
      </svg>
    </div>
  );
};

const BarHistogram = ({ items }) => {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const w = (item.count / max) * 100;
        return (
          <div key={item.label}>
            <div className="flex justify-between text-xs text-[#3e4c5b] mb-1.5">
              <span className="font-medium">{item.label}</span>
              <span className="text-[#7b8593]">{item.count}</span>
            </div>
            <div className="h-2 bg-[#f0eee6] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${w}%`,
                  background: 'linear-gradient(90deg, #0f766e, #14b8a6)'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TradeoffPlot = ({ items, width = 820, height = 300 }) => {
  const padding = 50;
  const maxComplexity = Math.max(...items.map((i) => i.complexityScore), 1);
  const maxAcc = Math.max(...items.map((i) => i.accuracy), 1);

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} className="min-w-[820px] bg-[#f0eee6]/40 rounded-xl border border-[#e6e2d6]">
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#d4cfbf" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#d4cfbf" />
        {items.map((item) => {
          const x = padding + (item.complexityScore / maxComplexity) * (width - padding * 2);
          const y = (height - padding) - ((item.accuracy / maxAcc) * (height - padding * 2));
          return (
            <g key={item.model}>
              <circle cx={x} cy={y} r="7" fill="#0f766e" opacity="0.85" />
              <text x={x + 12} y={y + 4} fill="#0f1f2e" fontSize="11" fontWeight="500">
                {item.model}
              </text>
            </g>
          );
        })}
        <text x={width / 2} y={height - 14} textAnchor="middle" fill="#7b8593" fontSize="11">
          Complexity score
        </text>
        <text
          x={14}
          y={height / 2}
          textAnchor="middle"
          fill="#7b8593"
          fontSize="11"
          transform={`rotate(-90, 14, ${height / 2})`}
        >
          Accuracy
        </text>
      </svg>
    </div>
  );
};

const GraphTriples = ({ triples }) => (
  <div className="max-h-72 overflow-auto rounded-xl border border-[#e6e2d6]">
    <table className="w-full text-xs">
      <thead className="sticky top-0 bg-[#f0eee6]">
        <tr className="text-[#7b8593] uppercase tracking-wide text-[10px]">
          <th className="p-3 text-left font-semibold">Subject</th>
          <th className="p-3 text-left font-semibold">Predicate</th>
          <th className="p-3 text-left font-semibold">Object</th>
          <th className="p-3 text-right font-semibold">Weight</th>
        </tr>
      </thead>
      <tbody>
        {triples.map((t, idx) => (
          <tr key={`${t.subject}-${idx}`} className="border-t border-[#e6e2d6] text-[#0f1f2e]">
            <td className="p-3">{t.subject}</td>
            <td className="p-3 text-[#0f766e]">{t.predicate}</td>
            <td className="p-3">{t.object}</td>
            <td className="p-3 text-right text-[#7b8593]">{t.weight}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const StatCard = ({ label, value }) => (
  <Card className="p-5">
    <p className="text-xs uppercase tracking-wide text-[#7b8593] font-semibold">{label}</p>
    <p className="font-display text-2xl font-semibold text-[#0f1f2e] mt-2">{value}</p>
  </Card>
);

const ModelAnalytics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getSymptomModelMetrics();
        if (!res?.success) {
          setError(res?.error || 'Couldn\'t load analytics.');
          return;
        }
        setMetrics(res.data);
      } catch (err) {
        setError(err?.response?.data?.error || err?.message || 'Couldn\'t load analytics.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const rocSeries = useMemo(() => {
    const perClass = metrics?.rocAucAnalysis?.perClass || {};
    return Object.entries(perClass).map(([id, data]) => ({ id, points: data.curve || [] }));
  }, [metrics]);

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <div className="text-center mb-4 space-y-3">
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#0f1f2e] tracking-tight">
          Model analytics
        </h1>
        <p className="text-[#3e4c5b] max-w-2xl mx-auto">
          Real evaluation metrics from the trained Naive Bayes / KNN models running in production.
        </p>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : metrics && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Selected model" value={metrics.selectedModelName} />
            <StatCard
              label="Accuracy"
              value={formatPct(metrics.datasetClassificationPerformance?.accuracy)}
            />
            <StatCard label="Macro AUC" value={formatPct(metrics.rocAucAnalysis?.macroAuc)} />
            <StatCard
              label="ANOVA p-value"
              value={Number(metrics.hypothesisTesting?.anova?.pValue || 0).toExponential(2)}
            />
          </div>

          <Card>
            <h2 className="font-display text-lg font-semibold text-[#0f1f2e] mb-4">
              Comparative model metrics
            </h2>
            <HeatmapGrid
              xLabels={metrics.comparativeModelAnalysis?.heatmap?.xLabels || []}
              yLabels={metrics.comparativeModelAnalysis?.heatmap?.yLabels || []}
              values={metrics.comparativeModelAnalysis?.heatmap?.values || []}
            />
          </Card>

          <Card>
            <h2 className="font-display text-lg font-semibold text-[#0f1f2e] mb-4">ROC curves</h2>
            <SimpleLineChart series={rocSeries} />
            <div className="flex flex-wrap gap-2 mt-4">
              {Object.entries(metrics.rocAucAnalysis?.perClass || {}).map(([label, data]) => (
                <span
                  key={label}
                  className="text-xs font-medium text-[#0f1f2e] bg-[#f0eee6] px-3 py-1.5 rounded-full"
                >
                  {label} · AUC {formatPct(data.auc)}
                </span>
              ))}
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <h2 className="font-display text-lg font-semibold text-[#0f1f2e] mb-4">
                Class distribution
              </h2>
              <BarHistogram items={metrics.comparativeModelAnalysis?.histogram?.careClassCounts || []} />
            </Card>

            <Card>
              <h2 className="font-display text-lg font-semibold text-[#0f1f2e] mb-4">
                Accuracy vs complexity
              </h2>
              <TradeoffPlot items={metrics.tradeOffAnalysis || []} />
            </Card>
          </div>

          <Card>
            <h2 className="font-display text-lg font-semibold text-[#0f1f2e] mb-4">
              Feature correlation matrix
            </h2>
            <HeatmapGrid
              xLabels={metrics.comparativeModelAnalysis?.correlationMatrix?.labels || []}
              yLabels={metrics.comparativeModelAnalysis?.correlationMatrix?.labels || []}
              values={(metrics.comparativeModelAnalysis?.correlationMatrix?.matrix || []).map((row) =>
                row.map((v) => (Number(v) + 1) / 2)
              )}
            />
          </Card>

          <Card>
            <h2 className="font-display text-lg font-semibold text-[#0f1f2e] mb-4">
              Healthcare knowledge graph
            </h2>
            <GraphTriples triples={metrics.healthcareKnowledgeGraph?.triples || []} />
          </Card>
        </>
      )}
    </div>
  );
};

export default ModelAnalytics;
