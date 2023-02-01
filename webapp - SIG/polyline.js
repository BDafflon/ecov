//===========================================
class ofPolyline {
    // Adapted from openFrameworks ofPolyline: 
    // openFrameworks/blob/master/graphics/ofPolyline.cpp
  
    constructor() {
      this.points = [];
      this.lengths = [];
      this.approx = [];
  
      this.beziers = [];
      this.bezierLengths = [];
      this.bezierResamples = []; 
    }
  
    clear() {
      this.points = [];
      this.lengths = [];
      this.approx = [];
  
      this.beziers = [];
      this.bezierLengths = [];
      this.bezierResamples = []; 
    }
  
    //--------------------------------------------------
    add(x, y) {
      // Store the new point if it's further than thresh away from prev.
      var N = this.points.length;
      var v2 = createVector(x, y);
      if (N === 0) {
        this.points.push(v2);
      } else {
        var movedThresh = 3;
        var v1 = this.points[N - 1];
        var moved = p5.Vector.dist(v1, v2);
        if (moved > movedThresh) {
          this.points.push(v2);
        }
      }
  
      // Store the cumulative length at this point.  
      N = this.points.length;
      if (N > 1) {
        var v1 = this.points[N - 2];
        var len = this.lengths[this.lengths.length - 1];
        len += p5.Vector.dist(v1, v2);
        this.lengths.push(len);
      } else {
        this.lengths.push(0);
      }
    }
  
    //--------------------------------------------------
    getSmoothed3() {
      var N = this.points.length;
      if (N > 2) {
        let smoothedPoly = new ofPolyline();
        smoothedPoly.add(this.points[0].x, this.points[0].y);
        for (var i = 1; i < (N - 1); i++) {
          var v0 = this.points[i - 1];
          var v1 = this.points[i];
          var v2 = this.points[i + 1];
          var x = (v0.x + 2 * v1.x + v2.x) / 4.0; // 1-2-1
          var y = (v0.y + 2 * v1.y + v2.y) / 4.0; // 1-2-1
          smoothedPoly.add(x, y);
        }
        smoothedPoly.add(this.points[N - 1].x, this.points[N - 1].y);
        return smoothedPoly;
      } else {
        return this;
      }
    }
  
  
  
  
  
    //--------------------------------------------------
    recalculateBezierLengths() {
      // Calculate an array storing cumulative lengths
      // for all of the bezier segments. 
      this.bezierLengths = [];
      var N = this.beziers.length;
  
      var len = 0;
      this.bezierLengths.push(len);
      for (var i = 0; i < N; i++) {
        len += this.beziers[i].length;
        this.bezierLengths.push(len);
      }
    }
  
    //-----------------------
    getBezierPerimeter() {
      var out = 0;
      var N = this.bezierLengths.length;
      if (N > 0) {
        out = this.bezierLengths[N - 1];
      }
      return out;
    }
  
    //-----------------------
    getBezierPointAtPercent(percent) {
      var nPoints = this.points.length;
      var bezPerimeter = this.getBezierPerimeter();
      if ((nPoints > 0) && (bezPerimeter > 0)) {
        if (percent <= 0) {
          return this.points[0]; // first point
        } else if (percent >= 1) {
          return this.points[nPoints - 1]; // last point
        }
        var inputLen = percent * bezPerimeter;
        return this.getBezierPointAtLength(inputLen);
      }
      return createVector(0, 0);
    }
  
    //-----------------------
    getBezierPointAtLength(inputLen) {
      var bezPerimeter = this.getBezierPerimeter();
      if (inputLen <= 0) {
        return this.points[0]; // first point
      } else if (inputLen >= bezPerimeter) {
        return this.points[nPoints - 1]; // last point
      }
      var nBezSegmentLengths = this.bezierLengths.length; 
      var currBezSegmentIndex = 0;
      var currBezSegmentLength = this.bezierLengths[currBezSegmentIndex];
      while ((currBezSegmentIndex < (nBezSegmentLengths - 1)) &&
        (inputLen > currBezSegmentLength)) {
        currBezSegmentIndex++;
        currBezSegmentLength = this.bezierLengths[currBezSegmentIndex];
      }
      currBezSegmentIndex = max(0, currBezSegmentIndex-1); // safety
      var prevBezSegmentLength = this.bezierLengths[currBezSegmentIndex];
      
      var currBezSegment = this.beziers[currBezSegmentIndex]; 
      return currBezSegment.getPointAtLength(inputLen-prevBezSegmentLength, 10);
    }
   
