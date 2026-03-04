import { TopBar } from "@/components/top-bar";
import { PortfolioView } from "@/features/finance/components/portfolio-view";

export default function FinancePage() {
    return (
        <>
            <TopBar title="Finance" />
            <div className="p-4">
                <PortfolioView />
            </div>
        </>
    );
}
