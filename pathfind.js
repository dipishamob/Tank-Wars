"use strict";
{
  const PF_CLEAR = 0;
  const CELL_MAX_DIMENSION = Math.pow(2, 26);
  const PF_OBSTACLE = 2147483647;
  function XYToKey(x, y) {
    return x * CELL_MAX_DIMENSION + y;
  }
  function KeyToXY(k) {
    const x = Math.floor(k / CELL_MAX_DIMENSION);
    const y = k % CELL_MAX_DIMENSION;
    return [x, y];
  }
  function Make2DCellArray(w, h) {
    const ret = [];
    for (let x = 0; x < w; ++x) ret.push(new Int32Array(h));
    return ret;
  }
  const pathfinderMap = new Map();
  function GetPathfinder(mapKey) {
    let ret = pathfinderMap.get(mapKey);
    if (!ret) {
      ret = new Pathfinder();
      pathfinderMap.set(mapKey, ret);
    }
    return ret;
  }
  self.JobHandlers["PFCellData"] = function (params) {
    const mapKey = params["mapKey"];
    const hcells = params["hcells"];
    const vcells = params["vcells"];
    const cellData = params["cellData"];
    const pathfinder = GetPathfinder(mapKey);
    pathfinder.Init(hcells, vcells, cellData);
  };
  self.JobHandlers["PFUpdateRegion"] = function (params) {
    const mapKey = params["mapKey"];
    const cx1 = params["cx1"];
    const cy1 = params["cy1"];
    const lenx = params["lenx"];
    const leny = params["leny"];
    const cellData = params["cellData"];
    const pathfinder = GetPathfinder(mapKey);
    pathfinder.UpdateRegion(cx1, cy1, lenx, leny, cellData);
  };
  self.JobHandlers["PFResetAllCellData"] = function (params) {
    for (const pathfinder of pathfinderMap.values()) pathfinder.Clear();
  };
  self.JobHandlers["PFFindPath"] = function (params) {
    const mapKey = params["mapKey"];
    const cellX = params["cellX"];
    const cellY = params["cellY"];
    const destCellX = params["destCellX"];
    const destCellY = params["destCellY"];
    const moveCost = params["moveCost"];
    const diagonalsEnabled = params["diagonalsEnabled"];
    const directMovementMode = params["directMovementMode"];
    const pathfinder = GetPathfinder(mapKey);
    const pathGroup = params["pathGroup"];
    if (pathfinder.IsInPathGroup())
      if (pathGroup) {
        if (pathfinder.GetPathGroupId() !== pathGroup["id"]) {
          pathfinder.EndGroup();
          pathfinder.StartGroup(
            pathGroup["id"],
            pathGroup["cost"],
            pathGroup["cellSpread"]
          );
        }
      } else pathfinder.EndGroup();
    else if (pathGroup)
      pathfinder.StartGroup(
        pathGroup["id"],
        pathGroup["cost"],
        pathGroup["cellSpread"]
      );
    pathfinder.SetMoveCost(moveCost);
    pathfinder.SetDiagonalsEnabled(diagonalsEnabled);
    const result = pathfinder.FindPath(
      cellX,
      cellY,
      destCellX,
      destCellY,
      directMovementMode
    );
    return { result };
  };
  let nodeSequence = 0;
  class Node {
    constructor(x, y) {
      this._parent = null;
      this._x = x || 0;
      this._y = y || 0;
      this._f = 0;
      this._g = 0;
      this._h = 0;
      this._seq = nodeSequence++;
    }
    SetXY(x, y) {
      this._x = x;
      this._y = y;
    }
    static Sort(a, b) {
      const af = a._f;
      const bf = b._f;
      if (af !== bf) return af - bf;
      return a._seq - b._seq;
    }
  }
  class Pathfinder {
    constructor() {
      this._adjacentCost = 10;
      this._diagonalCost = 14;
      this._hcells = 0;
      this._vcells = 0;
      this._cells = null;
      this._openList = new self.RedBlackSet(Node.Sort);
      this._openMap = new Map();
      this._closedSet = new Set();
      this._currentNode = null;
      this._targetX = 0;
      this._targetY = 0;
      this._diagonalsEnabled = true;
      this._isInPathGroup = false;
      this._pathGroupId = -1;
      this._pathGroupCost = 0;
      this._pathGroupCellSpread = 0;
      this._groupCostCells = null;
    }
    Init(hcells, vcells, data) {
      if (this._hcells !== hcells || this._vcells !== vcells) this.EndGroup();
      this._hcells = hcells;
      this._vcells = vcells;
      this._cells = data;
    }
    UpdateRegion(cx1, cy1, lenx, leny, cellData) {
      const cells = this._cells;
      if (!cells) return;
      for (let x = 0; x < lenx; ++x) cells[cx1 + x].set(cellData[x], cy1);
    }
    Clear() {
      this.EndGroup();
      this._cells = null;
    }
    _ClearIntermediateData() {
      this._openList.Clear();
      this._openMap.clear();
      this._closedSet.clear();
      this._currentNode = null;
      nodeSequence = 0;
    }
    UpdateRegion(cx, cy, lenx, leny, data) {
      for (let x = 0; x < lenx; ++x)
        for (let y = 0; y < leny; ++y) this._cells[cx + x][cy + y] = data[x][y];
    }
    SetMoveCost(c) {
      this._adjacentCost = Math.floor(c);
      this._diagonalCost = Math.round(this._adjacentCost * Math.SQRT2);
    }
    SetDiagonalsEnabled(d) {
      this._diagonalsEnabled = !!d;
    }
    StartGroup(id, pathCost, cellSpread) {
      if (this._isInPathGroup) return;
      this._isInPathGroup = true;
      this._pathGroupId = id;
      this._pathGroupCost = pathCost;
      this._pathGroupCellSpread = cellSpread;
      this._groupCostCells = Make2DCellArray(this._hcells, this._vcells);
    }
    EndGroup() {
      if (!this._isInPathGroup) return;
      this._isInPathGroup = false;
      this._pathGroupId = -1;
      this._groupCostCells = null;
    }
    IsInPathGroup() {
      return this._isInPathGroup;
    }
    GetPathGroupId() {
      return this._pathGroupId;
    }
    At(x, y) {
      if (x < 0 || y < 0 || x >= this._hcells || y >= this._vcells)
        return PF_OBSTACLE;
      let ret = this._cells[x][y];
      if (this._groupCostCells !== null)
        ret = Math.min(ret + this._groupCostCells[x][y], PF_OBSTACLE);
      return ret;
    }
    IsBoxAllClear(startX, startY, endX, endY) {
      const minX = Math.min(startX, endX);
      const maxX = Math.max(startX, endX);
      const minY = Math.min(startY, endY);
      const maxY = Math.max(startY, endY);
      for (let x = minX; x <= maxX; ++x) {
        const curCellCol = this._cells[x];
        for (let y = minY; y <= maxY; ++y)
          if (curCellCol[y] !== 0) return false;
      }
      return true;
    }
    FindPath(startX, startY, endX, endY, directMovementMode) {
      if (!this._cells) return null;
      startX = Math.floor(startX);
      startY = Math.floor(startY);
      endX = Math.floor(endX);
      endY = Math.floor(endY);
      this._targetX = endX;
      this._targetY = endY;
      const minX = Math.min(startX, endX);
      const maxX = Math.max(startX, endX);
      const minY = Math.min(startY, endY);
      const maxY = Math.max(startY, endY);
      if (minX < 0 || minY < 0 || maxX >= this._hcells || maxY >= this._vcells)
        return null;
      if (
        directMovementMode !== 0 &&
        this.IsBoxAllClear(startX, startY, endX, endY)
      )
        return [{ x: endX, y: endY }];
      return this._AStarFindPath(startX, startY, directMovementMode);
    }
    _AStarFindPath(startX, startY, directMovementMode) {
      const adjacentCost = this._adjacentCost;
      const diagonalCost = this._diagonalCost;
      const diagonals = this._diagonalsEnabled;
      const openList = this._openList;
      const openMap = this._openMap;
      const closedSet = this._closedSet;
      const startNode = new Node(startX, startY);
      openList.Add(startNode);
      openMap.set(XYToKey(startX, startY), startNode);
      while (!openList.IsEmpty()) {
        const c = openList.Shift();
        const key = XYToKey(c._x, c._y);
        openMap.delete(key);
        closedSet.add(key);
        if (c._x === this._targetX && c._y === this._targetY) {
          this._ClearIntermediateData();
          return this._GetResultPath(c, directMovementMode);
        }
        this._currentNode = c;
        const x = c._x;
        const y = c._y;
        const obsLeft = this.At(x - 1, y) === PF_OBSTACLE;
        const obsTop = this.At(x, y - 1) === PF_OBSTACLE;
        const obsRight = this.At(x + 1, y) === PF_OBSTACLE;
        const obsBottom = this.At(x, y + 1) === PF_OBSTACLE;
        if (!obsLeft) this._AddCellToOpenList(x - 1, y, adjacentCost);
        if (
          diagonals &&
          !obsLeft &&
          !obsTop &&
          this.At(x - 1, y - 1) !== PF_OBSTACLE
        )
          this._AddCellToOpenList(x - 1, y - 1, diagonalCost);
        if (!obsTop) this._AddCellToOpenList(x, y - 1, adjacentCost);
        if (
          diagonals &&
          !obsTop &&
          !obsRight &&
          this.At(x + 1, y - 1) !== PF_OBSTACLE
        )
          this._AddCellToOpenList(x + 1, y - 1, diagonalCost);
        if (!obsRight) this._AddCellToOpenList(x + 1, y, adjacentCost);
        if (
          diagonals &&
          !obsRight &&
          !obsBottom &&
          this.At(x + 1, y + 1) !== PF_OBSTACLE
        )
          this._AddCellToOpenList(x + 1, y + 1, diagonalCost);
        if (!obsBottom) this._AddCellToOpenList(x, y + 1, adjacentCost);
        if (
          diagonals &&
          !obsBottom &&
          !obsLeft &&
          this.At(x - 1, y + 1) !== PF_OBSTACLE
        )
          this._AddCellToOpenList(x - 1, y + 1, diagonalCost);
      }
      this._ClearIntermediateData();
      return null;
    }
    _AddCellToOpenList(x, y, g) {
      const key = XYToKey(x, y);
      if (this._closedSet.has(key)) return;
      const curCellCost = this.At(x, y);
      const c = this._openMap.get(key);
      if (c) {
        if (this._currentNode._g + g + curCellCost < c._g)
          this._UpdateNodeInOpenList(c, g, curCellCost);
        return;
      }
      this._AddNewNodeToOpenList(x, y, g, curCellCost);
    }
    _UpdateNodeInOpenList(c, g, curCellCost) {
      const openList = this._openList;
      const currentNode = this._currentNode;
      openList.Remove(c);
      c._parent = currentNode;
      c._g = currentNode._g + g + curCellCost;
      c._h = this._EstimateH(c._x, c._y);
      c._f = c._g + c._h;
      openList.Add(c);
    }
    _AddNewNodeToOpenList(x, y, g, curCellCost) {
      const c = new Node(x, y);
      const h = this._EstimateH(x, y);
      const g2 = this._currentNode._g + g + curCellCost;
      c._h = h;
      c._g = g2;
      c._f = h + g2;
      c._parent = this._currentNode;
      this._openMap.set(XYToKey(x, y), c);
      this._openList.Add(c);
    }
    _EstimateH(x, y) {
      const dx = Math.abs(x - this._targetX);
      const dy = Math.abs(y - this._targetY);
      const manhattanDist = this._adjacentCost * (dx + dy);
      return this._diagonalsEnabled
        ? manhattanDist +
            (this._diagonalCost - 2 * this._adjacentCost) * Math.min(dx, dy)
        : manhattanDist;
    }
    _GetResultPath(endNode, directMovementMode) {
      let pathList = [];
      let p = endNode;
      while (p) {
        pathList.push({ x: p._x, y: p._y });
        p = p._parent;
      }
      pathList.reverse();
      if (this._isInPathGroup) this._AddPathGroupCost(pathList);
      pathList = this._FilterRedundantNodes(pathList);
      if (directMovementMode === 2) {
        pathList = this._FilterNodesForDirectMovement(pathList);
        pathList = this._FilterRedundantNodes(pathList);
      }
      if (pathList.length > 1) pathList.shift();
      return pathList;
    }
    _AddPathGroupCost(pathList) {
      const cost = this._pathGroupCost;
      const cellSpread = this._pathGroupCellSpread;
      const spreadOffset = Math.floor(cellSpread / 2);
      const hcells = this._hcells;
      const vcells = this._vcells;
      const costCells = new Set();
      for (const node of pathList) {
        const nodeX = node.x;
        const nodeY = node.y;
        const startX = Math.max(nodeX - spreadOffset, 0);
        const startY = Math.max(nodeY - spreadOffset, 0);
        const endX = Math.min(startX + cellSpread, hcells);
        const endY = Math.min(startY + cellSpread, vcells);
        for (let x = startX; x < endX; ++x)
          for (let y = startY; y < endY; ++y) costCells.add(XYToKey(x, y));
      }
      for (const k of costCells) {
        const [x, y] = KeyToXY(k);
        this._groupCostCells[x][y] += cost;
      }
    }
    _FilterRedundantNodes(pathList) {
      if (pathList.length === 0) return [];
      let curNode = pathList[0];
      if (pathList.length === 1) return [curNode];
      const retList = [curNode];
      let nextNode = pathList[1];
      let curDx = nextNode.x - curNode.x;
      let curDy = nextNode.y - curNode.y;
      const NZ_EPSILON = 1e-7;
      const R_EPSILON = 0.001;
      for (let i = 1, len = pathList.length; i < len; ++i) {
        curNode = pathList[i];
        if (i === len - 1) retList.push(curNode);
        else {
          nextNode = pathList[i + 1];
          const nextDx = nextNode.x - curNode.x;
          const nextDy = nextNode.y - curNode.y;
          const bothXNearZero =
            Math.abs(nextDx) < NZ_EPSILON &&
            Math.abs(curDx) < NZ_EPSILON &&
            Math.sign(nextDy) === Math.sign(curDy);
          const bothYNearZero =
            Math.abs(nextDy) < NZ_EPSILON &&
            Math.abs(curDy) < NZ_EPSILON &&
            Math.sign(nextDx) === Math.sign(curDx);
          if (
            !bothXNearZero &&
            !bothYNearZero &&
            Math.abs(nextDx / curDx - nextDy / curDy) > R_EPSILON
          ) {
            retList.push(curNode);
            curDx = nextDx;
            curDy = nextDy;
          }
        }
      }
      return retList;
    }
    _FilterNodesForDirectMovement(pathList) {
      if (pathList.length === 0) return [];
      if (pathList.length <= 2) return pathList.slice(0);
      const retList = [];
      let i = 0,
        len = pathList.length;
      while (i < len) {
        const curNode = pathList[i];
        retList.push(curNode);
        if (i >= len - 2) ++i;
        else {
          let j = i + 1;
          while (j < len) {
            i = j;
            ++j;
            if (j >= len) break;
            const tryNode = pathList[j];
            if (!this.IsBoxAllClear(curNode.x, curNode.y, tryNode.x, tryNode.y))
              break;
          }
        }
      }
      return retList;
    }
  }
}
