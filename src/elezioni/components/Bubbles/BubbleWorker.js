importScripts("https://d3js.org/d3-collection.v1.min.js");
importScripts("https://d3js.org/d3-dispatch.v1.min.js");
importScripts("https://d3js.org/d3-quadtree.v1.min.js");
importScripts("https://d3js.org/d3-timer.v1.min.js");
importScripts("https://d3js.org/d3-force.v1.min.js");

// @args: You can pass your worker parameters on initialisation
export default function BubbleWorker(args) {
    let bubbles = [];
    const simulation = d3.forceSimulation()
                          .velocityDecay(0.5)
                          .force("x", d3.forceX().strength(0.002))
                          .force("y", d3.forceY().strength(0.002))
                          .force("collide", d3.forceCollide().radius(function(d) { return d.r + 0.5; }).iterations(2))
    const ticked = () => {
      //console.log(this.graph.nodes[0].x,this.graph.nodes[0].y)
      //this.bubbles.style('left',d => `${width/2 + d.x - d.r}px`).style('top',d => `${height/2 + d.y - d.r}px`);
      console.log('worker ticking...')
    }
    let onmessage = e => { // eslint-disable-line no-unused-vars
        console.log('BubbleWorker', e)

        const dataLength = e.data.length;
        bubbles = e.data;

        simulation
              .nodes(bubbles)
              .on("tick", ticked)
              .on("end", () => {

                console.log('worker end')
              })

        postMessage({processedData: e.data, length: dataLength});
    };
}
