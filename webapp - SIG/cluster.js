class Cluster {
  constructor (journey_start_insee, name) {
    this.nbStart = 0
    this.nbEnd = 0
    this.rncpStart = []
    this.nrcpEnd = []
    this.name = name
    this.journey_start_insee = journey_start_insee
  }
}

class Clusters {
  constructor () {
    this.data = {}
  }

  getSize () {
    return Object.keys(this.data).length
  }

  load (data) {
    data.forEach(element => {
      if (element.journey_start_insee in this.data) {
        this.data[element.journey_start_insee].nbStart++
        this.data[element.journey_start_insee].rncpStart.push(element)
      } else {
        this.data[element.journey_start_insee] = new Cluster(
          element.journey_start_insee,
          element.journey_start_town
        )
        this.data[element.journey_start_insee].nbStart++
        this.data[element.journey_start_insee].rncpStart.push(element)
      }
      if (element.journey_end_insee in this.data) {
        this.data[element.journey_end_insee].nbEnd++
        this.data[element.journey_end_insee].nrcpEnd.push(element)
      } else {
        this.data[element.journey_end_insee] = new Cluster(
          element.journey_end_insee,
          element.journey_end_town
        )
        this.data[element.journey_end_insee].nbEnd++
        this.data[element.journey_end_insee].nrcpEnd.push(element)
      }
    })
  }

  getStat (istart, iend) {
    let items = []
    Object.values(this.data).forEach(val => {
      items.push(val)
    })

    items.sort(dynamicSort('-nbStart'))

    let maxStart = []
    for (let i = istart; i < iend; i++) {
      maxStart.push(items[i])
    }
    items.sort(dynamicSort('-nbEnd'))
    let maxEnd = []
    for (let i = istart; i < iend; i++) {
      maxEnd.push(items[i])
    }
    return { maxStart: maxStart, maxEnd: maxEnd }
  }
}
