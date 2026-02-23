import { useMemo } from "react";
import { useMeals } from "@/contexts/MealContext";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, TrendingDown, Target } from "lucide-react";
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
  Legend,
} from "recharts";

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const ReportsTab = () => {
  const { dailyGoal, consumedCalories, consumedMacros } = useMeals();

  // Mock weekly data based on current day's real data
  const weeklyData = useMemo(() => {
    const base = consumedCalories || 1800;
    return DAYS.map((day, i) => {
      const jitter = Math.round((Math.random() - 0.45) * 600);
      const cal = Math.max(800, Math.round(base + jitter));
      return { day, calories: i < 5 ? cal : i === 5 ? Math.round(base * 0.9) : Math.round(base * 1.1) };
    });
  }, [consumedCalories]);

  const avgCalories = Math.round(weeklyData.reduce((s, d) => s + d.calories, 0) / 7);
  const daysOnTarget = weeklyData.filter((d) => d.calories <= dailyGoal).length;

  // Macro pie data
  const totalMacroGrams = consumedMacros.protein + consumedMacros.carbs + consumedMacros.fat || 1;
  const macroData = [
    { name: "Proteínas", value: consumedMacros.protein || 80, fill: "hsl(145, 45%, 52%)" },
    { name: "Carboidratos", value: consumedMacros.carbs || 200, fill: "hsl(15, 75%, 65%)" },
    { name: "Gorduras", value: consumedMacros.fat || 60, fill: "hsl(270, 35%, 72%)" },
  ];

  const summaryCards = [
    { icon: Flame, label: "Média cal/dia", value: `${avgCalories}`, color: "text-primary" },
    { icon: TrendingDown, label: "Peso simulado", value: "-0.4 kg", color: "text-accent" },
    { icon: Target, label: "Dias na meta", value: `${daysOnTarget}/7`, color: "text-lilac" },
  ];

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {summaryCards.map((card) => (
          <Card key={card.label} className="rounded-2xl border-0 bg-card shadow-sm">
            <CardContent className="p-3 flex flex-col items-center gap-1 text-center">
              <card.icon size={20} className={card.color} />
              <span className="text-lg font-bold text-foreground">{card.value}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{card.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bar Chart */}
      <Card className="rounded-2xl border-0 bg-card shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Tendência Semanal</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} barCategoryGap="20%">
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(220, 10%, 50%)" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <ReferenceLine
                y={dailyGoal}
                stroke="hsl(220, 10%, 70%)"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{ value: "Meta", position: "right", fontSize: 10, fill: "hsl(220, 10%, 50%)" }}
              />
              <Bar dataKey="calories" radius={[8, 8, 0, 0]} maxBarSize={32}>
                {weeklyData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.calories <= dailyGoal ? "hsl(145, 45%, 52%)" : "hsl(15, 75%, 65%)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card className="rounded-2xl border-0 bg-card shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Distribuição de Macros</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={macroData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span style={{ color: "hsl(220, 10%, 50%)", fontSize: 12 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsTab;
