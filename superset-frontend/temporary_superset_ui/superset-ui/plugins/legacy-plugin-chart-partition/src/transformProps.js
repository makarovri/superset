/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
export default function transformProps(chartProps) {
  const { width, height, datasource, formData, queryData } = chartProps;
  const {
    colorScheme,
    dateTimeFormat,
    equalDateSize,
    groupby,
    logScale,
    metrics,
    numberFormat,
    partitionLimit,
    partitionThreshold,
    richTooltip,
    timeSeriesOption,
  } = formData;
  const { verboseMap } = datasource;

  return {
    width,
    height,
    data: queryData.data,
    colorScheme,
    dateTimeFormat,
    equalDateSize,
    levels: groupby.map(g => verboseMap[g] || g),
    metrics,
    numberFormat,
    partitionLimit: partitionLimit && parseInt(partitionLimit, 10),
    partitionThreshold: partitionThreshold && parseInt(partitionThreshold, 10),
    timeSeriesOption,
    useLogScale: logScale,
    useRichTooltip: richTooltip,
  };
}
