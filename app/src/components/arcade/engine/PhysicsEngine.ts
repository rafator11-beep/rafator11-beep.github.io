export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class PhysicsEngine {
  // AABB Intersection Test O(1)
  public static isIntersecting(a: AABB, b: AABB): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  // Resolver Swept AABB o Continuous Collision si los objetos se mueven rápido
  public static resolveDynamicCollision(dynamicObj: AABB & { vx: number, vy: number }, staticObj: AABB) {
    if (!this.isIntersecting(dynamicObj, staticObj)) return;

    const overlapX = (dynamicObj.width + staticObj.width) / 2 - Math.abs((dynamicObj.x + dynamicObj.width / 2) - (staticObj.x + staticObj.width / 2));
    const overlapY = (dynamicObj.height + staticObj.height) / 2 - Math.abs((dynamicObj.y + dynamicObj.height / 2) - (staticObj.y + staticObj.height / 2));

    if (overlapX < overlapY) {
      if ((dynamicObj.x + dynamicObj.width / 2) < (staticObj.x + staticObj.width / 2)) {
        dynamicObj.x -= overlapX;
      } else {
        dynamicObj.x += overlapX;
      }
      dynamicObj.vx = 0;
    } else {
      if ((dynamicObj.y + dynamicObj.height / 2) < (staticObj.y + staticObj.height / 2)) {
        dynamicObj.y -= overlapY;
      } else {
        dynamicObj.y += overlapY;
      }
      dynamicObj.vy = 0;
    }
  }

  // Broadphase basic Grid Optimization
  public static broadphase(entities: AABB[], cellSize: number = 100): Map<string, AABB[]> {
    const grid = new Map<string, AABB[]>();
    for (const ent of entities) {
      const cellX = Math.floor(ent.x / cellSize);
      const cellY = Math.floor(ent.y / cellSize);
      const key = `${cellX},${cellY}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key)!.push(ent);
    }
    return grid;
  }
}