    //-----------------------
    calculateBezierResamples(nResamples){
      this.bezierResamples = []; 
      for (var i = 0; i < nResamples; i++) {
        var percent = map(i, 0, nResamples-1, 0, 1);
        var bezResamplePoint = this.getBezierPointAtPercent(percent);
        this.bezierResamples.push(bezResamplePoint); 
      }
    }
  
  
  
  
    //--------------------------------------------------
    getSmoothedRetainSharp() {
      // Slated for deletion
      var N = this.points.length;
      if (N > 2) {
        let smoothedPoly = new ofPolyline();
        smoothedPoly.add(this.points[0].x, this.points[0].y);
  
        // use kernel proportional to angle. 
        // sharp angles, less blurring. 
  
        for (var i = 1; i < (N - 1); i++) {
          var v0 = this.points[i - 1];
          var v1 = this.points[i];
          var v2 = this.points[i + 1];
  
          // https://p5js.org/reference/#/p5.Vector/angleBetween
          var d01 = p5.Vector.sub(v0, v1);
          var d21 = p5.Vector.sub(v2, v1);
          var ang = degrees(abs(d01.angleBetween(d21))); // 0..180
          if (isNaN(ang)) ang = 180;
          ang = constrain(ang, 30, 150);
          var kink = map(ang, 30, 150, 0.98, 0.80);
  
          var B = kink; // * 0.9;     
          var A = (1.0 - B) / 2.0;
          var x = (A * v0.x + B * v1.x + A * v2.x);
          var y = (A * v0.y + B * v1.y + A * v2.y);
          smoothedPoly.add(x, y);
        }
  
        smoothedPoly.add(this.points[N - 1].x, this.points[N - 1].y);
        return smoothedPoly;
      } else {
        return this;
      }
    }
  
  
  
    //--------------------------------------------------
    recalculateLengths() {
      this.lengths = [];
      var N = this.points.length;
      if (N === 1) {
        this.lengths.push(0);
      } else if (N > 1) {
        var len = 0;
        this.lengths.push(len);
        for (var i = 1; i < N; i++) {
          var v1 = this.points[i - 1];
          var v2 = this.points[i];
          len += p5.Vector.dist(v1, v2);
          this.lengths.push(len);
        }
      }
    }
  
  
    //--------------------------------------------------
    display() {
      var N = this.points.length;
      beginShape();
      for (var i = 0; i < N; i++) {
        var p = this.points[i];
        vertex(p.x, p.y);
      }
      endShape();
    }
  
    //--------------------------------------------------
    displayAsCircles() {
      var N = this.points.length;
      for (var i = 0; i < N; i++) {
        var p = this.points[i];
        point(p.x, p.y, 5);
      }
    }
  
    //--------------------------------------------------
    displayApprox() {
      var N = this.approx.length;
      if (N > 0) {
        beginShape();
        for (var i = 0; i < N; i++) {
          var p = this.approx[i];
          vertex(p.x, p.y);
        }
        endShape();
        for (var i = 0; i < N; i++) {
          var p = this.approx[i];
          point(p.x, p.y, 9);
        }
      }
    }
  
    //--------------------------------------------------
    getPerimeter() {
      var out = 0;
      var N = this.points.length;
      if (N >= 2) {
        for (var i = 1; i < N; i++) {
          var v1 = this.points[i - 1];
          var v2 = this.points[i];
          out += p5.Vector.dist(v1, v2);
        }
      }
      return out;
    }
  
    retrievePerimeter() {
      var N = this.lengths.length;
      return this.lengths[N - 1];
    }
  
    //--------------------------------------------------
    getIndexAtLength(len) {
      // OF uses a binary search for this, 
      // ...but their code may have an error.
      if (this.points.length < 2) {
        return 0;
      } else if (len <= 0) {
        return 0;
      } else if (len >= this.getPerimeter()) {
        return (this.points.length - 1);
      }
  
      var out = 0;
      var nLengthsm1 = this.lengths.length - 1;
      for (var i = 0; i < nLengthsm1; i++) {
        var indexLo = i;
        var indexHi = i + 1;
        var lengthLo = this.lengths[indexLo];
        var lengthHi = this.lengths[indexHi];
        if ((len >= lengthLo) && (len < lengthHi)) {
          var t = map(len, lengthLo, lengthHi, 0, 1);
          t = constrain(t, 0, 1);
          out = indexLo + t;
          break;
        }
      }
      return out;
    }
  
