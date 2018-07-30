// filter based on province, winning party and voteMargin
// class of the circles is naSeatCircle
// class of voronoi circle region is circle-catcher

// global variables for scaling na seat size
var base_bubble = 3 // min size that all bubbles take
var margin_range = 5 // range for vote margin

// width and height for voronoi boundaries
var width = 1000, height = 600;

// filter transition time (fadein/ fadeout)
var filtTransTime = 1000; // ms
// circle catch (voronoi) radius
var circle_catch_rad = 20;
var circle_catch_rad_prov = 14;

// defining an array function for difference
Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

var global_party_list = ["Pakistan Muslim League (N)","Independent","Pakistan Reh-e- Haq Party","Pakistan Peoples Party Parliamentarians","Pakistan Tehreek-e-Insaf","Awami National Party","All Pakistan Muslim League","MUTTHIDA MAJLIS-E-AMAL PAKISTAN","Pashtoonkhwa Milli Awami Party","Jamiat Ulama-e-lslam Nazaryati Pakistan","Allah-O-Akbar Tehreek","Qaumi Watan Party (Sherpao)","Tehreek Labbaik Pakistan","Pakistan Muslim League","Pak Sarzameen Party","Awami Workers Party","Humdardan-e-Watan Pakistan","Pakistan Justice and Democratic Party","Pakistan Falah Party","Tehrik Jawanan Pakistan","Pakistan Freedom Movement","Pakistan Muslim League(Z)","Pakistan Tehreek-e-lnsaf-Gulalai","Pasban Pakistan","Amun Taraqqi Party","Jamiyat Ulma-e-lslam Pakistan (S)","Pakistan Aman Tehreek","Pakistan Awami Inqelabi League","Mutahiddia Qabail Party","Majlis Wahdat-e-Muslimeen Pakistan","Page missing","National Party","Tehreek-e-Labbaik Islam","Aam Log Party Pakistan","Pakistan Awami League","Pakistan Tehreek-e-lnsaf (Nazriati)","Pakistan Human Rights Party","Pakistan Sunni Tehreek","Awami Muslim League Pakistan","Front National Pakistan","Barabri Party Pakistan","Pakistan Welfare Party","Pakistan Tehreek-e-lnsaniat","Pakistan Awami Raj","Pakistan Quami Yakjehti Party","Pakistan Peoples Party (Shaheed Bhutto)","Muttahida Qaumi Movement Pakistan","Pakistan Siraiki Party (T)","Aam Awam Party","Tehreek Tabdili Nizam Pakistan","Mustaqbil Pakistan","All Pakistan Muslim League (Jinnah)","Sunni Ittehad Council","Jamhoori Watan Party","Pakistan Kissan Ittehad (Ch. Anwar)","Awami Justice Party Pakistan","Illegible","Move on Pakistan","Pakistan Muslim Alliance","Pakistan National Muslim League","Jannat Pakistan Party","Pakistan Muslim League (Council)","Roshan Pakistan League","Pakistan Human Party","Pakistan Muslim League Organization","Awam League","Saraikistan Democratic Party","Pakistan Supreme Democratic","Jamiat Ulema-e-Pakistan (Noorani)","Aam Admi Tehreek Pakistan","Grand Democratic Alliance","Sindh United Party","Tabdeeli Pasand Party (Pakistan)","Mohajir Qaumi Movement (Pakistan)","Tehreek-e-Suba Hazara Pakistan","Pakistan Muslim League sher-e-bangal a.k. Fazal-UI-Haque","Peoples Movement of Pakistan","Balochistan Awami Party","Balochistan National Party","Balochistan National Movement","Balochistan National Party (Awami)","Jamote Qaumi Movement","All Pakistan Tehreek","Hazara Democratic Party","National Peace Council Party", "Muttahida Majlis-e-Amal Pakistan"];

