"use strict";

function createCartogram(year) {

  function removeAllDisplay() {
    // remove all contents of viz
    d3.select("#vizcontain").selectAll('*').remove();

    // remove all contents of legend
    d3.select("#legendcontain").selectAll('*').remove();

    d3.select('#barsvg').remove();

    d3.select("#majorityVote").selectAll('*').remove();
  }

  removeAllDisplay();

  function drawVotePercMap() {
    var parties = ["Pakistan Tehreek-e-Insaf", "Pakistan Muslim League (N)", "Pakistan Peoples Party Parliamentarians", "Jamiat Ulama-e-Islam (F)", "Independent", "Awami National Party", "Muttahida Qaumi Movement Pakistan", "Pakistan Muslim League", "Muttahida Majlis-e-Amal Pakistan", "Mutahida Majlis-e-Amal Pakistan", "Balochistan Awami Party", "Tehreek-e-Labbaik Pakistan"];

    // replace these with the colors from the naseats map
    var party_colors = ["#9C27B0", "#81C784", "#607D8B", "#4DB6AC", "#CDDC39", "#03A9F4", "#BDBDBD", "#4DD0E1", "#4DB6AC", "#4DB6AC", "#E53935", "#795548"];

    // color scale for parties, put in party and it gives you color
    var colorScale = d3.scaleOrdinal().domain(parties).range(party_colors);

    var map_block = d3.select("body").select("#vizcontain");

    // width and height of the svg viewport
    var width = 1000,
        height = 600;

    // defining the projection for map (change center and scale to get desired size for the map)
    var projection = d3.geoMercator()
    // .center([68.38, 31.5])
    // .scale([150 * 14]);
    .center([75, 31.5]).scale([150 * 13]);

    // defining the paths for the maps
    var path = d3.geoPath().projection(projection);

    // defining the svg view port for the map within the div
    var svg = map_block.append("svg")
    // .attr("width", width)
    // .attr("height", height)
    .attr("preserveAspectRatio", "xMinYMin meet")
    //.attr("viewBox", "0 0 1000 600")
    .attr("viewBox", "0 0 636 600").style("fill-opacity", 1).classed("map_in_a_box", "true").attr("id", "cartogram");

    var party_title = svg.append("text").attr("id", "party_title").attr('x', "50%").attr('y', 18).text(function (d) {
      if (year == 2013 || year == 2018) {
        return "Pakistan Tehreek-e-Insaf";
      } else if (year == 2008) {
        return "Pakistan Muslim League (N)";
      }
    }).style("text-anchor", "middle").style("font-size", "13px").style("fill", "#9E9E9E");

    //console.log(party_title.node().getBoundingClientRect());


    var svg_g = svg.append("g").classed("map_group", "true");
    // queue function to read in multiple flat files
    d3.queue().defer(d3.json, "./essentials/pakistan_districts.topojson").defer(d3.json, "./essentials/JAndKashmir.topojson").defer(d3.json, "./essentials/Pakistan_NationalBoundary.topojson").defer(d3.json, "./essentials/Pak_prov.topojson").defer(d3.csv, "./essentials/NA_seats_2008.csv").defer(d3.csv, "./essentials/NA_seats_2013.csv").defer(d3.csv, "./essentials/NA_seats_2018.csv").await(drawCartogram);

    // function executed by d3.queue
    function drawCartogram(error, topology, k_topology, pak_topology, pak_prov_topology, na_seats_2008, na_seats_2013, na_seats_2018) {

      d3.selectAll("#PA, #NA, #dwvs, #flow").attr('disabled', null);

      var path_data = topojson.feature(topology, topology.objects.pakistan_districts).features;
      var kshmr_path_data = topojson.feature(k_topology, k_topology.objects.JAndKashmir).features;
      var nat_path_data = topojson.feature(pak_topology, pak_topology.objects.Pakistan_NationalBoundary).features;
      var nat_prov_data = topojson.feature(pak_prov_topology, pak_prov_topology.objects.Pak_prov).features;

      //console.log(path_data);

      // compute centroids of all districts
      var centroids = path_data.map(function (feature) {
        var district = feature.properties.districts;
        var object = {};
        object["district"] = district;
        object["centroid"] = path.centroid(feature);
        return object;
      });

      // drawing paths of all districts within a g classed 'pakDistricts'
      svg_g.append("g").classed("pakDistricts", true).selectAll("path").data(path_data).enter().append("path").attr("d", function (d, i) {
        return path(d);
      }).style("stroke", "white").style("stroke-width", 0.2).style("fill", "#FFF").style("fill-opacity", 0.9)
      //.attr("district", d => d.properties.districts)
      .attr("class", function (d, i) {
        return whiteSpaceRem(d.properties.districts);
      }).classed("district", true);

      // drawing J and Kashmir with dotted stroke (classed JKAshmir)
      svg_g.append('g').classed("JKashmir", true).selectAll(".Kashmir").data(kshmr_path_data).enter().append("path").classed("Kashmir", true).attr("d", function (d, i) {
        return path(d);
      }).style("fill-opacity", 1).style("stroke", "grey").style("stroke-dasharray", 2).style("stroke-width", 0.5).style("fill", "#FFF");

      // drawing the Pakistan boundary
      svg_g.append("g").classed("Pak_boundary", true).selectAll(".Pak_boundary").data(nat_path_data).enter().append("path").classed("Pakistan", true).attr("d", function (d, i) {
        return path(d);
      }).style("stroke", "grey").style("stroke-width", 1)
      //.style("fill", "#EEE")
      .style("fill", "white").style("fill-opacity", 0);

      // generating path for Pakistan provinces (class PakProv)
      svg_g.selectAll(".Pak_prov").data(nat_prov_data).enter().append("path").classed("PakProv", true).attr("d", function (d, i) {
        return path(d);
      }).style("stroke", "grey").style("stroke-width", 0.25).style("fill", "white").style("fill-opacity", 0.0);

      //console.log(year);
      //var year = 2008;

      var na_seats;
      var elections;
      var selected_party;

      if (year == 2008) {
        na_seats = na_seats_2008;
        elections = elections_2008;
        // default party
        selected_party = "Pakistan Muslim League (N)";
      } else if (year == 2013) {
        na_seats = na_seats_2013;
        elections = elections_2013;
        // default party
        selected_party = "Pakistan Tehreek-e-Insaf";
      }
      else if (year == 2018) {
        na_seats = na_seats_2018;
        elections = election_2018_ann;
        // default party
        selected_party = "Pakistan Tehreek-e-Insaf";
      }

      d3.select("#topHighlightInfo")
        .selectAll('*')
        .remove();

      var appendTopInfoTo = d3.select('#topHighlightInfo');

      appendTopInfoTo.html(function(){
        return '<p class="animated fadeInDefault highlightinfo" style="margin-top: 15px;">Registered Votes: 104,940,436</p><p class="animated fadeInDefault highlightinfo" style="font-size: 14px; margin-top: -12px;">Valid Votes: 54,365,088</p><p class="animated fadeInDefault highlightinfo" style="margin-top: -12px;">Turnout: 51.8%</p>'
      })


    d3.select("#firstparty")
      .selectAll('*')
      .remove();

      var appendLeaderTo = d3.select('#firstparty');

      appendLeaderTo.append('div')
        .classed('icon-details', true)
        .classed('animated', true)
        .classed('fadeInDefault', true)
        .attr('id', 'iconDetailFirst');

      var icondetails1 = d3.select('#iconDetailFirst');
      icondetails1.append('div').classed('lead-18-logo', true).html(image('Pakistan Tehreek-e-Insaf'));
      icondetails1.append('div').classed('leaderInformation', true).html(function(){ return '<p class="partyTitle">Pakistan Tehreek-e-Insaf</p><p class="leadSeats">Total Votes: 16,816,264</p>'})

      d3.select("#secondparty")
        .selectAll('*')
        .remove();

      var appendRunnerTo = d3.select('#secondparty');

      appendRunnerTo.append('div')
        .classed('icon-details', true)
        .classed('animated', true)
        .classed('fadeInDefault', true)
        .attr('id', 'iconDetailSecond');

      var icondetails2 = d3.select('#iconDetailSecond');
      icondetails2.append('div').classed('lead-18-logo', true).html(image('Pakistan Muslim League (N)'));
      icondetails2.append('div').classed('leaderInformation', true).html(function(){ return '<p class="partyTitle">Pakistan Muslim League (N)</p><p class="leadSeats">Total Votes: 12,894,270</p>'})

      d3.select("#thirdparty")
        .selectAll('*')
        .remove();

      var appendThirdTo = d3.select('#thirdparty');

      appendThirdTo.append('div')
        .classed('icon-details', true)
        .classed('animated', true)
        .classed('fadeInDefault', true)
        .attr('id', 'iconDetailThird');

      var icondetails3 = d3.select('#iconDetailThird');
      icondetails3.append('div').classed('lead-18-logo', true).html(image('Pakistan Peoples Party Parliamentarians'));
      icondetails3.append('div').classed('leaderInformation', true).html(function(){ return '<p class="partyTitle">Pakistan Peoples Party Parliamentarians</p><p class="leadSeats">Total Votes: 6,894,296</p>'})


      // elections data set joined with the seats information
      var result = join(na_seats, elections, "Seat", "seat", function (election_row, seat_row) {
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
        };
      });

      // some processing to address blank data field
      result.forEach(function (d) {
        //console.log(d3.sum(d.results.map(d => d.votes)))
        d["Valid Votes"] = d3.sum(d.results.map(function (d) {
          return d.votes;
        }));
      });

      //console.log(result);

      // defining the nest function for grouping results by District
      var result_by_dist = d3.nest().key(function (d) {
        return d.PrimaryDistrict;
      }).entries(result);

      // listing all the primary districts
      var PrimDistList = result_by_dist.map(function (d) {
        return d.key;
      });

      // functions for unnesting the data
      var unnested = function unnested(data, children) {
        var out = [];
        data.forEach(function (d, i) {
          //console.log(i, d);
          var d_keys = Object.keys(d);
          //console.log(i, d_keys)
          var values = d[children];

          values.forEach(function (v) {
            d_keys.forEach(function (k) {
              if (k != children) {
                v[k] = d[k];
              }
            });
            out.push(v);
          });
        });
        return out;
      };

      // unnest all the results by district (unnest by seat)
      var result_by_dist_party = result_by_dist.map(function (d, i) {
        return {
          key: d.key,
          values: unnested(d['values'], "results")
        };
      });

      // now nesting results by party instead of seats
      var votes_by_dist_party = result_by_dist_party.map(function (d, i) {
        return {
          key: d.key,
          values: d3.nest().key(function (d) {
            return d.party;
          }).rollup(function (v) {
            return d3.sum(v, function (d) {
              return d.votes;
            });
          }).entries(d['values'])
          //.sort()
          .sort(function (a, b) {
            return b.value - a.value;
          })
        };
      });

      // making an objects out of result array
      var distPartyObj = _.keyBy(votes_by_dist_party, 'key');
      var resDistObj = _.keyBy(result_by_dist, 'key');

      // list number of votes for each district for a particular party
      function list_votes(data_entry, party) {
        var list_of_votes = data_entry.values.map(function (d) {
          return d.results;
        }).map(function (d) {
          return d.filter(function (x) {
            return x.party == party;
          });
        });
        list_of_votes = [].concat.apply([], list_of_votes).filter(function (d) {
          return d != null;
        }).map(function (d) {
          return d.votes;
        });
        return list_of_votes;
      }

      // list number of valid votes for each district
      function list_valid_votes(data_entry) {
        return data_entry.values.map(function (d) {
          return d['Valid Votes'];
        });
      }

      // scale for radius (vote percent circle)
      var rad_scale = d3.scaleSqrt().domain([0, 100]).range([0, 15]);

      // scale for radius (number of seats)
      var seat_rad_scale = d3.scaleSqrt().domain([0, 21]).range([0, 69]);

      // circles representing vote percent
      svg.selectAll('circle').data(result_by_dist).enter().append('circle').attr("cx", function (d) {
        return getCentroid(d.key)[0];
      }).attr("cy", function (d) {
        return getCentroid(d.key)[1];
      }).style("fill", function (d) {
        return colorScale(selected_party);
      }).style("fill-opacity", 0.7).each(function (d, i) {
        var total_votes = list_votes(d, selected_party);
        var total_valid_votes = list_valid_votes(d);
        d.ValidVotesTotal = d3.sum(total_valid_votes);
        d.VotePerc = d3.sum(total_votes) / d3.sum(total_valid_votes) * 100;
        d.VotePerc = Math.round(d.VotePerc * 10) / 10;
      }).attr("r", function (d, i) {
        // total_votes = list_votes(d);
        // total_valid_votes = list_valid_votes(d);
        // return (total_votes.length > 0) ? rad_scale((total_votes.reduce(function(a, b) { return a+b } ))/ (total_valid_votes.reduce(function(a, b){ return a+b }))) : 0;
        // console.log(d.VotePerc);
        return rad_scale(d.VotePerc);
      }).attr('class', function (d) {
        return 'votePerc ' + d.key;
      }).attr('id', function (d) {
        return whiteSpaceRem(d.key);
      });

      var nodes = result_by_dist;

      // defining voronoi
      var voronoi = d3.voronoi().x(function (d) {
        return getCentroid(d.key)[0] + Math.random() * (1 + 1) - 1;
      }).y(function (d) {
        return getCentroid(d.key)[1] + Math.random() * (1 + 1) - 1;
      }).extent([[0, 0], [width, height]]);
      //
      //
      var polygon = svg.append("defs").selectAll(".clip.cartogram").data(voronoi.polygons(nodes))
      //First append a clipPath element
      .enter().append("clipPath").attr("class", "clip cartogram")
      //Make sure each clipPath will have a unique id (connected to the circle element)
      .attr("id", function (d) {
        return "clipCartogram" + whiteSpaceRem(d.data.key);
      })
      //Then append a path element that will define the shape of the clipPath
      .append("path").attr("class", "clip-path-circle cartogram").attr("d", function (d) {
        return "M" + d.join(",") + "Z";
      });

      //Append larger circles (that are clipped by clipPaths)
      svg.append('g').classed('clip-circles', true).classed('cartogram', true).selectAll(".circle-catcher.cartogram").data(nodes).enter().append("circle")
      //.classed('circle-catcher', true)
      .attr("class", function (d, i) {
        return "circle-catcher cartogram " + d.key;
      })
      //Apply the clipPath element by referencing the one with the same countryCode
      .attr("clip-path", function (d, i) {
        return "url(#clipCartogram" + whiteSpaceRem(d.key) + ")";
      })
      //Bottom line for safari, which doesn't accept attr for clip-path
      .style("clip-path", function (d, i) {
        return "url(#clipCartogram" + whiteSpaceRem(d.key) + ")";
      }).attr("cx", function (d) {
        return getCentroid(d.key)[0];
      }).attr("cy", function (d) {
        return getCentroid(d.key)[1];
      })
      //Make the radius a lot bigger
      .attr("r", 20).style("fill", "none")
      //.style("opacity", 0.5)
      .style("pointer-events", "all");
      // .on("mouseover", activateMouseOv)
      // .on("mouseout", activateMouseOut)
      //Notice that we now have the mousover events on these circles
      // .on("mouseover", activateHover(100))
      // .on("mouseout",  deactivateHover(100));

      // mouseover event
      svg.selectAll('circle.circle-catcher.cartogram').on("mouseover", function (d, i) {
        var unique_dist = d3.select(this).attr('class').replace("circle-catcher cartogram ", "");
        var circle_select = d3.select('.votePerc' + "#" + whiteSpaceRem(unique_dist));
        // transitions for circle
        circle_select.transition("districtSelectTrans").duration(100).style('stroke', "black").style('stroke-width', 1);

        // datum of the hovered element
        var selectedDatum = d3.select(this).data()[0];
        //console.log(selectedDatum);
        // district of the hovered element without spaces
        var selected_district_WS = selectedDatum.key;
        var selected_district = whiteSpaceRem(selectedDatum.key);
        //console.log(selected_district);

        // secondary districts for hovered element
        var seconDistricts = selectedDatum.values.map(function (d) {
          return d.SeconDistrict;
        });
        // split secondary districts by the " - "
        seconDistricts = seconDistricts.map(function (d) {
          return d.split(" - ");
        });
        seconDistricts = [].concat.apply([], seconDistricts);
        // remove empty strings

        var seconDistricts_WS = seconDistricts.filter(function (d) {
          return d != "";
        });
        // removing spaces
        seconDistricts = seconDistricts_WS.map(function (d) {
          return whiteSpaceRem(d);
        });

        // important stats for tooltip
        var total_seats = resDistObj[d.key].values.length;
        var seat_arr = resDistObj[d.key].values.map(function (d) {
          return +d.seat.replace("NA-", "");
        });
        var min_seat = d3.min(seat_arr);
        var max_seat = d3.max(seat_arr);
        //console.log(min_seat, max_seat);
        var partyWinArr = resDistObj[d.key].values.map(function (d) {
          return d.results[0].party;
        });

        // how many seats ahas the party won?
        var party_seats = 0;
        partyWinArr.forEach(function (d) {
          if (d === selected_party) {
            party_seats++;
          }
        });

        var winnParty = distPartyObj[selected_district_WS].values[0].key;

        var winnPartySeats = 0;
        partyWinArr.forEach(function (d) {
          if (d === winnParty) {
            winnPartySeats++;
          }
        });

        // appending circles for seats/ district
        svg.append('circle').attr('r', 0).attr('cx', getCentroid(d.key)[0]).attr('cy', getCentroid(d.key)[1]).style('fill', 'none').style('stroke', '#212121').style('stroke-width', 0.5).style('stroke-dasharray', 2).classed('seatBubble', true).transition('seatBubbleTrans').attr('r', seat_rad_scale(total_seats)).style('stroke-width', 2);

        // appending title on hover
        d3.select('body').append('div').classed('animated', true).classed('fadeIn', true).classed('cartogramtool', true).attr('id', 'hoverbox');

        var tooltip = d3.select('.cartogramtool');

        tooltip.append('div').classed('cartotoolhead', true).html(function (d) {
          return '<span>District: <span style="color: #283593">' + selected_district_WS + '</span></span><span>Valid Votes: <span style="color: #283593">' + selectedDatum.ValidVotesTotal + '</span></span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
        });

        tooltip.append('div').classed('cartotoolop', true).html(function (d) {
          var otherdist = seconDistricts_WS.join(" | ");
          if (otherdist == '') {
            return '<span style="color: #283593">Other districts: None</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
          } else {
            return '<span style="font-size: 11px">Other districts: ' + otherdist + '</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
          }
        });

        tooltip.append('div').classed('cartotoolfooter', true).html(function (d) {
          if (selected_district_WS === 'Larkana') {
            return '<span>Total seats: ' + total_seats + '</span><span>NA 204, NA 205, NA 207</span>';
          } else {
            if (min_seat === max_seat) {
              return '<span>Total seats: ' + total_seats + '</span><span>NA' + min_seat + '</span>';
            } else {
              return '<span>Total seats: ' + total_seats + '</span><span>NA' + min_seat + ' - NA' + max_seat + '</span>';
            }
          }
        });

        tooltip.append('div').classed('cartotoolparty', true).style('background', d3.rgb(colorScale(selected_party)).darker(1)).html(function (d) {
          return '<span class="cartotoolpartyhead">SELECTED PARTY</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
        });

        tooltip.append('div').classed('cartotoolparty', true).style('background', d3.rgb(colorScale(distPartyObj[selected_district_WS].values[0].key)).darker(1)).html(function (d) {
          return '<span class="cartotoolpartyhead">MAJORITY VOTE</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
        });

        tooltip.append('div').classed('cartotoolpartylogo', true).html(image(selected_party)); //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";

        tooltip.append('div').classed('cartotoolpartylogo', true).html(image(distPartyObj[selected_district_WS].values[0].key));

        tooltip.append('div').classed('cartotoolpartydetail', true).html(function (d) {
          return '<span>Party: ' + abbreviate(selected_party) + '</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
        });

        tooltip.append('div').classed('cartotoolpartydetail', true).html(function (d) {
          return '<span>Party: ' + abbreviate(distPartyObj[selected_district_WS].values[0].key) + '</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
        });

        tooltip.append('div').classed('cartotoolpartydetail', true).html(function (d) {
          return '<span>Vote share: ' + selectedDatum.VotePerc + '%</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
        });

        tooltip.append('div').classed('cartotoolpartydetail', true).html(function (d) {
          var winnVotes = distPartyObj[selected_district_WS].values[0].value;
          var winnVotePerc = winnVotes / selectedDatum.ValidVotesTotal * 100;
          return '<span>Vote share: ' + Math.round(winnVotePerc * 10) / 10 + '%</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
        });

        tooltip.append('div').classed('cartotoolpartydetail', true).html(function (d) {
          return '<span>Seats Won: ' + party_seats + '</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
        });

        tooltip.append('div').classed('cartotoolpartydetail', true).html(function (d) {
          return '<span>Seats Won: ' + winnPartySeats + '</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
        });

        if (d3.event.pageY >= 460) {
          var hoverbox = document.getElementById('hoverbox');
          tooltip.style('top', d3.event.pageY - hoverbox.offsetHeight - 18 + "px");
          if (d3.event.pageX - 125 < 0) {
            tooltip.style('left', window.innerWidth / 2 - 125 + "px");
          } else if (d3.event.pageX + 125 > window.innerWidth) {
            tooltip.style('left', window.innerWidth / 2 - 125 + "px");
          } else if (window.innerWidth < 450) {
            tooltip.style('left', window.innerWidth / 2 - 125 + "px");
          } else {
            tooltip.style('left', d3.event.pageX - 125 + "px");
          }
        } else {
          tooltip.style('top', d3.event.pageY + 14 + "px");
          if (d3.event.pageX - 125 < 0) {
            tooltip.style('left', window.innerWidth / 2 - 125 + "px");
          } else if (d3.event.pageX + 125 > window.innerWidth) {
            tooltip.style('left', window.innerWidth / 2 - 125 + "px");
          } else if (window.innerWidth < 450) {
            tooltip.style('left', window.innerWidth / 2 - 125 + "px");
          } else {
            tooltip.style('left', d3.event.pageX - 125 + "px");
          }
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
        d3.selectAll('path.' + selected_district).transition().duration(100).style('stroke', 'purple').style('stroke-width', 1.5);

        // getting selection for secondary districts
        var SD_len = seconDistricts.length;
        var seconDistricts_select;
        if (SD_len == 1) {
          seconDistricts_select = "path." + seconDistricts[0];
        } else if (SD_len > 1) {
          seconDistricts_select = seconDistricts.reduce(createMCSelection);
        } else {
          seconDistricts_select = "nothing";
        }

        // raise selected secondary districts
        d3.selectAll(seconDistricts_select).raise();

        // making the secondary districts prominent
        d3.selectAll(seconDistricts_select).transition().duration(100).style('stroke', 'purple').style('fill', function (d) {
          return PrimDistList.indexOf(d.properties.districts) > -1 ? "#BDBDBD" : "none";
        }).style('stroke-width', 1.5);
      });

      // mouseout event
      svg.selectAll('circle.circle-catcher.cartogram').on("mouseout", function (d, i) {
        var unique_dist = d3.select(this).attr('class').replace("circle-catcher cartogram ", "");
        var circle_select = d3.select('.votePerc' + "#" + whiteSpaceRem(unique_dist));

        // selected primary district
        var selectedDatum = d3.select(this).data()[0];
        var selected_district = whiteSpaceRem(selectedDatum.key);

        // secondary districts
        var seconDistricts = selectedDatum.values.map(function (d) {
          return d.SeconDistrict;
        });
        seconDistricts = seconDistricts.map(function (d) {
          return d.split(" - ");
        });
        seconDistricts = [].concat.apply([], seconDistricts);
        seconDistricts = seconDistricts.filter(function (d) {
          return d != "";
        });
        seconDistricts = seconDistricts.map(function (d) {
          return whiteSpaceRem(d);
        });

        // unselect vote Perc circles
        circle_select.transition("districtSelectTrans").duration(100).style('stroke', "black").style('stroke-width', 0);

        // remove tooltip
        d3.selectAll('.cartogramtool').remove();
        // remove seat bubble
        d3.select('.seatBubble').remove();
        // remove district boundary
        d3.selectAll('path.' + selected_district).transition().duration(100).style('stroke', 'none').style('stroke-width', 0);

        // selection for secondary districts
        var SD_len = seconDistricts.length;
        var seconDistricts_select;
        if (SD_len == 1) {
          seconDistricts_select = "path." + seconDistricts[0];
        } else if (SD_len > 1) {
          seconDistricts_select = seconDistricts.reduce(createMCSelection);
        } else {
          seconDistricts_select = "nothing";
        }

        // remove all secondary district boundaries
        d3.selectAll(seconDistricts_select).transition().duration(100).style('stroke', 'none').style('stroke-width', 0).style('fill', 'none').style('opacity', 1);
      });

      // event for updating party

      $(".cartinput").click(function () {

        selected_party = d3.select(this).attr('value');
        //console.log(selected_party);
        // update party title
        d3.select('#party_title').text(selected_party);
        update_bubbles(selected_party);
      });

      // update bubble function when new party is selected
      function update_bubbles(new_party) {
        d3.selectAll('circle.votePerc').each(function (d, i) {
          var total_votes = list_votes(d, new_party);
          var total_valid_votes = list_valid_votes(d);
          d.ValidVotesTotal = d3.sum(total_valid_votes);
          d.VotePerc = d3.sum(total_votes) / d3.sum(total_valid_votes) * 100;
          d.VotePerc = Math.round(d.VotePerc * 10) / 10;
        }).transition("partySwitchTrans").duration(1000).attr("r", function (d, i) {
          return rad_scale(d.VotePerc);
        }).style("fill", function (d) {
          return colorScale(new_party);
        });
      }

      // code for putting in legends for the vis
      var legendDiv = d3.select("#legendcontain");

      var VSLegDomain = d3.range(20, 101, 20);
      var VSLegRange = VSLegDomain.map(function (d) {
        return rad_scale(d);
      });
      var VSLegDomain = VSLegDomain.map(function (d) {
        return d + "%";
      });

      var VMLegScale = d3.scaleOrdinal().domain(VSLegDomain).range(VSLegRange);

      // vote share legend
      var voteShrLegDiv = legendDiv.append("div").classed("voteShrLegDiv", true);

      voteShrLegDiv.append('p').text('Vote Share').style('font-size', '12px').style('text-align', 'center').style('margin-bottom', '1px');

      var voteShrLegSVG = voteShrLegDiv.append("svg").classed("voteShrLegSVG", true).attr('width', 220).attr('height', 90);

      voteShrLegSVG.append("g").attr("class", "voteShrLegG").attr("transform", "translate(25, 29)");

      var voteShrLeg = d3.legendSize().scale(VMLegScale).shape('circle').shapePadding(20).labelOffset(15).orient('horizontal');

      voteShrLegSVG.select(".voteShrLegG").call(voteShrLeg);

      // changing the style of legend text and circles
      d3.selectAll(".voteShrLegSVG text").style('font-size', '10px');

      d3.selectAll(".voteShrLegSVG circle").style('fill', 'none').style('stroke', 'black');

      var seatLegDomain = d3.range(1, 6, 1);
      var seatLegRange = seatLegDomain.map(function (d) {
        return seat_rad_scale(d);
      });

      var seatLegScale = d3.scaleOrdinal().domain(seatLegDomain).range(seatLegRange);

      // vote share legend
      var seatLegDiv = legendDiv.append("div").classed("seatLegDiv", true);

      seatLegDiv.append('p').text('Number of Seats').style('font-size', '12px').style('text-align', 'center').style('margin-bottom', '5px');

      var seatLegSVG = seatLegDiv.append("svg").classed("seatLegSVG", true).attr('width', 350).attr('height', 90);
      //  .attr("preserveAspectRatio", "xMinYMin meet")
      //  .attr("viewBox", "0 0 350 90")

      seatLegSVG.append("g").attr("class", "seatLegG").attr("transform", "translate(25, 20)");

      var seatLeg = d3.legendSize().scale(seatLegScale).shape('circle').shapePadding(25).labelOffset(15).orient('horizontal');

      seatLegSVG.select(".seatLegG").call(seatLeg);

      // changing the style of legend text and circles
      d3.selectAll(".seatLegSVG text").style('font-size', '10px');

      d3.selectAll(".seatLegSVG circle").style('fill', 'none').style('stroke', 'black').style('stroke-width', 2).style('stroke-dasharray', 2);

      // join datasets functions by key
      function join(lookupTable, mainTable, lookupKey, mainKey, select) {
        var l = lookupTable.length,
            m = mainTable.length,
            lookupIndex = [],
            output = [];
        for (var i = 0; i < l; i++) {
          // loop through l items
          var row = lookupTable[i];
          lookupIndex[row[lookupKey]] = row; // create an index for lookup table
        }

        //console.log(lookupIndex);
        for (var j = 0; j < m; j++) {
          // loop through m items
          var y = mainTable[j];
          var x = lookupIndex[y[mainKey]]; // get corresponding row from lookupTable
          output.push(select(y, x)); // select only the columns you need
          //output.push(y[mainKey]);
        }
        return output;
      };

      // get centrods by filtering for district function
      function getCentroid(dist) {
        return centroids.filter(function (d) {
          return d.district == dist;
        })[0].centroid;
      }

      // reuce function for creating multi-class selection
      function createMCSelection(acc, curr, curr_i, array) {
        if (curr_i == array.length) {
          return acc + "," + ("path." + curr);
        } else if (curr_i == 1) {
          return "path." + acc + "," + ("path." + curr);
        } else {
          return acc + "," + ("path." + curr);
        }
      }
    }

    function whiteSpaceRem(text) {
      return text.split(" ").join("");
    }
  }

  // removing all elements from vizcontain
  //removeAllDisplay()

  // drawing the votePerc map
  drawVotePercMap();
};
