function getTime (second) {
  let s = second
  let h = Math.floor(s / 3600)
  h = h.toLocaleString('en-US', {
    minimumIntegerDigits: 2,
    useGrouping: false
  })
  s %= 3600
  let m = Math.floor(s / 60)
  m = m.toLocaleString('en-US', {
    minimumIntegerDigits: 2,
    useGrouping: false
  })
  s = s % 60
  s = s.toLocaleString('en-US', {
    minimumIntegerDigits: 2,
    useGrouping: false
  })
  return h + ':' + m + ':' + s
}

function randomIntFromInterval (min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function getDate (timestamp) {
  var a = new Date(timestamp * 1000)
  var months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ]
  var year = a.getFullYear()
  var month = months[a.getMonth()]
  var date = a.getDate()
  var hour = a.getHours()
  var min = a.getMinutes()
  var sec = a.getSeconds()
  var time =
    date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec
  return time
}

function isHeurePointe (datetime) {
  const d = new Date(datetime)
  let h = d.getHours()
  if ((h > 7 && h < 9) || (h > 17 && h < 20)) return true
  return false
}

function getDistanceFromLatLonInKm (lat1, lon1, lat2, lon2) {
  var R = 6371 // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1) // deg2rad below
  var dLon = deg2rad(lon2 - lon1)
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  var d = R * c // Distance in km
  return d
}

function deg2rad (deg) {
  return deg * (Math.PI / 180)
}

function compare (a, b) {
  if (a.timestampStart > b.timestampStart) {
    return 1
  }
  if (a.timestampStart < b.timestampStart) {
    return -1
  }
  return 0
}

function dynamicSort (property) {
  var sortOrder = 1
  if (property[0] === '-') {
    sortOrder = -1

    property = property.substr(1)
  }
  return function (a, b) {
    /* next line works with strings and numbers,
     * and you may want to customize it to your needs
     */
    var result =
      a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0
    return result * sortOrder
  }
}


function correspondence (data, trip, dom) {
  trip.forEach(t => {
    data.forEach(d => {
      if (
        getDistanceFromLatLonInKm(
          d.journey_start_lat,
          d.journey_start_lon,
          t.startLat,
          t.startLng
        ) < 0.1
      ) {
        if (
          getDistanceFromLatLonInKm(
            d.journey_end_lat,
            d.journey_end_lon,
            t.endLat,
            t.endLng
          ) < 0.1
        ) {
          print('correspondence')
          t.rncp.push(d)
          t.trajetCovoit += 1
          t.journey_end_insee = d.journey_end_insee
          t.journey_start_insee = d.journey_start_insee
          t.timestampStart = t.rncp[0].timestampStart

          if (isHeurePoint(d.journey_start_datetime)) t.trajetCovoitHP += 1
          d.trip.push(t)
        }
      }
    })

    t.rncp.sort(dynamicSort('timestampStart'))
  })

  trip.sort(dynamicSort('-trajetCovoit'))
  bestTrajet = trip[0]
  bestTrajet.nb = trip[0].rncp.length

  trip.sort(dynamicSort('timestampStart'))
}
function normalisation (dataTrip) {
  let min = Number.MAX_SAFE_INTEGER
  let max = 0
  dataTrip.forEach(element => {
    if (element.rncp.length < min) min = element.rncp.length
    if (element.rncp.length > max) max = element.rncp.length
  })

  dataTrip.forEach(element => {
    element.normalizedRncp = parseInt(
      map((element.rncp.length - min) / (max - min), 0, 1, 100, 254)
    )
  })
}

function computStat (dataTrip, istart, iend) {
  let data = []
  for (let i = istart; i <= iend; i++) {
    dataTrip[i].rncp.forEach(element => {
      data.push(element)
    })
  }

  let sum = 0
  data.sort(dynamicSort('journey_distance'))

  res = { maxDistance: data[data.length - 1] }

  data.forEach(element => {
    sum += element.journey_distance
  })

  data.sort(dynamicSort('journey_duration'))
  res['maxDuration'] = data[data.length - 1]
  res['nbTrajetOffset'] = data.length

  res['totalDistance'] = sum
  return res
}
