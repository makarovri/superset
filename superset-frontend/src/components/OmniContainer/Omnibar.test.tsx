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
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Omnibar } from './Omnibar';

test('Must put id on input', () => {
  render(
    <Omnibar
      id="test-id-attribute"
      placeholder="Test Omnibar"
      extensions={[jest.fn().mockResolvedValue([{ title: 'test' }])]}
    />,
  );

  expect(screen.getByPlaceholderText('Test Omnibar')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Test Omnibar')).toHaveAttribute(
    'id',
    'test-id-attribute',
  );
});
