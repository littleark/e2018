import React, { Component } from 'react';
import {select as d3Select} from 'd3-selection';
import {scaleLinear, scaleSqrt, scaleQuantize} from 'd3-scale';
import { extent } from 'd3-array';
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

const width = 1000;
const height = 2600;

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
      .force("x", forceX((width) / 2))
      .force("y", forceY((d) => { return this.yscale(+d[yField]); }).strength(1))
      //.force("collide", forceCollide(4))
      .force("collide", forceCollide().radius(function(d) { return d.r + 2.5; }).iterations(2))

    this.ticked = () => {
      //console.log(this.graph.nodes[0].x,this.graph.nodes[0].y)
      this.bubbles.style('left',d => `${d.x - d.r}px`).style('top',d => `${d.y - d.r}px`);
    }
    this.bubbles = d3Select(this.bubbleDOM).selectAll('li').data(this.graph.nodes);
    //this.bubbles.attr('rel',d => d.id);
  }
  componentDidUpdate() {
    if(this.workerInstance) {
        this.workerInstance.postMessage((this.graph.nodes));
    }
    console.log("########")
    console.log(this.graph.nodes)
    this.updateBubbles(this.graph.nodes)
  }
  componentWillReceiveProps(nextProps) {
    const {articles, fields} = nextProps;
    const yField = fields.y;



    const extents = {
      y:extent(articles, d => +d[yField]),
      r:extent(articles, d => +d.tweets.number + +d.popularity),
      pop:extent(articles, d => +d.popularity),
    };
    console.log('EXZTENTS', extents)
    const minRadius = 12; //Math.floor(articles.length/height/2);
    const maxRadius = 150;
    this.yscale = scaleLinear().domain(extents.y).range([margins.top,height - margins.bottom]);
    this.rscale = scaleSqrt().domain(extents.pop).range([minRadius,maxRadius]);
    colorScale.domain(extents.pop);

    this.graph.nodes = articles.map((bubble,i) => {
      bubble.x = margins.left + (width - (margins.left+margins.right)) / 2;
      bubble.y = this.yscale(+bubble[yField]);
      bubble.r = this.rscale(+bubble.tweets.number + +bubble.popularity);
      // bubble.color = colorScale(+bubble.popularity)
      return bubble;
    });
    //this.bubbles.data(this.graph.nodes);


    this.setState({
      bubbles:this.graph.nodes,
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
    const bubbles = this.state.bubbles.map(bubble => <li key={bubble.id} style={{
      left:`${bubble.x - bubble.r}px`,
      top:`${bubble.y - bubble.r}px`,
      width:`${bubble.r*2}px`,
      height:`${bubble.r*2}px`,
      backgroundColor:bubble.color,
    }} className={bubble.r*2 >= MAX_WIDTH_FOR_TITLES ? 'big' : 'small'}>
      { bubble.r*2 >= MAX_WIDTH_FOR_TITLES && <span className="inside"><h2>{bubble.title}</h2></span>}
      <span className="outside" style={{top:`${bubble.r}px`}}><h3>{bubble.short_published}</h3>{bubble.title}<h4>{bubble.source}</h4></span>
    </li>)

    const ticks = this.state.bubbles.filter(bubble => bubble.date).filter((d,i) => i%2).map(bubble => {
      const tickStyle = {
        top: `${bubble.y}px`,
      }

      return <li key={bubble.date} style={tickStyle}><span>{bubble.date}</span></li>
    })

    return (
      <div className="bubbles-container">
        <ul className="timeline">{ticks}</ul>
        <ul className="bubbles" ref={el => this.bubbleDOM = el} style={{height:`${height}px`}}>{bubbles}</ul>
      </div>
    );
  }
}

export default Bubbles;
