class Point {
  constructor (x, y, data) {
    this.x = x
    this.y = y
    this.userData = data
  }


  sqDistanceFrom (other) {
    const dx = other.x - this.x
    const dy = other.y - this.y

    return dx * dx + dy * dy
  }
 
  distanceFrom (other) {
    return Math.sqrt(this.sqDistanceFrom(other))
  }
}

class Rectangle {
  constructor (x, y, w, h, data) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h

    this.left = x - w / 2
    this.right = x + w / 2
    this.top = y - h / 2
    this.bottom = y + h / 2
  }

  contains (point) {
    return (
      this.left <= point.x &&
      point.x <= this.right &&
      this.top <= point.y &&
      point.y <= this.bottom
    )
  }

  intersects (range) {
    return !(
      this.right < range.left ||
      range.right < this.left ||
      this.bottom < range.top ||
      range.bottom < this.top
    )
  }

  subdivide (quadrant) {
    switch (quadrant) {
      case 'ne':
        return new Rectangle(
          this.x + this.w / 4,
          this.y - this.h / 4,
          this.w / 2,
          this.h / 2
        )
      case 'nw':
        return new Rectangle(
          this.x - this.w / 4,
          this.y - this.h / 4,
          this.w / 2,
          this.h / 2
        )
      case 'se':
        return new Rectangle(
          this.x + this.w / 4,
          this.y + this.h / 4,
          this.w / 2,
          this.h / 2
        )
      case 'sw':
        return new Rectangle(
          this.x - this.w / 4,
          this.y + this.h / 4,
          this.w / 2,
          this.h / 2
        )
    }
  }

  xDistanceFrom (point) {
    if (this.left <= point.x && point.x <= this.right) {
      return 0
    }

    return Math.min(
      Math.abs(point.x - this.left),
      Math.abs(point.x - this.right)
    )
  }

  yDistanceFrom (point) {
    if (this.top <= point.y && point.y <= this.bottom) {
      return 0
    }

    return Math.min(
      Math.abs(point.y - this.top),
      Math.abs(point.y - this.bottom)
    )
  }

  // Skips Math.sqrt for faster comparisons
  sqDistanceFrom (point) {
    const dx = this.xDistanceFrom(point)
    const dy = this.yDistanceFrom(point)

    return dx * dx + dy * dy
  }

  // Pythagorus: a^2 = b^2 + c^2
  distanceFrom (point) {
    return Math.sqrt(this.sqDistanceFrom(point))
  }
}

// circle class for a circle shaped query
class Circle {
  constructor (x, y, r) {
    this.x = x
    this.y = y
    this.r = r
    this.rSquared = this.r * this.r
  }

  contains (point) {
    
    let d = Math.pow(point.x - this.x, 2) + Math.pow(point.y - this.y, 2)
    return d <= this.rSquared
  }

  intersects (range) {
    let xDist = Math.abs(range.x - this.x)
    let yDist = Math.abs(range.y - this.y)

    // radius of the circle
    let r = this.r

    let w = range.w / 2
    let h = range.h / 2

    let edges = Math.pow(xDist - w, 2) + Math.pow(yDist - h, 2)

    // no intersection
    if (xDist > r + w || yDist > r + h) return false

    // intersection within the circle
    if (xDist <= w || yDist <= h) return true

    // intersection on the edge of the circle
    return edges <= this.rSquared
  }
}

class QuadTree {
  DEFAULT_CAPACITY = 100
  MAX_DEPTH = 20

  constructor (boundary, capacity = this.DEFAULT_CAPACITY, _depth = 0) {
    if (!boundary) {
      throw TypeError('boundary is null or undefined')
    }
    if (!(boundary instanceof Rectangle)) {
      throw TypeError('boundary should be a Rectangle')
    }
    if (typeof capacity !== 'number') {
      throw TypeError(`capacity should be a number but is a ${typeof capacity}`)
    }
    if (capacity < 1) {
      throw RangeError('capacity must be greater than 0')
    }

    this.boundary = boundary
    this.capacity = capacity
    this.points = []
    this.divided = false

    this.depth = _depth
  }

  get children () {
    if (this.divided) {
      return [this.northeast, this.northwest, this.southeast, this.southwest]
    } else {
      return []
    }
  }

  clear () {
    this.points = []

    if (this.divided) {
      this.divided = false
      delete this.northwest
      delete this.northeast
      delete this.southwest
      delete this.southeast
    }
  }

  subdivide () {
    this.northeast = new QuadTree(
      this.boundary.subdivide('ne'),
      this.capacity,
      this.depth + 1
    )
    this.northwest = new QuadTree(
      this.boundary.subdivide('nw'),
      this.capacity,
      this.depth + 1
    )
    this.southeast = new QuadTree(
      this.boundary.subdivide('se'),
      this.capacity,
      this.depth + 1
    )
    this.southwest = new QuadTree(
      this.boundary.subdivide('sw'),
      this.capacity,
      this.depth + 1
    )

    this.divided = true

    // Move points to children.
    // This improves performance by placing points
    // in the smallest available rectangle.
    for (const p of this.points) {
      const inserted =
        this.northeast.insert(p) ||
        this.northwest.insert(p) ||
        this.southeast.insert(p) ||
        this.southwest.insert(p)

      if (!inserted) {
        throw RangeError('capacity must be greater than 0')
      }
    }

    this.points = null
  }

