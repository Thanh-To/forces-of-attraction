// eslint-disable-next-line no-unused-vars
class BarChart {
  constructor(_config, _data, _attribute, _selectedLabel, _selectedGender) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 500,
      containerHeight: 440,
      margin: {
        top: 90, right: 20, bottom: 20, left: 160,
      },
      // TODO: Margin is super large to accomodate super large labels
    };
    this.data = _data;
    this.attribute = _attribute;
    this.selectedLabel = _selectedLabel;
    this.selectedGender = _selectedGender;
    this.initVis();
  }

  initVis() {
    const vis = this;

    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append('svg')
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart
    // and position it according to the given margin config
    vis.chartArea = vis.svg.append('g')
      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
    vis.chart = vis.chartArea.append('g');

    // init scales
    vis.xScale = d3.scaleLinear()
      .range([0, vis.width]);
    vis.yScale = d3.scaleBand()
      .range([0, vis.height])
      .paddingInner(0.2);

    // init axes
    vis.xAxis = d3.axisBottom(vis.xScale)
      .ticks(10)
      .tickSizeOuter(0)
      .tickFormat(d3.format('.0%'));
    vis.yAxis = d3.axisLeft(vis.yScale);

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chartArea.append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0,${vis.height})`);

    // Append y-axis group
    vis.yAxisG = vis.chartArea.append('g')
      .attr('class', 'axis y-axis');

    // Append axis title
    vis.axisTitle = vis.svg.append('text')
      .attr('class', 'chart-title')
      .attr('x', 0)
      .attr('y', 0)
      .attr('dy', '.80em')
      .text(`Prob. of ${vis.selectedGender} ${vis.selectedLabel} matching with another person`);
  }

  updateVis() {
    const vis = this;

    vis.barData = [];
    if (vis.attribute === 'age') {
      for (let i = 18; i <= 45; i += 1) {
        vis.barData.push({
          row: i - 17,
          rowLabel: getLabel(vis.attribute, i),
          value: vis.data[getCode(vis.attribute, vis.selectedLabel)][i],
        });
      }
    } else {
      for (let i = 1; i < vis.data.length; i += 1) {
        vis.barData.push({
          row: i,
          rowLabel: getLabel(vis.attribute, i),
          value: vis.data[getCode(vis.attribute, vis.selectedLabel)][i],
        });
      }
    }

    // Add bar for any match probability
    vis.barData.push({
      row: vis.barData.length,
      rowLabel: 'Total',
      value: vis.data[getCode(vis.attribute, vis.selectedLabel)][vis.data.length] === 0
        ? 0 : (1 - vis.data[getCode(vis.attribute, vis.selectedLabel)][vis.data.length]),
    });

    vis.xValue = (d) => d.value;
    vis.yValue = (d) => d.rowLabel;

    vis.xScale.domain([0, 0.2]);
    vis.yScale.domain(vis.barData.map(vis.yValue));

    vis.renderVis();
  }

  renderVis() {
    const vis = this;

    vis.bars = vis.chart.selectAll('.bar')
      .data(vis.barData, vis.yValue)
      .join('rect')
      .attr('class', 'bar')
      .attr('y', (d) => vis.yScale(vis.yValue(d)))
      .attr('width', (d) => vis.xScale(vis.xValue(d)))
      .attr('height', vis.yScale.bandwidth())
      .attr('fill', 'green')
      .on('mouseover', (e, d) => {
        d3.select('#tooltip')
          .style('display', 'block')
          .style('left', `${e.pageX}px`)
          .style('top', `${e.pageY}px`)
          .html(vis.generateHtml(d));
      }).on('mouseout', (_, __) => {
        d3.select('#tooltip').style('display', 'none');
      });

      vis.bars.transition().duration(1000);

    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis)
      .selectAll('text')
      .attr('y', 0)
      .attr('x', -5)
      .style('text-anchor', 'end');

    vis.axisTitle.text(`Prob. of ${vis.selectedGender} ${vis.selectedLabel} matching with another person`); // https://stackoverflow.com/a/36707865
  }

  chooseAlternateMatchType(d) {
    let vis = this;
    const gender = getOtherGender(vis.selectedGender);
    if (d.rowLabel === 'Total') {
      return `any ${gender}`
    } else {
      return `${gender} ${d.rowLabel}`
    }
  }

  generateHtml(d) {
    let vis = this;
    if (vis.attribute === 'field_cd') {
      return `<div> A <strong>${vis.selectedGender} ${vis.selectedLabel} student </strong>has a <strong>${d3.format('.0%')(d.value)}</strong> chance of matching with <strong>${vis.chooseAlternateMatchType(d)} student</strong></div>`;
    } else if (vis.attribute === 'age'){
      return `<div> A <strong>${vis.selectedGender} ${vis.selectedLabel} year old </strong> has a <strong>${d3.format('.0%')(d.value)}</strong> chance of matching with <strong>${vis.chooseAlternateMatchType(d)} year old</strong></div>`;
    } else {
      return `<div> A <strong>${vis.selectedGender} ${vis.selectedLabel}</strong> has a <strong>${d3.format('.0%')(d.value)}</strong> chance of matching with <strong>${vis.chooseAlternateMatchType(d)}</strong></div>`;
    }
  }
}
