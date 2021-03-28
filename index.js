/**
 * Builds the graph so that it is consumable from the map-of-reddit
 */

let inputSVG = process.argv[2] || './svg/graph.svg';
let inputDOT = process.argv[3] || './graph/reddit-graph.dot';

const path = require('path')
const fromDOT = require('ngraph.fromdot');
const fs = require('fs');
const augmentGraphFiles = [
  path.join('graph', 'add', 'new-nodes.dot')
];

const {createStreamingSVGParser, getElementFillColor, getPointsFromPathData} = require('streaming-svg-parser');

const outputNodeFileName = path.join('dist', 'node-ids.txt');
const outputLinkFileName = path.join('dist', 'links.bin');

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

console.log('Reading the main graph file ' + inputDOT);
const graph = fromDOT(fs.readFileSync(inputDOT, 'utf8'));
console.log('Found ' + graph.getNodeCount() + ' nodes and ' + graph.getLinkCount() + ' edges');

augmentGraphFiles.forEach(file => {
  console.log('Augmenting graph from ' + file + '...')
  let addedLinks = 0;
  let addedNodes = 0;
  const subgraph = fromDOT(fs.readFileSync(file, 'utf8'));
  subgraph.forEachLink(link => {
    if (!graph.hasNode(link.fromId)) {
      graph.addNode(link.fromId, subgraph.getNode(link.fromId).data);
      addedNodes += 1;
    } 
    if (!graph.hasNode(link.toId)) {
      graph.addNode(link.toId, subgraph.getNode(link.toId).data);
      addedNodes += 1;
    }
    if (!graph.hasLink(link.fromId, link.toId)) {
      addedLinks += 1;
      graph.addLink(link.fromId, link.toId, link.data);
    } 
  });
  console.log('Added ' + addedLinks + ' links and ' + addedNodes + ' nodes to the main graph');
})

console.log('Parsing svg file ' + inputSVG);
const nodesInSVG = new Set();
let svgContent = fs.readFileSync(inputSVG, 'utf8');
let parseSVG = createStreamingSVGParser(handleElement, Function.prototype);

parseSVG(svgContent);
console.log('Found ' + nodesInSVG.size + ' svg nodes');
console.log('Checking svg nodes have neighbors...');

nodesInSVG.forEach(nodeId => {
  if (!graph.hasNode(nodeId)) {
    console.log('  WARNING: Node is missing in the graph: ' + nodeId);
  }
});

console.log('Preparing to save graph to binary...');
let toDelete = [];
graph.forEachNode(node => {
  if (!nodesInSVG.has(node.id)) {
    console.log('  WARNING: ' + node.id + ' is present in the graph but missing in the SVG. It will be deleted')
    toDelete.push(node.id);
  }
});

if (toDelete.length) {
  toDelete.forEach(nodeId => graph.removeNode(nodeId));
  console.log('Pruned ' + toDelete.length + ' nodes from the graph (they are missing in the SVG)')
}

let presentNodes = [];
graph.forEachNode(node => {
  let linkCount = (node.links && node.links.size) || 0;
  presentNodes.push([node.id, linkCount]);
});
presentNodes = presentNodes.sort((a, b) => b[1] - a[1]).map(x => x[0]);

let nodeToId = new Map();
presentNodes.forEach((node, id) => nodeToId.set(node, id));
console.log('Saving nodes into ' + outputNodeFileName);
fs.writeFileSync(outputNodeFileName, presentNodes.join('\n'), 'utf8');

console.log('Saving links into ' + outputLinkFileName);
let links = [];
presentNodes.forEach(nodeId => {
  links.push(-getNodeId(nodeId));
  // also sort the links in decreasing weight:
  let otherLink = []
  graph.forEachLinkedNode(nodeId, (other, link) => {
    otherLink.push([getNodeId(other.id), link.data.weight]);
  }, true);
  otherLink.sort((a, b) => b[1] - a[1]).forEach(pair => {
    links.push(pair[0]);
  })
});
let linkBuffer = Buffer.alloc(links.length * 4);
links.forEach((link, id) => {
  linkBuffer.writeInt32LE(link, id * 4);
});
fs.writeFileSync(outputLinkFileName, linkBuffer);

console.log('All done. Please do not forget to save optimized graph.svg file:\n')
console.log('  svgo -i svg/graph.svg -o - | scour > dist/graph.svg\n\n')

function getNodeId(nodeTextId) {
  return nodeToId.get(nodeTextId) + 1;
}

function handleElement(element) {
  if (element.tagName === 'path') {
    validateBorderElement(element);
  } else if (element.tagName === 'circle') {
    addNode(element)
  }
}

function validateBorderElement(el) {
  let points = getPointsFromPathData(el.attributes.get('d'));
  let color = getElementFillColor(el);
  // if we got here without exceptions, we assume it is a valid border
}

function addNode(el) {
  let x = getNumericAttribute(el, 'cx');
  let y = getNumericAttribute(el, 'cy');
  let r = getNumericAttribute(el, 'r');
  let nodeName = getTextAttribute(el, 'id');
  // TODO: this code should be shared with UI. Using it because affinity designer prefixes
  // ids starting with number with `_`..
  if (nodeName[0] === '_') nodeName = nodeName.substr(1);
  nodesInSVG.add(nodeName);
}

function getNumericAttribute(el, name) {
  let value = Number.parseFloat(el.attributes.get(name));
  if (!Number.isFinite(value))
    throw new Error('Element ' + el.tagName + ' does not have a finite numeric attribute ' + name);
  return value;
}

function getTextAttribute(el, name) {
  return el.attributes.get(name) || '';
}