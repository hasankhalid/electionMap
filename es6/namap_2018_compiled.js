"use strict";

function createNAMap_2018() {

  function removeAllDisplay() {
    // remove all contents of viz
    d3.select("#vizcontain").selectAll('*').remove();

    // remove all contents of legend
    d3.select("#legendcontain").selectAll('*').remove();

    d3.select('#barsvg').remove();

    d3.select("#majorityVote").selectAll('*').remove();
  }

  removeAllDisplay();
  function drawNAMap() {

    ////////////////////////////////////
    ////////////// Set up //////////////
    ////////////////////////////////////

    // selecting the div with id vizcontain
    var map_block = d3.select("#vizcontain");

    // width and height of the svg viewport
    // var width = 1000, height = 600;
    // var width = 404, height = 436;

    // defining the projection for map (change center and scale to get desired size for the map)
    var projection = d3.geoMercator()
    // .center([68.38, 31.5])
    // .scale([150 * 14]);
    .center([75, 31.5]).scale([150 * 13]);

    // defining the paths for the maps
    var path = d3.geoPath().projection(projection);

    // defining the svg view port for the map within the div
    var svg = map_block.append("svg").attr("preserveAspectRatio", "xMinYMin meet")
    //.attr("viewBox", "0 0 1000 600")
    .attr("viewBox", "0 0 636 600").style("fill-opacity", 1).classed("map_in_a_box", "true").attr("id", "NAmap");

    // appending a group in the svg with a class map_group
    var svg_g = svg.append("g").classed("map_group", "true");

    var status_message = svg.append("text").attr("id", "status_message").attr('x', '50%').attr('y', 10).style('text-anchor', 'middle').style('fill', '#D32F2F').style('font-size', '12px').text('Gathering data, votes and layout information');

    // reading in alll the files and defining the execution function
    d3.queue().defer(d3.json, "./essentials/pakistan_districts.topojson").defer(d3.json, "./essentials/JAndKashmir.topojson").defer(d3.json, "./essentials/Pak_prov.topojson").defer(d3.json, "./essentials/Pakistan_NationalBoundary.topojson").defer(d3.csv, "./essentials/NA_seats_2018.csv").await(drawElectMap);

    // listing the winning parties
    var parties = ["Pakistan Tehreek-e-Insaf", "Jamiat Ulama-e-Islam (F)", "Qaumi Watan Party (Sherpao)", "Awami National Party", "Awami Jamhuri Ittehad Pakistan", "Pakistan Muslim League (N)", "Independent", "Jamaat-e-Islami Pakistan", "All Pakistan Muslim League", "Awami Muslim League Pakistan", "Pakistan Muslim League", "Pakistan Muslim League(Z)", "Pakistan Peoples Party Parliamentarians", "National Peoples Party", "Pakistan Muslim League (F)", "Muttahida Qaumi Movement Pakistan", "Pashtoonkhwa Milli Awami Party", "National Party", "Balochistan National Party", "MUTTHIDA MAJLIS-E-AMAL PAKISTAN", "Balochistan National Party (Awami)", "Grand Democratic Alliance", "Mutahida Majlis-e-Amal Pakistan", "Balochistan Awami Party", "Muttahida Majlis-e-Amal Pakistan"];

    // defining colors mapping to parties / other color is mapped to multiple parties
    var other_color = "#03A9F4";

    var party_colors = ["#9C27B0", "#4DB6AC", other_color, other_color, other_color, "#66BB6A", "#FBC02D", other_color, other_color, other_color, "#4DD0E1", other_color, "#757575", other_color, "#FF8A65", "#F48FB1", other_color, other_color, other_color, "#4DB6AC", other_color, "#FF8A65", "#4DB6AC", "#E53935", "#4DB6AC"];

    // defining categorical color scale
    var colorScale = d3.scaleOrdinal().domain(parties).range(party_colors);

    ////////////////////////////////////////////////
    ////////////// Execution function //////////////
    ////////////////////////////////////////////////

    // execution function (Draws map and gets bubbles positioned on map)
    function drawElectMap(error, topology, k_topology, pak_prov_topology, pak_topology, na_seats_2018) {

      d3.selectAll("#PA-18, #dwvs, #flow, #dropdownMenuLink").attr('disabled', true);

      // relevant data extracted from topojson files
      var path_data = topojson.feature(topology, topology.objects.pakistan_districts).features;
      var kshmr_path_data = topojson.feature(k_topology, k_topology.objects.JAndKashmir).features;
      var nat_prov_data = topojson.feature(pak_prov_topology, pak_prov_topology.objects.Pak_prov).features;
      var nat_path_data = topojson.feature(pak_topology, pak_topology.objects.Pakistan_NationalBoundary).features;

      // getting district Centroids using the distCentroids function
      var centroids = distCentroids(path_data);

      ///////////////////////////////////////////////////////
      ////////////// Generating paths for maps //////////////
      ///////////////////////////////////////////////////////

      // map components for districts
      // will remian put for all map based visuals
      svg_g.selectAll("path").data(path_data).enter().append("path").attr("d", function (d, i) {
        return path(d);
      }).style("stroke", "#FFF").style("stroke-width", 0.25).style("fill", "#FFF").style("fill-opacity", 0.9)
      // each district path is classed by a district name
      .attr("class", function (d, i) {
        return d.properties.districts;
      }).classed("district", true);

      // generating path for J and Kashmir (class Kashmir)
      svg_g.selectAll(".Kashmir").data(kshmr_path_data).enter().append("path").classed("Kashmir", true).attr("d", function (d, i) {
        return path(d);
      }).style("fill-opacity", 1).style("stroke", "grey").style("stroke-dasharray", 2).style("stroke-width", 0.5).style("fill", "#FFF");

      // generating path for Pakistan national boundary (class Pakistan)
      svg_g.selectAll(".Pak_boundary").data(nat_path_data).enter().append("path").classed("Pakistan", true).attr("d", function (d, i) {
        return path(d);
      }).style("stroke", "grey").style("stroke-width", 1).style("fill", "white").style("fill-opacity", 0.9);

      // generating path for Pakistan provinces (class PakProv)
      svg_g.selectAll(".Pak_prov").data(nat_prov_data).enter().append("path").classed("PakProv", true).attr("d", function (d, i) {
        return path(d);
      }).style("stroke", "grey").style("stroke-width", 0.0).style("fill", "white").style("fill-opacity", 0.9);

      //////////////////////////////////////////////////
      ////////////// Data Pre-processing  //////////////
      //////////////////////////////////////////////////

      // comprehensive results by joining the scraped data with basic info of na_seats
      var result = join(na_seats_2018, election_2018_ann, "Seat", "seat", function (election_row, seat_row) {
        return {
          seat: seat_row['Seat'],
          PrimaryDistrict: seat_row.PrimaryDistrict,
          SeconDistrict: seat_row.SeconDistrict,
          Province: seat_row.Province,
          // just for 2018
          MaleTurnout: seat_row.MaleTurnout,
          FemaleTurnout: seat_row.FemaleTurnout,
          TotalTurnout: seat_row.TotalTurnout,
          //
          "Percentage of Votes Polled to Registered Voters": election_row['Percentage of Votes Polled to Registered Voters'],
          "Registered Votes": election_row['Registered Votes'],
          "Rejected Votes": election_row['Rejected Votes'],
          "Valid Votes": election_row['Valid Votes'],
          "Votes Polled": election_row['Votes Polled'],
          results: election_row['results']
        };
      });

      var base_bubble = 3; // min size that all bubbles take
      var margin_range = 5; // range for vote margin

      // adding vote margin and radius and init radius to results
      result.forEach(function (d) {
        d["Valid Votes"] = d3.sum(d.results.map(function (d) {
          return d.votes;
        }));
        if (d["Valid Votes"] == 0) {

          d["Percentage of Votes Polled to Registered Voters"] = (d3.sum(d.results.map(function (d) {
            return d.votes;
          })) / d["Registered Votes"] * 100).toFixed(2);
          //d.voteMargin = ((d.results[0].votes/ d['Valid Votes']) - (d.results[1].votes/ d['Valid Votes'])) * 100;
          // console.log(d.voteMargin);
          // console.log(getCircleSize(d.voteMargin));
          // console.log(d);
          // console.log(d.results);
        }

        d.voteMargin = (d.results[0].votes / d['Valid Votes'] - d.results[1].votes / d['Valid Votes']) * 100;
        d.radius = getCircleSize(d.voteMargin);
        d.radiusInit = getCircleSize(d.voteMargin);

        // add year 2018 condition later
        d["Percentage of Votes Polled to Registered Voters"] = d.TotalTurnout;
      });

      // adding initial x and y positions of seats/ nodes (start of the force simulation)
      // some additional processing to deal with missing voter data
      // adding initial x and y positions of seats/ nodes (start of the force simulation)
      result.forEach(function (d) {
        d.x = projection(cent_object_2018[d.seat])[0];
        d.y = projection(cent_object_2018[d.seat])[1];
      });

      //
      // result.forEach(function(d){
      //
      //   }
      //   //
      //
      // })

      // assigning results to nodes
      var nodes = result;

      var party_count = nodes.map(function (d) {
        return d.results[0] == null ? null : d.results[0].party;
      });

      function count(arr) {
        // count occurances
        var o = {},
            i;
        for (i = 0; i < arr.length; ++i) {
          if (o[arr[i]]) ++o[arr[i]];else o[arr[i]] = 1;
        }
        return o;
      }

      function weight(arr_in) {
        // unique sorted by num occurances
        var o = count(arr_in),
            arr = [],
            i;
        delete o[null];

        //for (i in o) arr.push({value: +i, weight: o[i]}); // fast unique only

        var arr = Object.keys(o).map(function (d) {
          return {
            "value": d,
            "weight": o[d]
          };
        });
        arr.sort(function (a, b) {
          return a.weight < b.weight;
        });
        return arr;
      }

      var sorted = weight(party_count).sort(function (a, b) {
        return b.weight - a.weight;
      });

      var appendTopInfoTo = d3.select('#topHighlightInfo');

      appendTopInfoTo.html(function () {
        return '<p class="animated fadeInDefault highlightinfo" style="margin-top: 15px;">Registered Votes: 104,940,436</p><p class="animated fadeInDefault highlightinfo" style="font-size: 14px; margin-top: -12px;">Valid Votes: 54,365,088</p><p class="animated fadeInDefault highlightinfo" style="margin-top: -12px;">Turnout: 51.8%</p>';
      });

      if (sorted[0] != undefined) {
        d3.select("#firstparty").selectAll('*').remove();

        var appendLeaderTo = d3.select('#firstparty');

        appendLeaderTo.append('div').classed('icon-details', true).classed('animated', true).classed('fadeInDefault', true).attr('id', 'iconDetailFirst');

        var icondetails1 = d3.select('#iconDetailFirst');
        icondetails1.append('div').classed('lead-18-logo', true).html(image(sorted[0].value));
        icondetails1.append('div').classed('leaderInformation', true).html(function () {
          return '<p class="partyTitle">' + sorted[0].value + '</p><p class="leadSeats">Total Votes: 16,816,264</p>';
        });
      }
      if (sorted[1] != undefined) {
        d3.select("#secondparty").selectAll('*').remove();

        var appendRunnerTo = d3.select('#secondparty');

        appendRunnerTo.append('div').classed('icon-details', true).classed('animated', true).classed('fadeInDefault', true).attr('id', 'iconDetailSecond');

        var icondetails2 = d3.select('#iconDetailSecond');
        icondetails2.append('div').classed('lead-18-logo', true).html(image(sorted[1].value));
        icondetails2.append('div').classed('leaderInformation', true).html(function () {
          return '<p class="partyTitle">' + sorted[1].value + '</p><p class="leadSeats">Total Votes: 12,894,270</p>';
        });
      }
      if (sorted[3] != undefined) {
        d3.select("#thirdparty").selectAll('*').remove();

        var appendThirdTo = d3.select('#thirdparty');

        appendThirdTo.append('div').classed('icon-details', true).classed('animated', true).classed('fadeInDefault', true).attr('id', 'iconDetailThird');

        var icondetails3 = d3.select('#iconDetailThird');
        icondetails3.append('div').classed('lead-18-logo', true).html(image(sorted[2].value));
        icondetails3.append('div').classed('leaderInformation', true).html(function () {
          return '<p class="partyTitle">' + sorted[2].value + '</p><p class="leadSeats">Total Votes: 6,894,296</p>';
        });
      }

      /////////////////////////////////////////////////////////
      ////////////// Setting up force simulation //////////////
      /////////////////////////////////////////////////////////

      // force with charge, forceX, forceY and collision detection

      var simulation = d3.forceSimulation(nodes).force('charge', d3.forceManyBody().strength(0.7)).force('x', d3.forceX().x(function (d) {
        return projection(cent_object_2018[d.seat])[0];
      })).force('y', d3.forceY().y(function (d) {
        return projection(cent_object_2018[d.seat])[1];
      })).force('collision', d3.forceCollide().radius(function (d) {
        return d.radius + .9;
      })).on('tick', ticked).alpha(0.525).alphaDecay(0.07).on('end', function () {
        redrawVoronoi();
        d3.select('svg').selectAll(".circle-catcher").style('display', 'block');

        d3.select('#status_message').text('All set').style('fill', '#1976D2').transition('status_trans').delay(2500).duration(1500).style('fill-opacity', 0);

        d3.selectAll("#PA-18, #dwvs, #flow, #dropdownMenuLink").attr('disabled', null);

        setTimeout(function () {
          $("#filterdropdown").show().addClass('animated fadeInDefault').css('display', 'flex');;
        }, 1000);

        setTimeout(function () {
          $("#partyFilters").show().addClass('animated fadeInDefault').css('display', 'flex');
        }, 1500);
      });

      //////////////////////////////////////////////////////////////
      ////////////// Adding bubble nodes for na seats //////////////
      //////////////////////////////////////////////////////////////

      // a group containing all na seat circles
      var u = svg.append('g').classed('na-seats-group', true).selectAll('.naSeat') // .selectAll('circle')
      .data(nodes);

      // entering all nodes // bubbles
      // initializing position of nodes
      u.enter().append('g').attr('class', function (d) {
        return d.seat;
      }).classed('naSeat_g', true).append('circle').attr("class", "naSeatCircle").classed('2008', true).classed('namap', true).merge(u).attr('cx', function (d) {
        return d.x;
      }).attr('cy', function (d) {
        return d.y;
      }).style("fill", function (d) {
        return colorScale(d.results[0].party);
      }).attr("party", function (d) {
        return d.results[0].party;
      }).attr("id", function (d) {
        return d.seat;
      }).attr('r', 0).transition('bubble_up').duration(1000).ease(d3.easePoly).attr('r', function (d) {
        return base_bubble + d.voteMargin / 100 * margin_range;
      });
      // removing the exit selection
      u.exit().remove();

      ///////////////////////////////////////////////////////////////////
      ////////////// Adding voronoi for better interaction //////////////
      ///////////////////////////////////////////////////////////////////

      var voronoi = d3.voronoi().x(function (d) {
        return d.x;
      }) // with some noise on x and y centers
      .y(function (d) {
        return d.y;
      }).extent([[0, 0], [width, height]]);

      var polygon = svg.append("defs").selectAll(".clip.NAmap").data(voronoi.polygons(nodes))
      //First append a clipPath element
      .enter().append("clipPath").attr("class", "clip NAmap")
      //Make sure each clipPath will have a unique id (connected to the circle element)
      .attr("id", function (d) {
        return d != null ? "clipNAmap" + d.data.seat : "clipNAmap" + "NA";
      })
      //Then append a path element that will define the shape of the clipPath
      .append("path").attr("class", "clip-path-circle NAmap").call(redrawPolygon);

      //Append larger circles (that are clipped by clipPaths)
      svg.append('g').classed('clip-circles', true).classed("NAmap", true).selectAll(".circle-catcher").data(nodes).enter().append("circle").attr("class", function (d, i) {
        return "circle-catcher NAmap " + d.seat;
      })
      //Apply the clipPath element by referencing the one with the same countryCode
      .attr("clip-path", function (d, i) {
        return "url(#clipNAmap" + d.seat + ")";
      })
      //Bottom line for safari, which doesn't accept attr for clip-path
      .style("clip-path", function (d, i) {
        return "url(#clipNAmap" + d.seat + ")";
      }).attr("cx", function (d) {
        return d.x;
      }).attr("cy", function (d) {
        return d.y;
      })
      //Make the radius a lot bigger
      .attr("r", 20).style("fill", "none")
      //  .style("fill-opacity", 0.5)
      .style("pointer-events", "all").style('display', 'none');

      d3.selectAll('circle.circle-catcher.NAmap').on("mouseover", activateMouseOv).on("mouseout", activateMouseOut);
      //Notice that we now have the mousover events on these circles
      // .on("mouseover", activateHover(100))
      // .on("mouseout",  deactivateHover(100));


      function redrawPolygon(polygon) {
        polygon.attr("d", function (d) {
          return d ? "M" + d.join(",") + "Z" : null;
        });
      }

      function redrawVoronoi() {
        polygon = polygon.data(voronoi.polygons(nodes)).call(redrawPolygon);
      }

      function ticked() {
        // updating the circle positions
        d3.selectAll(".naSeatCircle").attr('cx', function (d) {
          return d.x;
        }).attr('cy', function (d) {
          return d.y;
        });

        // redraw the voronoi clippaths

        //polygon = polygon.data(voronoi.polygons(nodes)).call(redrawPolygon);

        // changing the positions of the voronoi circle
        d3.select('svg').selectAll(".circle-catcher.NAmap").data(nodes).attr('cx', function (d) {
          return d.x;
        }).attr('cy', function (d) {
          return d.y;
        });
      }

      /*  if (simulation.alpha() > 0) {
          d3.timer(ticked);
        } */

      /////////////////////////////////////////////////////
      ////////////// Adding mouse over event //////////////
      /////////////////////////////////////////////////////

      function activateMouseOv(d, i) {
        // extract unique class of the hovered voronoi cell (replace "circle-catcher " to get seat)
        var unique_class = d3.select(this).attr('class').replace("circle-catcher NAmap ", "");
        // selecting the circle with the gotten id (first select group then circle)
        var circle_group = d3.select('g' + "." + unique_class);
        var circle_select = circle_group.select('circle');

        // raise the selected group
        circle_group.raise();

        // defining transition in the na circles
        circle_select.transition().ease(d3.easeElastic).duration(1700).tween('radius', function (d) {
          var that = d3.select(this);
          var i = d3.interpolate(d.radius, 10);
          return function (t) {
            d.radius = i(t);
            that.attr('r', function (d) {
              return d.radius >= 0 ? d.radius : 0;
            });
            //simulation.nodes(nodes)
          };
        }).attr('fill', function (d) {
          return d3.rgb(colorScale(d.results[0].party)).darker();
        }).attr('stroke', function (d) {
          return d3.rgb(colorScale(d.results[0].party)).darker();
        }).attr('stroke-width', 2);

        // extract the datum attached to the hovered circle
        var datum = circle_select.data()[0];
        // find out the party color by color scale
        var color = colorScale(datum.results[0].party);

        // append tooltip
        d3.select('body').append('div').classed('animated', true).classed('zoomIn', true).classed('tool', true).attr('id', 'hoverbox');
        // tooltip selection
        var tooltip = d3.select('.tool');

        tooltip.append('div').classed('toolhead', true).html(function (d) {
          return '<span class="NA">' + datum.seat + ' </span><span class="turnout">(' + datum["Percentage of Votes Polled to Registered Voters"] + '% voter turnout)</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
        });

        tooltip.append('div').classed('partyicon', true).html(image(datum.results[0].party));

        tooltip.append('div').classed('toolmfturnout', true).style('margin-top', '-8px').style('margin-bottom', '4px').style('font-size', '11px').style('color', '#757575').html(function () {
          return '<span>Turnout Gender Breakdown</span>';
        });

        tooltip.append('div').classed('toolmfturnout', true).append('div').classed('malefemalecontain', true).attr('id', 'mfcontain').style('margin-bottom', '2px');

        var mfcontain = d3.select('#mfcontain');

        if (datum.MaleTurnout != 0) {
          mfcontain.append('div').classed('genderturnout', true).html(function (d) {
            return '<img class="gendericon" src="./resources/masculine.svg"/><span class="mfpercent">' + datum.MaleTurnout + '% </span><span class="tdetail">male</span>';
          });
        } else {
          mfcontain.append('div').classed('genderturnout', true).html(function (d) {
            return '<img class="gendericon" src="./resources/masculine.svg"/><span class="tdetail">Unknown</span>';
          });
        }

        if (datum.FemaleTurnout != 0) {
          mfcontain.append('div').classed('genderturnout', true).html(function (d) {
            return '<img class="gendericon" src="./resources/femenine.svg"/><span class="mfpercent">' + datum.FemaleTurnout + '% </span><span class="tdetail">female</span>';
          });
        } else {
          mfcontain.append('div').classed('genderturnout', true).html(function (d) {
            return '<img class="gendericon" src="./resources/masculine.svg"/><span class="tdetail">Unknown</span>';
          });
        }

        tooltip.append('div').classed('toolhead', true).html(function (d) {
          return '<span class="dist">District: </span><span class="turnout">' + datum.PrimaryDistrict + '</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
        });

        tooltip.append('div').classed('nametitle', true).html(function (d) {
          return '<span>Name</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
        });

        tooltip.append('div').classed('partytitle', true).html(function (d) {
          return '<span>Party</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
        });

        tooltip.append('div').classed('voteTitle', true).html(function (d) {
          return '<span>Votes</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
        });

        //colored bar on top of tooltip showing the victorious party
        tooltip.append('div').classed('partyColorToolBar', true).style('background-color', color);

        tooltip.append('div').classed('candidatename', true).html(function (d) {
          return '<span>' + titleCase(datum.results[0].candidate) + '</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
        });
        tooltip.append('div').classed('partyname', true).html(function (d) {
          return '<span>' + abbreviate(datum.results[0].party) + '</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
        });
        tooltip.append('div').classed('votes', true).html(function (d) {
          return '<span>' + datum.results[0].votes + '</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
        });

        tooltip.append('div').classed('candidatename', true).html(function (d) {
          return '<span>' + titleCase(datum.results[1].candidate) + '</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
        });
        tooltip.append('div').classed('partyname', true).html(function (d) {
          return '<span>' + abbreviate(datum.results[1].party) + '</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
        });
        tooltip.append('div').classed('votes', true).html(function (d) {
          return '<span>' + datum.results[1].votes + '</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
        });

        tooltip.append('div').classed('candidatename', true).html(function (d) {
          if (datum.results[2] === undefined) {
            return '<span class="mobiletoolremove">' + 'N/A' + '</span>';
          } else {
            return '<span class="mobiletoolremove">' + titleCase(datum.results[2].candidate) + '</span>';
          } //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
        });
        tooltip.append('div').classed('partyname', true).html(function (d) {
          if (datum.results[2] === undefined) {
            return '<span class="mobiletoolremove">' + 'N/A' + '</span>';
          } else {
            return '<span class="mobiletoolremove">' + abbreviate(datum.results[2].party) + '</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
          }
        });
        tooltip.append('div').classed('votes', true).html(function (d) {
          if (datum.results[2] === undefined) {
            return '<span class="mobiletoolremove">' + 'N/A' + '</span>';
          } else {
            return '<span class="mobiletoolremove">' + datum.results[2].votes + '</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
          }
        });

        // create the tooltip for na-map
        //createTooltip(tooltip, datum);

        // positioning the tooltip

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

        // d3.selectAll('.voronoi').raise();
      }

      /////////////////////////////////////////////////////
      ////////////// Adding mouse out event ///////////////
      /////////////////////////////////////////////////////


      function activateMouseOut(d, i) {
        // retrieve unique class of voronoi circle catcher
        var unique_class = d3.select(this).attr('class').replace("circle-catcher NAmap ", "");
        // select the circle with the gotten id
        var circle_select = d3.select("circle" + "#" + unique_class);

        // transition the circle back
        circle_select.transition().ease(d3.easeElastic).duration(1200).tween('radius', function (d) {
          var that = d3.select(this);
          var i = d3.interpolate(d.radius, d.radiusInit);
          return function (t) {
            d.radius = i(t);
            that.attr('r', function (d) {
              return d.radius >= 0 ? d.radius : 0;
            });
            //simulation.nodes(nodes)
          };
        }).attr('fill', function (d) {
          return colorScale(d.results[0].party);
        }).attr('stroke', function (d) {
          d3.rgb(colorScale(d.results[0].party));
        }).attr('stroke-width', 0);

        // remove the tooltip
        d3.selectAll('.tool').remove();
      }

      function getCentroid(dist) {
        return centroids.filter(function (d) {
          return d.district == dist;
        })[0].centroid;
      }

      // displaying the election data with results

      na_seats_2018.map(function (d) {
        d["SeconDistrict"] = d["SeconDistrict"] == "" ? [] : d["SeconDistrict"].split(" - ");
      });

      var parties = result.map(function (d) {
        return d.results[0].party;
      });

      // get unique values, see how to use this
      var unique_parties = parties.filter(function (item, i, ar) {
        return ar.indexOf(item) === i;
      });

      /////////////////////////////////////////////////
      ////////////// Legend for parties ///////////////
      /////////////////////////////////////////////////

      var parties_legend = ["Pakistan Tehreek-e-Insaf", "MUTTHIDA MAJLIS-E-AMAL PAKISTAN", "Pakistan Muslim League (N)", "Independent", "Pakistan Muslim League", "Pakistan Peoples Party Parliamentarians", "Grand Democratic Alliance", "Muttahida Qaumi Movement Pakistan", "Balochistan Awami Party", "Other"];
      // define parts abbs and colors
      var parties_legend_abb = parties_legend.map(function (d) {
        return d != "Other" ? abbreviate(d) : "Other";
      });
      var parties_colors = parties_legend.map(function (d) {
        return d != "Other" ? colorScale(d) : "#03A9F4";
      });

      // defining ordinal scale for the legend
      var ordinal = d3.scaleOrdinal().domain(parties_legend_abb).range(parties_colors);

      var party_legend_div = d3.select("#legendcontain").append("div").classed("partyLegendSVGDiv", true);

      party_legend_div.append('p').text('Political Party').style('font-size', '12px').style('text-align', 'center').style('margin-bottom', '-10px');

      var party_legend_svg = party_legend_div.append("svg").classed("partyLegendSVG", true).attr('width', 320).attr('height', 50);

      party_legend_svg.append("g").attr("class", "legendOrdinal").attr("transform", "translate(20,20)");
      //
      var legendOrdinal = d3.legendColor().shapePadding(3).shapeWidth(25).shapeHeight(10).scale(ordinal).orient('horizontal');

      party_legend_svg.select(".legendOrdinal").call(legendOrdinal);

      var VM_legend_div = d3.select("#legendcontain").append("div").classed("VMLegendSVGDiv", true);

      VM_legend_div.append('p').text('Vote Margin').style('font-size', '12px').style('text-align', 'center').style('margin-bottom', '-10px');

      var VM_legend_svg = VM_legend_div.append("svg").classed("VMLegendSVG", true).attr('width', 170).attr('height', 50);

      var circLegDomain = [0, 25, 50, 75, 100];
      var circLegRange = circLegDomain.map(function (d) {
        return getCircleSize(d);
      });
      var circLegDomain = circLegDomain.map(function (d) {
        return d + "%";
      });

      var circLegScale = d3.scaleOrdinal().domain(circLegDomain).range(circLegRange);

      VM_legend_svg.append("g").attr("class", "legendSize").attr("transform", "translate(25, 20)");

      var legendSize = d3.legendSize().scale(circLegScale).shape('circle').shapePadding(20).labelOffset(15).orient('horizontal');

      VM_legend_svg.select(".legendSize").call(legendSize);

      // changing the style of legend text and circles
      d3.selectAll(".VMLegendSVG text").style('font-size', 9);

      d3.selectAll(".VMLegendSVG circle").style('fill', 'none').style('stroke', 'black');
    }

    // creating an array with district centrids
    function distCentroids(distMapData) {
      var centroids = distMapData.map(function (feature) {
        // get district
        var district = feature.properties.districts;
        var object = {};
        // for every entry create object with district and centroid
        object["district"] = district;
        object["centroid"] = path.centroid(feature);
        return object;
      });

      return centroids;
    }

    // keep the preprocessing code in comments

    // preprocessing elections 2013 data:
    // var election_13 = elections_2013.map(function(d){
    //   return {
    //     seat : d.district,
    //     "Percentage of Votes Polled to Registered Voters" : +d['Percentage of Votes Polled to Registered Voters'].replace(' %', ''),
    //     "Registered Votes" : +d['Registered Votes'],
    //     "Votes Polled" : +d['Votes Polled'],
    //     "Valid Votes" : +d['Valid Votes'],
    //     "Rejected Votes" : +d['Rejected Votes'],
    //     "results" : d['results']
    //     .map(function(candidate){
    //       return {
    //         candidate: candidate['candidate'],
    //         party: candidate['party'],
    //         votes: +candidate['votes']
    //       }
    //     }).sort(function(a,b) {
    //       return b.votes - a.votes;
    //     })
    //   };
    //

    d3.select('#barsvg').remove();

    makeSummBar(NA_summary18);
  }

  // call the draw na map function
  drawNAMap();
};
