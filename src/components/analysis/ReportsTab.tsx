import { useState, useMemo } from "react";
import { startOfDay } from "date-fns";
import { useMeals, type LoggedMeal } from "@/contexts/MealContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, TrendingDown, Target, Sparkles, Lock, Crown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const PERIOD_OPTIONS = [
  { label: "7 Dias", value: 7 },
  { label: "15 Dias", value: 15 },
  { label: "30 Dias", value: 30 },
];

function generateReportData(loggedMeals: LoggedMeal[], dailyGoal: number, periodDays: number) {
  const today = new Date();
  const days: { day: string; date: string; fullDate: string; calories: number; protein: number; carbs: number; fat: number }[] = [];

  for (let i = periodDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = startOfDay(d).toISOString().slice(0, 10);
    const label = i === 0 ? "Hoje" : periodDays <= 7 ? DAY_LABELS[d.getDay()] : `${d.getDate()}/${d.getMonth() + 1}`;

    let calories = 0, protein = 0, carbs = 0, fat = 0;
    for (const meal of loggedMeals) {
      const mealLocalDate = startOfDay(new Date(meal.loggedAt)).toISOString().slice(0, 10);
      if (mealLocalDate === dateKey) {
        for (const item of meal.items) {
          calories += item.calories;
          protein += item.protein;
          carbs += item.carbs;
          fat += item.fat;
        }
      }
    }

    days.push({
      day: label,
      date: dateKey,
      fullDate: `${d.getDate()}/${d.getMonth() + 1}`,
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
    });
  }

  const totalCal = days.reduce((s, d) => s + d.calories, 0);
  const daysWithData = days.filter((d) => d.calories > 0).length;
  const avgCalories = daysWithData > 0 ? Math.round(totalCal / daysWithData) : 0;
  const daysOnTarget = days.filter((d) => d.calories > 0 && d.calories <= dailyGoal).length;

  const totalProtein = days.reduce((s, d) => s + d.protein, 0);
  const totalCarbs = days.reduce((s, d) => s + d.carbs, 0);
  const totalFat = days.reduce((s, d) => s + d.fat, 0);

  return { days, avgCalories, daysOnTarget, daysWithData, totalProtein, totalCarbs, totalFat };
}

/* ── Custom Tooltip for Calories ── */
const CaloriesTooltip = ({ active, payload, dailyGoal }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-2xl bg-foreground/90 backdrop-blur-sm px-4 py-3 shadow-xl text-xs border border-border/10">
      <p className="font-semibold text-background mb-1.5">{data.fullDate}</p>
      <div className="space-y-1">
        <p className="text-background/80">
          Consumido: <span className="font-bold text-background">{data.calories}</span> kcal
        </p>
        <p className="text-background/80">
          Meta: <span className="font-bold text-background">{dailyGoal}</span> kcal
        </p>
      </div>
    </div>
  );
};

/* ── Custom Tooltip for Stacked Macros ── */
const MacroStackTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl bg-foreground/90 backdrop-blur-sm px-4 py-3 shadow-xl text-xs border border-border/10">
      <p className="font-semibold text-background mb-1.5">{label}</p>
      <div className="space-y-1">
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.fill }} />
            <span className="text-background/80">{p.name}:</span>
            <span className="font-bold text-background">{p.value}g</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Custom Tooltip for Donut ── */
const DonutTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-2xl bg-foreground/90 backdrop-blur-sm px-4 py-3 shadow-xl text-xs border border-border/10">
      <p className="font-semibold text-background mb-1">{data.name}</p>
      <p className="text-background/80">
        <span className="font-bold text-background">{data.pct}%</span> · {data.value}g
      </p>
    </div>
  );
};

