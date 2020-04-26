import 'jquery';
import 'html2canvas/dist/html2canvas.esm.js';

import { Feedback } from './feedback';
import './feedback.css';

$(function() {
  Feedback({
    h2cPath: 'html2canvas.js',
    url: 'api/feedback',
    scrollX: 0,
    scrollY: 0,
    scale: 1
  });
});
