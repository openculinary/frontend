import * as $ from 'jquery';
import * as d3 from 'd3';
import 'bootstrap';

// TODO: remove this workaround
// jQuery detection in Bootstrap v5 checks for presence of window.jQuery
// TypeScript type-checking prevents assignment to window.jQuery
// See: https://github.com/twbs/bootstrap/issues/35215
declare global {
  interface Window {
    jQuery: any; /* eslint-disable-line @typescript-eslint/no-explicit-any */
  }
}
window.jQuery = $;

// TODO: import d3-sankey without referencing the node_modules directory
import { sankeyTop } from '../../../node_modules/d3-sankey/src';
import * as data from './about-diagram.json';

export {};

let diagramRendered = false;
$('#about-modal').on('shown.bs.modal', function() {
  if (!diagramRendered) {
    renderDiagram();
    diagramRendered = true;
  }
});

// Based on: https://github.com/LonnyGomes/sankey-diagram-poc/
// In turn derived from https://github.com/holtzy/D3-graph-gallery/
function renderDiagram() {
  const container = $('#about-modal div.modal-body');
  const margin = { top: 5, right: 5, bottom: 5, left: 5 };
  const width = container.width() - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const svg = d3
      .select('#about-modal div.chart')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  const sankey = sankeyTop()
      .size([width, height])
      .nodeId(d => d.name)
      .nodeWidth(20)
      .nodePadding(10)
      .extent([
          [0, 5],
          [width, height - 5]
      ]);

  const graph = sankey(data);

  svg.append('g')
      .selectAll('rect')
      .data(graph.nodes)
      .join('rect')
      .attr('x', d => d.x0 + 1)
      .attr('y', d => d.y0)
      .attr('height', d => d.y1 - d.y0)
      .attr('width', d => d.x1 - d.x0 - 2)
      .attr('fill', d => d3.color(d.color || 'grey'))
      .append('title')
      .text(d => d.name);

  svg.append('g')
      .attr('fill', 'none')
      .selectAll('g')
      .data(graph.links)
      .join('g')
      .append('path')
      .attr('d', sankey.linkShape())
      .attr('class', 'link')
      .attr('stroke-width', 16)
      .append('title').text(d => `${d.source.name} →  ${d.target.name}`);

  svg.append('g')
      .style('font', '10px sans-serif')
      .selectAll('text')
      .data(graph.nodes)
      .join('text')
      .attr('x', d => (d.x0 + d.x1) / 2)
      .attr('y', d => (d.y1 + d.y0) / 2)
      .attr('dy', '0.2em')
      .attr('text-anchor', 'middle')
      .text(d => d.name);
}
