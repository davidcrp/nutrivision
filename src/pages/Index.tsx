import SearchBar from "@/components/SearchBar";
import GreetingHeader from "@/components/GreetingHeader";
import DailyProgressCard from "@/components/DailyProgressCard";
import RecipeBanner from "@/components/RecipeBanner";
import MealsGrid from "@/components/MealsGrid";
import BottomNav from "@/components/BottomNav";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-5 pt-6 pb-24">
        <SearchBar />
        <GreetingHeader />
        <DailyProgressCard />
        <RecipeBanner />
        <MealsGrid />
      </div>
      <BottomNav />
    </div>
  );
};

export default Index;
