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
import { fireEvent, render } from 'spec/helpers/testing-library';
import { OptionControlLabel } from 'src/explore/components/controls/OptionControls';

import ExploreContainer, { DraggingContext } from '.';
import OptionWrapper from '../controls/DndColumnSelectControl/OptionWrapper';

const MockChildren = () => {
  const dragging = React.useContext(DraggingContext);
  return (
    <div data-test="mock-children" className={dragging ? 'dragging' : ''}>
      {dragging ? 'dragging' : 'not dragging'}
    </div>
  );
};

test('should render children', () => {
  const { getByTestId, getByText } = render(
    <ExploreContainer>
      <MockChildren />
    </ExploreContainer>,
    { useRedux: true, useDnd: true },
  );
  expect(getByTestId('mock-children')).toBeInTheDocument();
  expect(getByText('not dragging')).toBeInTheDocument();
});

test('should update the style on dragging state', () => {
  const defaultProps = {
    label: <span>Test label</span>,
    tooltipTitle: 'This is a tooltip title',
    onRemove: jest.fn(),
    onMoveLabel: jest.fn(),
    onDropLabel: jest.fn(),
    type: 'test',
    index: 0,
  };
  const { container, getByText } = render(
    <ExploreContainer>
      <OptionControlLabel
        {...defaultProps}
        index={1}
        label={<span>Label 1</span>}
      />
      <OptionWrapper
        {...defaultProps}
        index={2}
        label="Label 2"
        clickClose={() => {}}
        onShiftOptions={() => {}}
      />
      <MockChildren />
    </ExploreContainer>,
    {
      useRedux: true,
      useDnd: true,
    },
  );
  expect(container.getElementsByClassName('dragging')).toHaveLength(0);
  fireEvent.dragStart(getByText('Label 1'));
  expect(container.getElementsByClassName('dragging')).toHaveLength(1);
  fireEvent.dragEnd(getByText('Label 1'));
  expect(container.getElementsByClassName('dragging')).toHaveLength(0);
  // don't show dragging state for the sorting item
  fireEvent.dragStart(getByText('Label 2'));
  expect(container.getElementsByClassName('dragging')).toHaveLength(0);
});
