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

import React from 'react';
import { render, screen } from 'spec/helpers/testing-library';
import { supersetTheme } from '@superset-ui/core';
import userEvent from '@testing-library/user-event';
import IndeterminateCheckbox from '.';

const mockedProps = {
  checked: false,
  id: 'checkbox-id',
  indeterminate: false,
  title: 'Checkbox title',
  onChange: () => null,
};

jest.mock('../Icon', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => (
    <div data-test="icon" data-name={name} />
  ),
}));

test('should render', () => {
  const { container } = render(<IndeterminateCheckbox {...mockedProps} />);
  expect(container).toBeInTheDocument();
});

test('should render the label', () => {
  render(<IndeterminateCheckbox {...mockedProps} />);
  expect(screen.getByTitle('Checkbox title')).toBeInTheDocument();
});

test('should render the checkbox', () => {
  render(<IndeterminateCheckbox {...mockedProps} />);
  expect(screen.getByRole('checkbox')).toBeInTheDocument();
});

test('should render the checkbox-half icon', () => {
  const indeterminateProps = {
    ...mockedProps,
    indeterminate: true,
  };
  render(<IndeterminateCheckbox {...indeterminateProps} />);
  expect(screen.getByTestId('icon')).toBeInTheDocument();
  expect(screen.getByTestId('icon')).toHaveAttribute(
    'data-name',
    'checkbox-half',
  );
});

test('should render the checkbox-off icon', () => {
  render(<IndeterminateCheckbox {...mockedProps} />);
  expect(screen.getByTestId('icon')).toBeInTheDocument();
  expect(screen.getByTestId('icon')).toHaveAttribute(
    'data-name',
    'checkbox-off',
  );
});

test('should render the checkbox-on icon', () => {
  const checkboxOnProps = {
    ...mockedProps,
    checked: true,
  };
  render(<IndeterminateCheckbox {...checkboxOnProps} />);
  expect(screen.getByTestId('icon')).toBeInTheDocument();
  expect(screen.getByTestId('icon')).toHaveAttribute(
    'data-name',
    'checkbox-on',
  );
});

test('should call the onChange', () => {
  const onChange = jest.fn();
  const onChangeProps = {
    ...mockedProps,
    onChange,
  };
  render(<IndeterminateCheckbox {...onChangeProps} />);
  const label = screen.getByTitle('Checkbox title');
  userEvent.click(label);
  expect(onChange).toHaveBeenCalledTimes(1);
});
