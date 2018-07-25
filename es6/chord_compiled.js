"use strict";

// processing 2008 elections data
// var election_08 = elections_2008.map(function(d){
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
// })
//
// console.log(JSON.stringify(election_08));

function createChord() {
  function removeAllDisplay() {
    // remove all contents of viz
    d3.select("#vizcontain").selectAll('*').remove();

    // remove all contents of legend
    d3.select("#legendcontain").selectAll('*').remove();

    d3.select('#barsvg').remove();

    d3.select("#majorityVote").selectAll('*').remove();
  }

  removeAllDisplay();

  d3.csv('./essentials/one_one_mapping.csv', function (error, one_one_map) {

    function getWinParty(seat, year) {
      var data = year == 2013 ? elections_2013 : elections_2008;
      var filtered_by_seat = data.filter(function (d) {
        return d.seat == seat;
      })[0];
      return filtered_by_seat != null ? filtered_by_seat.results[0].party : null;
    }

    one_one_map.map(function (d) {
      d.party_2008 = getWinParty(d['2008'], 2008);
      d.party_2013 = getWinParty(d['2013'], 2013);
      d.party_2008_abb = abbreviate(getWinParty(d['2008'], 2008));
      d.party_2013_abb = abbreviate(getWinParty(d['2013'], 2013));
    });

    d3.selectAll("#PA, #NA, #dwvs, #flow").attr('disabled', null);

    // console.log(one_one_map);
    // one_one_map = one_one_map.filter(d => d.party_2008 !=null && d.party_2013!=null);
    // console.log(one_one_map);
    // console.log(one_one_map.filter(function(d){ return d.party_2008_abb == 'Other'}));


    // removing Others/ nulls from data
    one_one_map = one_one_map.filter(function (d) {
      return d.party_2008_abb != 'Other' && d.party_2013_abb != 'Other';
    });

    var party_abbs_2013 = one_one_map.map(function (d) {
      return d.party_2013_abb;
    }).filter(unique);
    var party_abbs_2008 = one_one_map.map(function (d) {
      return d.party_2008_abb;
    }).filter(unique);

    function unique(entry, index, self) {
      return self.indexOf(entry) == index;
    }

    var party_abbs = party_abbs_2008.concat(party_abbs_2013);
    party_abbs = party_abbs.filter(unique);

    var party_matrix = [];
    party_abbs.forEach(function (party2013) {
      var matrix_array = [];
      party_abbs.forEach(function (party2008) {
        var evalvar = one_one_map.filter(function (d) {
          return d.party_2013_abb == party2013 && d.party_2008_abb == party2008;
        }).length;
        //console.log(party2013, ", ",party2008, " ", evalvar);
        matrix_array.push(evalvar);
      });
      party_matrix.push(matrix_array);
    });

    //console.log(party_matrix);

    // now comes in the chord diagram code adpated from mike bostocks block

    var matrix = [[11975, 5871, 8916, 2868], [1951, 10048, 2060, 6171], [8010, 16145, 8090, 8045], [1013, 990, 940, 6907]];

    var width = 540,
        height = 540;

    var svg = d3.select("#vizcontain").append("svg").attr("width", width).attr("height", height).attr('viewBox', "0 0 540 540").attr('perserveAspectRatio', "xMinYMid").attr('id', 'chorddiagram').classed('animated', true).classed('fadeInDefault', true),
        outerRadius = Math.min(width, height) * 0.5 - 50,
        innerRadius = outerRadius - 15;

    var formatValue = d3.formatPrefix(",.0", 1e3);

    var chord = d3.chord().padAngle(0.025).sortSubgroups(d3.ascending);

    var arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

    var ribbon = d3.ribbon().radius(innerRadius);

    var color = d3.scaleOrdinal(d3.schemeCategory20);
    // .domain(d3.range(4))
    // .range(["#000000", "#FFDD89", "#957244", "#F26223"]);

    var g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")").datum(chord(party_matrix));

    var group = g.append("g").attr("class", "groups").attr("id", "chordgroup").selectAll("g").data(function (chords) {
      return chords.groups;
    }).enter().append("g").attr('class', function (d, i) {
      return party_abbs[i];
    }).classed('party_holders', true);

    group.append('text').each(function (d) {
      d.angle = (d.startAngle + d.endAngle) / 2;
    })
    //.data(d => d)
    .text(function (d, i) {
      return party_abbs[i];
    }).classed("party_label", true).attr('transform', function (d, i) {
      return 'rotate(' + (radians_to_degrees(d.angle / 2) - 90) + ')' + 'rotate(' + (d.angle > Math.PI ? -find_text_rot('.party_label') : find_text_rot('.party_label')) + ')' + 'translate(' + (outerRadius + 10) + ') ' + (d.angle > Math.PI ? "rotate(180)" : "");
    }).attr('text-anchor', function (d) {
      return d.angle > Math.PI ? "end" : null;
    });

    group.append("path").style("fill", function (d) {
      return color(d.index);
    }).style("stroke", function (d) {
      return d3.rgb(color(d.index)).darker();
    }).attr("d", arc);

    // var groupTick = group.selectAll(".group-tick")
    //   .data(function(d) { return groupTicks(d, 1e3); })
    //   .enter().append("g")
    //     .attr("class", "group-tick")
    //     .attr("transform", function(d) { return "rotate(" + (d.angle * 180 / Math.PI - 90) + ") translate(" + outerRadius + ",0)"; });
    //
    // groupTick.append("line")
    //     .attr("x2", 6);
    //
    // groupTick
    //   .filter(function(d) { return d.value % 5e3 === 0; })
    //   .append("text")
    //     .attr("x", 8)
    //     .attr("dy", ".35em")
    //     .attr("transform", function(d) { return d.angle > Math.PI ? "rotate(180) translate(-16)" : null; })
    //     .style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
    //     .text(function(d) { return formatValue(d.value); });

    g.append("g").attr("class", "ribbons").selectAll("path").data(function (chords) {
      return chords;
    }).enter().append("path").attr("d", ribbon).style("fill", function (d) {
      return color(d.source.index);
    }).style("stroke", function (d) {
      return d3.rgb(color(d.source.index)).darker();
    }).style('fill-opacity', 0.7).style('stroke-opacity', 0.7);

    //console.log(d3.select('.ribbons').data());

    // // Returns an array of tick angles and values for a given group and step.
    // function groupTicks(d, step) {
    //   var k = (d.endAngle - d.startAngle) / d.value;
    //   return d3.range(0, d.value, step).map(function(value) {
    //     return {value: value, angle: value * k + d.startAngle};
    //   });
    // }

    // here ends the code for chord from mike bostocks block


    function find_text_rot(text_class) {
      var font_size = d3.select(text_class).style('font-size').replace("px", "");
      return font_size / 2 / (outerRadius * 2 * Math.PI) * 360;
    }

    function fade_group(opacity, add_title) {
      return function (d, i) {
        // console.log(d3.select("g.ribbons").selectAll("path").data());
        // console.log(d3.select("g.ribbons").data());
        d3.select("g.ribbons").selectAll("path").filter(function (rib) {
          return rib.source.index !== i && rib.target.index !== i;
        }).transition().style("fill-opacity", opacity).style("stroke-opacity", opacity);
        // remove transparency of little groups when mouse is hovered
        if (add_title) {
          d3.select('body').append('div').classed('chordtool', true).classed('animated', true).classed('fadeIn', true).attr('id', 'hoverbox');

          if (d3.event.pageY > window.innerHeight - 250) {
            var hoverbox = document.getElementById('hoverbox');
            d3.select('.chordtool').style('top', d3.event.pageY - hoverbox.offsetHeight - 50 + "px");
            if (d3.event.pageX - 87.5 < 0) {
              d3.select('.chordtool').style('left', d3.event.pageX + 4 + "px");
            } else if (d3.event.pageX + 87.5 > window.innerWidth) {
              d3.select('.chordtool').style('left', d3.event.pageX - 175 + "px");
            } else {
              d3.select('.chordtool').style('left', d3.event.pageX - 87.5 + "px");
            }
          } else {
            d3.select('.chordtool').style('top', d3.event.pageY + 10 + "px");
            if (d3.event.pageX - 87.5 < 0) {
              d3.select('.chordtool').style('left', d3.event.pageX + 4 + "px");
            } else if (d3.event.pageX + 87.5 > window.innerWidth) {
              d3.select('.chordtool').style('left', d3.event.pageX - 175 + "px");
            } else {
              d3.select('.chordtool').style('left', d3.event.pageX - 87.5 + "px");
            }
          }

          d3.select('.chordtool').append('div').classed('party', true).html(function () {
            return '<span>' + party_abbs[d.index] + ' - ' + d.value + ' seats' + '</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
          });

          d3.select('.chordtool').append('div').classed('cpartyicon', true).html(function () {
            return returnIntikhabiNishaan(party_abbs[d.index]);
          });
        } else {
          d3.select(".chordtool").remove();
        }
      };
    }

    // Fade function when hovering over chord
    function fadeOnChord(opac1, opac2, add_title) {
      return function (d) {
        var chosen = d;
        d3.select("g.ribbons").selectAll("path").transition().style("fill-opacity", function (d) {
          return d.source.index === chosen.source.index && d.target.index === chosen.target.index ? opac1 : opac2;
        }).style("stroke-opacity", function (d) {
          return d.source.index === chosen.source.index && d.target.index === chosen.target.index ? opac1 : opac2;
        });

        var selected_ribbon = d3.select(this).data()[0];

        var gained = selected_ribbon.source.value;
        var lost = selected_ribbon.target.value;

        if (add_title) {

          if (selected_ribbon.source.index == selected_ribbon.target.index) {
            d3.select('body').append('div').classed('chordtool', true).classed('animated', true).classed('fadeIn', true).attr('id', 'hoverbox');

            if (d3.event.pageY > window.innerHeight - 250) {
              var hoverbox = document.getElementById('hoverbox');
              d3.select('.chordtool').style('top', d3.event.pageY - hoverbox.offsetHeight - 50 + "px");
              if (d3.event.pageX - 87.5 < 0) {
                d3.select('.chordtool').style('left', d3.event.pageX + 4 + "px");
              } else if (d3.event.pageX + 87.5 > window.innerWidth) {
                d3.select('.chordtool').style('left', d3.event.pageX - 175 + "px");
              } else {
                d3.select('.chordtool').style('left', d3.event.pageX - 87.5 + "px");
              }
            } else {
              d3.select('.chordtool').style('top', d3.event.pageY + 10 + "px");
              if (d3.event.pageX - 87.5 < 0) {
                d3.select('.chordtool').style('left', d3.event.pageX + 4 + "px");
              } else if (d3.event.pageX + 87.5 > window.innerWidth) {
                d3.select('.chordtool').style('left', d3.event.pageX - 175 + "px");
              } else {
                d3.select('.chordtool').style('left', d3.event.pageX - 87.5 + "px");
              }
            }

            d3.select('.chordtool').append('div').classed('party', true).html(function () {
              return '<span style="padding: 2px;">' + party_abbs[d.source.index] + ' retained ' + gained + (gained > 1 ? " seats" : " seat") + '</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
            });
            d3.select('.chordtool').append('div').classed('cpartyicon', true).html(function () {
              return returnIntikhabiNishaan(party_abbs[d.source.index]);
            });
          } else {
            d3.select('body').append('div').classed('chordtoolexpand', true).classed('animated', true).classed('fadeIn', true).attr('id', 'hoverbox');

            var full = document.getElementById('chorddiagram').getBoundingClientRect().x + document.getElementById('chorddiagram').getBoundingClientRect().width;
            var half = full / 2;
            var midfactor = (document.getElementById('chorddiagram').getBoundingClientRect().width - 250) / 2;

            if (d3.event.pageY > window.innerHeight - 250) {
              var hoverbox = document.getElementById('hoverbox');
              d3.select('.chordtoolexpand').style('top', d3.event.pageY - hoverbox.offsetHeight - 130 + "px");
              if (d3.event.pageX - 125 < 0) {
                d3.select('.chordtoolexpand').style('left', d3.event.pageX - 125 - (d3.event.pageX - 125) + 5 + "px");
              } else if (d3.event.pageX + 125 > window.innerWidth) {
                d3.select('.chordtoolexpand').style('right', 15 + "px");
              } else {
                d3.select('.chordtoolexpand').style('left', d3.event.pageX - 125 + "px");
              }
            } else {
              console.log('goodbye');
              d3.select('.chordtoolexpand').style('top', d3.event.pageY + 10 + "px");
              if (d3.event.pageX - 125 < 0) {
                d3.select('.chordtoolexpand').style('left', d3.event.pageX - 125 - (d3.event.pageX - 125) + 5 + "px");
              } else if (d3.event.pageX + 125 > window.innerWidth) {
                d3.select('.chordtoolexpand').style('right', 15 + "px");
              } else {
                d3.select('.chordtoolexpand').style('left', d3.event.pageX - 125 + "px");
              }
            }

            d3.select('.chordtoolexpand').append('div').classed('cpartyicon', true).classed('vsparty', true).attr('id', 'winnericon').html(function () {
              return returnIntikhabiNishaan(party_abbs[d.source.index]);
            });

            setTimeout(function () {
              $('#winnericon').css('padding', '4px');
            }, 100);

            d3.select('.chordtoolexpand').append('div').classed('chordtoolheading', true).html(function () {
              return '<span>Flow between ' + party_abbs[d.source.index] + " & " + party_abbs[d.target.index] + '</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
            });

            d3.select('.chordtoolexpand').append('div').classed('cpartyicon', true).classed('vsparty', true).html(function () {
              return returnIntikhabiNishaan(party_abbs[d.target.index]);
            });

            d3.select('.chordtoolexpand').append('div').classed('chordexpandicon', true).html(function () {
              return '<img src="./resources/up-chevron-button.svg" style="width: 100%;">'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
            });

            d3.select('.chordtoolexpand').append('div').classed('chordexpandinfo', true).html(function () {
              return '<span>' + party_abbs[d.source.index] + " gained " + gained + (gained > 1 ? " seats" : " seat") + " from " + party_abbs[d.target.index] + '</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
            });

            d3.select('.chordtoolexpand').append('div').classed('chordexpandicon', true).html(function () {
              return '<img src="./resources/chevron-sign-down.svg" style="width: 100%;">'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
            });

            d3.select('.chordtoolexpand').append('div').classed('chordexpandinfo', true).html(function () {
              return '<span>' + party_abbs[d.source.index] + " lost " + lost + (lost > 1 ? " seats" : " seat") + " to " + party_abbs[d.target.index] + '</span>'; //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
            });

            /*      d3.select(this).append("title").append('tspan')
                    .text(function(d){
                      return party_abbs[d.source.index] + " gained from " + party_abbs[d.target.index] + " - " + gained + (gained > 1 ? " seats | " : " seat | " )
                    })
                   d3.select(this).select("title").append('tspan')
                    .text(function(d){
                      return party_abbs[d.source.index] + " lost from " + party_abbs[d.target.index] + " - " + lost + (lost > 1 ? " seats" : " seat");
                    }) */
          }
        } else {
          d3.select(".chordtool").remove();
          d3.select(".chordtoolexpand").remove();
        }
      };
    }

    d3.selectAll('.party_holders').on("mouseover", fade_group(0.05, 1)).on("mouseout", fade_group(0.70, 0));

    d3.select("g.ribbons").selectAll("path").on("mouseover", fadeOnChord(0.70, 0, 1)).on("mouseout", fadeOnChord(0.70, 0.70, 0));
  });

  function returnIntikhabiNishaan(party) {
    switch (party) {
      case "PTI":
        return '<img src="./resources/partylogos/bat.svg"></img>';
        break;
      case "PML-N":
        return '<img src="./resources/partylogos/tiger.svg"></img>';
        break;
      case "MQM":
        return '<img src="./resources/partylogos/kite.svg"></img>';
        break;
      case "PPPP":
        return '<img style="transform: rotate(45deg); -ms-transform: rotate(45deg); -webkit-transform: rotate(45deg);" src="./resources/partylogos/arrow.svg"></img>';
        break;
      case "APML":
        return '<img src="./resources/partylogos/eagle.svg"></img>';
        break;
      case "PML":
        return '<img src="./resources/partylogos/bicycle.svg"></img>';
        break;
      case "PML-F":
        return '<img src="./resources/partylogos/rose.svg"></img>';
        break;
      case "JUI-F":
        return '<img style="width: 100%;" src="./resources/partylogos/book.svg"></img>';
        break;
      case "JI":
        return '<img style="width: 100%;" src="./resources/partylogos/balance.svg"></img>';
        break;
      case "PML-Z":
        return '<img style="width: 100%;" src="./resources/partylogos/helicopter.svg"></img>';
        break;
      case "Ind.":
        return '<img style="width: 100%;" src="./resources/partylogos/ind.png"></img>';
        break;
      default:
        return '<img style="width: 90%;" src="./resources/ballot1.svg"></img>';
        break;
    }
  }

  function abbreviate(party) {
    switch (party) {
      case "Pakistan Tehreek-e-Insaf":
        return 'PTI';
        break;
      case "Jamiat Ulama-e-Islam (F)":
        return 'JUI-F';
        break;
      case "Qaumi Watan Party (Sherpao)":
        return 'QWP-S';
        break;
      case "Awami National Party":
        return 'ANP';
        break;
      case "Awami Jamhuri Ittehad Pakistan":
        return 'AJIP';
        break;
      case "Pakistan Muslim League (N)":
        return 'PML-N';
        break;
      case "Independent":
        return 'Ind.';
        break;
      case "Jamaat-e-Islami Pakistan":
        return 'JI';
        break;
      case "All Pakistan Muslim League":
        return 'APML';
        break;
      case "Awami Muslim League Pakistan":
        return 'AMLP';
        break;
      case "Pakistan Muslim League":
        return 'PML';
        break;
      case "Pakistan Muslim League(Z)":
        return 'PML-Z';
        break;
      case "Pakistan Peoples Party Parliamentarians":
        return 'PPPP';
        break;
      case "National Peoples Party":
        return 'NPP';
        break;
      case "Pakistan Muslim League (F)":
        return 'PML-F';
        break;
      case "Muttahida Qaumi Movement Pakistan":
        return 'MQM';
        break;
      case "Pashtoonkhwa Milli Awami Party":
        return 'PMAP';
        break;
      case "National Party":
        return 'NP';
        break;
      case "Balochistan National Party":
        return 'BNP';
        break;
      case "Sindh United Party":
        return 'SUP';
        break;
      case "MUTAHIDA DEENI MAHAZ":
        return 'MDM';
        break;
      case "Pakistan Peoples Party (Shaheed Bhutto)":
        return 'PPP-SB';
        break;
      case "Jamiat Ulama-e-Pakistan (Noorani)":
        return 'JUP-N';
        break;
      case "Tehreek-e-Suba Hazara":
        return 'TSH';
        break;
      case "Pakistan Sunni Tehreek":
        return 'PST';
        break;
      case "Bahawalpur National Awami Party":
        return 'BNA';
        break;
      case "Jumiat Ulma-e-Islam(Nazryati)":
        return 'JUI-N';
        break;
      case "Qomi Awami Tehreek":
        return 'QAT';
        break;
      case "Majlis-e-Wahdat-e-Muslimeen Pakistan":
        return 'MWM';
        break;
      case "Pakistan National Muslim League":
        return 'PNML';
        break;
      case "Pakistan Muslim League (J)":
        return 'PNML';
        break;
      case "Sunni Ittehad Council":
        return 'SIC';
        break;
      case "Sindh Taraqi Passand Party (STP)":
        return 'STP';
        break;
      case "Balochistan National Party (Awami)":
        return 'BNP-A';
        break;
      case "MUTTHIDA MAJLIS-E-AMAL PAKISTAN":
        return 'MMA';
        break;
      default:
        return 'Other';
    }
  }

  function radians_to_degrees(rad) {
    return rad * (360 / Math.PI);
  }
}
