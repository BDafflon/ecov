class Trip {
  constructor (obj) {
    this.uuid = Math.floor(
      Math.random() * (9999999990 - 199999999 + 1) + 199999999
    )
    this.timestampStart = undefined
    this.startLat = obj.journey_start_lat
    this.startLng = obj.journey_start_lon
    this.endLat = obj.journey_end_lat
    this.endLng = obj.journey_end_lon
    this.journey_start_insee = undefined
    this.journey_end_insee = undefined
    this.waypoint = []
    this.rncp = []
    this.trajetCovoit = 0
    this.trajetDomTra = 0
    this.trajetCovoitHP = 0
    this.normalizedRncp = 255
    this.myPolyline = new ofPolyline()
    let data = obj.geometry
      .replace('LINESTRING (', '')
      .replace(')', '')
      .split(', ')
    data.forEach(element => {
      this.waypoint.push([
        parseFloat(element.split(' ')[1]),
        parseFloat(element.split(' ')[0])
      ])
    })
  }

  show (chk_depart, chk_arrivee) {
    strokeWeight(4)
    stroke(0)
    const start = myMap.latLngToPixel(this.startLat, this.startLng)
    const stop = myMap.latLngToPixel(this.endLat, this.endLng)
    if (chk_depart.checked) {
      stroke(0, 255, 0)
      point(start.x, start.y, 10)
    }
    if (chk_arrivee.checked) {
      stroke(0, 0, 255)
      point(stop.x, stop.y, 10)
    }
  }

  showTrip () {
    noFill()
    stroke(0, 128)
    strokeWeight(4)
    stroke(0, 255, 0, this.normalizedRncp)
    this.myPolyline = new ofPolyline()

    for (let i = 0; i < this.waypoint.length; i = i + 20) {
      let s = myMap.latLngToPixel(this.waypoint[i][0], this.waypoint[i][1])

      this.myPolyline.add(s.x, s.y)
      qtree.insert(new Point(s.x, s.y))

      this.myPolyline.calculateApprox(1)
    }
    let s = myMap.latLngToPixel(
      this.waypoint[this.waypoint.length - 1][0],
      this.waypoint[this.waypoint.length - 1][1]
    )

    this.myPolyline.add(s.x, s.y)
    this.myPolyline.calculateApprox(1)

    this.myPolyline.displayApprox()
    fill(0)
  }
}
