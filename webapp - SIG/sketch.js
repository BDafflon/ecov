let canvas

let myMap
let mappa = new Mappa('Leaflet')

let tableTrip
let tableRNCP
let tableDomTravaille

let dataTrip = []
let dataRNCP = []
let dataDom = {}

let bestTrajet

let chk1
let chk_depart
let chk_arrivee
let slider

let tripLimit = 1

let dateStart = 'oct'
let dateEnd = 'feb'

let fullStat = {}
let offsetStat = {}
let clusters = new Clusters()
let hubs = []
let hubThreshold = 10

let qtree

// centre map
let options = {
  lat: 45.8,
  lng: 4.77,
  zoom: 9,
  style: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png'
}

function preload () {
  //my table is comma separated value "csv"
  //and has a header specifying the columns labels
  tableTrip = loadTable('linestrings_RNCP.csv', 'csv', 'header')
  tableRNCP = loadTable('RNCP_decembre.csv', 'csv', 'header')
  tableDomTravaille = loadTable(
    'mobilite_professionnelle_69.csv',
    'csv',
    'header'
  )
}

function setup () {
  let boundary = new Rectangle(600 / 2, 600 / 2, 600, 600)
  qtree = new QuadTree(boundary, 10)
  rangeInput[0].value = 0
  rangeInput[1].value = 100
  chk1 = select('#box1').elt
  chk_depart = select('#box2').elt
  chk_arrivee = select('#box3').elt

  canvas = createCanvas(600, 600)
  canvas.parent('carte')
  myMap = mappa.tileMap(options)
  myMap.overlay(canvas)

  myMap.onChange(callbackFunction)

  for (let r = 0; r < tableTrip.getRowCount(); r++) {
    dataTrip.push(new Trip(tableTrip.getRow(r).obj))
  }

  for (let r = 0; r < tableDomTravaille.getRowCount(); r++) {
    dataDom[
      tableDomTravaille.getRow(r).obj.code_origine +
        ' ' +
        tableDomTravaille.getRow(r).obj.code_destination
    ] = {
      fluxCovoit: 0,
      fluxVoiture: tableDomTravaille.getRow(r).obj.flux_voiture
    }
  }

  for (let r = 0; r < tableRNCP.getRowCount(); r++) {
    dataRNCP.push(new Rncp(tableRNCP.getRow(r).obj))
  }

  dataRNCP.forEach(d => {
    if (d.journey_start_insee + ' ' + d.journey_end_insee in dataDom) {
      dataDom[d.journey_start_insee + ' ' + d.journey_end_insee].fluxCovoit += 1
    }
  })

  correspondence(dataRNCP, dataTrip, dataDom)

  hubThreshold = parseInt(
    map(document.getElementById('sizeHub').value, 0, 1000, 1, 100)
  )
  hubs = getHubs(dataTrip, hubThreshold)

  normalisation(dataTrip)

  dateStart = 0
  dateEnd = dataTrip.length

  fullStat = computStat(dataTrip, 0, dataTrip.length - 1)

  document.getElementById('covoitMaxDuration').innerHTML = getTime(
    fullStat.maxDuration.journey_duration
  )
  document.getElementById('covoitMaxLongeur').innerHTML =
    fullStat.maxDistance.journey_distance / 1000 + ' km'
  document.getElementById('distanceTotal').innerHTML =
    fullStat.totalDistance / 1000 + ' km'
  clusters.load(dataRNCP)
}

