export interface ClientGameData {
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
}
