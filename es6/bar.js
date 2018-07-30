
// summBarG = summBarG
//         .append("g")
//         .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// NAtional assembly summary
var NA_summary = [{"Pakistan Tehreek-e-Insaf":28,"Jamiat Ulama-e-Islam (F)":11,"Other":16,"Pakistan Muslim League (N)":126,"Independent":29,"Pakistan Muslim League":2,"Pakistan Peoples Party Parliamentarians":34,"Pakistan Muslim League (F)":5,"Muttahida Qaumi Movement Pakistan":18}];

var NA_summary08 = [{"Other":19,"Pakistan Peoples Party Parliamentarians":89,"Independent":30,"Pakistan Muslim League (N)":68,"Pakistan Muslim League":38,"Pakistan Muslim League (F)":3,"Muttahida Qaumi Movement Pakistan":19}];

var NA_summary18 = [{"Other":6,"Pakistan Peoples Party Parliamentarians":43,"Independent":13,"Pakistan Muslim League (N)":64,"Pakistan Muslim League":4,"Grand Democratic Alliance":2,"Muttahida Qaumi Movement Pakistan":6,"Pakistan Tehreek-e-Insaf":116, "Muttahida Majlis-e-Amal Pakistan":12, "Balochistan Awami Party":4}];

// Provincial assembly summary
// KP
var PK_summary = [{"Pakistan Tehreek-e-Insaf":35,"Pakistan Muslim League (N)":12,"Jamiat Ulama-e-Islam (F)":13,"Other":22,"Independent":14,"Pakistan Peoples Party Parliamentarians":3}];
// Punjab
var PP_summary = [{"Pakistan Muslim League (N)":214,"Independent":41,"Pakistan Tehreek-e-Insaf":20,"Pakistan Muslim League":7,"Other":5,"Jamiat Ulama-e-Islam (F)":1,"Pakistan Peoples Party Parliamentarians":6}];
// balochistan
var PB_summary = [{"Pakistan Muslim League (N)":9,"Other":22,"Independent":8,"Pakistan Muslim League":5,"Jamiat Ulama-e-Islam (F)":6}];
// Sindh
var PS_summary = [{"Muttahida Qaumi Movement Pakistan":37,"Pakistan Peoples Party Parliamentarians":69,"Pakistan Muslim League (F)":7,"Pakistan Muslim League (N)":4,"Other":2,"Pakistan Muslim League":1,"Independent":5,"Pakistan Tehreek-e-Insaf":3}];

// keysSorted = Object.keys(list).sort(function(a,b){return list[a]-list[b]})



