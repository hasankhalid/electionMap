function makeProvMaps(){
  var map_block = d3.select("#vizcontain")

  // width and height of the svg viewport
  var width = 1000, height = 600;

  function removeAllDisplay(){
    // remove all contents of viz
    d3.select("#vizcontain")
      .selectAll('*')
      .remove()

    // remove all contents of legend
    d3.select("#legendcontain")
      .selectAll('*')
      .remove()
  }

  removeAllDisplay();

  // defining the projection for map (change center and scale to get desired size for the map)
  var projection = d3.geoMercator()
      .center([75, 31.5])
      .scale([150 * 13]);

  var zoom = d3.zoom()
    // no longer in d3 v4 - zoom initialises with zoomIdentity, so it's already at origin
    // .translate([0, 0])
    // .scale(1)
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

  // defining the paths for the maps
  var path = d3.geoPath().projection(projection);

  // defining the svg view port for the map within the div
  var svg = map_block.append("svg")
                    // .attr("width", width)
                    // .attr("height", height)
                    .attr("preserveAspectRatio", "xMinYMin meet")
                    //.attr("viewBox", "0 0 1000 600")
                    .attr("viewBox", "0 0 636 600")
                    .style("fill-opacity", 1)
                    .classed("map_in_a_box", "true")

  var svg_g = svg.append("g")
                .classed("map_group_province", "true");

  d3.queue()
    .defer(d3.json, "pakistan_districts.topojson")
    .defer(d3.json, "Pak_prov.topojson")
    .defer(d3.json, "prov2013.json")
    .defer(d3.csv, "prov_seats_2013.csv")
    .await(drawProvincial)

  // listing the parties from na map
  var parties = [
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
    "Balochistan National Party"
  ];

  // defining colors mapping to parties / other color is mapped to multiple parties
  // color mapping is the same as na map
  var other_color = "#03A9F4";

  var party_colors = [
    "#9C27B0",
    "#4DB6AC",
    other_color,
    other_color,
    other_color,
    "#81C784",
    "#CDDC39",
    other_color,
    other_color,
    other_color,
    "#4DD0E1",
    other_color,
    "#607D8B",
    other_color,
    "#FF8A65",
    "#BDBDBD",
    other_color,
    other_color,
    other_color
  ];

  // defining categorical color scale
  var colorScale = d3.scaleOrdinal()
                     .domain(parties)
                     .range(party_colors);

  function drawProvincial(error, topology, prov_topology, prov2013, prov_seats_2013){

    var path_data = topojson.feature(topology, topology.objects.pakistan_districts).features;
    var prov_path_data = topojson.feature(prov_topology, prov_topology.objects.Pak_prov).features;

    // drawing paths of all districts within a g classed 'pakDistricts'
    svg_g.append("g")
          .classed("pakDistricts", true)
          .selectAll("path")
          .data(path_data)
          .enter().append("path")
          .attr("d", function (d, i){ return path(d)})
          .style("stroke", "black")
          .style("stroke-width", 0.2)
          .style("fill", "#FFF")
          .style("fill-opacity", 0.9)
          //.attr("district", d => d.properties.districts)
          .attr("class", function(d, i){
            return whiteSpaceRem(d.properties.districts);
          })
          .classed("district", true);

    svg_g.append("g")
          .classed("pakProvs", true)
          .selectAll("path")
          .data(prov_path_data)
          .enter().append("path")
          .attr("d", function (d, i){ return path(d)})
          .style("stroke", "black")
          .style("stroke-width", 00)
          .style("fill", "#FFF")
          .style("fill-opacity", 1)
          //.attr("district", d => d.properties.districts)
          .attr("prov", function(d, i){
            return d.properties.province_territory;
          })
          .attr('class', d => provAbb[d.properties.province_territory])
          .classed("province", true);

    //////////////////////////////////////////////////
    ////////////// Data Pre-processing  //////////////
    //////////////////////////////////////////////////

    // comprehensive results by joining the scraped data with basic info of na_seats
    var result = join(prov_seats_2013, prov2013, "seat", "seat", function(election_row, seat_row) {
      return {
          seat: seat_row['seat'],
          PrimaryDistrict: seat_row.district,
          //SeconDistrict: seat_row.SeconDistrict,
          province: seat_row.province,
          "Percentage of Votes Polled to Registered Voters": election_row['Percentage of Votes Polled to Registered Voters'],
          "Registered Votes": election_row['Registered Votes'],
          "Rejected Votes": election_row['Rejected Votes'],
          "Valid Votes": election_row['Valid Votes'],
          "Votes Polled": election_row['Votes Polled'],
          results: election_row['results']
      }
    });


    const base_bubble = 3 * 0.7 // min size that all bubbles take
    const margin_range = 5 * 0.7 // range for vote margin

    var y_offset_tx = - 60;

    // adding vote margin and radius and init radius to results
    result.forEach(function(d){
      //console.log(d.results[0].votes);
      d.voteMargin = ((d.results[0].votes/ d['Valid Votes']) - (d.results[1].votes/ d['Valid Votes'])) * 100;
      d.radius = base_bubble + ((d.voteMargin/ 100) * margin_range);
      d.radiusInit = base_bubble + ((d.voteMargin/ 100) * margin_range);
    })

    // getting district Centroids using the distCentroids function
    var centroids = distCentroids(path_data);

    // adding initial x and y positions of seats/ nodes (start of the force simulation)
    result.forEach(function(d){
      d.x = getCentroid(d.PrimaryDistrict)[0];
      d.y = getCentroid(d.PrimaryDistrict)[1];
    });


    // assigning results to nodes
    nodes = result;


    /////////////////////////////////////////////////////////
    ////////////// Setting up force simulation //////////////
    /////////////////////////////////////////////////////////

    // force with charge, forceX, forceY and collision detection

    var simulation = d3.forceSimulation(nodes)
                      .force('charge', d3.forceManyBody().strength(0.2))
                      .force('x', d3.forceX().x(function(d) {
                        return getCentroid(d.PrimaryDistrict)[0];
                      }))
                      .force('y', d3.forceY().y(function(d) {
                        return getCentroid(d.PrimaryDistrict)[1];
                      }))
                      .force('collision', d3.forceCollide().radius(function(d) {
                        return d.radius + 0.65;
                      }))
                      .on('tick', ticked)
                      .on('end', function() {end_force()})
                      .alpha(0.525)
                      .alphaDecay(0.07)

      // a group containing all na seat circles
      var u = svg.append('g')
                  .classed('na-seats-group', true)
                  .selectAll('.pSeat') // .selectAll('circle')
                  .data(nodes)

      // entering all nodes // bubbles
      // initializing position of nodes
      u.enter()
        .append('g')
        .attr('class', d => d.seat)
        .classed('pSeat_g', true)
        .append('circle')
        .attr("class", d => d.province)
        .classed("pSeatCircle", true)
        .classed('2013', true)
        .merge(u)
        .attr('cx', function(d) {
          return d.x;
        })
        .attr('cy', function(d) {
          return d.y;
        })
        .style("fill", function(d){
          return colorScale(d.results[0].party);
        })
        //.style("opacity", d => (d.province == "KP") ? 1 : 0)
        .style("display", d => (d.province == "KP") ? "block" : "none")
        .attr("party", function(d){
          return d.results[0].party;
        })
        .attr("id", function(d){
          return d.seat;
        })
        .attr('r', 0)
        .transition('bubble_up')
        .duration(1000)
        .ease(d3.easePoly)
        .attr('r', function(d, i){
          radius = base_bubble + ((d.voteMargin/ 100) * margin_range)
          //console.log(is.nan(radius) ? "Problem!" : "")
          return radius;

        })

      // removing the exit selection
      u.exit().remove()


      var voronoi = d3.voronoi()
                        .x(d => d.x) // with some noise on x and y centers
                        .y(d => d.y)
                        .extent([[0, 0], [width, height]]);





      function redrawPolygon(polygon) {
            polygon
                .attr("d", function(d) { return d ? "M" + d.join(",") + "Z" : null; })
      }


    function end_force(){
        // making clip circles over the seat circles
        //Append larger circles (that are clipped by clipPaths)
        svg.append('g').classed('clip-circles', true)
            .selectAll(".circle-catcher.pMap")
            .data(nodes)
            .enter().append("circle")
            .attr("class", function(d,i) { return "circle-catcher pMap " + d.seat; })
            //Apply the clipPath element by referencing the one with the same countryCode
            .attr("clip-path", function(d, i) { return "url(#clip" + d.seat + ")"; })
            //Bottom line for safari, which doesn't accept attr for clip-path
            .style("clip-path", function(d, i) { return "url(#clip" + d.seat + ")"; })
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            //Make the radius a lot bigger
            .attr("r", 14)
            .style("fill", "none")
          //  .style("fill-opacity", 0.5)
            .style("pointer-events", "all")
            .style("display", d => (d.province == "KP") ? "block" : "none")
            .on("mouseover", activateMouseOv)
            .on("mouseout", activateMouseOut);

        // hard code the translate params for KP
        scale = 1.770600970553169
        translate = [-345.4863342221814,54.93697529051545 + y_offset_tx]

        d3.selectAll(".circle-catcher.pMap")
          .style("transform", "translate3d(" + translate[0] + "px," + translate[1] + "px,0px)" + " scale3d(" + scale + "," + scale + ", 1)");

      //  console.log(nodes)
      //  console.log(voronoi.polygons(nodes))

        var polygon =  svg.append("defs")
                          .selectAll(".clip")
                          .data(voronoi.polygons(nodes))
                          //First append a clipPath element
                          .enter().append("clipPath")
                          .attr("class", "clip")
                          //Make sure each clipPath will have a unique id (connected to the circle element)
                          .attr("id", d => (d != null) ? "clip" + d.data.seat : "clip" + "P")
                          //Then append a path element that will define the shape of the clipPath
                          .append("path")
                          .attr("class", "clip-path-circle")
                          .call(redrawPolygon);
    }

    function ticked() {
           // updating the circle positions
           d3.selectAll(".pSeatCircle")
             .attr('cx', function(d) {
               return d.x
             })
             .attr('cy', function(d) {
               return d.y
             })

       }

    makeProvMap("KP")

    function activateMouseOv(d, i){
      // extract unique class of the hovered voronoi cell (replace "circle-catcher " to get seat)
      var unique_class = d3.select(this).attr('class').replace("circle-catcher pMap ", "");
      // selecting the circle with the gotten id (first select group then circle)
      var circle_group = d3.select('g' + "." + unique_class)
      var circle_select = circle_group.select('circle');

      // raise the selected group
      circle_group.raise();

      // defining transition in the na circles
      circle_select
       .transition()
       .ease(d3.easeElastic)
       .duration(1700)
       .tween('radius', function(d) {
         var that = d3.select(this);
         var i = d3.interpolate(d.radius, 5.5);
         return function(t) {
           d.radius = i(t);
           that.attr('r', function(d) { return d.radius; });
           //simulation.nodes(nodes)
         }
       })
       .attr('fill', function(d){
         return d3.rgb(colorScale(d.results[0].party)).darker();
       })
       .attr('stroke', function(d){
         return d3.rgb(colorScale(d.results[0].party)).darker();
       })
       .attr('stroke-width', 0.75);

       datum = circle_select.data()[0];
       color = colorScale(datum.results[0].party);

       // append tooltip
       d3.select('body').append('div')
         .classed('animated', true)
         .classed('zoomIn', true)
         .classed('tool', true)
         .attr('id', 'hoverbox')
       // tooltip selection
       var tooltip = d3.select('.tool');

       tooltip.append('div')
       .classed('toolhead', true)
       .html(function(d){
         return '<span class="NA">' + datum.seat + ' </span><span class="turnout">(' + datum["Percentage of Votes Polled to Registered Voters"] + '% voter turnout)</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
       })

       tooltip.append('div')
       .classed('partyicon', true)
       .html(image(datum.results[0].party));

       tooltip.append('div')
       .classed('toolhead', true)
       .html(function(d){
         return '<span class="dist">District: </span><span class="turnout">' + datum.PrimaryDistrict + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
       })

       tooltip.append('div')
       .classed('nametitle', true)
       .html(function(d){
         return '<span>Name</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
       })

       tooltip.append('div')
       .classed('partytitle', true)
       .html(function(d){
         return '<span>Party</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
       })

       tooltip.append('div')
       .classed('voteTitle', true)
       .html(function(d){
         return '<span>Votes</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
       })

       //colored bar on top of tooltip showing the victorious party
       tooltip.append('div')
       .classed('partyColorToolBar', true)
       .style('background-color', color)

       tooltip.append('div')
       .classed('candidatename', true)
       .html(function(d){
         return '<span>' + titleCase(datum.results[0].candidate) + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
       })
       tooltip.append('div')
       .classed('partyname', true)
       .html(function(d){
         return '<span>' + abbreviate(datum.results[0].party) + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
       })
       tooltip.append('div')
       .classed('votes', true)
       .html(function(d){
         return '<span>' + datum.results[0].votes + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
       })

       tooltip.append('div')
       .classed('candidatename', true)
       .html(function(d){
         return '<span>' + titleCase(datum.results[1].candidate) + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
       })
       tooltip.append('div')
       .classed('partyname', true)
       .html(function(d){
         return '<span>' + abbreviate(datum.results[1].party) + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
       })
       tooltip.append('div')
       .classed('votes', true)
       .html(function(d){
         return '<span>' + datum.results[1].votes + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
       })

       tooltip.append('div')
       .classed('candidatename', true)
       .html(function(d){
         return '<span class="mobiletoolremove">' + titleCase(datum.results[2].candidate) + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
       })
       tooltip.append('div')
       .classed('partyname', true)
       .html(function(d){
         return '<span class="mobiletoolremove">' + abbreviate(datum.results[2].party) + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
       })
       tooltip.append('div')
       .classed('votes', true)
       .html(function(d){
         return '<span class="mobiletoolremove">' + datum.results[2].votes + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
       })

       // positioning the tooltip

       if (d3.event.pageY >= 460) {
         var hoverbox = document.getElementById('hoverbox');
         tooltip.style('top', d3.event.pageY - hoverbox.offsetHeight - 18 + "px")
         if (d3.event.pageX - 125 < 0) {
           tooltip.style('left', window.innerWidth/2 - 125 + "px")
         }
         else if (d3.event.pageX + 125 > window.innerWidth) {
           tooltip.style('left', window.innerWidth/2 - 125 + "px")
         }
         else if (window.innerWidth < 450) {
           tooltip.style('left', window.innerWidth/2 - 125 + "px")
         }
         else {
           tooltip.style('left', d3.event.pageX - 125 + "px")
         }
       }
       else {
         tooltip.style('top', d3.event.pageY + 14 + "px")
         if (d3.event.pageX - 125 < 0) {
           tooltip.style('left', window.innerWidth/2 - 125 + "px")
         }
         else if (d3.event.pageX + 125 > window.innerWidth) {
           tooltip.style('left', window.innerWidth/2 - 125 + "px")
         }
         else if (window.innerWidth < 450) {
           tooltip.style('left', window.innerWidth/2 - 125 + "px")
         }
         else {
           tooltip.style('left', d3.event.pageX - 125 + "px")
         }
       }
    }

    function activateMouseOut(d, i){
        // retrieve unique class of voronoi circle catcher
        var unique_class = d3.select(this).attr('class').replace("circle-catcher pMap ", "");
        // select the circle with the gotten id
        circle_select = d3.select("circle" + "#" + unique_class);

        // transition the circle back
        circle_select
          .transition()
          .ease(d3.easeElastic)
          .duration(1200)
          .tween('radius', function(d) {
            var that = d3.select(this);
            var i = d3.interpolate(d.radius, d.radiusInit);
            return function(t) {
              d.radius = i(t);
              that.attr('r', d => (d.radius >=0) ? d.radius : 0 );
              //simulation.nodes(nodes)
            }
          })
          .attr('fill', function(d){
            return colorScale(d.results[0].party);
          })
          .attr('stroke', function(d){
            d3.rgb(colorScale(d.results[0].party));
          })
          .attr('stroke-width', 0);

          // remove the tooltip
          d3.selectAll('.tool').remove()
    }


    function makeProvMap(Prov){

      selected_prov = Prov

      //console.log(selected_prov)

      active = d3.select("path" + "." + selected_prov).classed("active", true).raise();
      inactive = d3.selectAll("path:not(" + "." + selected_prov + ")").classed("inactive", true);
      active_circles = d3.selectAll("circle.pSeatCircle" + "." + selected_prov).classed("active", true);
      inactive_circles = d3.selectAll("circle.pSeatCircle:not(" + "." + selected_prov + ")").classed("inactive", true);

      //console.log(active_circles)
      //console.log(inactive_circles)


      delay_time = 5000
      trans_time = 1000

      active.transition('map_move')
            //.delay(delay_time)
            .duration(trans_time)
            .style('stroke-width', 0.75)
            .style('stroke', 'grey')
            .style('fill', 'white');
      inactive.transition('map_move')
              //.delay(delay_time)
              .duration(trans_time)
              .style('stroke-width', 0.0)

      active_circles.transition('circle_trans')
            //.delay(delay_time)
            .duration(trans_time)
            .attr('r', function(d){
              return base_bubble + ((d.voteMargin/ 100) * margin_range);
            })
            .style("display", "block")

      inactive_circles.transition('circle_trans')
            //.delay(delay_time)
            .duration(trans_time)
            .attr('r', '0');

      // getting height and width of svg on full screen on mac
      mac_pro_height = 679.234375;
      mac_pro_width = 720;

      // giving some padding
      height_pad = 60;
      width_pad = 60;

      // calculating ultimate width and height
      height = mac_pro_height - height_pad
      width = mac_pro_width - width_pad;

      // getting bounds
      var bounds = path.bounds(active.datum()),
          dx = bounds[1][0] - bounds[0][0],
          dy = bounds[1][1] - bounds[0][1],
          x = (bounds[0][0] + bounds[1][0]) / 2,
          y = (bounds[0][1] + bounds[1][1]) / 2,

          // // calculating different scale for all provinces
          //scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / width, dy / height))),

          // constant scale (pick the one calculated for balochistan, so that scale is constant for all provinces)
          scale = 1.770600970553169

          // getting the translate coordinates
          translate = [(width / 2 - scale * x), (height / 2 - scale * (y)) + y_offset_tx];




      // svg.transition('zoom_trans')
      //     //.delay(delay_time)
      //     .duration(trans_time)
      //     // .call(zoom.translate(translate).scale(scale).event); // not in d3 v4
      //     .call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) ); // updated for d3 v4
      //     //////////////////////////////////////////////////////////////
          ////////////// Adding bubble nodes for provincial seats //////////////
          //////////////////////////////////////////////////////////////
      d3.selectAll(".pSeatCircle").transition()
          .duration(750)
          // .call(zoom.translate(translate).scale(scale).event); // not in d3 v4
          .call( zoom.transform, d3.zoomIdentity.translate(translate[0],translate[1]).scale(scale) );

      d3.selectAll(".pSeatCircle")
          //.delay()
          .transition('zoom_trans')
          .duration(trans_time)
          .style("transform", "translate3d(" + translate[0] + "px," + translate[1] + "px,0px)" + " scale3d(" + scale + "," + scale + ", 1)");
      d3.selectAll(".circle-catcher.pMap")
        .transition('zoom_trans')
        .duration(trans_time)
        .style("transform", "translate3d(" + translate[0] + "px," + translate[1] + "px,0px)" + " scale3d(" + scale + "," + scale + ", 1)")
        .style("display", d => (d.province == Prov) ? "block" : "none");



      // // getting district Centroids using the distCentroids function
      // var centroids = distCentroids(path_data);
      //
      // // adding initial x and y positions of seats/ nodes (start of the force simulation)
      // nodes.forEach(function(d){
      //   d.x = getCentroid(d.PrimaryDistrict)[0];
      //   d.y = getCentroid(d.PrimaryDistrict)[1];
      // });

      // d3.selectAll(".circle-catcher")
      //   .style("display", d => (d.province == Prov) ? "block" : "none");

    }

    //makeProvMap("KP");

    // event listener for province

    $('.provinceButt').click(function() {
      selected_prov = $(this).attr("value");
      makeProvMap(selected_prov);
    })

    // preprocessing_data
    function voteDataPreP(data){
      return data.map(function(d){
        return {
          seat : d.district,
          place : (d.place != null ? d.place : "unknown"),
          "Percentage of Votes Polled to Registered Voters" : +d['Percentage of Votes Polled to Registered Voters'].replace(' %', ''),
          "Registered Votes" : +d['Registered Votes'],
          "Votes Polled" : +d['Votes Polled'],
          "Valid Votes" : +d['Valid Votes'],
          "Rejected Votes" : +d['Rejected Votes'],
          "results" : d['results']
          .map(function(candidate){
            return {
              candidate: candidate['candidate'],
              party: candidate['party'],
              votes: +candidate['votes']
            }
          }).sort(function(a,b) {
            return b.votes - a.votes;
          })
        };
      })
    }

    // creating an array with district centrids
    function distCentroids(distMapData){
      var centroids = distMapData.map(function (feature){
        // get district
        var district = feature.properties.districts;
        var object = {};
        // for every entry create object with district and centroid
        object["district"] = district;
        object["centroid"] = path.centroid(feature)
        return object;
      });

      return centroids
    }

    function getCentroid(dist) {
      return centroids.filter(function(d){
        return (d.district == dist);
      })[0].centroid
    }


  }

  function zoomed() {
    //g.style("stroke-width", 1.5 / d3.event.transform.k + "px");
    //g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"); // not in d3 v4
    svg_g.attr("transform", d3.event.transform); // updated for d3 v4

  }

  provAbb = {
    "Federally Administered Tribal Areas": "FATA",
    "Sindh": "Sindh",
    "Khyber Pakhtunkhwa": "KP",
    "Balochistan": "Balochistan",
    "Punjab": "Punjab",
    "Azad Jammu & Kashmir": "AJK",
    "Gilgit-Baltistan": "GB",
    "Islamabad Capital Territory": "ICT"
  }

  function whiteSpaceRem(text){
    return text.split(" ").join("")
  }
}
