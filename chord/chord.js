function zoomer(svgg) {
    function zoomed({ transform }) {
      svgg.attr("transform", `${transform}`);
    }
    return zoomed;
  }

function chord(labelFile, matrixFile) {
    var clicked = false;
    const svg = d3.select("svg");
    const chart = d3.select("#chart");
    const width = chart.node().clientWidth;
    const height = 0.95 * window.innerHeight;
    svg
      .attr("viewBox", [0, 0, width, height])
      .attr("height", height)
      .attr("width", 0.99 * width);
  
    const outerRadius = Math.min(width, height) * 0.6 - 10,
      innerRadius = outerRadius - 30;
  
    const search = d3.select("#search");
  
    const ribbonOpacity = (d) => {
      return Math.sqrt(d.source.value + d.target.value);
    };
  
    const mainG = svg.append("g");
  
    svg.call(
      d3
        .zoom()
        .extent([
          [0, 0],
          [chart.node().clientWidth, 0.9 * window.innerHeight],
        ])
        .scaleExtent([0.8, 4])
        .on("zoom", zoomer(mainG))
    );
    mainG.selectAll("*").remove();
  
    const chord = d3.chord().padAngle(0.05).sortSubgroups(d3.descending);
  
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
  
    const ribbon = d3.ribbon().radius(innerRadius);
  
    d3.csv(labelFile).then((audienceInfo) => {
      d3.json(matrixFile).then((matrix) => {
        const names = audienceInfo.map((d) => d.name);
  
        const color = d3
          .scaleOrdinal()
          .domain(names)
          .range(d3.schemePaired);
  
        const restore = () => {
          ribbons.style("opacity", ribbonOpacity);
          ticks.style("opacity", 1.0);
          clicked = false;
        };
  
        d3.select("#goback").on("click", restore);
  
        svg.on("click", () => {
          if (clicked) {
            restore();
          }
        });
  
        const g = mainG
          .append("g")
          .attr(
            "transform",
            "translate(" + width / 2 + "," + height / 2 + ") scale(0.7)"
          )
  
          .datum(chord(matrix));
        const group = g
          .append("g")
          .attr("class", "groups")
          .selectAll("g")
          .data(function (chords) {
            return chords.groups;
          })
          .enter()
          .append("g")
          .attr("class", "innerG")
          .on("click", (e, d, i) => {
            ribbonTickToggler(ribbons, ticks)(e, d, i);
            e.stopPropagation();
          })
          .attr("d", arc);
  
        group
          .append("path")
          .style("fill", function (d) {
            return color(d.index);
          })
          .style("stroke", function (d) {
            return d3.rgb(color(d.index)).darker();
          })
          .attr("d", arc);
  
        const groupTick = group
          .selectAll(".group-tick")
          .data(function (d, i) {
            return groupTicks(d, 1, i);
          })
          .enter()
          .append("g")
          .attr("class", "group-tick")
          .attr("transform", function (d) {
            return (
              "rotate(" +
              ((d.angle * 180) / Math.PI - 90) +
              ") translate(" +
              outerRadius +
              ",0)"
            );
          });
  
        groupTick.append("line").attr("x2", 6);
        groupTick
          .append("text")
          .attr("x", 8)
          .attr("dy", ".35em")
          .attr("transform", function (d) {
            return d.angle > Math.PI ? "rotate(180) translate(-16)" : null;
          })
          .style("text-anchor", function (d) {
            return d.angle > Math.PI ? "end" : null;
          })
          .text((d) => names[d.index]);
  
        const ticks = groupTick;
  
        const ribbons = g
          .append("g")
          .attr("class", "ribbons")
          .selectAll("path")
          .data(function (chords) {
            return chords;
          })
          .enter()
          .append("path")
          .attr("d", ribbon)
          .style("fill", function (d) {
            return color(d.target.index);
          })
          .style("stroke", function (d) {
            return d3.rgb(color(d.target.index)).darker();
          })
          .style("opacity", ribbonOpacity);

  
        function ribbonTickToggler(ribs, ticks) {
          return function click(event, dd) {
            // Activate the ribbons into/outo
  
            var hidden = (d) =>
              d.source.index != dd.index && d.target.index != dd.index;
            ribs.filter((d) => hidden(d)).style("opacity", 0);
            var notHidden = ribs.filter((d) => !hidden(d));
            notHidden.style("opacity", 1);
  
            // Find the tick labels to show and hide
            const source = ribs.filter((d) => d.source.index == dd.index);
            const target = ribs.filter((d) => d.target.index == dd.index);
            const targets = source.data().map((d) => d.target.index);
            const sources = target.data().map((d) => d.source.index);
            const all = sources.concat(targets);
  
            clicked = dd;
 
            function toHide(d) {
              var show1 = d.index == dd.index;
              var show2 = all.includes(d.index);
              return !show1 && !show2;
            }
  
            ticks.style("opacity", (d) => {
              return toHide(d) ? 0.3 : 1.0;
            });
          };
        }
      });
    });
  
    function groupTicks(d, step, ind) {
      var k = (d.endAngle - d.startAngle) / d.value;
      return d3.range(0, d.value, step).map((value, i) => {
        return {
          index: ind,
          value: value,
          angle: d.startAngle + (d.endAngle - d.startAngle) / 2,
        };
      });
    }
  }
  