function makeSummBar(result){

  var width = "100%"
  var height = 55

  // listing the winning parties
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

  var bar_height = 20;
  var text_size = 14;
  // defining categorical color scale for parties
  var colorScale = d3.scaleOrdinal()
                     .domain(parties)
                     .range(party_colors);

  // defining the stack layout
  var stack = d3.stack()
                .order(d3.stackOrderDescending);

  // keys as in Parties
  var keys = d3.keys(result[0]);
  stack.keys(keys);

  var stacked_data = stack(result);
  stacked_data = stacked_data.sort(function(a, b){
    return (b[0][1] - b[0][0]) - (a[0][1] - a[0][0]);
  })

  var majority_party = stacked_data[0].key;
  var majority_seats = stacked_data[0][0][1] - stacked_data[0][0][0];

  d3.select('#majorityVote')
    .style('width', '100%')
    .style('margin-top', '30px')
    .html(function(){
      return '<p style="text-align: center; font-size: 25px; color: #607D8B;">MAJORITY</p>';
    })

  d3.select('#majorityVote')
    .append('div')
    .style('display', 'flex')
    .style('justify-content', 'center')
    .style('margin-bottom', '10px')
    .append('div')
    .style('display', 'flex')
    .attr('id', 'majorityInfo')

  d3.select('#majorityInfo')
    .append('div')
    .attr('id', 'infoPict')
    .html(image(majority_party));

  d3.select('#majorityInfo')
    .append('div')
    .attr('id', 'infoText')
    .html(function(){
      return '<p>' + majority_party + '</p><p style="margin: 0px">' + majority_seats + ' seats won</p>';
    });

  var summBarG = d3.select("#barcontain").append("svg").attr("width", width)
          .attr("height", height)
          .attr('id', 'barsvg')
          .attr("preserveAspectRatio", "none");

  var max_seats = d3.max(stack(result).map(d => d[0][1]));

  var seat_scale = d3.scaleLinear()
                      .domain([0, max_seats])
                      .range([0, 100])

  var parties_legend = [
        "Pakistan Tehreek-e-Insaf",
        "Jamiat Ulama-e-Islam (F)",
        "Pakistan Muslim League (N)",
        "Independent",
        "Pakistan Muslim League",
        "Pakistan Peoples Party Parliamentarians",
        "Pakistan Muslim League (F)",
        "Muttahida Qaumi Movement Pakistan",
        "Other"
      ];
  // define parts abbs and colors
  var parties_legend_abb = parties_legend.map(d => (d != "Other" ? abbreviate(d) : "Other"))
  var parties_colors = parties_legend.map(d => (d != "Other" ? colorScale(d) : "#03A9F4"))


  // defining ordinal scale for the legend
  var ordinal = d3.scaleOrdinal()
                  .domain(parties_legend_abb)
                  .range(parties_colors);


  summBarG.selectAll('rect')
    .data(stacked_data)
    .enter()
    .append('rect')
    .attr('x', d=> seat_scale(d[0][0]) + "%")
    .attr('y', 5)
    .attr('width', d => seat_scale(d[0][1] - d[0][0]) + "%")
    .attr('height', bar_height)
    .style('fill', d => ordinal(abbreviate(d.key)))
    .attr('class', d => d.key)
    .on('mouseover', function(d, i){
      d3.select('body').append('div')
        .classed('chordtool', true)
        .classed('animated', true)
        .classed('fadeIn', true)
        .attr('id', 'hoverbox')

        var seats = d[0][1] - d[0][0];

        d3.select('.chordtool')
          .append('div')
          .classed('party', true)
          .html(function(){
            return '<span style="padding: 2px;">' + d.key + ' won ' + seats + (seats > 1 ? " seats" : " seat") + '</span>' //+ ' vs ' + d.results[1].party + " ("+d.PrimaryDistrict+ " "+ d.seat +")";
          })
        d3.select('.chordtool')
          .append('div')
          .classed('cpartyicon', true)
          .html(image(d.key));

          var hoverbox = document.getElementById('hoverbox');
          d3.select('.chordtool').style('top', d3.event.pageY - hoverbox.offsetHeight - 18 + "px");

          if (window.innerWidth < 450) {
            d3.select('.chordtool').style('left', window.innerWidth/2 - hoverbox.offsetWidth/2 + "px");
          }
          else {
            if (d3.event.pageX < window.innerWidth/2) {
              d3.select('.chordtool').style('left', d3.event.pageX + 4 + "px");
            }
            else {
              d3.select('.chordtool').style('left', d3.event.pageX - hoverbox.offsetWidth - 8 + "px");
            }
          }
    })
    .on('mouseout', function(d, i){
      d3.select(".chordtool").remove();
    });

  // summBarG.append('rect')
  //     .attr('x', 0)
  //     .attr('y', 5)
  //     .attr('width', d => seat_scale(max_seats) + "%")
  //     .attr('height', bar_height)
  //     .style('fill', 'none')
  //     .style('stroke', 'black')
  //     .style('stroke-width', 2);


  summBarG.selectAll("text")
      .data(stacked_data)
      .enter()
      .append('text')
      .attr('x', d=> seat_scale(d[0][0]) + "%")
      .attr('y', 5 + bar_height + 2 + text_size)
      .style('font-size', text_size + "px")
      .text(d => ((d[0][1] - d[0][0])/ max_seats > 0.03) ? d[0][1] - d[0][0] : "")
}
