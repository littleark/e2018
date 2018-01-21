import React, {Component} from "react";
import moment from 'moment';
import Bubbles from "../components/Bubbles";
import Scatter from "../components/Scatter";

import "./elezioni.css";

class ElezioniContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      articles: [],
    }
  }
  componentDidMount() {
    //fetch(`${process.env.PUBLIC_URL}/data/articles3.json`)
    fetch('https://api.elezioni.io/browse/?page_size=200')
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log("parsed json", data);
        const days = [];
        const articles = data.articles.filter(d => typeof d.dbid === 'undefined').sort((a,b) => b.timestamp_published - a.timestamp_published).map((article,i) => {
          article.index = i;
          const date = moment(article.date_published).format('YYYY-MM-DD HH:00');
          if(days.indexOf(date) === -1) {
            article.date = date;
            console.log('setting date', date)
            days.push(date);
          }

          return article;
        });
        this.setState({articles})
      })
      .catch((ex) => {
        console.log("parsing failed", ex);
      });
  }

  render() {
    const {articles} = this.state;
    return (
      <div className="elezioni-container">
        <Bubbles articles={articles} fields={{y:'index'}}/>
        {/* <Scatter articles={articles}/> */}
      </div>
    );
  }

};

export default ElezioniContainer;
