import React from 'react';
import ReactDOM from 'react-dom';
import 'whatwg-fetch';
import 'promise-polyfill/src/polyfill';

import './index.css';
import Elezioni from './elezioni';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<Elezioni />, document.getElementById('root'));
registerServiceWorker();
