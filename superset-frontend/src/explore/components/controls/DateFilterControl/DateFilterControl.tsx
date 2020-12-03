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
import React, { useState, useEffect } from 'react';
import rison from 'rison';
import moment, { Moment } from 'moment';
import {
  SupersetClient,
  TimeRangeEndpoints,
  t,
  styled,
} from '@superset-ui/core';
import {
  buildTimeRangeString,
  formatTimeRange,
  SEPARATOR,
} from 'src/explore/dateFilterUtils';
import ControlHeader from 'src/explore/components/ControlHeader';
import Label from 'src/components/Label';
import Modal from 'src/common/components/Modal';
import { DatePicker, Input } from 'src/common/components';
import { Select } from 'src/components/Select';
import { Col, InputNumber, Radio, Row } from 'antd';
import {
  TimeRangeFrameType,
  CommonRangeType,
  CalendarRangeType,
  CustomRangeType,
  CustomRangeDecodeType,
  CustomRangeKey,
  PreviousCalendarWeek,
} from './types';
import {
  COMMON_RANGE_OPTIONS,
  CALENDAR_RANGE_OPTIONS,
  RANGE_FRAME_OPTIONS,
  SINCE_GRAIN_OPTIONS,
  UNTIL_GRAIN_OPTIONS,
  SINCE_MODE_OPTIONS,
  UNTIL_MODE_OPTIONS,
} from './constants';

const MOMENT_FORMAT = 'YYYY-MM-DD[T]HH:mm:ss';
const DEFAULT_SINCE = moment()
  .utc()
  .startOf('day')
  .subtract(7, 'days')
  .format(MOMENT_FORMAT);
const DEFAULT_UNTIL = moment().utc().startOf('day').format(MOMENT_FORMAT);

const customTimeRangeDecode = (timeRange: string): CustomRangeDecodeType => {
  const splitDateRange = timeRange.split(SEPARATOR);
  const defaultCustomRange: CustomRangeType = {
    sinceDatetime: DEFAULT_SINCE,
    sinceMode: 'relative',
    sinceGrain: 'day',
    sinceGrainValue: -7,
    untilDatetime: DEFAULT_UNTIL,
    untilMode: 'specific',
    untilGrain: 'day',
    untilGrainValue: 7,
    anchorMode: 'now',
    anchorValue: 'now',
  };

  /**
   * RegExp to test a string for a full ISO 8601 Date
   * Does not do any sort of date validation, only checks if the string is according to the ISO 8601 spec.
   *  YYYY-MM-DDThh:mm:ss
   *  YYYY-MM-DDThh:mm:ssTZD
   *  YYYY-MM-DDThh:mm:ss.sTZD
   * @see: https://www.w3.org/TR/NOTE-datetime
   */
  const iso8601 = String.raw`\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:(?:[+-]\d\d:\d\d)|Z)?`;
  const datetimeConstant = String.raw`TODAY|NOW`;
  const grainValue = String.raw`[+-]?[1-9][0-9]*`;
  const grain = String.raw`YEAR|QUARTER|MONTH|WEEK|DAY|HOUR|MINUTE|SECOND`;
  const CUSTOM_RANGE_EXPRESSION = RegExp(
    String.raw`^DATEADD\(DATETIME\("(${iso8601}|${datetimeConstant})"\),\s(${grainValue}),\s(${grain})\)$`,
    'i',
  );
  const ISO8601_AND_CONSTANT = RegExp(
    String.raw`^${iso8601}|${datetimeConstant}$`,
    'i',
  );

  if (splitDateRange.length === 2) {
    const [since, until] = [...splitDateRange];

    // specific : specific
    if (
      since.match(ISO8601_AND_CONSTANT) &&
      until.match(ISO8601_AND_CONSTANT)
    ) {
      return {
        customRange: {
          ...defaultCustomRange,
          sinceDatetime: since,
          untilDatetime: until,
          sinceMode: 'specific',
          untilMode: 'specific',
        },
        matchedFlag: true,
      };
    }

    // relative : specific
    const sinceCapturedGroup = since.match(CUSTOM_RANGE_EXPRESSION);
    if (
      sinceCapturedGroup &&
      until.match(ISO8601_AND_CONSTANT) &&
      since.includes(until)
    ) {
      const [dttm, grainValue, grain] = [...sinceCapturedGroup.slice(1)];
      return {
        customRange: {
          ...defaultCustomRange,
          sinceGrain: grain,
          sinceGrainValue: parseInt(grainValue, 10),
          untilDatetime: dttm,
          sinceMode: 'relative',
          untilMode: 'specific',
        },
        matchedFlag: true,
      };
    }

    // specific : relative
    const untilCapturedGroup = until.match(CUSTOM_RANGE_EXPRESSION);
    if (
      since.match(ISO8601_AND_CONSTANT) &&
      untilCapturedGroup &&
      until.includes(since)
    ) {
      const [dttm, grainValue, grain] = [...untilCapturedGroup.slice(1)];
      return {
        customRange: {
          ...defaultCustomRange,
          untilGrain: grain,
          untilGrainValue: parseInt(grainValue, 10),
          sinceDatetime: dttm,
          sinceMode: 'specific',
          untilMode: 'relative',
        },
        matchedFlag: true,
      };
    }

    // relative : relative
    if (sinceCapturedGroup && untilCapturedGroup) {
      const [sinceDttm, sinceGrainValue, sinceGrain] = [
        ...sinceCapturedGroup.slice(1),
      ];
      const [untileDttm, untilGrainValue, untilGrain] = [
        ...untilCapturedGroup.slice(1),
      ];
      if (sinceDttm === untileDttm) {
        return {
          customRange: {
            ...defaultCustomRange,
            sinceGrain,
            sinceGrainValue: parseInt(sinceGrainValue, 10),
            untilGrain,
            untilGrainValue: parseInt(untilGrainValue, 10),
            anchorValue: sinceDttm,
            sinceMode: 'relative',
            untilMode: 'relative',
            anchorMode: sinceDttm === 'now' ? 'now' : 'specific',
          },
          matchedFlag: true,
        };
      }
    }
  }

  return {
    customRange: defaultCustomRange,
    matchedFlag: false,
  };
};

