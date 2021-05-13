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
import React, { useState } from 'react';
<<<<<<< HEAD
import LabeledErrorBoundInput, {
  LabeledErrorBoundInputProps,
} from './LabeledErrorBoundInput';
=======
import LabeledErrorBoundInput, { LabeledErrorBoundInputProps } from '.';
>>>>>>> da526cbb4... testing complete

export default {
  title: 'LabeledErrorBoundInput',
  component: LabeledErrorBoundInput,
};

export const InteractiveLabeledErrorBoundInput = ({
  name,
  value,
  placeholder,
  type,
  id,
}: LabeledErrorBoundInputProps) => {
  const [checkErrorMessage, setCheckErrorMessage] = useState('');
  const [currentValue, setCurrentValue] = useState(value);

  const validateFunctionality: (value: any) => void = value => {
    setCurrentValue(value.target.value);
    if (value.target.value.includes('success')) {
      setCheckErrorMessage('');
    } else {
      setCheckErrorMessage('Type success in the text bar');
    }
  };

  return (
    <LabeledErrorBoundInput
      id={id}
      name={name}
      validationMethods={{ onChange: validateFunctionality }}
      errorMessage={checkErrorMessage}
      helpText="This is a line of example help text"
      value={currentValue}
      // This must stay the same as name or form breaks
      label={name}
      placeholder={placeholder}
      type={type}
      required
    />
  );
};

InteractiveLabeledErrorBoundInput.args = {
  name: 'Username',
  placeholder: 'Example placeholder text...',
  id: 1,
};

InteractiveLabeledErrorBoundInput.argTypes = {
  type: {
    defaultValue: 'textbox',
    control: {
      type: 'select',
      options: ['textbox', 'checkbox', 'radio'],
    },
  },
};