//listing unique parties
var unique_parties = [
  "Pakistan Tehreek-e-Insaf",
  "Jamiat Ulama-e-Islam (F)",
  "Qaumi Watan Party (Sherpao)",
  "Awami National Party",
  "Awami Jamhuri Ittehad Pakistan",
  "Pakistan Muslim League (N)",
  "Independent",
  "Jamaat-e-Islami Pakistan",
  "All Pakistan Muslim League",
  "Awami Muslim League Pakistan",
  "Pakistan Muslim League",
  "Pakistan Muslim League(Z)",
  "Pakistan Peoples Party Parliamentarians",
  "National Peoples Party",
  "Pakistan Muslim League (F)",
  "Muttahida Qaumi Movement Pakistan",
  "Pashtoonkhwa Milli Awami Party",
  "National Party",
  "Balochistan National Party",
  "Balochistan National Party (Awami)",
  "MUTTHIDA MAJLIS-E-AMAL PAKISTAN"
];

unique_parties = unique_parties.concat(global_party_list);
unique_parties = unique_parties.filter((v, i, a) => a.indexOf(v) === i);

var parties_in_legend = [
  "Pakistan Tehreek-e-Insaf",
  "Jamiat Ulama-e-Islam (F)",
  "Pakistan Muslim League (N)",
  "Independent",
  "Pakistan Muslim League",
  "Pakistan Peoples Party Parliamentarians",
  "Pakistan Muslim League (F)",
  "Muttahida Qaumi Movement Pakistan",
  "MUTTHIDA MAJLIS-E-AMAL PAKISTAN",
  "Grand Democratic Alliance"
];

var rest_parties = unique_parties.diff(parties_in_legend)
//
//console.log(rest_parties);
// get size of the na seat circles
function getCircleSize(voteMargin, scale){
  if (scale == null){
    return base_bubble + ((voteMargin/ 100) * margin_range)
  }
  else {
    (base_bubble * scale) + ((voteMargin/ 100) * margin_range * scale)
  }

}