    //--------------------------------------------------
    getIndexAtPercent(pct) {
      var pctPerimeter = pct * this.getPerimeter();
      return this.getIndexAtLength(pctPerimeter);
    }
  
    //--------------------------------------------------
    getLengthAtIndex(intIndex) {
      if (this.points.length < 2) {
        return 0;
      } else if (intIndex < 0) {
        return 0;
      } else if (intIndex >= this.points.length) {
        return this.getPerimeter();
      }
  
      intIndex = constrain(intIndex, 0, this.lengths.length - 1);
      return this.lengths[floor(intIndex)];
    }
  
    //--------------------------------------------------
    getLengthAtIndexInterpolated(findex) {
      var nPoints = this.points.length;
      if (nPoints < 2) {
        return 0;
      } else if (findex < 0) {
        return 0;
      } else if (findex >= this.points.length) {
        return this.getPerimeter();
      }
  
      var i1 = floor(findex);
      var i2 = min(i1 + 1, this.points.length - 1);
      var t = findex - i1;
      return lerp(this.getLengthAtIndex(i1), this.getLengthAtIndex(i2), t);
    }
  
    //-------------------------------------------------- 
    getPointAtIndexInterpolated(findex) {
      var nPoints = this.points.length;
      if (nPoints === 0) {
        return createVector(0, 0, 0);
      } else if (nPoints === 1) {
        return this.points[0];
      } else if (findex >= (nPoints - 1)) {
        return this.points[nPoints - 1];
      }
  
      var i1 = floor(findex);
      var i2 = min(i1 + 1, this.points.length - 1);
      var t = findex - i1;
      var v1 = this.points[i1];
      var v2 = this.points[i2];
      return p5.Vector.lerp(v1, v2, t);
    }
  
    //--------------------------------------------------
    getPointAtLength(f) { // ported
      var nPoints = this.points.length;
      var nLengths = this.lengths.length;
      if (nPoints <= 0) {
        return createVector(0, 0);
      } else if (nPoints == 1) {
        return this.points[0];
      } else if (f >= this.lengths[nLengths - 1]) {
        return this.points[nPoints - 1];
      }
      return this.getPointAtIndexInterpolated(this.getIndexAtLength(f));
    }
  
    //--------------------------------------------------
    getPointAtPercent(f) {
      var len = this.getPerimeter(); //retrievePerimeter();
      return this.getPointAtLength(f * len);
    }
  
    //----------------------------------------------------------
    getResampledBySpacing(spacing) {
      var nPoints = this.points.length;
      if ((nPoints <= 1) || (spacing <= 0)) {
        return this;
      }
      let resampledPoly = new ofPolyline();
      var totalLength = this.getPerimeter(); //retrievePerimeter();
      var resampleCount = 0;
      for (var f = 0; f < totalLength; f += spacing) {
        var pointAtf = this.getPointAtLength(f);
        resampledPoly.add(pointAtf.x, pointAtf.y);
        resampleCount++;
      }
  
      // Correction to handle numeric precision error on last point:
      var lastP = this.points[nPoints - 1];
      var lastQ = resampledPoly.points[resampledPoly.points.length - 1];
      var pqDist = lastQ.dist(lastP);
      if (pqDist > (spacing * 0.1)) {
        resampledPoly.add(lastP.x, lastP.y);
      }
      return resampledPoly;
    }
  
    //----------------------------------------------------------
    getResampledByCount(count) {
      var perimeter = this.getPerimeter();
      count = max(count, 2);
      return this.getResampledBySpacing(perimeter / (count - 1));
    }
  
