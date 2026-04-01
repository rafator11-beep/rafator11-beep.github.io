export interface LevelSchema {
  id: string;
  name: string;
  platforms: { x: number, y: number, width: number, height: number }[];
  spawns: {
    host: { x: number, y: number };
    guest: { x: number, y: number };
  }
}

export const ARCADE_LEVELS: Record<string, LevelSchema> = {
  "neo_tokyo": {
    "id": "level_neo_tokyo",
    "name": "Neo Tokyo Arena",
    "platforms": [
      { "x": 0, "y": 400, "width": 800, "height": 50 },
      { "x": 200, "y": 250, "width": 200, "height": 20 },
      { "x": 500, "y": 180, "width": 100, "height": 20 }
    ],
    "spawns": { "host": { "x": 100, "y": 300 }, "guest": { "x": 600, "y": 300 } }
  },
  "cyber_dungeon": {
    "id": "level_cyber_dungeon",
    "name": "Profundidades OS",
    "platforms": [
      { "x": 0, "y": 500, "width": 800, "height": 50 },
      { "x": 100, "y": 350, "width": 100, "height": 20 },
      { "x": 350, "y": 250, "width": 100, "height": 20 },
      { "x": 600, "y": 350, "width": 100, "height": 20 }
    ],
    "spawns": { "host": { "x": 50, "y": 400 }, "guest": { "x": 700, "y": 400 } }
  }
};