  insert (point) {
    if (!this.boundary.contains(point)) {
      return false
    }

    if (!this.divided) {
      if (this.points.length < this.capacity || this.depth === this.MAX_DEPTH) {
        this.points.push(point)
        return true
      }

      this.subdivide()
    }

    return (
      this.northeast.insert(point) ||
      this.northwest.insert(point) ||
      this.southeast.insert(point) ||
      this.southwest.insert(point)
    )
  }

  query (range, found) {
    if (!found) {
      found = []
    }

    if (!range.intersects(this.boundary)) {
      return found
    }

    if (this.divided) {
      this.northwest.query(range, found)
      this.northeast.query(range, found)
      this.southwest.query(range, found)
      this.southeast.query(range, found)
      return found
    }

    for (const p of this.points) {
      if (range.contains(p)) {
        found.push(p)
      }
    }

    return found
  }

  deleteInRange (range) {
    if (this.divided) {
      this.northwest.deleteInRange(range)
      this.northeast.deleteInRange(range)
      this.southwest.deleteInRange(range)
      this.southeast.deleteInRange(range)
    }

    // Delete points with range
    this.points = this.points.filter(point => !range.contains(point))
  }

  closest (searchPoint, maxCount = 1, maxDistance = Infinity) {
    if (typeof searchPoint === 'undefined') {
      throw TypeError("Method 'closest' needs a point")
    }

    const sqMaxDistance = maxDistance ** 2
    return this.kNearest(searchPoint, maxCount, sqMaxDistance, 0, 0).found
  }

  kNearest (
    searchPoint,
    maxCount,
    sqMaxDistance,
    furthestSqDistance,
    foundSoFar
  ) {
    let found = []

    if (this.divided) {
      this.children
        .sort(
          (a, b) =>
            a.boundary.sqDistanceFrom(searchPoint) -
            b.boundary.sqDistanceFrom(searchPoint)
        )
        .forEach(child => {
          const sqDistance = child.boundary.sqDistanceFrom(searchPoint)
          if (sqDistance > sqMaxDistance) {
            return
          } else if (foundSoFar < maxCount || sqDistance < furthestSqDistance) {
            const result = child.kNearest(
              searchPoint,
              maxCount,
              sqMaxDistance,
              furthestSqDistance,
              foundSoFar
            )
            const childPoints = result.found
            found = found.concat(childPoints)
            foundSoFar += childPoints.length
            furthestSqDistance = result.furthestSqDistance
          }
        })
    } else {
      this.points
        .sort(
          (a, b) =>
            a.sqDistanceFrom(searchPoint) - b.sqDistanceFrom(searchPoint)
        )
        .forEach(p => {
          const sqDistance = p.sqDistanceFrom(searchPoint)
          if (sqDistance > sqMaxDistance) {
            return
          } else if (foundSoFar < maxCount || sqDistance < furthestSqDistance) {
            found.push(p)
            furthestSqDistance = Math.max(sqDistance, furthestSqDistance)
            foundSoFar++
          }
        })
    }

    return {
      found: found
        .sort(
          (a, b) =>
            a.sqDistanceFrom(searchPoint) - b.sqDistanceFrom(searchPoint)
        )
        .slice(0, maxCount),
      furthestSqDistance: Math.sqrt(furthestSqDistance)
    }
  }

  forEach (fn) {
    if (this.divided) {
      this.northeast.forEach(fn)
      this.northwest.forEach(fn)
      this.southeast.forEach(fn)
      this.southwest.forEach(fn)
    } else {
      this.points.forEach(fn)
    }
  }

  filter (fn) {
    let filtered = new QuadTree(this.boundary, this.capacity)

    this.forEach(point => {
      if (fn(point)) {
        filtered.insert(point)
      }
    })

    return filtered
  }

  merge (other, capacity) {
    let left = Math.min(this.boundary.left, other.boundary.left)
    let right = Math.max(this.boundary.right, other.boundary.right)
    let top = Math.min(this.boundary.top, other.boundary.top)
    let bottom = Math.max(this.boundary.bottom, other.boundary.bottom)

    let height = bottom - top
    let width = right - left

    let midX = left + width / 2
    let midY = top + height / 2

    let boundary = new Rectangle(midX, midY, width, height)
    let result = new QuadTree(boundary, capacity)

    this.forEach(point => result.insert(point))
    other.forEach(point => result.insert(point))

    return result
  }

  get length () {
    if (this.divided) {
      return (
        this.northwest.length +
        this.northeast.length +
        this.southwest.length +
        this.southeast.length
      )
    }

    return this.points.length
  }
}

if (typeof module !== 'undefined') {
  module.exports = { Point, Rectangle, QuadTree, Circle }
}