    //----------------------------------------------------------
    calculateBeziers(pointArray) {
  
      this.beziers = [];
      var N = pointArray.length;
      if (N > 2) {
        var p1, p2, p3, p4;
  
        // Handle start
        p1 = pointArray[0];
        p3 = this.getVertexPoint(pointArray, 1, -1);
        p4 = this.getVertexPoint(pointArray, 1, 0);
        p2 = p5.Vector.lerp(p1, p4, 0.5);
        this.beziers.push(new BezierQuad(p1, p2, p3, p4));
  
        // Handle middle
        for (var i = 1; i < (N - 2); i++) {
          p1 = this.getVertexPoint(pointArray, i, 0);
          p2 = this.getVertexPoint(pointArray, i, 1);
          p3 = this.getVertexPoint(pointArray, i + 1, -1);
          p4 = this.getVertexPoint(pointArray, i + 1, 0);
          this.beziers.push(new BezierQuad(p1, p2, p3, p4));
        }
  
        // Handle end
        p4 = pointArray[N - 1];
        p1 = pointArray[N - 2];
        p2 = this.getVertexPoint(pointArray, N - 2, 1);
        p3 = p5.Vector.lerp(p1, p4, 0.5);
        this.beziers.push(new BezierQuad(p1, p2, p3, p4));
      }
    }
  
    //----------------------------------------------------------
    displayCalculatedBeziers() {
      var N = this.beziers.length;
      if (N > 0) {
        var p1, p2, p3, p4;
        beginShape();
        p1 = this.beziers[0].p1;
        vertex(p1.x, p1.y);
        for (var i = 0; i < N; i++) {
          p2 = this.beziers[i].p2;
          p3 = this.beziers[i].p3;
          p4 = this.beziers[i].p4;
          bezierVertex(p2.x, p2.y, p3.x, p3.y, p4.x, p4.y);
        }
        endShape();
      }
    }
  
  
    //----------------------------------------------------------
    getVertexPoint(pointArray, index, side) {
      var N = pointArray.length;
      if (side === 0) {
        return (pointArray[index]);
      } else {
  
        // Get the current vertex, and its neighbors
        var vB = pointArray[index];
        var vA = pointArray[index - 1];
        var vC = pointArray[index + 1];
  
        // Compute delta vectors from neigbors
        var dAB = p5.Vector.sub(vA, vB);
        var dCB = p5.Vector.sub(vC, vB);
        var dAB1 = dAB.copy().normalize();
        var dCB1 = dCB.copy().normalize();
  
        // Compute perpendicular and tangent vectors
        var vPerp = p5.Vector.add(dAB1, dCB1).normalize();
        var vTan = createVector(vPerp.y, 0 - vPerp.x);
        var vCros = p5.Vector.cross(dAB1, dCB1);
  
        // Compute angle between vectors, 
        // Make Bezier tighter for sharper angles
        // https://p5js.org/reference/#/p5.Vector/angleBetween
        var ang = degrees(abs(dAB1.angleBetween(dCB1))); // 0..180
        if (isNaN(ang)) ang = 180;
        ang = constrain(ang, 0, 90);
  
  
        // Compute control point
        // var tightness = 1.0 / 3.0;
        ang = pow((ang / 90.0), 2.0);
        var tightness = map(ang, 0, 1, 0.00, 0.33);
  
        var len = tightness;
        if (side === 1) {
          len *= dCB.mag();
          len *= (vCros.z > 0) ? -1 : 1;
        } else { // e.g. if side === -1
          len *= dAB.mag();
          len *= (vCros.z < 0) ? -1 : 1;
        }
        return (vB.copy().add(vTan.mult(len)));
      }
    }
  
