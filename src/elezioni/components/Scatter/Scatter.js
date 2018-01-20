import React, { Component } from 'react';
import {select as d3Select} from 'd3-selection';
import {scaleLinear, scaleLog, scaleSqrt, scaleQuantize} from 'd3-scale';
import { extent, range } from 'd3-array';

import './scatter.css';

const sequentialRed = ['#ffe4c4', '#ffc991', '#ffaa74', '#ff8869', '#fc6266', '#f13a5f', '#dc143c']; // red scale
const colorScale = scaleQuantize().range(sequentialRed);



const width = 800;
const height = 500;

const margins = {
  top: 50,
  bottom: 50,
  left: 50,
  right: 50,
}

// returns slope, intercept and r-square of the line
const leastSquares = (xSeries, ySeries) => {
		var reduceSumFunc = function(prev, cur) { return prev + cur; };

		var xBar = xSeries.reduce(reduceSumFunc) * 1.0 / xSeries.length;
		var yBar = ySeries.reduce(reduceSumFunc) * 1.0 / ySeries.length;

		var ssXX = xSeries.map(function(d) { return Math.pow(d - xBar, 2); })
			.reduce(reduceSumFunc);

		var ssYY = ySeries.map(function(d) { return Math.pow(d - yBar, 2); })
			.reduce(reduceSumFunc);

		var ssXY = xSeries.map(function(d, i) { return (d - xBar) * (ySeries[i] - yBar); })
			.reduce(reduceSumFunc);

		var slope = ssXY / ssXX;
		var intercept = yBar - (xBar * slope);
		var rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);

		return {slope, intercept, rSquare};
}

class Scatter extends Component {
  constructor(props) {
    super(props);
    this.graph = {
      nodes: [],
    };
    this.state = {
      samples: [],
    }
  }

  componentWillReceiveProps(nextProps) {
    const {articles} = nextProps;

    const extents = {
      x:extent(articles, d => +d.tweets.number),
      y:extent(articles, d => +d.popularity),
    };
    console.log('EXZTENTS', extents)
    this.xscale = scaleLinear().domain(extents.x).range([0,width - (margins.left+margins.right)]);
    this.yscale = scaleLinear().domain(extents.y).range([height - (margins.top + margins.bottom),0]);

    let x_mean = 0;
    let y_mean = 0;

    const samples = articles.map(d => {
      d.x = this.xscale(+d.tweets.number);
      d.y = this.yscale(+d.popularity || 0.0001);
      d.r = 2;
      return d;
    })

    const xSeries = range(1, samples.length + 1);
		const ySeries = samples.map(d => parseFloat(+d.popularity));

    const leastSquaresCoeff = leastSquares(xSeries, ySeries);
    console.log(leastSquaresCoeff)

    // apply the reults of the least squares regression
		var x1 = extents.x[0];
		var y1 = leastSquaresCoeff.slope + leastSquaresCoeff.intercept;
		var x2 = extents.x[1];
		var y2 = leastSquaresCoeff.slope * samples.length + leastSquaresCoeff.intercept;

    this.setState({
      samples,
      leastSquaresCoeff,
      trendData: [{x:this.xscale(x1),y:this.yscale(y1)},{x:this.xscale(x2),y:this.yscale(y2)}],
    })
  }

  render() {
    const {trendData} = this.state;
    const samples = this.state.samples.map(d => <li key={d.id} title={`${d.popularity}/${d.tweets.number}`} style={{
      left:`${d.x - d.r}px`,
      top:`${d.y - d.r}px`,
      width:`${d.r*2}px`,
      height:`${d.r*2}px`,
    }}></li>)
    return (
      <div className="scatter-plot">
        {trendData && <svg width={width} height={height}>
          <g transform={`translate(${margins.left},${margins.left})`}>
            <line x1={trendData[0].x} y1={trendData[0].y} x2={trendData[1].x} y2={trendData[1].y} />
          </g>
        </svg>}
        <ul style={{marginTop:`${margins.top}px`,marginLeft:`${margins.left}px`}}>{samples}</ul>
      </div>
    );
  }
}

export default Scatter;
