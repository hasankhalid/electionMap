function createCartogram(){

  function removeAllDisplay(){
    d3.select("#vizcontain")
      .selectAll('*')
      .remove()
  }

  removeAllDisplay();

  function drawVotePercMap(){
    var parties = [
      "Pakistan Tehreek-e-Insaf",
      "Pakistan Muslim League (N)",
      "Pakistan Peoples Party Parliamentarians",
      "Jamiat Ulama-e-Islam (F)",
      "Independent",
      "Awami National Party",
      "Muttahida Qaumi Movement Pakistan"
    ]

    // replace these with the colors from the naseats map
    var party_colors = [
      "#9C27B0",
      "#81C784",
      "#607D8B",
      "#4DB6AC",
      "#CDDC39",
      "#03A9F4",
      "#BDBDBD"
    ]

    // color scale for parties, put in party and it gives you color
    var colorScale = d3.scaleOrdinal()
                      .domain(parties)
                      .range(party_colors);

    var map_block = d3.select("body").select("#vizcontain");

    // width and height of the svg viewport
    var width = 1000, height = 600;

    // defining the projection for map (change center and scale to get desired size for the map)
    var projection = d3.geoMercator()
        .center([68.38, 31.5])
        .scale([150 * 14]);

    // defining the paths for the maps
    var path = d3.geoPath().projection(projection);

    // defining the svg view port for the map within the div
    var svg = map_block.append("svg")
                      .attr("width", width)
                      .attr("height", height)
                      .style("opacity", 1)
                      .classed("map_in_a_box", "true")
                      .attr("id", "cartogram");

    var svg_g = svg.append("g")
                  .classed("map_group", "true");
    // queue function to read in multiple flat files
    d3.queue()
      .defer(d3.json, "pakistan_districts.topojson")
      .defer(d3.json, "JAndKashmir.topojson")
      .defer(d3.json, "Pakistan_NationalBoundary.topojson")
      .defer(d3.csv, "NA_seats_2013.csv")
      .await(drawCartogram)

    // function executed by d3.queue
    function drawCartogram(error, topology, k_topology, pak_topology, na_seats_2013){
      var path_data = topojson.feature(topology, topology.objects.pakistan_districts).features;
      var kshmr_path_data = topojson.feature(k_topology, k_topology.objects.JAndKashmir).features;
      var nat_path_data = topojson.feature(pak_topology, pak_topology.objects.Pakistan_NationalBoundary).features;

      console.log(path_data);

      // compute centroids of all districts
      var centroids = path_data.map(function (feature){
        var district = feature.properties.districts;
        var object = {};
        object["district"] = district;
        object["centroid"] = path.centroid(feature)
        return object;
      });

      // drawing paths of all districts within a g classed 'pakDistricts'
      svg_g.append("g")
            .classed("pakDistricts", true)
            .selectAll("path")
            .data(path_data)
            .enter().append("path")
            .attr("d", function (d, i){ return path(d)})
            .style("opacity", 1)
            .style("stroke", "white")
            .style("stroke-width", 0.2)
            .style("fill", "#FFF")
            .style("opacity", 0.9)
            //.attr("district", d => d.properties.districts)
            .attr("class", function(d, i){
              return whiteSpaceRem(d.properties.districts);
            })
            .classed("district", true);

      // drawing J and Kashmir with dotted stroke (classed JKAshmir)
      svg_g.append('g')
          .classed("JKashmir", true)
          .selectAll(".Kashmir")
          .data(kshmr_path_data)
          .enter().append("path")
          .classed("Kashmir", true)
          .attr("d", function (d, i){ return path(d)})
          .style("opacity", 1)
          .style("stroke", "grey")
          .style("stroke-dasharray", 2)
          .style("stroke-width", 0.5)
          .style("fill", "#FFF")
          .style("opacity", 0.9);

      // drawing the Pakistan boundary
      svg_g.append("g").classed("Pak_boundary", true)
          .selectAll(".Pak_boundary")
          .data(nat_path_data)
          .enter().append("path")
          .classed("Pakistan", true)
          .attr("d", function (d, i){ return path(d)})
          .style("stroke", "grey")
          .style("stroke-width", 1)
          //.style("fill", "#EEE")
          .style("fill", "white")
          .style("fill-opacity", 0);

      // elections data set joined with the seats information
      var result = join(na_seats_2013, elections_2013, "Seat", "seat", function(election_row, seat_row) {
        return {
            seat: seat_row['Seat'],
            PrimaryDistrict: seat_row.PrimaryDistrict,
            SeconDistrict: seat_row.SeconDistrict,
            Province: seat_row.Province,
            "Percentage of Votes Polled to Registered Voters": election_row['Percentage of Votes Polled to Registered Voters'],
            "Registered Votes": election_row['Registered Votes'],
            "Rejected Votes": election_row['Rejected Votes'],
            "Valid Votes": election_row['Valid Votes'],
            "Votes Polled": election_row['Votes Polled'],
            results: election_row['results']
        }
      });

      // defining the nest function for grouping results by District
      var result_by_dist = d3.nest()
                              .key(d => d.PrimaryDistrict)
                              .entries(result);

      // listing all the primary districts
      var PrimDistList = result_by_dist.map(d => d.key);

      // functions for unnesting the data
      var unnested = function(data, children){
  				var out = [];
          data.forEach(function(d, i){
            //console.log(i, d);
            d_keys = Object.keys(d);
            //console.log(i, d_keys)
            values = d[children];

            values.forEach(function(v){
            	d_keys.forEach(function(k){
                if (k != children) { v[k] = d[k]}
              })
              out.push(v);
            })

          })
          return out;
        }

      // unnest all the results by district (unnest by seat)
      var result_by_dist_party = result_by_dist.map(function(d, i){
        return {
          key : d.key,
          values : unnested(d['values'], "results")
        }})

      // now nesting results by party instead of seats
      votes_by_dist_party = result_by_dist_party.map(function(d, i){
        return {
          key : d.key,
          values : d3.nest()
                    .key(d => d.party)
                    .rollup(function(v) { return d3.sum(v, function(d) { return d.votes; }); })
                    .entries(d['values'])
                    //.sort()
                    .sort(function(a, b){
                       return b.value - a.value;
                    })
        }
      })

      // making an objects out of result array
      var distPartyObj = _.keyBy(votes_by_dist_party, 'key')
      var resDistObj = _.keyBy(result_by_dist, 'key')

      // default party name
      var selected_party = "Pakistan Tehreek-e-Insaf"

      // list number of votes for each district for a particular party
      function list_votes(data_entry, party){
        var list_of_votes = data_entry.values.map(d => d.results )
                                        .map(d => d.filter(x => x.party == party))
        list_of_votes = [].concat.apply([], list_of_votes)
                                        .filter(d => d != null)
                                        .map(d => d.votes)
        return list_of_votes;
      }

      // list number of valid votes for each district
      function list_valid_votes(data_entry){
        return data_entry.values.map(d => d['Valid Votes']);
      }

      // scale for radius (vote percent circle)
      var rad_scale = d3.scaleSqrt()
                        .domain([0, 100])
                        .range([0, 15]);

      // scale for radius (number of seats)
      var seat_rad_scale = d3.scaleSqrt()
                              .domain([0, 21])
                              .range([0, 69]);

      // circles representing vote percent
      svg.selectAll('circle')
        .data(result_by_dist)
        .enter()
        .append('circle')
        .attr("cx", function(d){
          return getCentroid(d.key)[0];
        })
        .attr("cy", function(d){
          return getCentroid(d.key)[1];
        })
        .style("fill", d => colorScale(selected_party))
        .style("opacity", 0.7)
        .each(function(d, i){
          total_votes = list_votes(d, selected_party);
          total_valid_votes = list_valid_votes(d);
          d.ValidVotesTotal = d3.sum(total_valid_votes);
          d.VotePerc = (d3.sum(total_votes)/ d3.sum(total_valid_votes)) * 100;
          d.VotePerc = Math.round(d.VotePerc * 10)/ 10;
        })
        .attr("r", function(d, i){
          // total_votes = list_votes(d);
          // total_valid_votes = list_valid_votes(d);
          // return (total_votes.length > 0) ? rad_scale((total_votes.reduce(function(a, b) { return a+b } ))/ (total_valid_votes.reduce(function(a, b){ return a+b }))) : 0;
          return rad_scale(d.VotePerc);
        })
        .attr('class', d => 'votePerc ' + d.key)
        .attr('id', d => whiteSpaceRem(d.key))

        nodes = result_by_dist;

        // defining voronoi
        var voronoi = d3.voronoi()
                    .x(d => getCentroid(d.key)[0] + Math.random() * (1 + 1) - 1)
                    .y(d => getCentroid(d.key)[1] + Math.random() * (1 + 1) - 1)
                    .extent([[0, 0], [width, height]]);
    //
        //
        var polygon =  svg.append("defs")
          .selectAll(".clip.cartogram")
          .data(voronoi.polygons(nodes))
          //First append a clipPath element
          .enter().append("clipPath")
          .attr("class", "clip cartogram")
          //Make sure each clipPath will have a unique id (connected to the circle element)
          .attr("id", d => "clipCartogram" + whiteSpaceRem(d.data.key))
          //Then append a path element that will define the shape of the clipPath
          .append("path")
          .attr("class", "clip-path-circle cartogram")
          .attr("d", function(d) { return "M" + d.join(",") + "Z"; })

        //Append larger circles (that are clipped by clipPaths)
        svg.append('g').classed('clip-circles', true)
            .classed('cartogram', true)
            .selectAll(".circle-catcher.cartogram")
            .data(nodes)
            .enter().append("circle")
            //.classed('circle-catcher', true)
            .attr("class", function(d,i) { return "circle-catcher cartogram " + d.key; })
            //Apply the clipPath element by referencing the one with the same countryCode
            .attr("clip-path", function(d, i) { return "url(#clipCartogram" + whiteSpaceRem(d.key) + ")"; })
            //Bottom line for safari, which doesn't accept attr for clip-path
            .style("clip-path", function(d, i) { return "url(#clipCartogram" + whiteSpaceRem(d.key) + ")"; })
            .attr("cx", d => getCentroid(d.key)[0])
            .attr("cy", d => getCentroid(d.key)[1])
            //Make the radius a lot bigger
            .attr("r", 20)
            .style("fill", "none")
            .style("opacity", 0.5)
            .style("pointer-events", "all")
            // .on("mouseover", activateMouseOv)
            // .on("mouseout", activateMouseOut)
            //Notice that we now have the mousover events on these circles
            // .on("mouseover", activateHover(100))
            // .on("mouseout",  deactivateHover(100));

      // mouseover event
      svg.selectAll('circle.circle-catcher.cartogram')
        .on("mouseover", function(d, i){
          var unique_dist = d3.select(this).attr('class').replace("circle-catcher cartogram ", "");
          circle_select = d3.select('.votePerc' + "#" + whiteSpaceRem(unique_dist));
          // transitions for circle
          circle_select
            .transition()
            .duration(100)
            .style('stroke', "black")
            .style('stroke-width', 1)

          // datum of the hovered element
          var selectedDatum = d3.select(this).data()[0]
          console.log(selectedDatum);
          // district of the hovered element without spaces
          var selected_district_WS = selectedDatum.key;
          var selected_district = whiteSpaceRem(selectedDatum.key);

          // secondary districts for hovered element
          var seconDistricts = selectedDatum.values.map(d => d.SeconDistrict);
          // split secondary districts by the " - "
          seconDistricts = seconDistricts.map(d => d.split(" - "))
          seconDistricts = [].concat.apply([], seconDistricts);
          // remove empty strings
          seconDistricts_WS = seconDistricts.filter(d => (d != ""));
          // removing spaces
          seconDistricts = seconDistricts_WS.map(d => whiteSpaceRem(d) );

          // important stats for tooltip
          var total_seats = resDistObj[d.key].values.length;
          var partyWinArr = resDistObj[d.key].values.map( d => d.results[0].party);

          // how many seats ahas the party won?
          var party_seats = 0
          partyWinArr.forEach(function(d){
            if (d === selected_party){
              party_seats ++;
            }
          })

          var winnParty = distPartyObj[selected_district_WS].values[0].key;

          var winnPartySeats = 0;
          partyWinArr.forEach(function(d){
            if (d === winnParty){
              winnPartySeats ++;
            }
          })

          // appending circles for seats/ district
          svg.append('circle')
            .attr('r', 0)
            .attr('cx', getCentroid(d.key)[0])
            .attr('cy', getCentroid(d.key)[1])
            .style('fill', 'none')
            .style('stroke', '#212121')
            .style('stroke-width', 0.5)
            .style('stroke-dasharray', 2)
            .classed('seatBubble', true)
            .transition('seatBubbleTrans')
            .attr('r', seat_rad_scale(total_seats))
            .style('stroke-width', 2);

          // appending title on hover
          d3.select('body').append('div')
            .classed('animated', true)
            .classed('fadeIn', true)
            .classed('cartogramtool', true)
            .attr('id', 'hoverbox')

            var tooltip = d3.select('.cartogramtool');

          tooltip.append('div')
            .classed('cartotoolhead', true)
            .html(function(d){
              return '<span>District: <span style="color: #283593">' + selected_district_WS + '</span></span><span>Valid Votes: <span style="color: #283593">' + selectedDatum.ValidVotesTotal + '</span></span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
            })

          tooltip.append('div')
            .classed('cartotoolop', true)
            .html(function(d){
              var otherdist = seconDistricts_WS.join(" | ");
              if (otherdist == '') {
                return '<span style="color: #283593">Other districts: None</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
              }
              else {
                return '<span style="font-size: 11px">Other districts: ' +  otherdist  + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
              }
            })

            tooltip.append('div')
              .classed('cartotoolparty', true)
              .style('background', d3.rgb(colorScale(selected_party)).darker(1))
              .html(function(d){
                return '<span>SELECTED PARTY</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
              })

            tooltip.append('div')
              .classed('cartotoolparty', true)
              .style('background', d3.rgb(colorScale(distPartyObj[selected_district_WS].values[0].key)).darker(1))
              .html(function(d){
                return '<span>MAJORITY VOTE</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
              })

          tooltip.append('div')
            .classed('cartotoolpartylogo', true)
            .html(image(selected_party)) //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";

          tooltip.append('div')
            .classed('cartotoolpartylogo', true)
            .html(image(distPartyObj[selected_district_WS].values[0].key))

          tooltip.append('div')
            .classed('cartotoolpartydetail', true)
            .html(function(d){
              return '<span>Party: ' + abbreviate(selected_party) + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
            })


          tooltip.append('div')
            .classed('cartotoolpartydetail', true)
            .html(function(d){
              return '<span>Party: '+ abbreviate(distPartyObj[selected_district_WS].values[0].key) +'</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
            })

          tooltip.append('div')
            .classed('cartotoolpartydetail', true)
            .html(function(d){
              return '<span>Vote share: '+ selectedDatum.VotePerc + '%</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
            })


          tooltip.append('div')
            .classed('cartotoolpartydetail', true)
            .html(function(d){
              var winnVotes = distPartyObj[selected_district_WS].values[0].value
              var winnVotePerc = (winnVotes/ selectedDatum.ValidVotesTotal) * 100;
              return '<span>Vote share: ' + Math.round(winnVotePerc * 10)/ 10 +'%</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
            })


          tooltip.append('div')
            .classed('cartotoolpartydetail', true)
            .html(function(d){
              return '<span>Seats Won: ' + party_seats + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
            })

          tooltip.append('div')
            .classed('cartotoolpartydetail', true)
            .html(function(d){
              return '<span>Seats Won: ' + winnPartySeats + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
            })

            if (d3.event.pageY >= 460) {
              var hoverbox = document.getElementById('hoverbox');
              tooltip.style('top', d3.event.pageY - hoverbox.offsetHeight - 18 + "px")
              tooltip.style('left', d3.event.pageX - 125 + "px")
            }
            else {
              tooltip.style('top', d3.event.pageY + 14 + "px")
              tooltip.style('left', d3.event.pageX - 125 + "px")
            }



      /*    d3.select(this).append("title")
            .text(function(d){
              var winnVotes = distPartyObj[d.key].values[0].value
              var winnParty = distPartyObj[d.key].values[0].key
              var winnVotePerc = (winnVotes/ d.ValidVotesTotal) * 100
              winnVotePerc = Math.round(winnVotePerc * 10)/ 10
              return d.key + " - " + (d.VotePerc) + "%" + "|" + winnParty + " - " + winnVotePerc + '%';
            }) */

          // raise the hovered district path
          d3.selectAll('path.' + selected_district).raise();

          // make district boundary prominent
          d3.selectAll('path.' + selected_district)
            .transition()
            .duration(100)
            .style('stroke', 'purple')
            .style('stroke-width', 1.5);

          // getting selection for secondary districts
          var SD_len = seconDistricts.length;
          if (SD_len == 1){
            seconDistricts_select = "path." + seconDistricts[0];
          }
          else if (SD_len > 1){
            seconDistricts_select = seconDistricts.reduce(createMCSelection);
          }
          else{
            seconDistricts_select = "nothing"
          }

          // raise selected secondary districts
          d3.selectAll(seconDistricts_select).raise()

          // making the secondary districts prominent
          d3.selectAll(seconDistricts_select)
            .transition()
            .duration(100)
            .style('stroke', 'purple')
            .style('fill', d => (PrimDistList.indexOf(d.properties.districts) > -1) ? "#BDBDBD" : "none")
            .style('stroke-width', 1.5);
        });

      // mouseout event
      svg.selectAll('circle.circle-catcher.cartogram')
        .on("mouseout", function(d, i){
          var unique_dist = d3.select(this).attr('class').replace("circle-catcher cartogram ", "");
          circle_select = d3.select('.votePerc' + "#" + whiteSpaceRem(unique_dist));

          // selected primary district
          var selectedDatum = d3.select(this).data()[0]
          var selected_district = whiteSpaceRem(selectedDatum.key);

          // secondary districts
          var seconDistricts = selectedDatum.values.map(d => d.SeconDistrict);
          seconDistricts = seconDistricts.map(d => d.split(" - "))
          seconDistricts = [].concat.apply([], seconDistricts);
          seconDistricts = seconDistricts.filter(d => (d != ""));
          seconDistricts = seconDistricts.map(d => whiteSpaceRem(d));

          // unselect vote Perc circles
          circle_select
            .transition()
            .duration(100)
            .style('stroke', "black")
            .style('stroke-width', 0)

          // remove title
          d3.selectAll('.cartogramtool').remove();
          // remove seat bubble
          d3.select('.seatBubble').remove();
          // remove district boundary
          d3.selectAll('path.' + selected_district)
            .transition()
            .duration(100)
            .style('stroke', 'none')
            .style('stroke-width', 0);

          // selection for secondary districts
          var SD_len = seconDistricts.length;
          if (SD_len == 1){
            seconDistricts_select = "path." + seconDistricts[0];
          }
          else if (SD_len > 1){
            seconDistricts_select = seconDistricts.reduce(createMCSelection);
          }
          else{
            seconDistricts_select = "nothing"
          }

          // remove all secondary district boundaries
          d3.selectAll(seconDistricts_select)
            .transition()
            .duration(100)
            .style('stroke', 'none')
            .style('stroke-width', 0)
            .style('fill', 'none')
            .style('opacity', 1);

        });

      // event for updating party

      $(".cartinput").click(function() {

        selected_party = d3.select(this).attr('value');
        console.log(selected_party);
        update_bubbles(selected_party);
      })

      // update bubble function when new party is selected
      function update_bubbles(new_party){
        d3.selectAll('circle.votePerc')
        .each(function(d, i){
          total_votes = list_votes(d, new_party);
          total_valid_votes = list_valid_votes(d);
          d.ValidVotesTotal = d3.sum(total_valid_votes);
          d.VotePerc = (d3.sum(total_votes)/ d3.sum(total_valid_votes)) * 100;
          d.VotePerc = Math.round(d.VotePerc * 10)/ 10;
        })
        .transition()
        .duration(1000)
        .attr("r", function(d, i){
          return rad_scale(d.VotePerc);
        })
        .style("fill", d => colorScale(new_party));
      }

      // join datasets functions by key
      function join(lookupTable, mainTable, lookupKey, mainKey, select) {
          var l = lookupTable.length,
              m = mainTable.length,
              lookupIndex = [],
              output = [];
          for (var i = 0; i < l; i++) { // loop through l items
              var row = lookupTable[i];
              lookupIndex[row[lookupKey]] = row; // create an index for lookup table
          }

          console.log(lookupIndex);
          for (var j = 0; j < m; j++) { // loop through m items
              var y = mainTable[j];
              var x = lookupIndex[y[mainKey]]; // get corresponding row from lookupTable
              output.push(select(y, x)); // select only the columns you need
              //output.push(y[mainKey]);
          }
          return output;
      };

      // get centrods by filtering for district function
      function getCentroid(dist) {
        return centroids.filter(function(d){
          return (d.district == dist);
        })[0].centroid
      }

      // reuce function for creating multi-class selection
      function createMCSelection(acc, curr, curr_i, array){
        if (curr_i == (array.length)) {
          return acc + "," + ("path." + curr);
        }
        else if (curr_i == 1) {
          return ("path." + acc + ",") + ("path." + curr);

        }
        else {
          return acc + "," + ("path." + curr);
        }

      }
    }

    function whiteSpaceRem(text){
      return text.split(" ").join("")
    }
  }

  // removing all elements from vizcontain
  //removeAllDisplay()

  // drawing the votePerc map
  drawVotePercMap();

};