function draw () {
  displayStatRepartion(
    clusters.getStat(
      0,
      parseInt(
        map(
          document.getElementById('nbCommune').value,
          0,
          1000,
          1,
          clusters.getSize()
        )
      )
    )
  )

  if (
    hubThreshold !=
    parseInt(map(document.getElementById('sizeHub').value, 0, 1000, 1, 100))
  ) {
    hubThreshold = parseInt(
      map(document.getElementById('sizeHub').value, 0, 1000, 1, 100)
    )
    hubs = getHubs(dataTrip, hubThreshold)
  }

  displayHubs(hubs)

  displayTaux()

  starti = parseInt(map(rangeInput[0].value, 0, 1000, 0, dataTrip.length - 1))
  endi = parseInt(map(rangeInput[1].value, 0, 1000, 0, dataTrip.length - 1))

  offsetStat = computStat(dataTrip, starti, endi)

  document.getElementById('covoitMaxDurationOffset').innerHTML = getTime(
    offsetStat.maxDuration.journey_duration
  )
  document.getElementById('covoitMaxLongeurOffset').innerHTML =
    offsetStat.maxDistance.journey_distance / 1000 + ' km'
  document.getElementById('distanceTotalOffset').innerHTML =
    offsetStat.totalDistance / 1000 + ' km'
  document.getElementById('nbTrajetOffset').innerHTML =
    offsetStat.nbTrajetOffset

  callbackFunction()

  let range = new Circle(mouseX, mouseY, 10 * myMap.zoom())
  showQuadTree(qtree, range)

  stroke('pink')
  strokeWeight(10)
  ellipse(range.x, range.y, range.r * 2)

  let points = qtree.query(range)
  for (let p of points) {
    stroke(255, 0, 0)
    strokeWeight(4)
    point(p.x, p.y)
  }
}

function showQuadTree (qtree, range) {
  noFill()
  strokeWeight(1)
  rectMode(CENTER)
  stroke(255, 41)
  if (range.intersects(qtree.boundary)) {
    stroke(255)
  }
  rect(qtree.boundary.x, qtree.boundary.y, qtree.boundary.w, qtree.boundary.h)

  stroke(255)
  strokeWeight(2)

  if (qtree.divided) {
    showQuadTree(qtree.northeast, range)
    showQuadTree(qtree.northwest, range)
    showQuadTree(qtree.southeast, range)
    showQuadTree(qtree.southwest, range)
  }
}

function displayTaux () {
  let sommeCo = 0
  let sommeNoCo = 0
  let sommeHP = 0
  dataTrip.forEach(element => {
    sommeCo += element.trajetCovoit
    sommeNoCo += element.trajetDomTra
    sommeHP += element.trajetCovoitHP
  })
  document.getElementById('trajetDomTra').innerHTML = sommeHP
  document.getElementById('ratioCovoit').innerHTML = parseFloat(
    sommeCo / sommeNoCo
  ).toFixed(3)
  document.getElementById('bestTrajet').innerHTML =
    bestTrajet.rncp[0].journey_start_town +
    ' -> ' +
    bestTrajet.rncp[0].journey_end_town +
    '(' +
    bestTrajet.nb +
    ')'
}

function displayHubs (data) {
  let s = '<ul>'
  data.forEach(element => {
    s +=
      '<li> [' +
      element.lat +
      ',' +
      element.lon +
      '] : ' +
      element.cpt +
      ' passage(s) </li>'
  })
  s += '</ul>'
  document.getElementById('hubs').innerHTML = s
}

function displayStatRepartion (data) {
  let s = '<ul>'
  data.maxStart.forEach(element => {
    s += '<li>' + element.name + '(' + element.nbStart + ') </li>'
  })
  s += '</ul>'
  document.getElementById('communeDepart').innerHTML = s

  s = '<ul>'
  data.maxEnd.forEach(element => {
    s += '<li>' + element.name + '(' + element.nbEnd + ') </li>'
  })
  s += '</ul>'
  document.getElementById('communeArrivee').innerHTML = s
}

function callbackFunction () {
  clear()
  qtree.clear()
  starti = parseInt(map(rangeInput[0].value, 0, 1000, 0, dataTrip.length - 1))
  endi = parseInt(map(rangeInput[1].value, 0, 1000, 0, dataTrip.length - 1))

  hubs.forEach(element => {
    const start = myMap.latLngToPixel(element.lat, element.lon)

    strokeWeight(10)
    stroke(255, 0, 0)
    point(start.x, start.y, 50)
  })
  dataTrip.forEach(function (value, i) {
    value.show(chk_depart, chk_arrivee)

    if (chk1.checked && i < endi && i > starti) {
      value.showTrip()
    }
  })
}
