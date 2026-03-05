import { Suspense } from "react";
import { TopBar } from "@/components/top-bar";
import { TripList } from "@/features/travel/components/trip-list";

export default function TravelPage() {
    return (
        <>
            <TopBar title="Travel" />
            <div className="p-4">
                <Suspense fallback={null}>
                    <TripList />
                </Suspense>
            </div>
        </>
    );
}
