import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReportsTab from "@/components/analysis/ReportsTab";
import AIPlanTab from "@/components/analysis/AIPlanTab";
import { BarChart3, Sparkles } from "lucide-react";

const AnalysisPage = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto px-4 pt-6">
        <h1 className="text-xl font-bold text-foreground mb-4">Análise e Plano AI</h1>

        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-secondary rounded-2xl p-1 h-12">
            <TabsTrigger
              value="reports"
              className="rounded-xl data-[state=active]:bg-popover data-[state=active]:shadow-sm text-sm font-semibold flex items-center gap-1.5"
            >
              <BarChart3 size={16} />
              Relatórios
            </TabsTrigger>
            <TabsTrigger
              value="plan"
              className="rounded-xl data-[state=active]:bg-popover data-[state=active]:shadow-sm text-sm font-semibold flex items-center gap-1.5"
            >
              <Sparkles size={16} />
              Plano Inteligente
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="mt-4">
            <ReportsTab />
          </TabsContent>

          <TabsContent value="plan" className="mt-4">
            <AIPlanTab />
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  );
};

export default AnalysisPage;