// master function for filtering
function filterCircles(province, party, voteMargin, ru_party, voteTurnout, na_range){

  // in case the argument is null, do not filter in that category
  // province filter
  function filterProvince(datum){
    if (province == null){
      return true;
    }
    else {
      return province.includes(datum);
    }
  }
  // Party filter
  function filterParty(datum){
    if (party == null){
      return true;
    }
    else {
      // appending rest parties in case of selected rest
      if (party.includes("Rest")){
        party = party.filter(d => d != "Rest")
        party = party.concat(rest_parties);
        //console.log(party);

      }
      return party.includes(datum);
    }
  }
  // Runner-up Party filter
  function filterRUParty(datum){
    if (ru_party == null){
      return true;
    }
    else {
      // appending rest parties in case of selected rest
      if (ru_party.includes("Rest")){
        ru_party = ru_party.filter(d => d != "Rest")
        ru_party = ru_party.concat(rest_parties);
        //console.log(party);

      }
      return ru_party.includes(datum);
    }
  }
  // VoteMargin filter
  function filterVoteMargin(datum){
    if (voteMargin == null) {
      return true;
    }
    else {
      return (voteMargin[0] <= datum && datum <= voteMargin[1]);
    }
  }

  // Vote Turnout filter
  function filterVoteTurnout(datum){
    if (voteTurnout == null) {
      return true;
    }
    else {
      return (voteTurnout[0] <= datum && datum <= voteTurnout[1]);
    }
  }

  function filterNARange(datum){
    if (na_range == null) {
      return true;
    }
    else {
      return (na_range[0] <= datum && datum <= na_range[1]);
    }
  }

  // composite filter combining by and(ing) the above category logicals
  // filteres true means filteres elements whereas false means unfiltered elements
  function compFilter(filtered){
    return function(d){
      // check if result array is empty
      var filt_party = (d.results.length != 0) ? filterParty(d.results[0].party) : true;
      var filt_party_ru = (d.results.length != 0) ? filterRUParty(d.results[1].party) : true;
      var filt_VM = (d.results.length != 0) ? filterVoteMargin(d.voteMargin) : true;
      var logical = filterProvince(d.Province) &&
      // filterParty(d.results[0].party) &&
      // filterVoteMargin(d.voteMargin) &&
      // filterRUParty(d.results[1].party) &&
      filt_party &&
      filt_VM &&
      filt_party_ru &&
      filterVoteTurnout(d["Percentage of Votes Polled to Registered Voters"]) &&
      filterNARange(+d.seat.replace("NA-", ""));
      if (filtered == true){
        return logical;
      }
      else {
        return !(logical);
      }
    }
  }

  ///// transition for the na seat circles /////

  var num_filtered = d3.selectAll(".naSeatCircle")
                      .filter(compFilter(true)).data().length

  //console.log(num_filtered);

  // filtered remain
  d3.selectAll(".naSeatCircle")
    .filter(compFilter(true))
    .transition()
    .duration(filtTransTime)
    .attr('r', d => d.radiusInit)
  // unfiltered fadeout
  d3.selectAll(".naSeatCircle")
    .filter(compFilter(false))
    .transition()
    .duration(filtTransTime)
    .attr('r', 0)


  ///// transition for the circle catchers /////

  // filtered circle catchers remain
  d3.selectAll(".circle-catcher")
    .filter(compFilter(true))
    .transition("cicleCatchTrans")
    .duration(filtTransTime)
    .attr('r', d => circle_catch_rad)
    .style('display', 'block')
  // unfilteres circle catchers fadeout
  d3.selectAll(".circle-catcher")
    .filter(compFilter(false))
    .transition("cicleCatchTrans")
    .duration(filtTransTime)
    .attr('r', 0)
    .style('display', 'none')

  // original nodes
  var nodes = d3.selectAll(".naSeatCircle").data();

  // filteres nodes
  var nodes_filtered = nodes.filter(compFilter(true));

  // update selection/ update clipPaths
  var polygon = d3.selectAll(".clip")
                  .data(voronoi.polygons(nodes_filtered), d => d.data.seat) // make sure to make data joins wrt seat
                    //Make sure each clipPath will have a unique id (connected to the circle element)
                    .attr("id", d => (d != null) ? "clipNAmap" + d.data.seat : "clipNAmap" + "NA")
                    .select("path")
                    .attr("class", "clip-path-circle NAmap")
                    .call(redrawPolygon)
  // enter selection, create new clipPaths
  var polygon_enter = d3.selectAll(".clip")
                    .enter()
                    .append("clipPath")
                    .attr("class", "clip NAmap")
                    //Make sure each clipPath will have a unique id (connected to the circle element)
                    .attr("id", d => (d != null) ? "clipNAmap" + d.data.seat : "clipNAmap" + "NA")
                    //Then append a path element that will define the shape of the clipPath
                    .append("path")
                    .attr("class", "clip-path-circle NAmap")
                    .call(redrawPolygon)

  // exite selection, remove old clipPaths
  var polygon_exit = d3.selectAll(".clip")
                      .exit()
                      .remove()

  return num_filtered
}


// redraw voronoi cell/ polygon function
function redrawPolygon(polygon) {
  polygon
      .attr("d", function(d) { return d ? "M" + d.join(",") + "Z" : null; })
}

// main voronoi definition
var voronoi = d3.voronoi()
                .x(d => d.x) // with some noise on x and y centers
                .y(d => d.y)
                .extent([[0, 0], [width, height]]);



