export interface GameData {
    id: string;
    name: string;
    pixelRadius: string;
    difficulty: string;
    originalImage: string;
    modifiedImage: string;
    topSoloPlayers: string[];
    topVersusPlayers: string[];
    topSoloTimes: string[];
    topVersusTimes: string[];
    numberOfDifferences: number;
    differences: { x: number; y: number }[][];
    joinable?: boolean;
}