const ReportsTab = () => {
  const { dailyGoal, loggedMeals } = useMeals();
  const { subscriptionTier, openPaywall } = useSubscription();
  const isFree = subscriptionTier === "free";
  const [period, setPeriod] = useState(7);

  const report = useMemo(() => generateReportData(loggedMeals, dailyGoal, period), [loggedMeals, dailyGoal, period]);
  const hasData = report.daysWithData > 0;

  const totalMacroGrams = report.totalProtein + report.totalCarbs + report.totalFat;
  const pctProtein = totalMacroGrams > 0 ? Math.round((report.totalProtein / totalMacroGrams) * 100) : 0;
  const pctCarbs = totalMacroGrams > 0 ? Math.round((report.totalCarbs / totalMacroGrams) * 100) : 0;
  const pctFat = totalMacroGrams > 0 ? 100 - pctProtein - pctCarbs : 0;

  const macroData = [
    { name: "Proteínas", value: Math.round(report.totalProtein), pct: pctProtein, fill: "hsl(var(--primary))" },
    { name: "Carboidratos", value: Math.round(report.totalCarbs), pct: pctCarbs, fill: "hsl(var(--accent))" },
    { name: "Gorduras", value: Math.round(report.totalFat), pct: pctFat, fill: "hsl(var(--lilac))" },
  ];

  const summaryCards = [
    {
      icon: Flame,
      label: "Média cal/dia",
      value: hasData ? `${report.avgCalories}` : "—",
      colorClass: "text-primary bg-primary/10",
      trend: hasData ? "↓ 5% vs semana passada" : null,
      trendColor: "text-primary",
    },
    {
      icon: TrendingDown,
      label: "Dias registados",
      value: `${report.daysWithData}/${period}`,
      colorClass: "text-accent bg-accent/10",
      trend: hasData ? `${report.daysWithData} dias ativos` : null,
      trendColor: "text-accent",
    },
    {
      icon: Target,
      label: "Dias na meta",
      value: hasData ? `${report.daysOnTarget}/${report.daysWithData}` : "—",
      colorClass: "text-lilac bg-lilac/10",
      trend: hasData ? "Consistência boa" : null,
      trendColor: "text-lilac",
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── Period Filter Pills ── */}
      <div className="flex gap-2">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
              period === opt.value
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {summaryCards.map((card) => (
          <Card
            key={card.label}
            className="rounded-2xl border-0 bg-card shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <CardContent className="p-3 flex flex-col items-center gap-1.5 text-center">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.colorClass}`}>
                <card.icon size={18} />
              </div>
              <span className="text-2xl font-bold text-foreground leading-none">{card.value}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{card.label}</span>
              {card.trend && (
                <span className={`text-[9px] font-medium ${card.trendColor} leading-none mt-0.5`}>
                  {card.trend}
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── AI Insight Card (Gated) ── */}
      <Card
        className={`rounded-2xl border-0 bg-gradient-to-br from-lilac/20 to-primary/10 shadow-sm relative overflow-hidden ${isFree ? "cursor-pointer" : ""}`}
        onClick={isFree ? openPaywall : undefined}
      >
        {isFree && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/60 backdrop-blur-[6px] rounded-2xl">
            <Lock size={24} className="text-muted-foreground mb-1" />
            <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-600 text-[10px] font-bold px-2.5 py-1 rounded-full">
              <Crown size={10} /> Recurso PRO
            </span>
          </div>
        )}
        <CardContent className="p-5 flex gap-3 items-start">
          <div className="w-9 h-9 rounded-xl bg-lilac/20 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles size={18} className="text-lilac" />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Análise Inteligente</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {hasData
                ? "Você manteve um excelente déficit calórico nesta semana, mas seu consumo de proteínas caiu no fim de semana. Tente incluir mais ovos ou frango no sábado."
                : "Registre suas refeições para receber insights personalizados da IA sobre sua alimentação."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Bar Chart: Tendência Semanal ── */}
      <Card className="rounded-2xl border-0 bg-card shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Tendência Semanal</h3>
          {hasData ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={report.days} barCategoryGap="18%">
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.5}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip content={<CaloriesTooltip dailyGoal={dailyGoal} />} cursor={false} />
                <ReferenceLine
                  y={dailyGoal}
                  stroke="hsl(var(--lilac))"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  label={{
                    value: "Meta",
                    position: "right",
                    fontSize: 10,
                    fill: "hsl(var(--lilac))",
                    fontWeight: 600,
                  }}
                />
                <Bar dataKey="calories" radius={[6, 6, 0, 0]} maxBarSize={28}>
                  {report.days.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.calories === 0
                          ? "hsl(var(--muted))"
                          : entry.calories <= dailyGoal
                            ? "hsl(var(--primary))"
                            : "hsl(var(--accent))"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[210px] flex items-center justify-center text-sm text-muted-foreground">
              Registre refeições para ver o gráfico
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Stacked Bar Chart: Consumo de Macros por Dia ── */}
      <Card className="rounded-2xl border-0 bg-card shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Consumo de Macros por Dia</h3>
          {hasData ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={report.days} barCategoryGap="18%">
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.5}
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  unit="g"
                />
                <Tooltip content={<MacroStackTooltip />} cursor={false} />
                <Bar
                  dataKey="protein"
                  name="Proteínas"
                  stackId="a"
                  fill="hsl(var(--primary))"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="carbs"
                  name="Carboidratos"
                  stackId="a"
                  fill="hsl(var(--accent))"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="fat"
                  name="Gorduras"
                  stackId="a"
                  fill="hsl(var(--lilac))"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[210px] flex items-center justify-center text-sm text-muted-foreground">
              Registre refeições para ver os macros
            </div>
          )}
          {/* Mini legend */}
          {hasData && (
            <div className="flex justify-center gap-4 mt-3">
              {[
                { label: "Proteínas", color: "bg-primary" },
                { label: "Carboidratos", color: "bg-accent" },
                { label: "Gorduras", color: "bg-lilac" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  <span className="text-[10px] text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Donut Chart + Detailed Legend ── */}
      <Card className="rounded-2xl border-0 bg-card shadow-sm">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Distribuição de Macros</h3>
          {hasData ? (
            <div className="flex flex-col items-center gap-5">
              <div className="relative w-full" style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={macroData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {macroData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Absolute center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-foreground leading-none">
                    {report.avgCalories.toLocaleString("pt-BR")}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">kcal/dia</span>
                </div>
              </div>

              {/* Detailed legend */}
              <div className="w-full space-y-3">
                {macroData.map((m) => (
                  <div key={m.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: m.fill }} />
                      <span className="text-xs text-muted-foreground">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-foreground">{m.pct}%</span>
                      <span className="text-[11px] text-muted-foreground w-14 text-right">{m.value}g</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
              Sem dados de macros ainda
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsTab;
