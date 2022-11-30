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
import React, {
  forwardRef,
  ReactElement,
  RefObject,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import {
  ensureIsArray,
  formatNumber,
  NumberFormats,
  styled,
  t,
} from '@superset-ui/core';
import AntdSelect, { LabeledValue as AntdLabeledValue, SelectValue } from 'antd/lib/select';
import { isEqual } from 'lodash';
import {
  getValue,
  hasOption,
  isLabeledValue,
  renderSelectOptions,
  sortSelectedFirstHelper,
  sortComparatorWithSearchHelper,
  handleFilterOptionHelper,
  dropDownRenderHelper,
  getSuffixIcon,
  SELECT_ALL_VALUE,
  selectAllOption,
} from './utils';
import { RawValue, SelectOptionsType, SelectProps } from './types';
import {
  NoElement,
  StyledCheckOutlined,
  StyledContainer,
  StyledHeader,
  StyledSelect,
  StyledStopOutlined,
  StyledTag,
} from './styles';
import {
  EMPTY_OPTIONS,
  MAX_TAG_COUNT,
  TOKEN_SEPARATORS,
  DEFAULT_SORT_COMPARATOR,
} from './constants';

/**
 * This component is a customized version of the Antdesign 4.X Select component
 * https://ant.design/components/select/.
 * The aim of the component was to combine all the instances of select components throughout the
 * project under one and to remove the react-select component entirely.
 * This Select component provides an API that is tested against all the different use cases of Superset.
 * It limits and overrides the existing Antdesign API in order to keep their usage to the minimum
 * and to enforce simplification and standardization.
 * It is divided into two macro categories, Static and Async.
 * The Static type accepts a static array of options.
 * The Async type accepts a promise that will return the options.
 * Each of the categories come with different abilities. For a comprehensive guide please refer to
 * the storybook in src/components/Select/Select.stories.tsx.
 */
const Select = forwardRef(
  (
    {
      allowClear,
      allowNewOptions = false,
      ariaLabel,
      filterOption = true,
      header = null,
      headerPosition = 'top',
      helperText,
      invertSelection = false,
      labelInValue = false,
      loading,
      mode = 'single',
      name,
      notFoundContent,
      onChange,
      onClear,
      onDropdownVisibleChange,
      optionFilterProps = ['label', 'value'],
      options,
      placeholder = t('Select ...'),
      showSearch = true,
      onSelectAll,
      sortComparator = DEFAULT_SORT_COMPARATOR,
      tokenSeparators,
      value,
      getPopupContainer,
      ...props
    }: SelectProps,
    ref: RefObject<HTMLInputElement>,
  ) => {
    const isSingleMode = mode === 'single';
    const shouldShowSearch = allowNewOptions ? true : showSearch;
    const [selectValue, setSelectValue] = useState(value);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(loading);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const mappedMode = isSingleMode
      ? undefined
      : allowNewOptions
      ? 'tags'
      : 'multiple';

    const { Option } = AntdSelect;

    const sortSelectedFirst = useCallback(
      (a: AntdLabeledValue, b: AntdLabeledValue) =>
        sortSelectedFirstHelper(a, b, selectValue),
      [selectValue],
    );
    const sortComparatorWithSearch = useCallback(
      (a: AntdLabeledValue, b: AntdLabeledValue) =>
        sortComparatorWithSearchHelper(
          a,
          b,
          inputValue,
          sortSelectedFirst,
          sortComparator,
        ),
      [inputValue, sortComparator, sortSelectedFirst],
    );

    const initialOptions = useMemo(
      () =>
        options && Array.isArray(options) ? options.slice() : EMPTY_OPTIONS,
      [options],
    );
    const initialOptionsSorted = useMemo(
      () => initialOptions.slice().sort(sortSelectedFirst),
      [initialOptions, sortSelectedFirst],
    );

    const [selectOptions, setSelectOptions] =
      useState<SelectOptionsType>(initialOptionsSorted);

    // add selected values to options list if they are not in it
    const fullSelectOptions = useMemo(() => {
      const missingValues: SelectOptionsType = ensureIsArray(selectValue)
        .filter(opt => !hasOption(getValue(opt), selectOptions))
        .map(opt =>
          isLabeledValue(opt) ? opt : { value: opt, label: String(opt) },
        );
      const result =
        missingValues.length > 0
          ? missingValues.concat(selectOptions)
          : selectOptions;
      return result.filter(opt => opt.value !== SELECT_ALL_VALUE);
    }, [selectOptions, selectValue]);

    const selectAllEnabled = useMemo(
      () => !isSingleMode && fullSelectOptions.length > 0 && !inputValue,
      [fullSelectOptions, isSingleMode, inputValue],
    );

    const handleOnSelect = (
      selectedItem: string | number | AntdLabeledValue | undefined,
    ) => {
      if (isSingleMode) {
        setSelectValue(selectedItem);
      } else {
        setSelectValue(previousState => {
          const array = ensureIsArray(previousState);
          const value = getValue(selectedItem);
          // Tokenized values can contain duplicated values
          if (value === getValue(SELECT_ALL_VALUE)) {
            const ret_val = labelInValue 
              ? [selectAllOption, ...selectOptions] as AntdLabeledValue[] 
              : [SELECT_ALL_VALUE, ...selectOptions.map(opt => opt.value)] as AntdLabeledValue[];
            return ret_val;
          }
          if (!hasOption(value, array)) {
            const result = [...array, selectedItem];
            if (
              result.length === fullSelectOptions.length &&
              selectAllEnabled
            ) {
              return [SELECT_ALL_VALUE, ...result] as AntdLabeledValue[];
            }
            return result as AntdLabeledValue[];
          }
          return previousState;
        });
      }
      setInputValue('');
    };

    const handleOnDeselect = (
      value: string | number | AntdLabeledValue | undefined,
    ) => {
      if (Array.isArray(selectValue)) {
        if (getValue(value) === getValue(SELECT_ALL_VALUE)) {
          setSelectValue(undefined);
        } else {
          let array = selectValue as AntdLabeledValue[];
          array = array.filter(
            element =>
              getValue(element) !== getValue(value) &&
              getValue(element) !== SELECT_ALL_VALUE,
          )
          setSelectValue(array);
        }
      }
      setInputValue('');
    };

    const handleOnSearch = (search: string) => {
      const searchValue = search.trim();
      if (allowNewOptions && isSingleMode) {
        const newOption = searchValue &&
          !hasOption(searchValue, fullSelectOptions, true) && {
            label: searchValue,
            value: searchValue,
            isNewOption: true,
          };
        const cleanSelectOptions = ensureIsArray(fullSelectOptions).filter(
          opt => !opt.isNewOption || hasOption(opt.value, selectValue),
        );
        const newOptions = newOption
          ? [newOption, ...cleanSelectOptions]
          : cleanSelectOptions;
        setSelectOptions(newOptions);
      }
      setInputValue(search);
    };

    const handleFilterOption = (search: string, option: AntdLabeledValue) =>
      handleFilterOptionHelper(search, option, optionFilterProps, filterOption);

    const handleOnDropdownVisibleChange = (isDropdownVisible: boolean) => {
      setIsDropdownVisible(isDropdownVisible);

      // if no search input value, force sort options because it won't be sorted by
      // `filterSort`.
      if (isDropdownVisible && !inputValue && selectOptions.length > 1) {
        if (!isEqual(initialOptionsSorted, selectOptions)) {
          setSelectOptions(initialOptionsSorted);
        }
      }
      if (onDropdownVisibleChange) {
        onDropdownVisibleChange(isDropdownVisible);
      }
    };

    const dropdownRender = (
      originNode: ReactElement & { ref?: RefObject<HTMLElement> },
    ) =>
      dropDownRenderHelper(
        originNode,
        isDropdownVisible,
        isLoading,
        fullSelectOptions.length,
        helperText,
      );

    const handleClear = () => {
      setSelectValue(undefined);
      if (onClear) {
        onClear();
      }
    };

    useEffect(() => {
      // when `options` list is updated from component prop, reset states
      setSelectOptions(initialOptions);
    }, [initialOptions]);

    useEffect(() => {
      if (loading !== undefined && loading !== isLoading) {
        setIsLoading(loading);
      }
    }, [isLoading, loading]);
    
    
    const selectAllMode = useMemo(
      () => {
        return ensureIsArray(selectValue).length === fullSelectOptions.length + 1 
      }, [selectValue, fullSelectOptions]
    )

    useEffect(() => {
      // if all values are selected, add select all to value
      ensureIsArray(value).length === fullSelectOptions.length && fullSelectOptions.length > 0
        ? setSelectValue([SELECT_ALL_VALUE, ...ensureIsArray(value)] as AntdLabeledValue[]) 
        : setSelectValue(value);
    }, [value]);

    useEffect(() => {
      const checkSelectAll = ensureIsArray(selectValue).some(v => getValue(v) === SELECT_ALL_VALUE) 
      checkSelectAll && !selectAllMode 
        ? setSelectValue([SELECT_ALL_VALUE, ...fullSelectOptions] as AntdLabeledValue[]) 
        : null;
    },
    [selectValue, selectAllMode])

    const selectAllLabel = useMemo(
      () => () =>
        `${SELECT_ALL_VALUE} (${formatNumber(
          NumberFormats.INTEGER,
          fullSelectOptions.length,
        )})`,
      [fullSelectOptions],
    );

    const SelectAllModeTagRenderer = (props: any) => {
      const { value } = props;
      // skip plus elements placeholder
      if (!value) {
        return <NoElement />; // doesn't accept null
      }
      return (
        <StyledTag {...props}>{`${formatNumber(
          NumberFormats.INTEGER,
          ensureIsArray(selectValue).length - 1,
        )} ${t('selected')}`}</StyledTag>
      );
    };

    const handleOnChange = (values: any, options: any) => {
      // intercept onChange call to handle the select all case
      // if the "select all" option is selected, we want to send all options to the onChange, 
      // otherwise we want to remove
      if(!isSingleMode) {
        if(ensureIsArray(values).some(val => getValue(val) === SELECT_ALL_VALUE)){
          // send all options to onchange if all are not currently there
          if (!selectAllMode) {
            values = fullSelectOptions.map(opt => opt.value);
            options = fullSelectOptions.map(opt => ({
              children: opt.value,
              key: opt.value,
              value: opt.value,
              label: opt.label,
            }));
          }else{
            values = ensureIsArray(values).filter((val: any) => getValue(val) !== SELECT_ALL_VALUE);
          }
        }else if(ensureIsArray(values).length === fullSelectOptions.length && selectAllMode){
          values = [];
          options = [];
        }
      }
      onChange?.(values, options)
    }
  
    return (
      <StyledContainer headerPosition={headerPosition}>
        {header && (
          <StyledHeader headerPosition={headerPosition}>{header}</StyledHeader>
        )}
        <StyledSelect
          allowClear={!isLoading && allowClear}
          aria-label={ariaLabel || name}
          dropdownRender={dropdownRender}
          filterOption={handleFilterOption}
          filterSort={sortComparatorWithSearch}
          getPopupContainer={
            getPopupContainer || (triggerNode => triggerNode.parentNode)
          }
          headerPosition={headerPosition}
          labelInValue={labelInValue}
          maxTagCount={selectAllMode ? 1 : MAX_TAG_COUNT}
          mode={mappedMode}
          notFoundContent={isLoading ? t('Loading...') : notFoundContent}
          onDeselect={handleOnDeselect}
          onDropdownVisibleChange={handleOnDropdownVisibleChange}
          onPopupScroll={undefined}
          onSearch={shouldShowSearch ? handleOnSearch : undefined}
          onSelect={handleOnSelect}
          onClear={handleClear}
          onChange={handleOnChange}
          options={undefined}
          placeholder={placeholder}
          showSearch={shouldShowSearch}
          showArrow
          tagRender={selectAllMode ? SelectAllModeTagRenderer : undefined}
          tokenSeparators={tokenSeparators || TOKEN_SEPARATORS}
          value={selectValue}
          suffixIcon={getSuffixIcon(
            isLoading,
            shouldShowSearch,
            isDropdownVisible,
          )}
          menuItemSelectedIcon={
            invertSelection ? (
              <StyledStopOutlined iconSize="m" />
            ) : (
              <StyledCheckOutlined iconSize="m" />
            )
          }
          {...props}
          ref={ref}
        >
          {selectAllEnabled && (
            <Option
              id="select-all"
              key={SELECT_ALL_VALUE}
              value={SELECT_ALL_VALUE}
            >
              {selectAllLabel()}
            </Option>
          )}
          {renderSelectOptions(fullSelectOptions)}
        </StyledSelect>
      </StyledContainer>
    );
  },
);

export default Select;
