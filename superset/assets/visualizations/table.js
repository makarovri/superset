import d3 from 'd3';
import { fixDataTableBodyHeight } from '../javascripts/modules/utils';
import { timeFormatFactory, formatDate } from '../javascripts/modules/dates';

require('./table.css');
const $ = require('jquery');

require('datatables-bootstrap3-plugin/media/css/datatables-bootstrap3.css');
import 'datatables.net';
import dt from 'datatables.net-bs';
dt(window, $);

function tableVis(slice) {
  const fC = d3.format('0,000');
  let timestampFormatter;
  const container = $(slice.selector);

  function refresh() {
    function onError(xhr) {
      slice.error(xhr.responseText, xhr);
      return;
    }
    function onSuccess(json) {
      const data = json.data;
      const fd = json.form_data;
      console.log("form_data:");
      console.log(fd);
      // Removing metrics (aggregates) that are strings
      const realMetrics = [];
      for (const k in data.records[0]) {
        if (fd.metrics.indexOf(k) > -1 && !isNaN(data.records[0][k])) {
          realMetrics.push(k);
        }
      }
      const metrics = realMetrics;

      function col(c) {
        const arr = [];
        for (let i = 0; i < data.records.length; i++) {
          arr.push(data.records[i][c]);
        }
        return arr;
      }
      const maxes = {};
      for (let i = 0; i < metrics.length; i++) {
        maxes[metrics[i]] = d3.max(col(metrics[i]));
      }

      if (fd.table_timestamp_format === 'smart_date') {
        timestampFormatter = formatDate;
      } else if (fd.table_timestamp_format !== undefined) {
        timestampFormatter = timeFormatFactory(fd.table_timestamp_format);
      }

      const div = d3.select(slice.selector);
      div.html('');
      const table = div.append('table')
        .classed(
          'dataframe dataframe table table-striped table-bordered ' +
          'table-condensed table-hover dataTable no-footer', true)
        .attr('width', '100%');

      // add header style
      let headerStyle = fd['headerValue'];
      table.append('thead').append('tr')
        .attr('style', headerStyle)
        .selectAll('th')
        .data(data.columns)
        .enter()
        .append('th')
        .text(function (d) {
          return d;
        });

      table.append('tbody')
        .selectAll('tr')
        .data(data.records)
        .enter()
        .append('tr')
        .selectAll('td')
        .data((row) => data.columns.map((c) => {
          let val = row[c];
          if (c === 'timestamp') {
            val = timestampFormatter(val);
          }
          return {
            col: c,
            val,
            isMetric: metrics.indexOf(c) >= 0,
          };
        }))
        .enter()
        .append('td')
        /* .style('background-image', function (d) {
          if (d.isMetric) {
            const perc = Math.round((d.val / maxes[d.col]) * 100);
            return (
              `linear-gradient(to right, lightgrey, lightgrey ${perc}%, ` +
              `rgba(100,100,100,100) ${perc}%`
            );
          }
          return null;
        }) */
        .attr('style', function (d) {
          // add body style
          let bodyStyle = fd['bodyValue'];
          for (let i = 1; i < 10; i++) {
            if (fd['style_expr_' + i] !== '') {
              if (d.isMetric && d.col === fd['style_metric_' + i]) {
                let expr = fd['style_expr_' + i].replace(/x/g, d.val);
                // make '=' to '=='
                expr = expr.replace(/=/g, '==').replace(/>==/g, '>=').replace(/<==/g, '<=');
                console.log(expr);
                if ((expr.indexOf('$.inArray') === -1 && eval(expr))
                  || (expr.indexOf('$.inArray') !== -1 && eval(expr) !== -1)) {
                  console.log(fd['style_value_' + i]);
                  return bodyStyle + ';' + fd['style_value_' + i];
                }
              }
            } else {
              break;
            }
          }
          return bodyStyle;
        })
        .attr('title', (d) => {
          if (!isNaN(d.val)) {
            return fC(d.val);
          }
          return null;
        })
        .attr('data-sort', function (d) {
          return (d.isMetric) ? d.val : null;
        })
        .on('click', function (d) {
          if (!d.isMetric && fd.table_filter) {
            const td = d3.select(this);
            if (td.classed('filtered')) {
              slice.removeFilter(d.col, [d.val]);
              d3.select(this).classed('filtered', false);
            } else {
              d3.select(this).classed('filtered', true);
              slice.addFilter(d.col, [d.val]);
            }
          }
        })
        .style('cursor', function (d) {
          return (!d.isMetric) ? 'pointer' : '';
        })
        .html((d) => {
          if (d.isMetric) {
            return slice.d3format(d.col, d.val);
          }
          return d.val;
        });
      const height = slice.height();
      let paging = false;
      let pageLength;
      if (fd.page_length && fd.page_length > 0) {
        paging = true;
        pageLength = parseInt(fd.page_length, 10);
      }
      const datatable = container.find('.dataTable').DataTable({
        paging,
        pageLength,
        aaSorting: [],
        searching: fd.include_search,
        bInfo: false,
        scrollY: height + 'px',
        scrollCollapse: true,
        scrollX: true,
      });
      fixDataTableBodyHeight(
          container.find('.dataTables_wrapper'), height);
      // Sorting table by main column
      if (fd.metrics.length > 0) {
        const mainMetric = fd.metrics[0];
        datatable.column(data.columns.indexOf(mainMetric)).order('desc').draw();
      }
      slice.done(json);
      container.parents('.widget').find('.tooltip').remove();
    }
    $.getJSON(slice.jsonEndpoint(), onSuccess).fail(onError);
  }

  return {
    render: refresh,
    resize() {},
  };
}

module.exports = tableVis;