const customTimeRangeEncode = (customRange: CustomRangeType): string => {
  const {
    sinceDatetime,
    sinceMode,
    sinceGrain,
    sinceGrainValue,
    untilDatetime,
    untilMode,
    untilGrain,
    untilGrainValue,
    anchorValue,
  } = { ...customRange };
  // specific : specific
  if (sinceMode === 'specific' && untilMode === 'specific') {
    return `${sinceDatetime} : ${untilDatetime}`;
  }

  // specific : relative
  if (sinceMode === 'specific' && untilMode === 'relative') {
    const _until = `DATEADD(DATETIME("${sinceDatetime}"), ${untilGrainValue}, ${untilGrain})`;
    return `${sinceDatetime} : ${_until}`;
  }

  // relative : specific
  if (sinceMode === 'relative' && untilMode === 'specific') {
    const _since = `DATEADD(DATETIME("${untilDatetime}"), ${-Math.abs(sinceGrainValue,)}, ${sinceGrain})`;
    return `${_since} : ${untilDatetime}`;
  }

  // relative : relative
  const _since = `DATEADD(DATETIME("${anchorValue}"), ${-Math.abs(sinceGrainValue,)}, ${sinceGrain})`;
  const _until = `DATEADD(DATETIME("${anchorValue}"), ${untilGrainValue}, ${untilGrain})`;
  return `${_since} : ${_until}`;
};

const guessTimeRangeFrame = (timeRange: string): TimeRangeFrameType => {
  if (COMMON_RANGE_OPTIONS.map(_ => _.value).indexOf(timeRange) > -1) {
    return 'Common';
  }
  if (CALENDAR_RANGE_OPTIONS.map(_ => _.value).indexOf(timeRange) > -1) {
    return 'Calendar';
  }
  if (timeRange === 'No filter') {
    return 'No Filter';
  }
  if (customTimeRangeDecode(timeRange).matchedFlag) {
    return 'Custom';
  }
  return 'Advanced';
};

const fetchActualTimeRange = async (
  timeRange: string,
  endpoints?: TimeRangeEndpoints,
) => {
  const query = rison.encode(timeRange);

  const { json = {} } = await SupersetClient.get({
    endpoint: `/api/v1/chart/time_range/?q=${query}`,
  });
  const timeRangeString = buildTimeRangeString(
    json?.result?.since || '',
    json?.result?.until || '',
  );
  return formatTimeRange(timeRangeString, endpoints);
};

const Styles = styled.div`
  .ant-row {
    margin-top: 5px;
  }
`;

