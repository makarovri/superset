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
import { shallow } from 'enzyme';

import PopoverSection from 'src/components/PopoverSection';

describe('PopoverSection', () => {
  const defaultProps = {
    title: 'Section Title',
    isSelected: true,
    onSelect: () => {},
    info: 'info section',
    children: <div />,
  };

  let wrapper;
  const factory = overrideProps => {
    const props = { ...defaultProps, ...(overrideProps || {}) };
    return shallow(<PopoverSection {...props} />);
  };
  beforeEach(() => {
    wrapper = factory();
  });
  it('renders', () => {
    expect(React.isValidElement(<PopoverSection {...defaultProps} />)).toBe(
      true,
    );
  });
  it('is show an icon when selected', () => {
    expect(wrapper.find('.fa-check')).toHaveLength(1);
  });
  it('is show no icon when not selected', () => {
    expect(factory({ isSelected: false }).find('.fa-check')).toHaveLength(0);
  });
});
