import { useMemo } from "react";
import { useMeals, type LoggedMeal } from "@/contexts/MealContext";
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

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Builds last-7-days report from real loggedMeals state */
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

const ReportsTab = () => {
  const { dailyGoal, loggedMeals } = useMeals();

  const report = useMemo(() => generateReportData(loggedMeals, dailyGoal), [loggedMeals, dailyGoal]);

  const hasData = report.daysWithData > 0;

  const macroData = [
    { name: "Proteínas", value: Math.round(report.totalProtein), fill: "hsl(145, 45%, 52%)" },
    { name: "Carboidratos", value: Math.round(report.totalCarbs), fill: "hsl(15, 75%, 65%)" },
    { name: "Gorduras", value: Math.round(report.totalFat), fill: "hsl(270, 35%, 72%)" },
  ];

  const summaryCards = [
    { icon: Flame, label: "Média cal/dia", value: hasData ? `${report.avgCalories}` : "—", color: "text-primary" },
    { icon: TrendingDown, label: "Dias registados", value: `${report.daysWithData}/7`, color: "text-accent" },
    { icon: Target, label: "Dias na meta", value: hasData ? `${report.daysOnTarget}/${report.daysWithData}` : "—", color: "text-lilac" },
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
          {hasData ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={report.days} barCategoryGap="20%">
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
                  {report.days.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.calories <= dailyGoal ? "hsl(145, 45%, 52%)" : "hsl(15, 75%, 65%)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
              Registre refeições para ver o gráfico
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card className="rounded-2xl border-0 bg-card shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Distribuição de Macros</h3>
          {hasData ? (
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
