import React, { Component } from 'react';
import {select as d3Select} from 'd3-selection';
import {scaleLinear, scaleSqrt, scaleQuantize} from 'd3-scale';
import { extent, range } from 'd3-array';
import {forceSimulation, forceLink, forceManyBody, forceCenter, forceX, forceY, forceCollide} from 'd3-force';

import WebWorker from '../../../utils/WebWorker';
// import BubbleWorker from './BubbleWorker';
import './bubbles.css';

const sequentialRed = ['#ffe4c4', '#ffc991', '#ffaa74', '#ff8869', '#fc6266', '#f13a5f', '#dc143c']; // red scale
const colorScale = scaleQuantize().range(sequentialRed);

const margins = {
  top: 80,
  bottom: 80,
  left: 0,
  right: 0,
}
const areas = [
  'destra',
  'centro-destra',
  'm5s',
  'centro-sinistra',
  'sinistra',
]
const  colors = {
  destra: '#1E7AF7',
  'centro-destra': '#56CCF2',
  'centro-sinistra': '#F55B5B',
  sinistra: 'rgba(186,0,78,1)',
  m5s: '#FFDC73',
}

const MIN_WIDTH = 800;
const BLOCK_HEIGHT = 2000;
const ARTICLES_IN_BLOCK = 200;

const MAX_WIDTH_FOR_TITLES = 150;

class Bubbles extends Component {
  constructor(props) {
    super(props);
    this.graph = {
      nodes: [],
    };
    this.state = {
      bubbles: [],
    }
  }
  componentDidMount() {
    // this.workerInstance = new WebWorker(BubbleWorker);
    // this.workerInstance.addEventListener("message", e => {
    //   console.log('worker message', e.data);
    //   this.updateBubbles(e.data.processedData);
    // }, false);

    // this.simulation = forceSimulation()
    //     .velocityDecay(0.5)
    //     .force("x", forceX().strength(0.002))
    //     .force("y", forceY().strength(0.002))
    //     .force("collide", forceCollide().radius(function(d) { return d.r + 0.5; }).iterations(2))
    const yField = this.props.fields.y;

    this.simulation = forceSimulation()
      .force("x", forceX((MIN_WIDTH) / 2))
      .force("y", forceY((d) => { return this.yscale(+d[yField]); }).strength(1))
      //.force("collide", forceCollide(4))
      .force("collide", forceCollide().radius(function(d) { return d.r + 2.5; }).iterations(2))

    this.ticked = () => {
      //console.log(this.graph.nodes[0].x,this.graph.nodes[0].y)
      this.bubbles.style('left',d => `${d.x - d.r}px`).style('top',d => `${d.y - d.r}px`);
    }
    this.bubbles = d3Select(this.bubbleDOM).selectAll('li').data(this.graph.nodes);
    //this.bubbles.attr('rel',d => d.id);

    this.height = (this.graph.nodes.length / ARTICLES_IN_BLOCK) * BLOCK_HEIGHT;
    console.log("SETTING HEIGHT TO", this.height)
  }
  componentDidUpdate() {
    if(this.workerInstance) {
        this.workerInstance.postMessage((this.graph.nodes));
    }
    console.log("########", "componentDidUpdate")
    console.log("HEIGHT", this.height)
    console.log(this.graph.nodes.length / ARTICLES_IN_BLOCK)

    console.log(this.graph.nodes)
    this.updateBubbles(this.graph.nodes)
  }
  componentWillReceiveProps(nextProps) {
    const {articles, fields, width} = nextProps;
    const yField = fields.y;

    this.height = (articles.length / ARTICLES_IN_BLOCK) * BLOCK_HEIGHT;
    console.log("SETTING HEIGHT TO", this.height)
    console.log(`(${this.graph.nodes.length} / ${ARTICLES_IN_BLOCK}) * ${BLOCK_HEIGHT}`)
    const extents = {
      y:extent(articles, d => +d[yField]),
      r:extent(articles, d => {
        // console.log(d)
        return +d.tweets.number + +d.popularity
      }),
      pop:extent(articles, d => +d.popularity),
    };
    console.log('EXZTENTS', extents)
    const minRadius = 12;
    const maxRadius = width / 8;
    this.yscale = scaleLinear().domain(extents.y).range([margins.top,this.height - margins.bottom]);
    this.rscale = scaleSqrt().domain([extents.pop[0], Math.min(extents.pop[1], 3000)]).range([minRadius,maxRadius]).clamp(true);
    colorScale.domain(extents.pop);

    this.graph.nodes = articles.map((bubble,i) => {
      bubble.x = bubble.x || margins.left + (width - (margins.left+margins.right)) / 2;
      bubble.y = bubble.y || this.yscale(+bubble[yField]);
      bubble.r = bubble.r || this.rscale(+bubble.tweets.number + +bubble.popularity);
      // bubble.color = colorScale(+bubble.popularity)
      return bubble;
    });

    this.simulation.force("x", forceX((this.props.width || MIN_WIDTH) / 2))

    this.setState({
      bubbles:this.graph.nodes,
      //width: this.props.width || MIN_WIDTH,
    })
  }
  updateBubbles(data) {
    this.graph.nodes = data;
    const bubbles = d3Select(this.bubbleDOM).selectAll('li');
    this.bubbles = d3Select(this.bubbleDOM).selectAll('li').data(this.graph.nodes);
    this.simulation
          .nodes(this.graph.nodes)
          .on("tick", this.ticked)
          .on("end", () => {
            console.log('end')
          })
  }
  render() {
    const bubbles = this.state.bubbles.map(bubble => {


      let bgColor = colors[bubble.collections[0].slug];
      const l = bubble.collections.length;

      // linear-gradient(to right, $centro-destra 0%,$centro-sinistra 100%);

      if(l > 1) {
          const bgColorStep = Math.floor(100 / (l - 1));
          const bgGradient = bubble.collections.sort((a,b) => areas.indexOf(a.slug) - areas.indexOf(b.slug)).map((d,i) => `${colors[d.slug]} ${i * bgColorStep}%`).join(',');
          bgColor = `linear-gradient(to right, ${bgGradient})`;
          // console.log(bgColor)
      }

      return <li key={bubble.id} style={{
      left:`${bubble.x - bubble.r}px`,
      top:`${bubble.y - bubble.r}px`,
      width:`${bubble.r*2}px`,
      height:`${bubble.r*2}px`,
        background:bgColor,
      }} className={`${bubble.r*2 >= MAX_WIDTH_FOR_TITLES ? 'big' : 'small'}`}>
        { bubble.r*2 >= MAX_WIDTH_FOR_TITLES && <span className="inside"><h2>{bubble.title}</h2></span>}
      <span className="outside" style={{top:`${bubble.r}px`}}><h3>{bubble.short_published}</h3>{bubble.title}<h4>{bubble.source}</h4></span>
    </li>})

    const ticks = this.state.bubbles.filter(bubble => bubble.date).filter((d,i) => i%2).map(bubble => {
      const tickStyle = {
        top: `${bubble.y}px`,
      }

      return <li key={bubble.date} style={tickStyle}><span>{bubble.date}</span></li>
    })

    return (
      <div className="bubbles-container">
        <ul className="timeline">{ticks}</ul>
        <ul className="bubbles" ref={el => this.bubbleDOM = el} style={{height:`${this.height}px`}}>{bubbles}</ul>
      </div>
    );
  }
}

export default Bubbles;
