// FORCING PARAMETERS
// TODO: these should probably be proportioned to the vis dimensions
const NODE_REPEL_STRENGTH = 0;
const NODE_LIKE_DISTANCE_FACTOR = 50;
const NODE_MATCH_DISTANCE_FACTOR = 250;

// Default attraction attribute key
const DEFAULT_DISTANCE = 'like';

/*
    A force-directed simulation view representing unique participants
    as nodes, and allowing a user to interactively control forcing
    between the nodes based on different features in the dataset.
*/
// eslint-disable-next-line no-unused-vars
class ForceDirectedGraph extends View {
  initVis() {
    super.initVis();
    const vis = this;

    // Static elements for simulation
    vis.distance = DEFAULT_DISTANCE;
    vis.graph = d3.forceSimulation();
    vis.repel = d3.forceManyBody().strength(-NODE_REPEL_STRENGTH);
    vis.graph.force('charge', vis.repel);
    vis.linkForce = d3.forceLink().id((d) => d.id);
    vis.graph.force('link', vis.linkForce);

    // a categorical color scale
    vis.colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    vis.updateVis();
  }

  // Set the forcing/attraction attribute
  // TODO: could be converted to an enum
  setNodeDistance(dist) {
    if (dist === 'like' || dist === 'match') {
      this.distance = dist;
    }
  }

  // Based on the current attraction attribute, produce
  // the actual link distance
  nodeDistance() {
    switch (this.distance) {
      case 'like':
        return (l) => (10 - l.like) * NODE_LIKE_DISTANCE_FACTOR;
      case 'match':
      default:
        return (l) => (l.match ? 0 : 1) * NODE_MATCH_DISTANCE_FACTOR;
    }
  }

  updateVis() {
    super.updateVis();
    const vis = this;

    // Colorize by categories in the current attr.
    vis.colorDomain = unique(vis.getData().nodes, decode(vis.attribute));
    vis.colorScale.domain(vis.colorDomain);

    // update attraction force
    vis.linkForce.distance(vis.nodeDistance());

    // update graph center
    vis.graph.force('center',
      d3.forceCenter(vis.getWidth() / 2, vis.getHeight() / 2));

    const { nodes } = vis.getData();

    // Set data for the simulation
    vis.graph.nodes(nodes);
    vis.linkForce.links(vis.getData().links);

    // Reboot the simulation
    vis.graph.stop();
    vis.graph.alpha(1).restart();

    vis.renderVis();
  }

  renderVis() {
    const vis = this;

    // Map node elements, with tooltip interactivity.
    // See tooltip example:
    // https://github.com/UBC-InfoVis/2021-436V-case-studies/blob/097d13b05d587f4fab3e3fcd23f5e99274397c2c/case-study_measles-and-vaccines/css/style.css
    const nodes = vis.getChart().selectAll('circle')
      .data(vis.getData().nodes, (d) => d.id)
      .join('circle')
      .attr('r', 4)
      .attr('fill', (d) => vis.colorScale(decode(vis.attribute)(d)))
      .attr('stroke', 'black')
      .call(drag(vis.graph))
      .on('mouseover', (e, d) => {
        d3.select('#tooltip')
          .style('display', 'block')
          .style('left', `${e.pageX}px`)
          .style('top', `${e.pageY}px`)
          .html(`
                <h1>Participant ${decode('id')(d)}</h1>
                <p>Field: ${decode('field_cd')(d)}<p>
                <p>From: ${decode('from')(d)}<p>
                `);
      })
      .on('mouseout', (_, __) => {
        d3.select('#tooltip').style('display', 'none');
      });

    vis.graph.on('tick', () => {
      nodes
        .attr('cx', (d) => d.x)
        .attr('cy', (d) => d.y);
    });
  }
}

// Drag simulation code curtesy of
// https://observablehq.com/@d3/force-directed-graph
const drag = (simulation) => {
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  return d3.drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);
};