    //----------------------------------------------------------
    pointDistanceToSegment(p, p0, p1) {
      // https://stackoverflow.com/a/6853926
      var x = p.x;
      var y = p.y;
      var x1 = p0.x;
      var y1 = p0.y;
      var x2 = p1.x;
      var y2 = p1.y;
      var A = x - x1;
      var B = y - y1;
      var C = x2 - x1;
      var D = y2 - y1;
      var dot = A * C + B * D;
      var len_sq = C * C + D * D;
      var param = -1;
      if (len_sq != 0) {
        param = dot / len_sq;
      }
      var xx;
      var yy;
      if (param < 0) {
        xx = x1;
        yy = y1;
      } else if (param > 1) {
        xx = x2;
        yy = y2;
      } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
      }
      var dx = x - xx;
      var dy = y - yy;
      return sqrt(dx * dx + dy * dy);
    }
  
    calculateApprox(precision) {
      this.approx = this.approxPolyDP(this.points, precision);
    }
  
    approxPolyDP(pointArray, epsilon) {
      // https://en.wikipedia.org/wiki/Ramer–Douglas–Peucker_algorithm
      // David Douglas & Thomas Peucker, 
      // "Algorithms for the reduction of the number of points required to 
      // represent a digitized line or its caricature", 
      // The Canadian Cartographer 10(2), 112–122 (1973)
  
      var N = pointArray.length;
      if (N <= 4) {
        return pointArray;
      }
  
      var dmax = 0;
      var argmax = -1;
      for (var i = 1; i < N - 1; i++) {
        var d = this.pointDistanceToSegment(
          pointArray[i],
          pointArray[0],
          pointArray[N - 1]);
        if (d > dmax) {
          dmax = d;
          argmax = i;
        }
      }
  
      var ret = [];
      if (dmax > epsilon) {
        var L = this.approxPolyDP(pointArray.slice(0, argmax + 1), epsilon);
        var R = this.approxPolyDP(pointArray.slice(argmax, N), epsilon);
        ret = ret.concat(L.slice(0, L.length - 1));
        ret = ret.concat(R);
      } else {
        ret.push(pointArray[0]);
        ret.push(pointArray[N - 1]);
      }
      return ret;
    }
  
  }
  
  //===========================================
  class BezierQuad {
    constructor(a1, a2, a3, a4) {
      this.p1 = a1; //createVector();
      this.p2 = a2; //createVector();
      this.p3 = a3; //createVector();
      this.p4 = a4; //createVector();
      this.length = this.getLength();
    }
  
    //---------------------------
    getPointAtLengthFrac(inputFrac, nIterations) {
      return this.getPointAtLength(inputFrac * this.length, nIterations);
    }
  
    //---------------------------
    getPointAtLength(inputLen, nIterations) {
      var hiT = 1.0;
      var loT = 0.0;
      var T = (hiT + loT) / 2.0;
      for (var i = 0; i < nIterations; i++) {
        T = (hiT + loT) / 2.0;
        var lengthAtT = this.getLengthAtT(T);
        if (lengthAtT > inputLen) {
          hiT = T;
        } else if (lengthAtT < inputLen) {
          loT = T;
        } else if (lengthAtT === inputLen) {
          break;
        }
      }
      let p1 = this.p1;
      let p2 = this.p2;
      let p3 = this.p3;
      let p4 = this.p4;
      let x = bezierPoint(p1.x, p2.x, p3.x, p4.x, T);
      let y = bezierPoint(p1.y, p2.y, p3.y, p4.y, T);
      return createVector(x, y);
    }
  
    //---------------------------
    getLengthAtT(input) {
      if (input <= 0) {
        return 0;
      } else if (input >= 1) {
        return this.length; //getLength();
      }
  
      var nSteps = 64;
      var len = 0;
  
      let p1 = this.p1;
      let p2 = this.p2;
      let p3 = this.p3;
      let p4 = this.p4;
      let px = p1.x;
      let py = p1.y;
      for (let i = 0; i <= nSteps; i++) {
        let t = i / nSteps;
        if (t < input) {
          let x = bezierPoint(p1.x, p2.x, p3.x, p4.x, t);
          let y = bezierPoint(p1.y, p2.y, p3.y, p4.y, t);
          if (i > 0) {
            len += dist(x, y, px, py);
          }
          px = x;
          py = y;
        }
      }
      let x = bezierPoint(p1.x, p2.x, p3.x, p4.x, input);
      let y = bezierPoint(p1.y, p2.y, p3.y, p4.y, input);
      len += dist(x, y, px, py);
      return len;
    }
  
    //---------------------------
    getLength() {
      // There is no closed-form solution for cubic beziers.
      var nSteps = 64;
      var len = 0;
      let px = 0;
      let py = 0;
      let p1 = this.p1;
      let p2 = this.p2;
      let p3 = this.p3;
      let p4 = this.p4;
      for (let i = 0; i <= nSteps; i++) {
        let t = i / nSteps;
        let x = bezierPoint(p1.x, p2.x, p3.x, p4.x, t);
        let y = bezierPoint(p1.y, p2.y, p3.y, p4.y, t);
        if (i > 0) {
          len += dist(x, y, px, py);
        }
        px = x;
        py = y;
      }
      return len;
    }
  }