export interface FlightResult {
    airline: string;
    departure: string;
    arrival: string;
    price: number;
    duration: string;
}

export interface HotelResult {
    name: string;
    rating: number;
    pricePerNight: number;
    location: string;
}

export interface ITravelSearchService {
    searchFlights(from: string, to: string, date: string): Promise<FlightResult[]>;
    searchHotels(destination: string, checkIn: string, checkOut: string): Promise<HotelResult[]>;
}

/** Stub implementation — inject a real travel API when ready */
export class MockTravelSearchService implements ITravelSearchService {
    async searchFlights(from: string, to: string, _date: string): Promise<FlightResult[]> {
        return [
            { airline: "SkyAir", departure: from, arrival: to, price: 349, duration: "4h 30m" },
            { airline: "OceanWings", departure: from, arrival: to, price: 425, duration: "3h 45m" },
            { airline: "SwiftJet", departure: from, arrival: to, price: 289, duration: "5h 10m" },
        ];
    }

    async searchHotels(destination: string, _checkIn: string, _checkOut: string): Promise<HotelResult[]> {
        return [
            { name: `Grand ${destination} Hotel`, rating: 4.5, pricePerNight: 189, location: "Downtown" },
            { name: `${destination} Suites`, rating: 4.2, pricePerNight: 145, location: "Midtown" },
            { name: `The ${destination} Inn`, rating: 3.8, pricePerNight: 99, location: "Airport" },
        ];
    }
}

export const travelSearchService: ITravelSearchService = new MockTravelSearchService();
