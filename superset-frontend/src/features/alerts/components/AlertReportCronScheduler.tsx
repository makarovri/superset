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
import React, { useState, useCallback, useRef, FocusEvent } from 'react';
import { t, useTheme } from '@superset-ui/core';

import { AntdInput, Select } from 'src/components';
import { Input } from 'src/components/Input';
import { CronPicker, CronError } from 'src/components/CronPicker';
import { StyledInputContainer } from '../AlertReportModal';

export interface AlertReportCronSchedulerProps {
  value: string;
  onChange: (change: string) => any;
}
const SCHEDULE_TYPE_OPTIONS = [
  {
    label: t('Recurring (every)'),
    value: 'picker',
  },
  {
    label: t('CRON Schedule'),
    value: 'input',
  },
];

export const AlertReportCronScheduler: React.FC<AlertReportCronSchedulerProps> =
  ({ value, onChange }) => {
    const theme = useTheme();
    const inputRef = useRef<AntdInput>(null);
    const [scheduleFormat, setScheduleFormat] = useState<'picker' | 'input'>(
      'picker',
    );

    const customSetValue = useCallback(
      (newValue: string) => {
        onChange(newValue);
        inputRef.current?.setValue(newValue);
      },
      [inputRef, onChange],
    );

    const handleBlur = useCallback(
      (event: FocusEvent<HTMLInputElement>) => {
        onChange(event.target.value);
      },
      [onChange],
    );

    const handlePressEnter = useCallback(() => {
      onChange(inputRef.current?.input.value || '');
    }, [onChange]);

    const [error, onError] = useState<CronError>();

    return (
      <>
        <StyledInputContainer>
          <div className="control-label">
            {t('Schedule type')}
            <span className="required">*</span>
          </div>
          <div className="input-container">
            <Select
              ariaLabel={t('Schedule type')}
              placeholder={t('Schedule type')}
              onChange={(e: any) => {
                setScheduleFormat(e);
              }}
              options={SCHEDULE_TYPE_OPTIONS}
            />
          </div>
        </StyledInputContainer>

        <StyledInputContainer
          data-test="input-content"
          className="styled-input"
        >
          <div className="control-label">
            {t('Schedule')}
            <span className="required">*</span>
          </div>
          {scheduleFormat === 'input' ? (
            <Input
              type="text"
              name="crontab"
              ref={inputRef}
              style={error ? { borderColor: theme.colors.error.base } : {}}
              placeholder={t('CRON expression')}
              disabled={scheduleFormat !== 'input'}
              value={value}
              onBlur={handleBlur}
              onChange={e => customSetValue(e.target.value)}
              onPressEnter={handlePressEnter}
            />
          ) : (
            <CronPicker
              clearButton={false}
              value={value}
              setValue={customSetValue}
              disabled={scheduleFormat !== 'picker'}
              displayError={scheduleFormat === 'picker'}
              onError={onError}
            />
          )}
        </StyledInputContainer>
      </>
    );
  };
