set -e

node index.js
echo "Optimizng SVG..."
svgo -i svg/graph.svg -o - | scour > dist/graph.svg