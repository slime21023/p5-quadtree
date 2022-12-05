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
    return (point.x >= this.topLeft.x ) && (point.x < this.bottomRight.x) 
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
    
    if (this.points.length < this.capacity - 1) {
      this.points.push(point);
      return true;
    }
    else {
      if (!this.divided) {
        this.divide();
      }
      const { topLeft, bottomRight } = this.boundary;
      const centerX = (topLeft.x + bottomRight.x) / 2;
      const centerY = (topLeft.y + bottomRight.y) / 2;
      if (point.x < centerX && point.y < centerY ) {
        return this.northwest.insert(point);
      }
      else if (point.x >= centerX && point.y < centerY ) {
        return this.northeast.insert(point);
      }
      else if (point.x < centerX && point.y >= centerY) {
        return this.southwest.insert(point);
      }
      else if (point.x >= centerX && point.y >= centerY) {
        return this.southeast.insert(point);
      }
    }
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
    if (this.boundary.intersects(range)) {
      for (let p of this.points) {
        if (range.contains(p)) found.push(p);
      }

      if (this.divided) {
        found.concat(this.northwest.query(range));
        found.concat(this.northeast.query(range));
        found.concat(this.southwest.query(range));
        found.concat(this.southeast.query(range));
      }
    }
    return found;
  }

  show() {
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
  createCanvas(600, 600);
  background(0);
  const topLeft = new Point(0, 0);
  const bottomRight = new Point(600, 600);
  const boundary = new Boundary(topLeft, bottomRight);

  qdtree = new QuadTree(boundary, 4);
  for (let i = 0; i < 300; i++) {
    let x = randomGaussian(width / 2, width / 8);
    let y = randomGaussian(height / 2, height / 8);
    let p = new Point(x, y);
    qdtree.insert(p);
  }
}

function draw(){
  background(0);
  qdtree.show();
}