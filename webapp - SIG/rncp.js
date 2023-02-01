class Rncp{
    constructor(obj){
        this.journey_id=obj.journey_id
        this.trip_id=obj.trip_id
        this.journey_start_datetime=obj.journey_start_datetime
        this.journey_start_lat=obj.journey_start_lat
        this.journey_start_lon=obj.journey_start_lon
        this.journey_start_insee=obj.journey_start_insee
        this.journey_start_postcode=obj.journey_start_postcode
        this.journey_start_town=obj.journey_start_town
        this.journey_start_country=obj.journey_start_country
        this.journey_end_datetime=obj.journey_end_datetime
        this.journey_end_lat=obj.journey_end_lat
        this.journey_end_lon=obj.journey_end_lon
        this.journey_end_insee=obj.journey_end_insee
        this.journey_end_postcode=obj.journey_end_postcode
        this.journey_end_town=obj.journey_end_town
        this.journey_end_country=obj.journey_end_country
        this.journey_distance=parseInt( obj.journey_distance)
        this.journey_duration=parseInt(obj.journey_duration)
        this.timestampStart = Date.parse(obj.journey_start_datetime)/1000
        this.timestampEnd = Date.parse(obj.journey_end_datetime)/1000
        this.trip= []
    }
}