import { useMemo } from "react";
import { useMeals, type LoggedMeal } from "@/contexts/MealContext";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, TrendingDown, Target, Sparkles } from "lucide-react";
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
} from "recharts";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function generateReportData(loggedMeals: LoggedMeal[], dailyGoal: number) {
  const today = new Date();
  const days: { day: string; date: string; calories: number; protein: number; carbs: number; fat: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    const label = DAY_LABELS[d.getDay()];

    let calories = 0, protein = 0, carbs = 0, fat = 0;
    for (const meal of loggedMeals) {
      const mealDate = new Date(meal.loggedAt).toISOString().slice(0, 10);
      if (mealDate === dateKey) {
        for (const item of meal.items) {
          calories += item.calories;
          protein += item.protein;
          carbs += item.carbs;
          fat += item.fat;
        }
      }
    }

    days.push({
      day: i === 0 ? "Hoje" : label,
      date: dateKey,
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

/* ── Custom Tooltip ── */
const CaloriesTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const cal = payload[0].value;
  return (
    <div className="rounded-xl bg-card border border-border px-3.5 py-2.5 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-0.5">{label}</p>
      <p className="text-muted-foreground">
        <span className="font-bold text-foreground text-sm">{cal}</span> kcal
      </p>
    </div>
  );
};

/* ── Donut centre label ── */
const DonutCenterLabel = ({ viewBox, value }: any) => {
  const { cx, cy } = viewBox;
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-0.4em" className="fill-foreground text-lg font-bold">
        {value}
      </tspan>
      <tspan x={cx} dy="1.4em" className="fill-muted-foreground text-[10px]">
        kcal/dia
      </tspan>
    </text>
  );
};

const ReportsTab = () => {
  const { dailyGoal, loggedMeals } = useMeals();
  const report = useMemo(() => generateReportData(loggedMeals, dailyGoal), [loggedMeals, dailyGoal]);
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
      value: `${report.daysWithData}/7`,
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

      {/* ── AI Insight Card ── */}
      <Card className="rounded-2xl border-0 bg-gradient-to-br from-lilac/20 to-primary/10 shadow-sm">
        <CardContent className="p-4 flex gap-3 items-start">
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

      {/* ── Bar Chart ── */}
      <Card className="rounded-2xl border-0 bg-card shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Tendência Semanal</h3>
          {hasData ? (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={report.days} barCategoryGap="20%">
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "hsl(220, 10%, 50%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<CaloriesTooltip />} cursor={false} />
                <ReferenceLine
                  y={dailyGoal}
                  stroke="hsl(220, 10%, 70%)"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  label={{ value: "Meta", position: "right", fontSize: 10, fill: "hsl(220, 10%, 50%)" }}
                />
                <Bar dataKey="calories" radius={[6, 6, 0, 0]} maxBarSize={30}>
                  {report.days.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.calories === 0
                          ? "hsl(220, 10%, 90%)"
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
            <div className="h-[190px] flex items-center justify-center text-sm text-muted-foreground">
              Registre refeições para ver o gráfico
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Donut Chart + Detailed Legend ── */}
      <Card className="rounded-2xl border-0 bg-card shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Distribuição de Macros</h3>
          {hasData ? (
            <div className="flex flex-col items-center gap-4">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    label={false}
                  >
                    {macroData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  {/* center label */}
                  <Pie
                    data={[{ value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={0}
                    dataKey="value"
                    label={<DonutCenterLabel value={report.avgCalories} />}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Detailed legend */}
              <div className="w-full space-y-2.5">
                {macroData.map((m) => (
                  <div key={m.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: m.fill }} />
                      <span className="text-xs text-muted-foreground">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-foreground">{m.pct}%</span>
                      <span className="text-[11px] text-muted-foreground w-12 text-right">{m.value}g</span>
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
