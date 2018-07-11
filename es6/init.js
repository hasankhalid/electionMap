// reading in alll the files and defining the execution function
d3.queue()
  .defer(d3.json, "./essentials/pakistan_districts.topojson")
  .defer(d3.json, "./essentials/JAndKashmir.topojson")
  .defer(d3.json, "./essentials/Pak_prov.topojson")
  .defer(d3.json, "./essentials/Pakistan_NationalBoundary.topojson")
  .defer(d3.csv, "./essentials/NA_seats_2013.csv")
  .await(initialize)

function initialize (error, topology, prov_topology, prov2013, prov_seats_2013) {

}
