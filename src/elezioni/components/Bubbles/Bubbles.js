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

const MIN_WIDTH = 800;
const BLOCK_HEIGHT = 2000;
const ARTICLES_IN_BLOCK = 200;
const TOP_ARTICLES = 30;
const SPACE_BETWEEN_TOP = 100;
const TOP_PART = (window.innerHeight * 0.9) * 2 + (window.innerHeight * 0.9) * 0.7;

const MAX_WIDTH_FOR_TITLES = 150;

const margins = {
  top: SPACE_BETWEEN_TOP * 2,
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
  destra: '#244761',
  'centro-destra': '#56CCF2',
  'centro-sinistra': '#F55B5B',
  sinistra: 'rgba(186,0,78,1)',
  m5s: '#FFDC73',
  black: 'rgba(0,0,0,0)',
}



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
    const yField = this.props.fields.y;

    this.simulation = forceSimulation()
      .force("x", forceX((MIN_WIDTH) / 2))
      .force("y", forceY((d,i) => {
        if(i <= TOP_ARTICLES) {
            return this.yscales[0](+d[yField]);
        }
        return this.yscales[1](+d[yField]);
      }).strength(1))
      //.force("collide", forceCollide(4))
      .force("collide", forceCollide().radius(function(d,i) {
        // if(i<=TOP_ARTICLES) {
        //   return d.r + SPACE_BETWEEN_TOP + 2.5;
        // }
        return d.r + 2.5;
      }).iterations(2))

    this.ticked = () => {
      //console.log(this.graph.nodes[0].x,this.graph.nodes[0].y)
      this.bubbles.style('left',d => `${d.x - d.r}px`).style('top',d => `${d.y - d.r}px`);
    }
    this.bubbles = d3Select(this.bubbleDOM).selectAll('li').data(this.graph.nodes);
    //this.bubbles.attr('rel',d => d.id);

    this.height = (this.graph.nodes.length / ARTICLES_IN_BLOCK) * BLOCK_HEIGHT + TOP_PART;
    console.log("SETTING HEIGHT TO", this.height)
  }
  componentDidUpdate() {
    // if(this.workerInstance) {
    //     this.workerInstance.postMessage((this.graph.nodes));
    // }
    console.log("########", "componentDidUpdate")
    console.log("HEIGHT", this.height)
    console.log(this.graph.nodes.length / ARTICLES_IN_BLOCK)

    console.log(this.graph.nodes)
    this.updateBubbles(this.graph.nodes)
  }
  componentWillReceiveProps(nextProps) {
    const {articles, fields, width} = nextProps;
    const yField = fields.y;

    this.height = (articles.length / ARTICLES_IN_BLOCK) * BLOCK_HEIGHT + TOP_PART;
    console.log("SETTING HEIGHT TO", this.height)
    console.log(`(${this.graph.nodes.length} / ${ARTICLES_IN_BLOCK}) * ${BLOCK_HEIGHT}`)
    const extents = {
      y:[
        extent(articles.filter((d,i) => i <= TOP_ARTICLES), d => +d[yField]),
        extent(articles.filter((d,i) => i > TOP_ARTICLES), d => +d[yField]),
        extent(articles, d => +d[yField])
      ],
      r:extent(articles, d => {
        // console.log(d)
        return +d.tweets.number + +d.popularity
      }),
      pop:extent(articles, d => +d.popularity),
    };
    console.log('EXZTENTS', extents)
    const minRadius = 12;
    const maxRadius = width / 8;
    this.yscales = [
      scaleLinear().domain(extents.y[0]).range([margins.top,TOP_PART]),
      scaleLinear().domain(extents.y[1]).range([TOP_PART,this.height - margins.bottom])
    ]

    this.radiusDeltaScale = scaleLinear().domain([TOP_ARTICLES/2, TOP_ARTICLES]).range([1, 0]).clamp(true);
    this.opacityScale = scaleLinear().domain([0, TOP_ARTICLES]).range([1, 0]).clamp(true);

    this.rscales = [
      scaleSqrt().domain([extents.pop[0], Math.min(extents.pop[1], 3000)]).range([minRadius,maxRadius]).clamp(true),
      scaleSqrt().domain([extents.pop[0], Math.min(extents.pop[1], 3000)]).range([minRadius,maxRadius]).clamp(true)
    ];

    colorScale.domain(extents.pop);

    this.graph.nodes = articles.map((bubble,i) => {
      bubble.x = bubble.x || margins.left + (width - (margins.left+margins.right)) / 2  + (-50 + Math.random()*100);
      if(i <= TOP_ARTICLES) {
        bubble.y = bubble.y || this.yscales[0](+bubble[yField]) + (-10 + Math.random()*20);
        this.rscales[0].range([minRadius, maxRadius]);
        bubble.r = bubble.r || this.rscales[0](+bubble.tweets.number + +bubble.popularity) + this.radiusDeltaScale(bubble.index) * SPACE_BETWEEN_TOP;
        bubble.innerOpacity = this.opacityScale(bubble.index);
      } else {
        bubble.y = bubble.y || this.yscales[1](+bubble[yField]);
        bubble.r = bubble.r || this.rscales[1](+bubble.tweets.number + +bubble.popularity);
      }


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

            // bubbles.select('span').classed('left-title', d => {
            //   console.log("----->",d)
            //   return d.x > this.props.width / 2
            // })
            // bubbles.select('span').classed('right-title', d => d.x <= this.props.width / 2)

            console.log('end')
          })
  }
  render() {
    const bubbles = this.state.bubbles.map(bubble => {


      let bgColor = colors[bubble.collections[0].slug];
      const collection = bubble.collections.sort((a,b) => areas.indexOf(a.slug) - areas.indexOf(b.slug));
      const l = collection.length;

      const innerCircleRadius = bubble.r - 5;
      const innerCircleStyle = {
        width: `${innerCircleRadius * 2}px`,
        height: `${innerCircleRadius * 2}px`,
        opacity: bubble.innerOpacity,
      };

      if(l > 1) {
          const bgColorStep = Math.floor(100 / (l - 1));
          const bgGradient = collection.map((d,i) => `${colors[d.slug]} ${i * bgColorStep}%`).join(',');
          bgColor = `linear-gradient(to right, ${bgGradient})`;
      }

      return <li key={bubble.id} style={{
      left:`${bubble.x - bubble.r}px`,
      top:`${bubble.y - bubble.r - (bubble.index <= TOP_ARTICLES ? SPACE_BETWEEN_TOP : 0)}px`,
      width:`${bubble.r*2}px`,
      height:`${bubble.r*2}px`,
        background:bgColor,
      }} className={`${bubble.index <= TOP_ARTICLES ? 'top-articles' : 'bottom-articles'} ${bubble.r*2 >= MAX_WIDTH_FOR_TITLES ? 'big' : 'small'}`}>
        { bubble.index <= TOP_ARTICLES && <div className="top-article-inner-circle" style={innerCircleStyle}/>}
        { bubble.r*2 >= MAX_WIDTH_FOR_TITLES && <span className="inside" style={{opacity:bubble.innerOpacity}}><h2>{bubble.title}</h2></span>}
        {/* { bubble.index <= TOP_ARTICLES && <span className="top-title"><h2>{bubble.title}</h2></span>} */}
        <span className="outside" style={{top:`${bubble.r}px`}}><h3>{bubble.short_published}</h3><h2>{bubble.title}</h2><p>{bubble.description}</p><h4>{bubble.source}</h4></span>
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
