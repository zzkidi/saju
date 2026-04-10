declare module 'circular-natal-horoscope-js' {
  export class Origin {
    constructor(params: {
      year: number;
      month: number;
      date: number;
      hour: number;
      minute: number;
      second?: number;
      latitude: number;
      longitude: number;
    });
  }

  export class Horoscope {
    constructor(params: {
      origin: Origin;
      houseSystem?: string;
      zodiac?: string;
      aspectPoints?: string[];
      aspectWithPoints?: string[];
      aspectTypes?: string[];
      customOrbs?: Record<string, number>;
      language?: string;
    });
    CelestialBodies: {
      sun: { Sign: { label: string } };
      moon: { Sign: { label: string } };
      mercury: { Sign: { label: string } };
      venus: { Sign: { label: string } };
      mars: { Sign: { label: string } };
      [key: string]: { Sign: { label: string } };
    };
    Angles: {
      ascendant: { Sign: { label: string } };
      midheaven: { Sign: { label: string } };
    };
  }
}
