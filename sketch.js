class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Boundary {
  constructor(topLeft, bottomRight) {
    this.topLeft = topLeft;
    this.bottomRight = bottomRight;
  }

  contains(point) {
    return (point.x >= this.topLeft.x) && (point.x < this.bottomRight.x)
      && (point.y >= this.topLeft.y) && (point.y < this.bottomRight.y)
  }

  intersects(boundary) {
    return !(boundary.topLeft.x > this.bottomRight.x ||
      boundary.bottomRight.x < this.topLeft.x ||
      boundary.topLeft.y > this.bottomRight.y ||
      boundary.bottomRight.y < this.topLeft.y);
  }
}

class QuadTree {
  constructor(boundary, capacity) {
    this.boundary = boundary;
    this.capacity = capacity;
    this.points = [];
    this.divided = false;
  }

  insert(point) {
    if (!this.boundary.contains(point)) {
      return false;
    }

    if (this.divided) {
      this.northwest.insert(point);
      this.northeast.insert(point);
      this.southwest.insert(point);
      this.southeast.insert(point);
    }

    if (!this.divided && this.points.length == this.capacity - 1) {
      this.divide();
      for (let p of this.points) {
        this.northwest.insert(p);
        this.northeast.insert(p);
        this.southwest.insert(p);
        this.southeast.insert(p);
      }
      this.points = [];
      this.insert(point);
    }

    if (!this.divided && this.points.length < this.capacity - 1) {
      this.points.push(point);
      return true;
    }

    return true;
  }

  divide() {
    const { topLeft, bottomRight } = this.boundary;
    const centerX = (topLeft.x + bottomRight.x) / 2;
    const centerY = (topLeft.y + bottomRight.y) / 2;

    let neBoundary = new Boundary(new Point(centerX, topLeft.y), new Point(bottomRight.x, centerY));
    this.northeast = new QuadTree(neBoundary, this.capacity);
    let nwBoundary = new Boundary(topLeft, new Point(centerX, centerY));
    this.northwest = new QuadTree(nwBoundary, this.capacity);
    let seBoundary = new Boundary(new Point(centerX, centerY), bottomRight);
    this.southeast = new QuadTree(seBoundary, this.capacity);
    let swBoundary = new Boundary(new Point(topLeft.x, centerY), new Point(centerX, bottomRight.y));
    this.southwest = new QuadTree(swBoundary, this.capacity);
    this.divided = true;
  }

  query(range) {
    let found = [];
    if (!this.boundary.intersects(range)) {
      return found;
    }

    if (!this.divided) {
      for (let p of this.points) {
        if (range.contains(p)) found.push(p);
      }
    }

    if (this.divided) {
      return found.concat(
        this.northwest.query(range),
        this.northeast.query(range),
        this.southwest.query(range),
        this.southeast.query(range)
      );
    }

    return found;
  }

  has(point) {
    if (!this.boundary.contains(point)) {
      return false;
    }

    if (this.divided) {
      return (this.northwest.has(point) ||
        this.northeast.has(point) ||
        this.southwest.has(point) ||
        this.southeast.has(point)
      );
    }

    for (let p of this.points) {
      if (point.x == p.x && point.y == p.y) {
        return true;
      }
    }

    return false;
  }

  show() {
    rectMode(CORNER);
    stroke(255);
    noFill();
    strokeWeight(1);

    const { topLeft, bottomRight } = this.boundary;
    let x = topLeft.x;
    let y = topLeft.y;
    let w = bottomRight.x - x;
    let h = bottomRight.y - y;

    rect(x, y, w, h);
    for (let p of this.points) {
      strokeWeight(2);
      point(p.x, p.y);
    }
    if (this.divided) {
      this.northeast.show();
      this.northwest.show();
      this.southeast.show();
      this.southwest.show();
    }
  }
}

let qdtree;

function setup() {
  createCanvas(650, 650);
  background(0);
  const topLeft = new Point(0, 0);
  const bottomRight = new Point(800, 800);
  const boundary = new Boundary(topLeft, bottomRight);

  qdtree = new QuadTree(boundary, 4);
  for (let i = 0; i < 300; i++) {
    let x = randomGaussian(width / 2, width / 8);
    let y = randomGaussian(height / 2, height / 8);
    let p = new Point(x, y);
    qdtree.insert(p);
  }

  drawDiagram()
}

function draw() {
  background(0);

  if (mouseIsPressed && mouseButton === LEFT) {
    if (mouseX < 650 && mouseY < 650) {

      for (let i = 0; i < 4; i++) {
        let x = random( -100, 100);
        let y = random( -100, 100);

        let p = new Point(mouseX + x, mouseY + y);
        if (!qdtree.has(p)) {
          qdtree.insert(p);
        }
      }
    }
  }

  if (mouseIsPressed && mouseButton === RIGHT) {
    strokeWeight(1);
    stroke(0, 255, 0);
    rectMode(CENTER);

    let boundary = new Boundary(
      new Point(mouseX - 25, mouseY - 25),
      new Point(mouseX + 25, mouseY + 25)
    )

    if (mouseX < width && mouseY < height) {
      rect(mouseX, mouseY, 50, 50);

      let points = qdtree.query(boundary);
      for (let p of points) {
        strokeWeight(5);
        point(p.x, p.y);
      }
    }
  }

  qdtree.show();
}


function drawDiagram() {
  const bfs = (tree) => {
    if(tree.divided == false) {
      return [tree.points.length];
    }
    else {
      let cache = [];
      cache = cache.concat(bfs(tree.northeast));
      cache = cache.concat(bfs(tree.northwest));
      cache = cache.concat(bfs(tree.southeast));
      cache = cache.concat(bfs(tree.southwest));
      return cache;
    }
  }

  let histoCache = bfs(qdtree);
  let x = [];
  for (i = 0; i < histoCache.length; i++) {
    x = x.concat(Array(histoCache[i]).fill(i))
  }
  Plotly.newPlot('histogram', [{ 
    x, 
    type: 'histogram',
    xbins: { 
      end: histoCache.length, 
      size: 1, 
      start: 0
    }
  }]);

  Plotly.newPlot('cdf', [{
    x, 
    type: 'histogram',
    xbins: { 
      end: histoCache.length, 
      size: 1, 
      start: 0
    },
    cumulative: {enabled: true}
  }])

}