interface DateFilterLabelProps {
  animation?: boolean;
  name: string;
  label?: string;
  description?: string;
  onChange: (timeRange: string) => void;
  value?: string;
  height?: number;
  onOpenDateFilterControl?: () => {};
  onCloseDateFilterControl?: () => {};
  endpoints?: TimeRangeEndpoints;
}

export default function DateFilterControl(props: DateFilterLabelProps) {
  const { value = 'Last week', endpoints, onChange } = props;
  const [timeRangeFrame, setTimeRangeFrame] = useState<TimeRangeFrameType>(
    guessTimeRangeFrame(value),
  );
  const [show, setShow] = useState<boolean>(false);
  const [actualTimeRange, setActualTimeRange] = useState<string>('');
  const [commonRange, setCommonRange] = useState<CommonRangeType>('Last week');
  const [calendarRange, setCalendarRange] = useState<CalendarRangeType>(
    PreviousCalendarWeek,
  );
  const [customRange, setCustomRange] = useState<CustomRangeType>(
    customTimeRangeDecode(value).customRange,
  );
  // const [advancedRange, setAdvancedRange] = useState<string>(`${SEPARATOR}`);

  useEffect(() => {
    fetchActualTimeRange(value, endpoints).then(value => {
      setActualTimeRange(value);
    });
  }, [value]);

  function onSave() {
    if (timeRangeFrame === 'Common') onChange(commonRange);
    if (timeRangeFrame === 'Calendar') onChange(calendarRange);
    if (timeRangeFrame === 'Custom') onChange(customTimeRangeEncode(customRange));
    if (timeRangeFrame === 'No Filter') onChange('No filter');
    setShow(false);
  }

  function renderCommon() {
    return (
      <div>
        {t('COMMON DATETIME')}
        <Select
          options={COMMON_RANGE_OPTIONS}
          value={COMMON_RANGE_OPTIONS.filter(_ => _.value === commonRange)}
          onChange={(_: any) => setCommonRange(_.value)}
        />
      </div>
    );
  }

  function renderCalendar() {
    return (
      <div>
        {t('PREVIOUS CALENDAR DATETIME')}
        <Select
          options={CALENDAR_RANGE_OPTIONS}
          value={CALENDAR_RANGE_OPTIONS.filter(_ => _.value === calendarRange)}
          onChange={(_: any) => setCalendarRange(_.value)}
        />
      </div>
    );
  }

  function renderAdvanced() {
    return (
      // <>
      //   <Input placeholder="Basic usage" />
      //   <Input placeholder="Basic usage" />
      // </>
      <h1>WIP</h1>
    );
  }

  function onCustomRangeChange(control: CustomRangeKey, value: string | number) {
    setCustomRange({
      ...customRange,
      [control]: value,
    });
  }

  function onCustomRangeChangeAnchorMode(option: any) {
    const radioValue = option.target.value;
    if (radioValue === 'now') {
      setCustomRange({
        ...customRange,
        'anchorValue': 'now',
        'anchorMode': radioValue,
      });
    } else {
      setCustomRange({
        ...customRange,
        'anchorValue': DEFAULT_UNTIL,
        'anchorMode': radioValue,
      });
    }
  }

  function renderCustom() {
    const {
      sinceDatetime,
      sinceMode,
      sinceGrain,
      sinceGrainValue,
      untilDatetime,
      untilMode,
      untilGrain,
      untilGrainValue,
      anchorValue,
      anchorMode,
    } = { ...customRange };

    return (
      <>
        <Row gutter={8}>
          <Col span={12}>
            {t('START')}
            <Select
              name="select-start-type"
              options={SINCE_MODE_OPTIONS}
              value={SINCE_MODE_OPTIONS.filter(
                option => option.value === sinceMode,
              )}
              onChange={(option: any) =>
                onCustomRangeChange('sinceMode', option.value)
              }
            />
            {sinceMode === 'specific' && (
              <Row>
                <DatePicker
                  showTime
                  // @ts-ignore
                  value={moment(sinceDatetime)}
                  // @ts-ignore
                  onChange={(datetime: Moment) =>
                    onCustomRangeChange(
                      'sinceDatetime',
                      datetime.format(MOMENT_FORMAT),
                    )
                  }
                />
              </Row>
            )}
            {sinceMode === 'relative' && (
              <Row gutter={8}>
                <Col span={10}>
                  {/* Make sure sinceGrainValue looks like a positive integer */}
                  <InputNumber
                    placeholder={t('Relative quantity')}
                    value={Math.abs(sinceGrainValue)}
                    min={1}
                    defaultValue={1}
                    onChange={value =>
                      onCustomRangeChange('sinceGrainValue', value || 1)
                    }
                  />
                </Col>
                <Col span={14}>
                  <Select
                    options={SINCE_GRAIN_OPTIONS}
                    value={SINCE_GRAIN_OPTIONS.filter(
                      option => option.value === sinceGrain,
                    )}
                    onChange={(option: any) =>
                      onCustomRangeChange('sinceGrain', option.value)
                    }
                  />
                </Col>
              </Row>
            )}
          </Col>
          <Col span={12}>
            {t('END')}
            <Select
              options={UNTIL_MODE_OPTIONS}
              value={UNTIL_MODE_OPTIONS.filter(
                option => option.value === untilMode,
              )}
              onChange={(option: any) =>
                onCustomRangeChange('untilMode', option.value)
              }
            />
            {untilMode === 'specific' && (
              <Row>
                <DatePicker
                  showTime
                  // @ts-ignore
                  value={moment(untilDatetime)}
                  // @ts-ignore
                  onChange={(datetime: Moment) =>
                    onCustomRangeChange(
                      'untilDatetime',
                      datetime.format(MOMENT_FORMAT),
                    )
                  }
                />
              </Row>
            )}
            {untilMode === 'relative' && (
              <Row gutter={8}>
                <Col span={10}>
                  <InputNumber
                    placeholder={t('Relative quantity')}
                    value={untilGrainValue}
                    min={1}
                    defaultValue={1}
                    onChange={value =>
                      onCustomRangeChange('untilGrainValue', value || 1)
                    }
                  />
                </Col>
                <Col span={14}>
                  <Select
                    options={UNTIL_GRAIN_OPTIONS}
                    value={UNTIL_GRAIN_OPTIONS.filter(
                      option => option.value === untilGrain,
                    )}
                    onChange={(option: any) =>
                      onCustomRangeChange('untilGrain', option.value)
                    }
                  />
                </Col>
              </Row>
            )}
          </Col>
        </Row>
        {sinceMode === 'relative' && untilMode === 'relative' && (
          <>
            <Row>{t('ANCHOR RELATIVE TO')}</Row>
            <Row align="middle">
              <Radio.Group
                onChange={onCustomRangeChangeAnchorMode}
                defaultValue="now"
                value={anchorMode}
              >
                <Radio key="now" value="now">{t('NOW')}</Radio>
                <Radio key="specific" value="specific">{t('Date/Time')}</Radio>
              </Radio.Group>
              {anchorMode !== 'now' && (
                <DatePicker
                  showTime
                  // @ts-ignore
                  value={moment(
                    anchorValue.toLowerCase() === 'now'
                      ? DEFAULT_UNTIL
                      : anchorValue,
                  )}
                  // @ts-ignore
                  onChange={(datetime: Moment) =>
                    onCustomRangeChange(
                      'anchorValue',
                      datetime.format(MOMENT_FORMAT),
                    )
                  }
                />
              )}
            </Row>
          </>
        )}
      </>
    );
  }

  return (
    <>
      <ControlHeader {...props} />
      <Label
        className="pointer"
        data-test="popover-trigger"
        onClick={() => setShow(true)}
      >
        {actualTimeRange}
      </Label>

      <Modal
        title="Range"
        show={show}
        onHide={() => setShow(false)}
        onHandledPrimaryAction={onSave}
        primaryButtonName={t('APPLY')}
        primaryButtonType="primary"
      >
        <Styles>
          <div>
            {t('RANGE TYPE')}
            <Select
              options={RANGE_FRAME_OPTIONS}
              value={RANGE_FRAME_OPTIONS.filter(
                _ => _.value === timeRangeFrame,
              )}
              onChange={(_: any) => setTimeRangeFrame(_.value)}
            />
          </div>
          {timeRangeFrame === 'Common' && renderCommon()}
          {timeRangeFrame === 'Calendar' && renderCalendar()}
          {timeRangeFrame === 'Advanced' && renderAdvanced()}
          {timeRangeFrame === 'Custom' && renderCustom()}
        </Styles>
      </Modal>
    </>
  );
}
