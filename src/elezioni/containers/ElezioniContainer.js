import React, { Component } from "react";
import Measure from "react-measure";
import moment from "moment";
import Bubbles from "../components/Bubbles";
import Scatter from "../components/Scatter";
import { cleanUp } from "../utils";
import "./elezioni.css";

class ElezioniContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      articles: [],
      dimensions: {
        width: 0,
        height: 0
      }
    };
  }
  componentDidMount() {
    //fetch(`${process.env.PUBLIC_URL}/data/articles3.json`)
    fetch("https://api.elezioni.io/browse/?page_size=400")
      .then(response => {
        return response.json();
      })
      .then(data => {
        console.log("parsed json", data);
        const days = [];
        const articles = data.articles
          .filter(d => typeof d.dbid === "undefined")
          .sort((a, b) => b.timestamp_published - a.timestamp_published)
          .map((article, i) => {
            article.index = i;
            const date = moment(article.date_published).format(
              "YYYY-MM-DD HH:00"
            );
            if (days.indexOf(date) === -1) {
              article.date = date;
              // console.log("setting date", date);
              days.push(date);
            }

            article.originalTitle = article.title;
            article.title = cleanUp(article.title);
            return article;
          });
        this.setState({ articles });
      })
      .catch(ex => {
        console.log("parsing failed", ex);
      });
  }

  render() {
    const { articles } = this.state;
    return (
      <div className="elezioni">
        <Measure
          bounds
          onResize={contentRect => {
            console.log("contentRect", contentRect);
            if(contentRect.bounds.width !== this.state.dimensions.width) {
              this.setState({
                dimensions: {
                  width: contentRect.bounds.width,
                  height: contentRect.bounds.height
                }
              });
            }
          }}
        >
          {({ measureRef }) => (
            <div className="elezioni-container" ref={measureRef}>
              <Bubbles
                articles={articles}
                fields={{ y: "index" }}
                {...this.state.dimensions}
              />
            </div>
          )}
        </Measure>
      </div>
    );
  }
}

export default ElezioniContainer;