// master function for filtering
function filterCirclesPr(province, party, voteMargin, ru_party, voteTurnout, na_range){

  // in case the argument is null, do not filter in that category
  // province filter
  function filterProvince(datum){
    if (province == null){
      return true;
    }
    else {
      return province.includes(datum);
    }
  }
  // Party filter
  function filterParty(datum){
    if (party == null){
      return true;
    }
    else {
      // appending rest parties in case of selected rest
      if (party.includes("Rest")){
        party = party.filter(d => d != "Rest")
        party = party.concat(rest_parties);
        //console.log(party);

      }
      return party.includes(datum);
    }
  }
  // Runner-up Party filter
  function filterRUParty(datum){
    if (ru_party == null){
      return true;
    }
    else {
      // appending rest parties in case of selected rest
      if (ru_party.includes("Rest")){
        ru_party = ru_party.filter(d => d != "Rest")
        ru_party = ru_party.concat(rest_parties);
        //console.log(party);

      }
      return ru_party.includes(datum);
    }
  }
  // VoteMargin filter
  function filterVoteMargin(datum){
    if (voteMargin == null) {
      return true;
    }
    else {
      return (voteMargin[0] <= datum && datum <= voteMargin[1]);
    }
  }
  // Vote Turnout filter
  function filterVoteTurnout(datum){
    if (voteTurnout == null) {
      return true;
    }
    else {
      return (voteTurnout[0] <= datum && datum <= voteTurnout[1]);
    }
  }

  function filterNARange(datum){
    if (na_range == null) {
      return true;
    }
    else {
      return (na_range[0] <= datum && datum <= na_range[1]);
    }
  }

  // composite filter combining by and(ing) the above category logicals
  // filteres true means filteres elements whereas false means unfiltered elements
  function compFilter(filtered){
    return function(d){
      var logical = filterProvince(d.province) &&
      filterParty(d.results[0].party) &&
      filterVoteMargin(d.voteMargin) &&
      filterRUParty(d.results[1].party) &&
      filterVoteTurnout(d["Percentage of Votes Polled to Registered Voters"]) &&
      filterNARange(+d.seat.replace(/P[KPBS]-/, ""));

      if (filtered == true){
        return logical;
      }
      else {
        return !(logical);
      }
    }
  }

  ///// transition for the na seat circles /////

  var num_filtered = d3.selectAll(".pSeatCircle")
    .filter(compFilter(true)).data().length

  //console.log(num_filtered);

  // filtered remain
  d3.selectAll(".pSeatCircle")
    .filter(compFilter(true))
    .transition()
    .duration(filtTransTime)
    .attr('r', d => d.radiusInit)
  // unfiltered fadeout
  d3.selectAll(".pSeatCircle")
    .filter(compFilter(false))
    .transition()
    .duration(filtTransTime)
    .attr('r', 0)


  ///// transition for the circle catchers /////

  // filtered circle catchers remain
  d3.selectAll(".circle-catcher")
    .filter(compFilter(true))
    .transition("cicleCatchTrans")
    .duration(filtTransTime)
    .attr('r', d => circle_catch_rad_prov)
    .style('display', 'block')
  // unfilteres circle catchers fadeout
  d3.selectAll(".circle-catcher")
    .filter(compFilter(false))
    .transition("cicleCatchTrans")
    .duration(filtTransTime)
    .attr('r', 0)
    .style('display', 'none')

  // original nodes
  var nodes = d3.selectAll(".pSeatCircle").data();

  // filteres nodes
  var nodes_filtered = nodes.filter(compFilter(true));




  

  // update selection/ update clipPaths
  var polygon = d3.selectAll(".clip")
                  .data(voronoi.polygons(nodes_filtered), d => d.data.seat) // make sure to make data joins wrt seat
                    //Make sure each clipPath will have a unique id (connected to the circle element)
                    .attr("id", d => (d != null) ? "clip" + d.data.seat : "clipPMap")
                    .select("path")
                    .attr("class", "clip-path-circle NAmap")
                    .call(redrawPolygon)
  // enter selection, create new clipPaths
  var polygon_enter = d3.selectAll(".clip")
                    .enter()
                    .append("clipPath")
                    .attr("class", "clip NAmap")
                    //Make sure each clipPath will have a unique id (connected to the circle element)
                    .attr("id", d => (d != null) ? "clip" + d.data.seat : "clipPMap")
                    //Then append a path element that will define the shape of the clipPath
                    .append("path")
                    .attr("class", "clip-path-circle NAmap")
                    .call(redrawPolygon)

  // exite selection, remove old clipPaths
  var polygon_exit = d3.selectAll(".clip")
                      .exit()
                      .remove()

  return num_filtered;
}
